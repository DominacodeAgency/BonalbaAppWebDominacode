import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * APPCC: registro de temperaturas y cambios de aceite.
 * Estándar beta:
 * - Carga inicial con PageState
 * - Si falla fetch: limpia estados
 * - Acciones: errores inline en modal (sin alert)
 */
export default function APPCC() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<
    "temperaturas" | "aceites"
  >("temperaturas");

  const [equipment, setEquipment] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  // Form
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [temperature, setTemperature] = useState("");
  const [tipoAceite, setTipoAceite] = useState("girasol");
  const [motivoCambio, setMotivoCambio] = useState("");
  const [observations, setObservations] = useState("");

  // Modal submit state (inline)
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [equipmentData, registrosData] = await Promise.all([
        apiFetchAuth<any[]>("/equipment", { method: "GET" }),
        apiFetchAuth<any[]>("/appcc/registros", { method: "GET" }),
      ]);

      setEquipment(equipmentData ?? []);
      setRegistros(registrosData ?? []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar APPCC"));
      // ✅ importante para beta: no dejar datos viejos
      setEquipment([]);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setSelectedEquipment("");
    setTemperature("");
    setTipoAceite("girasol");
    setMotivoCambio("");
    setObservations("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitLoading(false);
    setSubmitError(null);
    resetForm();
  };

  const openModal = () => {
    setSubmitError(null);
    setSubmitLoading(false);
    setShowModal(true);
  };

  const handleSubmitTemperatura = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      await apiFetchAuth("/appcc/temperatura", {
        method: "POST",
        body: JSON.stringify({
          equipmentId: selectedEquipment,
          temperature: parseFloat(temperature),
          observations,
        }),
      });

      closeModal();
      await fetchData();
    } catch (err) {
      setSubmitError(normalizeError(err, "Error registrando temperatura"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitAceite = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      await apiFetchAuth("/appcc/aceite", {
        method: "POST",
        body: JSON.stringify({
          equipmentId: selectedEquipment,
          tipo: tipoAceite,
          motivo: motivoCambio,
          observations,
        }),
      });

      closeModal();
      await fetchData();
    } catch (err) {
      setSubmitError(normalizeError(err, "Error registrando cambio de aceite"));
    } finally {
      setSubmitLoading(false);
    }
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

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchData}
      title="No se pudo cargar APPCC"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Control APPCC
          </h2>
          <p className="text-muted-foreground">
            Registro de temperaturas y cambios de aceite
          </p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection("temperaturas")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeSection === "temperaturas"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:opacity-90"
              }`}
            >
              Temperaturas
            </button>
            <button
              onClick={() => setActiveSection("aceites")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeSection === "aceites"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:opacity-90"
              }`}
            >
              Aceites
            </button>
          </div>
        </div>

        {/* Temperaturas */}
        {activeSection === "temperaturas" && (
          <div>
            <div className="mb-6">
              <button
                onClick={openModal}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Registrar temperatura
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {getCamaras().map((camara) => {
                const lastRegistro = registros
                  .filter(
                    (r) =>
                      r.equipmentId === camara.id && r.type === "temperatura"
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )[0];

                const isOutOfRange =
                  lastRegistro &&
                  (lastRegistro.temperature < 0 ||
                    lastRegistro.temperature > 4);

                return (
                  <div
                    key={camara.id}
                    className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6"
                  >
                    <h3 className="font-semibold text-foreground mb-3">
                      {camara.name}
                    </h3>

                    {lastRegistro ? (
                      <div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span
                            className={`text-3xl font-bold ${
                              isOutOfRange
                                ? "text-destructive"
                                : "text-[var(--success)]"
                            }`}
                          >
                            {lastRegistro.temperature}°C
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Última medición:{" "}
                          {new Date(lastRegistro.date).toLocaleString("es-ES")}
                        </p>
                        {isOutOfRange && (
                          <div className="mt-2 bg-[var(--error-bg)] border border-destructive/30 rounded px-2 py-1">
                            <p className="text-xs text-destructive font-medium">
                              ⚠️ Fuera de rango (0-4°C)
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin registros
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Últimos registros de temperatura
              </h3>
              <div className="space-y-3">
                {getRecentRegistros("temperatura", "camara").map((registro) => {
                  const eq = equipment.find(
                    (e) => e.id === registro.equipmentId
                  );
                  const isOutOfRange =
                    registro.temperature < 0 || registro.temperature > 4;

                  return (
                    <div
                      key={registro.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {eq?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(registro.date).toLocaleString("es-ES")} •{" "}
                          {registro.userName}
                        </p>
                        {registro.observations && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {registro.observations}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          isOutOfRange
                            ? "text-destructive"
                            : "text-[var(--success)]"
                        }`}
                      >
                        {registro.temperature}°C
                      </span>
                    </div>
                  );
                })}
                {getRecentRegistros("temperatura", "camara").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay registros todavía
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aceites */}
        {activeSection === "aceites" && (
          <div>
            <div className="mb-6">
              <button
                onClick={openModal}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Registrar cambio de aceite
              </button>
            </div>

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
                    className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6"
                  >
                    <h3 className="font-semibold text-foreground mb-3">
                      {freidora.name}
                    </h3>

                    {lastRegistro ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong className="text-foreground">
                            Último cambio:
                          </strong>{" "}
                          {lastRegistro.tipo}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong className="text-foreground">Motivo:</strong>{" "}
                          {lastRegistro.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(lastRegistro.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin registros
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Últimos cambios de aceite
              </h3>
              <div className="space-y-3">
                {getRecentRegistros("aceite", "freidora").map((registro) => {
                  const eq = equipment.find(
                    (e) => e.id === registro.equipmentId
                  );

                  return (
                    <div
                      key={registro.id}
                      className="py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">
                          {eq?.name}
                        </p>
                        <span className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded">
                          {registro.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Motivo:</strong>{" "}
                        {registro.motivo}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(registro.date).toLocaleString("es-ES")} •{" "}
                        {registro.userName}
                      </p>
                      {registro.observations && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {registro.observations}
                        </p>
                      )}
                    </div>
                  );
                })}
                {getRecentRegistros("aceite", "freidora").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay registros todavía
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                {activeSection === "temperaturas"
                  ? "Registrar temperatura"
                  : "Registrar cambio de aceite"}
              </h3>

              {submitError && (
                <div className="mb-4 bg-[var(--error-bg)] border border-destructive/30 rounded p-3">
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}

              <form
                onSubmit={
                  activeSection === "temperaturas"
                    ? handleSubmitTemperatura
                    : handleSubmitAceite
                }
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {activeSection === "temperaturas"
                      ? "Cámara frigorífica"
                      : "Freidora"}
                  </label>
                  <select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                      placeholder="Ej: 2.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Rango óptimo: 0-4°C
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tipo de aceite
                      </label>
                      <select
                        value={tipoAceite}
                        onChange={(e) => setTipoAceite(e.target.value)}
                        className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                      >
                        <option value="girasol">Girasol</option>
                        <option value="oliva">Oliva</option>
                        <option value="vegetal">Vegetal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Motivo del cambio
                      </label>
                      <input
                        type="text"
                        value={motivoCambio}
                        onChange={(e) => setMotivoCambio(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                        placeholder="Ej: Cambio programado, color oscuro..."
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    rows={3}
                    placeholder="Añade observaciones..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 bg-primary disabled:opacity-60 text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {submitLoading ? "Guardando..." : "Registrar"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitLoading}
                    className="flex-1 bg-secondary disabled:opacity-60 text-secondary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
