import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

type ApiList<T> = { ok: boolean; data: T[] };

type HistoricoItem = {
  id: string;
  type: "checklist" | "incidencia" | "appcc" | string;
  action: string;
  user?: string | null;
  date: string;

  observations?: string | null;
  temperature?: number | null;
  title?: string | null;
};

export default function Historico() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("todos");

  const fetchHistorico = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetchAuth<ApiList<HistoricoItem>>("/historico", {
        method: "GET",
      });

      setHistorico(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar histórico"));
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeHistorico = Array.isArray(historico) ? historico : [];

  const filteredHistorico = safeHistorico.filter((item) => {
    if (typeFilter === "todos") return true;
    return item.type === typeFilter;
  });

  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);

  const thisWeekItems = safeHistorico.filter(
    (item) => new Date(item.date) >= thisWeekStart
  );

  const completedTasks = safeHistorico.filter(
    (item) => item.type === "checklist" && item.action === "Tarea completada"
  ).length;

  const totalIncidencias = safeHistorico.filter(
    (item) => item.type === "incidencia"
  ).length;

  const getTypeBadge = (type: string) => {
    const styles = {
      checklist: "bg-[var(--info-bg)] text-[var(--info)]",
      incidencia: "bg-[var(--error-bg)] text-[var(--error)]",
      appcc: "bg-[var(--success-bg)] text-[var(--success)]",
    };

    const labels = {
      checklist: "Checklist",
      incidencia: "Incidencia",
      appcc: "APPCC",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          styles[type as keyof typeof styles] ||
          "bg-muted text-muted-foreground"
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
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Histórico de actividades
          </h2>
          <p className="text-muted-foreground">
            Registro completo de todas las operaciones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Total registros
            </p>
            <p className="text-3xl font-bold text-foreground">
              {safeHistorico.length}
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">
              Tareas completadas
            </p>
            <p className="text-3xl font-bold text-[var(--success)]">
              {completedTasks}
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Incidencias</p>
            <p className="text-3xl font-bold text-destructive">
              {totalIncidencias}
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Esta semana</p>
            <p className="text-3xl font-bold text-primary">
              {thisWeekItems.length}
            </p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 mb-6">
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
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  typeFilter === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Actividad reciente
          </h3>

          <div className="space-y-4">
            {filteredHistorico.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b border-border/50 last:border-0"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getTypeBadge(item.type)}
                    <span className="font-medium text-foreground">
                      {item.action}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    Por{" "}
                    <strong className="text-foreground">
                      {item.user ?? "-"}
                    </strong>
                  </p>

                  {item.observations && (
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong className="text-foreground">
                        Observaciones:
                      </strong>{" "}
                      {item.observations}
                    </p>
                  )}

                  {typeof item.temperature === "number" && (
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong className="text-foreground">Temperatura:</strong>{" "}
                      {item.temperature}°C
                    </p>
                  )}

                  {item.title && (
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong className="text-foreground">Título:</strong>{" "}
                      {item.title}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.date).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredHistorico.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividades registradas
            </p>
          )}
        </div>
      </div>
    </PageState>
  );
}
