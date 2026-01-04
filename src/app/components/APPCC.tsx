import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";

/**
 * APPCC: registro de temperaturas y cambios de aceite.
 * Usa AuthContext + apiFetchAuth (sin props de token/projectId).
 */
export default function APPCC() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<
    "temperaturas" | "aceites"
  >("temperaturas");
  const [equipment, setEquipment] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [temperature, setTemperature] = useState("");
  const [tipoAceite, setTipoAceite] = useState("girasol");
  const [motivoCambio, setMotivoCambio] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [equipmentData, registrosData] = await Promise.all([
        apiFetchAuth<any[]>("/equipment", { method: "GET" }),
        apiFetchAuth<any[]>("/appcc/registros", { method: "GET" }),
      ]);

      setEquipment(equipmentData);
      setRegistros(registrosData);
    } catch (error) {
      console.error("Error fetching APPCC data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTemperatura = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetchAuth("/appcc/temperatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEquipment,
          temperature: parseFloat(temperature),
          observations,
        }),
      });

      setShowModal(false);
      resetForm();
      fetchData();
      alert("Temperatura registrada correctamente");
    } catch (error) {
      console.error("Error registering temperatura:", error);
    }
  };

  const handleSubmitAceite = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetchAuth("/appcc/aceite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: selectedEquipment,
          tipo: tipoAceite,
          motivo: motivoCambio,
          observations,
        }),
      });

      setShowModal(false);
      resetForm();
      fetchData();
      alert("Cambio de aceite registrado correctamente");
    } catch (error) {
      console.error("Error registering aceite:", error);
    }
  };

  const resetForm = () => {
    setSelectedEquipment("");
    setTemperature("");
    setTipoAceite("girasol");
    setMotivoCambio("");
    setObservations("");
  };

  const getCamaras = () => equipment.filter((eq) => eq.type === "camara");
  const getFreidoras = () => equipment.filter((eq) => eq.type === "freidora");

  const getRecentRegistros = (type: string, equipmentType: string) => {
    return registros
      .filter(
        (r) =>
          r.type === type &&
          equipment.find(
            (e) => e.id === r.equipmentId && e.type === equipmentType
          )
      )
      .slice(0, 5);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Control APPCC</h2>
        <p className="text-gray-600">
          Registro de temperaturas y cambios de aceite
        </p>
      </div>

      {/* Section selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("temperaturas")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeSection === "temperaturas"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Temperaturas
          </button>
          <button
            onClick={() => setActiveSection("aceites")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeSection === "aceites"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Aceites
          </button>
        </div>
      </div>

      {/* Temperaturas Section */}
      {activeSection === "temperaturas" && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Registrar temperatura
            </button>
          </div>

          {/* Equipment cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {getCamaras().map((camara) => {
              const lastRegistro = registros
                .filter(
                  (r) => r.equipmentId === camara.id && r.type === "temperatura"
                )
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0];

              const isOutOfRange =
                lastRegistro &&
                (lastRegistro.temperature < 0 || lastRegistro.temperature > 4);

              return (
                <div
                  key={camara.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {camara.name}
                  </h3>

                  {lastRegistro ? (
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span
                          className={`text-3xl font-bold ${
                            isOutOfRange ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {lastRegistro.temperature}°C
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Última medición:{" "}
                        {new Date(lastRegistro.date).toLocaleString("es-ES")}
                      </p>
                      {isOutOfRange && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                          <p className="text-xs text-red-700 font-medium">
                            ⚠️ Fuera de rango (0-4°C)
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin registros</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent registros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Últimos registros de temperatura
            </h3>
            <div className="space-y-3">
              {getRecentRegistros("temperatura", "camara").map((registro) => {
                const eq = equipment.find((e) => e.id === registro.equipmentId);
                const isOutOfRange =
                  registro.temperature < 0 || registro.temperature > 4;

                return (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{eq?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.date).toLocaleString("es-ES")} •{" "}
                        {registro.userName}
                      </p>
                      {registro.observations && (
                        <p className="text-sm text-gray-600 mt-1">
                          {registro.observations}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-lg font-bold ${
                        isOutOfRange ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {registro.temperature}°C
                    </span>
                  </div>
                );
              })}
              {getRecentRegistros("temperatura", "camara").length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay registros todavía
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aceites Section */}
      {activeSection === "aceites" && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Registrar cambio de aceite
            </button>
          </div>

          {/* Equipment cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {getFreidoras().map((freidora) => {
              const lastRegistro = registros
                .filter(
                  (r) => r.equipmentId === freidora.id && r.type === "aceite"
                )
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0];

              return (
                <div
                  key={freidora.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {freidora.name}
                  </h3>

                  {lastRegistro ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Último cambio:</strong> {lastRegistro.tipo}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Motivo:</strong> {lastRegistro.motivo}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(lastRegistro.date).toLocaleString("es-ES")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin registros</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent registros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Últimos cambios de aceite
            </h3>
            <div className="space-y-3">
              {getRecentRegistros("aceite", "freidora").map((registro) => {
                const eq = equipment.find((e) => e.id === registro.equipmentId);

                return (
                  <div
                    key={registro.id}
                    className="py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{eq?.name}</p>
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {registro.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Motivo:</strong> {registro.motivo}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(registro.date).toLocaleString("es-ES")} •{" "}
                      {registro.userName}
                    </p>
                    {registro.observations && (
                      <p className="text-sm text-gray-600 mt-1">
                        {registro.observations}
                      </p>
                    )}
                  </div>
                );
              })}
              {getRecentRegistros("aceite", "freidora").length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay registros todavía
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for registration */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {activeSection === "temperaturas"
                ? "Registrar temperatura"
                : "Registrar cambio de aceite"}
            </h3>

            <form
              onSubmit={
                activeSection === "temperaturas"
                  ? handleSubmitTemperatura
                  : handleSubmitAceite
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeSection === "temperaturas"
                    ? "Cámara frigorífica"
                    : "Freidora"}
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {(activeSection === "temperaturas"
                    ? getCamaras()
                    : getFreidoras()
                  ).map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeSection === "temperaturas" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej: 2.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rango óptimo: 0-4°C
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de aceite
                    </label>
                    <select
                      value={tipoAceite}
                      onChange={(e) => setTipoAceite(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="girasol">Girasol</option>
                      <option value="oliva">Oliva</option>
                      <option value="vegetal">Vegetal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo del cambio
                    </label>
                    <input
                      type="text"
                      value={motivoCambio}
                      onChange={(e) => setMotivoCambio(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ej: Cambio programado, color oscuro..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Añade observaciones..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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
