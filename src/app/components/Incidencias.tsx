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

  // Delete (inline)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [filter, setFilter] = useState("todas");

  // Modal estado
  const [selectedIncidencia, setSelectedIncidencia] = useState<any | null>(
    null
  );
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIncidencias = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/incidencias", { method: "GET" });
      setIncidencias(data ?? []);
    } catch (e) {
      setError(normalizeError(e, "Error cargando incidencias"));
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidencias = incidencias.filter((inc) => {
    if (filter === "todas") return true;
    if (filter === "mias") return inc.userId === user?.id;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    const styles = {
      alta: "bg-[var(--error-bg)] text-[var(--error)]",
      media: "bg-[var(--warning-bg)] text-[var(--warning)]",
      baja: "bg-[var(--info-bg)] text-[var(--info)]",
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
      abierta: "bg-[var(--error-bg)] text-[var(--error)]",
      en_proceso: "bg-[var(--warning-bg)] text-[var(--warning)]",
      resuelta: "bg-[var(--success-bg)] text-[var(--success)]",
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

  const canDelete = (inc: any) => {
    // Reglas:
    // - admin puede borrar todas
    // - creador puede borrar las suyas (si quieres)
    return user?.role === "admin" || inc.userId === user?.id;
  };

  const openStatusModal = (incidencia: any) => {
    setDeleteError(null);
    setStatusError(null);
    setStatusLoading(false);

    setSelectedIncidencia(incidencia);
    setNewStatus(incidencia.status === "abierta" ? "en_proceso" : "resuelta");
    setStatusComment("");
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedIncidencia(null);
    setNewStatus("");
    setStatusComment("");
    setStatusLoading(false);
    setStatusError(null);
  };

  const handleChangeStatus = async () => {
    if (!selectedIncidencia || !newStatus) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      await apiFetchAuth(`/incidencias/${selectedIncidencia.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus, comment: statusComment }),
      });

      await fetchIncidencias();
      closeStatusModal();
    } catch (e) {
      setStatusError(normalizeError(e, "Error actualizando incidencia"));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteIncidencia = async (inc: any) => {
    if (!inc?.id) return;

    setDeleteError(null);
    setStatusError(null);

    const ok = confirm(
      `¿Eliminar la incidencia "${inc.title}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      setDeleteLoadingId(inc.id);

      await apiFetchAuth(`/incidencias/${inc.id}`, { method: "DELETE" });

      // Si estaba abierta en modal, cerramos
      if (selectedIncidencia?.id === inc.id) closeStatusModal();

      await fetchIncidencias();
    } catch (e) {
      setDeleteError(normalizeError(e, "Error eliminando incidencia"));
    } finally {
      setDeleteLoadingId(null);
    }
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
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Incidencias
          </h2>
          <p className="text-muted-foreground">
            Gestiona y da seguimiento a las incidencias reportadas
          </p>
        </div>

        {deleteError && (
          <div className="mb-4 bg-[var(--error-bg)] border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded-lg text-sm">
            {deleteError}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("todas")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === "todas"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("mias")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === "mias"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
              className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {incidencia.title}
                    </h3>
                    {getStatusBadge(incidencia.status)}
                    {getPriorityBadge(incidencia.priority)}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {incidencia.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Reportada por: {incidencia.userName}</span>
                    <span>•</span>
                    <span>
                      {new Date(incidencia.date).toLocaleString("es-ES")}
                    </span>
                  </div>
                </div>
              </div>

              {incidencia.updates && incidencia.updates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Historial de actualizaciones:
                  </p>
                  <div className="space-y-2">
                    {incidencia.updates.map((update: any, index: number) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground pl-4 border-l-2 border-border"
                      >
                        <p className="font-medium text-foreground">
                          {update.action}
                        </p>
                        {update.comment && (
                          <p className="text-muted-foreground">
                            {update.comment}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {update.user} -{" "}
                          {new Date(update.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {incidencia.photoData && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Foto adjunta:
                  </p>
                  <img
                    src={incidencia.photoData}
                    alt="Incidencia"
                    className="max-w-full h-auto rounded border border-border"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {incidencia.status !== "resuelta" && (
                  <button
                    onClick={() => openStatusModal(incidencia)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-[color:var(--brand-olive-dark)] transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {incidencia.status === "abierta"
                      ? "Poner en proceso"
                      : "Marcar como resuelta"}
                  </button>
                )}

                {canDelete(incidencia) && (
                  <button
                    onClick={() => handleDeleteIncidencia(incidencia)}
                    disabled={deleteLoadingId === incidencia.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--error)]/30 text-[var(--error)] bg-[var(--error-bg)] hover:opacity-90 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Eliminar incidencia"
                  >
                    {deleteLoadingId === incidencia.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredIncidencias.length === 0 && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-12 text-center">
            <p className="text-muted-foreground">
              No hay incidencias reportadas
            </p>
          </div>
        )}

        {/* Modal cambio de estado */}
        {showStatusModal && selectedIncidencia && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
              <h3 className="font-bold text-lg mb-2 text-foreground">
                Actualizar estado
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedIncidencia.title}
              </p>

              {statusError && (
                <div className="mb-4 bg-[var(--error-bg)] border border-[var(--error)]/20 text-[var(--error)] px-4 py-3 rounded-lg text-sm">
                  {statusError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nuevo estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="abierta">Abierta</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelta">Resuelta</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Añade un comentario sobre el cambio..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleChangeStatus}
                  disabled={statusLoading}
                  className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-[color:var(--brand-olive-dark)] transition-colors font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {statusLoading ? "Actualizando..." : "Actualizar"}
                </button>

                <button
                  onClick={closeStatusModal}
                  disabled={statusLoading}
                  className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg hover:bg-muted/80 hover:text-foreground transition-colors font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
