import { useState, useEffect } from "react";

interface AdminEquipmentProps {
  user: any;
  accessToken: string;
  projectId: string;
}

export default function AdminEquipment({ user, accessToken, projectId }: AdminEquipmentProps) {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/equipment`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const equipmentData = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/equipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(equipmentData),
        }
      );

      if (response.ok) {
        setShowModal(false);
        fetchEquipment();
        alert("Equipo creado correctamente");
      } else {
        const error = await response.json();
        alert("Error al crear equipo: " + error.error);
      }
    } catch (error) {
      console.error("Error creating equipment:", error);
      alert("Error al crear equipo");
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este equipo?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/equipment/${equipmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        fetchEquipment();
        alert("Equipo eliminado correctamente");
      } else {
        const error = await response.json();
        alert("Error al eliminar equipo: " + error.error);
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      alert("Error al eliminar equipo");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const camaras = equipment.filter((eq) => eq.type === "camara");
  const freidoras = equipment.filter((eq) => eq.type === "freidora");

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de equipos</h3>
          <p className="text-sm text-gray-600">Gestiona cámaras frigoríficas y freidoras</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Añadir equipo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cámaras */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Cámaras frigoríficas</h4>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {camaras.map((eq) => (
              <div key={eq.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{eq.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Última verificación: {new Date(eq.lastCheck).toLocaleString("es-ES")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEquipment(eq.id)}
                  className="ml-4 text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {camaras.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No hay cámaras registradas
              </div>
            )}
          </div>
        </div>

        {/* Freidoras */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Freidoras</h4>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {freidoras.map((eq) => (
              <div key={eq.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{eq.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Última verificación: {new Date(eq.lastCheck).toLocaleString("es-ES")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEquipment(eq.id)}
                  className="ml-4 text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {freidoras.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No hay freidoras registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create equipment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Añadir nuevo equipo</h3>

            <form onSubmit={handleCreateEquipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de equipo
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="camara">Cámara frigorífica</option>
                  <option value="freidora">Freidora</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Cámara frigorífica 3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Crear equipo
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
