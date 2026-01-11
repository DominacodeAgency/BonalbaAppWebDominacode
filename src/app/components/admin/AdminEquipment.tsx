import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * AdminEquipment: gestión de equipos (cámaras y freidoras).
 * Usa AuthContext + apiFetchAuth.
 */
export default function AdminEquipment() {
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/equipment", { method: "GET" });
      setEquipment(data);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar equipos"));
      setEquipment([]);
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
      await apiFetchAuth("/equipment", {
        method: "POST",
        body: JSON.stringify(equipmentData),
      });

      setShowModal(false);
      await fetchEquipment();
      alert("Equipo creado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al crear equipo"));
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este equipo?")) return;

    try {
      await apiFetchAuth(`/equipment/${equipmentId}`, {
        method: "DELETE",
      });

      await fetchEquipment();
      alert("Equipo eliminado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al eliminar equipo"));
    }
  };

  if (!user) return null;

  const camaras = equipment.filter((eq) => eq.type === "camara");
  const freidoras = equipment.filter((eq) => eq.type === "freidora");

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchEquipment}
      title="No se pudieron cargar los equipos"
    >
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Gestión de equipos
            </h3>
            <p className="text-sm text-muted-foreground">
              Gestiona cámaras frigoríficas y freidoras
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Añadir equipo
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cámaras */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">
              Cámaras frigoríficas
            </h4>
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border divide-y divide-border">
              {camaras.map((eq) => (
                <div
                  key={eq.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{eq.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última verificación:{" "}
                      {eq.lastCheck
                        ? new Date(eq.lastCheck).toLocaleString("es-ES")
                        : "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEquipment(eq.id)}
                    className="ml-4 text-destructive hover:opacity-90 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {camaras.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay cámaras registradas
                </div>
              )}
            </div>
          </div>

          {/* Freidoras */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Freidoras</h4>
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border divide-y divide-border">
              {freidoras.map((eq) => (
                <div
                  key={eq.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{eq.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última verificación:{" "}
                      {eq.lastCheck
                        ? new Date(eq.lastCheck).toLocaleString("es-ES")
                        : "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEquipment(eq.id)}
                    className="ml-4 text-destructive hover:opacity-90 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {freidoras.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay freidoras registradas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create equipment modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                Añadir nuevo equipo
              </h3>

              <form onSubmit={handleCreateEquipment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de equipo
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="camara">Cámara frigorífica</option>
                    <option value="freidora">Freidora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre del equipo
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="Ej: Cámara frigorífica 3"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Crear equipo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageState>
  );
}
