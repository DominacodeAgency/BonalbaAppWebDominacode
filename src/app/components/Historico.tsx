import { useState, useEffect } from "react";

interface HistoricoProps {
  user: any;
  accessToken: string;
  projectId: string;
}

export default function Historico({ user, accessToken, projectId }: HistoricoProps) {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todos");

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/historico`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHistorico(data);
      }
    } catch (error) {
      console.error("Error fetching historico:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistorico = historico.filter((item) => {
    if (typeFilter === "todos") return true;
    return item.type === typeFilter;
  });

  // Calculate KPIs
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
      <span className={`text-xs font-medium px-2 py-1 rounded ${styles[type as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico de actividades</h2>
        <p className="text-gray-600">Registro completo de todas las operaciones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total registros</p>
          <p className="text-3xl font-bold text-gray-900">{historico.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Tareas completadas</p>
          <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Incidencias</p>
          <p className="text-3xl font-bold text-red-600">{totalIncidencias}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Esta semana</p>
          <p className="text-3xl font-bold text-blue-600">{thisWeekItems.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter("todos")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              typeFilter === "todos"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter("checklist")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              typeFilter === "checklist"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Checklists
          </button>
          <button
            onClick={() => setTypeFilter("incidencia")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              typeFilter === "incidencia"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Incidencias
          </button>
          <button
            onClick={() => setTypeFilter("appcc")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              typeFilter === "appcc"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            APPCC
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Actividad reciente</h3>
        
        <div className="space-y-4">
          {filteredHistorico.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getTypeBadge(item.type)}
                  <span className="font-medium text-gray-900">{item.action}</span>
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
          <p className="text-sm text-gray-500 text-center py-8">No hay actividades registradas</p>
        )}
      </div>
    </div>
  );
}
