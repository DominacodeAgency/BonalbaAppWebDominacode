import { useState, useEffect } from "react";
import ChecklistDetail from "./ChecklistDetail";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * Checklists: lista checklists disponibles y abre su detalle.
 * Usa AuthContext + apiFetchAuth (sin props de token/projectId).
 */
export default function Checklists() {
  const { user } = useAuth();

  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(
    null
  );

  const fetchChecklists = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/checklists", { method: "GET" });
      setChecklists(data);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar checklists"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  if (selectedChecklist) {
    return (
      <ChecklistDetail
        checklistId={selectedChecklist}
        onBack={() => {
          setSelectedChecklist(null);
          fetchChecklists();
        }}
      />
    );
  }

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchChecklists}
      title="No se pudieron cargar los checklists"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Checklists diarias
          </h2>
          <p className="text-muted-foreground">
            Gestiona las tareas de apertura y cierre
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {checklists.map((checklist) => {
            const total = checklist.progress?.total || 0;
            const completed = checklist.progress?.completed || 0;
            const percentage =
              total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={checklist.id}
                className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedChecklist(checklist.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {checklist.name}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {checklist.type} • {checklist.shift}
                    </p>
                  </div>
                  {checklist.incidencias > 0 && (
                    <span className="bg-[var(--error-bg)] text-destructive text-xs font-medium px-2 py-1 rounded">
                      {checklist.incidencias} incidencia
                      {checklist.incidencias !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium text-foreground">
                        {completed} / {total} tareas
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage === 100
                            ? "bg-[var(--success)]"
                            : percentage > 0
                            ? "bg-primary"
                            : "bg-muted-foreground/40"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {percentage === 100
                        ? "Completado"
                        : percentage > 0
                        ? "En progreso"
                        : "Pendiente"}
                    </span>
                    <button className="text-sm font-medium text-primary hover:opacity-90">
                      Ver detalle →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {checklists.length === 0 && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-12 text-center">
            <p className="text-muted-foreground">
              No hay checklists disponibles
            </p>
          </div>
        )}
      </div>
    </PageState>
  );
}
