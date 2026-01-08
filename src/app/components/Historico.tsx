import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * Historico: muestra el histórico de actividades.
 * Usa apiFetchAuth para llamar al backend con token automático.
 */
export default function Historico() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("todos");

  const fetchHistorico = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/historico", { method: "GET" });
      setHistorico(data);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar histórico"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHistorico = historico.filter((item) => {
    if (typeFilter === "todos") return true;
    return item.type === typeFilter;
  });

  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);

  const thisWeekItems = historico.filter(
    (item) => new Date(item.date) >= thisWeekStart
  );

  const completedTasks = historico.filter(
    (item) => item.type === "checklist" && item.action === "Tarea completada"
  ).length;

  const totalIncidencias = historico.filter(
    (item) => item.type === "incidencia"
  ).length;

  const getTypeBadge = (type: string) => {
    const styles = {
      checklist: "bg-blue-100 text-blue-700",
      incidencia: "bg-red-100 text-red-700",
      appcc: "bg-green-100 text-green-700",
    };

    const labels = {
      checklist: "Checklist",
      incidencia: "Incidencia",
      appcc: "APPCC",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          styles[type as keyof typeof styles] || "bg-gray-100 text-gray-700"
        }`}
      >
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchHistorico}
      title="No se pudo cargar el histórico"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Histórico de actividades
          </h2>
          <p className="text-gray-600">
            Registro completo de todas las operaciones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total registros</p>
            <p className="text-3xl font-bold text-gray-900">
              {historico.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Tareas completadas</p>
            <p className="text-3xl font-bold text-green-600">
              {completedTasks}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Incidencias</p>
            <p className="text-3xl font-bold text-red-600">
              {totalIncidencias}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Esta semana</p>
            <p className="text-3xl font-bold text-blue-600">
              {thisWeekItems.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              ["todos", "Todos"],
              ["checklist", "Checklists"],
              ["incidencia", "Incidencias"],
              ["appcc", "APPCC"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTypeFilter(id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  typeFilter === id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Actividad reciente
          </h3>

          <div className="space-y-4">
            {filteredHistorico.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600"></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getTypeBadge(item.type)}
                    <span className="font-medium text-gray-900">
                      {item.action}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    Por <strong>{item.user}</strong>
                  </p>

                  {item.observations && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Observaciones:</strong> {item.observations}
                    </p>
                  )}

                  {item.temperature && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Temperatura:</strong> {item.temperature}°C
                    </p>
                  )}

                  {item.title && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Título:</strong> {item.title}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.date).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredHistorico.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay actividades registradas
            </p>
          )}
        </div>
      </div>
    </PageState>
  );
}
