import { useEffect, useState } from "react";
import { apiFetchAuth } from "@/auth/apiAuth";
import { useAuth } from "@/auth/AuthContext";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

export default function Incidencias() {
  const { user } = useAuth();

  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState("todas");
  const [selectedIncidencia, setSelectedIncidencia] = useState<any | null>(
    null
  );
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  useEffect(() => {
    fetchIncidencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIncidencias = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/incidencias", { method: "GET" });
      setIncidencias(data);
    } catch (e) {
      setError(normalizeError(e, "Error cargando incidencias"));
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedIncidencia || !newStatus) return;

    try {
      await apiFetchAuth(`/incidencias/${selectedIncidencia.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus, comment: statusComment }),
      });

      await fetchIncidencias();
      setShowStatusModal(false);
      setSelectedIncidencia(null);
      setNewStatus("");
      setStatusComment("");
    } catch (e) {
      // Importante: no conviertas esto en "error de página"
      alert(normalizeError(e, "Error actualizando incidencia"));
    }
  };

  const filteredIncidencias = incidencias.filter((inc) => {
    if (filter === "todas") return true;
    if (filter === "mias") return inc.userId === user?.id;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    const styles = {
      alta: "bg-red-100 text-red-700",
      media: "bg-yellow-100 text-yellow-700",
      baja: "bg-blue-100 text-blue-700",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          styles[priority as keyof typeof styles] || ""
        }`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      abierta: "bg-red-100 text-red-700",
      en_proceso: "bg-yellow-100 text-yellow-700",
      resuelta: "bg-green-100 text-green-700",
    };

    const labels = {
      abierta: "Abierta",
      en_proceso: "En proceso",
      resuelta: "Resuelta",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          styles[status as keyof typeof styles] || ""
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchIncidencias}
      title="No se pudieron cargar las incidencias"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Incidencias</h2>
          <p className="text-gray-600">
            Gestiona y da seguimiento a las incidencias reportadas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("todas")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === "todas"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("mias")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === "mias"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mis incidencias
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredIncidencias.map((incidencia) => (
            <div
              key={incidencia.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {incidencia.title}
                    </h3>
                    {getStatusBadge(incidencia.status)}
                    {getPriorityBadge(incidencia.priority)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {incidencia.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Reportada por: {incidencia.userName}</span>
                    <span>•</span>
                    <span>
                      {new Date(incidencia.date).toLocaleString("es-ES")}
                    </span>
                  </div>
                </div>
              </div>

              {incidencia.updates && incidencia.updates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Historial de actualizaciones:
                  </p>
                  <div className="space-y-2">
                    {incidencia.updates.map((update: any, index: number) => (
                      <div
                        key={index}
                        className="text-sm text-gray-600 pl-4 border-l-2 border-gray-300"
                      >
                        <p className="font-medium">{update.action}</p>
                        {update.comment && (
                          <p className="text-gray-500">{update.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {update.user} -{" "}
                          {new Date(update.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {incidencia.photoData && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Foto adjunta:
                  </p>
                  <img
                    src={incidencia.photoData}
                    alt="Incidencia"
                    className="max-w-full h-auto rounded border border-gray-300"
                  />
                </div>
              )}

              {incidencia.status !== "resuelta" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedIncidencia(incidencia);
                      setNewStatus(
                        incidencia.status === "abierta"
                          ? "en_proceso"
                          : "resuelta"
                      );
                      setShowStatusModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {incidencia.status === "abierta"
                      ? "Poner en proceso"
                      : "Marcar como resuelta"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredIncidencias.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No hay incidencias reportadas</p>
          </div>
        )}

        {/* Modal cambio de estado */}
        {showStatusModal && selectedIncidencia && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="font-bold text-lg mb-4">Actualizar estado</h3>
              <p className="text-gray-700 mb-4">{selectedIncidencia.title}</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="abierta">Abierta</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelta">Resuelta</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Añade un comentario sobre el cambio..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleChangeStatus}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Actualizar
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedIncidencia(null);
                    setNewStatus("");
                    setStatusComment("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageState>
  );
}
