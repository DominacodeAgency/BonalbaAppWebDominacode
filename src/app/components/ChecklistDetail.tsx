import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * ChecklistDetail: muestra tareas de un checklist, permite completar tareas y reportar incidencias.
 * - Carga inicial: PageState (error de página)
 * - Acciones (complete / incidencia): errores inline (NO alert)
 */
interface ChecklistDetailProps {
  checklistId: string;
  onBack: () => void;
}

export default function ChecklistDetail({
  checklistId,
  onBack,
}: ChecklistDetailProps) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Modal completar
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeObservations, setCompleteObservations] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Modal incidencia
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
  const [incTitle, setIncTitle] = useState("");
  const [incDescription, setIncDescription] = useState("");
  const [incPriority, setIncPriority] = useState("media");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [incLoading, setIncLoading] = useState(false);
  const [incError, setIncError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<{ tasks: any[] }>(
        `/checklists/${checklistId}`,
        {
          method: "GET",
        }
      );
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar tareas del checklist"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklistId]);

  const openCompleteModal = (task: any) => {
    setSelectedTask(task);
    setCompleteObservations(task?.observations || "");
    setCompleteError(null);
    setShowCompleteModal(true);
  };

  const closeCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedTask(null);
    setCompleteObservations("");
    setCompleteError(null);
    setCompleteLoading(false);
  };

  const confirmComplete = async () => {
    if (!selectedTask) return;

    setCompleteLoading(true);
    setCompleteError(null);

    try {
      await apiFetchAuth(
        `/checklists/${checklistId}/tasks/${selectedTask.id}/complete`,
        {
          method: "POST",
          body: JSON.stringify({ observations: completeObservations }),
        }
      );

      await fetchTasks();
      closeCompleteModal();
    } catch (e) {
      setCompleteError(normalizeError(e, "Error al completar la tarea"));
    } finally {
      setCompleteLoading(false);
    }
  };

  const openIncidenciaModal = (task: any) => {
    setSelectedTask(task);

    // reset form
    setIncTitle("");
    setIncDescription("");
    setIncPriority("media");
    setPhotoData(null);
    setPhotoPreview(null);
    setIncError(null);
    setIncLoading(false);

    setShowIncidenciaModal(true);
  };

  const closeIncidenciaModal = () => {
    setShowIncidenciaModal(false);
    setSelectedTask(null);

    setIncTitle("");
    setIncDescription("");
    setIncPriority("media");
    setPhotoData(null);
    setPhotoPreview(null);

    setIncError(null);
    setIncLoading(false);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoData(null);
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoData(base64String);
      setPhotoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const submitIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIncLoading(true);
    setIncError(null);

    try {
      await apiFetchAuth("/incidencias", {
        method: "POST",
        body: JSON.stringify({
          title: incTitle,
          description: incDescription,
          priority: incPriority,
          checklistId,
          taskId: selectedTask.id,
          photoData,
        }),
      });

      // ✅ refresca tareas (por si backend marca la tarea como "with_issue", etc.)
      await fetchTasks();
      closeIncidenciaModal();
    } catch (e2) {
      setIncError(normalizeError(e2, "Error al reportar incidencia"));
    } finally {
      setIncLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-gray-100 text-gray-700",
      completed: "bg-green-100 text-green-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      with_issue: "bg-red-100 text-red-700",
    };

    const labels = {
      pending: "Pendiente",
      completed: "Completada",
      in_progress: "En progreso",
      with_issue: "Con incidencia",
    };

    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

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
        Prioridad {priority}
      </span>
    );
  };

  if (!user) return null;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchTasks}
      title="No se pudo cargar el checklist"
    >
      <div>
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
          >
            ← Volver a checklists
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {checklistId.replace(/-/g, " ")}
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progreso del día</span>
                <span className="font-medium text-gray-900">
                  {completed} / {total} tareas completadas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    percentage === 100
                      ? "bg-green-600"
                      : percentage > 0
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {task.title}
                    </h3>
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              </div>

              {task.observations && (
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Observaciones:</strong> {task.observations}
                  </p>
                </div>
              )}

              {task.completedBy && (
                <div className="mt-3 text-xs text-gray-500">
                  Completada por {task.completedBy} el{" "}
                  {new Date(task.completedAt).toLocaleString("es-ES")}
                </div>
              )}

              {task.status !== "completed" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openCompleteModal(task)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Completar tarea
                  </button>
                  <button
                    onClick={() => openIncidenciaModal(task)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Reportar incidencia
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal completar */}
        {showCompleteModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="font-bold text-lg mb-4">Completar tarea</h3>
              <p className="text-gray-700 mb-4">{selectedTask.title}</p>

              {completeError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{completeError}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={completeObservations}
                  onChange={(e) => setCompleteObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Añade observaciones si es necesario..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmComplete}
                  disabled={completeLoading}
                  className="flex-1 bg-green-600 disabled:opacity-60 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {completeLoading ? "Guardando..." : "Confirmar"}
                </button>
                <button
                  onClick={closeCompleteModal}
                  disabled={completeLoading}
                  className="flex-1 bg-gray-200 disabled:opacity-60 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal incidencia */}
        {showIncidenciaModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="font-bold text-lg mb-4">Reportar incidencia</h3>

              {incError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{incError}</p>
                </div>
              )}

              <form onSubmit={submitIncidencia} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Resumen de la incidencia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={incDescription}
                    onChange={(e) => setIncDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={3}
                    placeholder="Describe la incidencia..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={incPriority}
                    onChange={(e) => setIncPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Captura una foto (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoCapture}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {photoPreview && (
                    <div className="mt-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-w-full h-auto rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={incLoading}
                    className="flex-1 bg-red-600 disabled:opacity-60 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    {incLoading ? "Enviando..." : "Reportar"}
                  </button>
                  <button
                    type="button"
                    onClick={closeIncidenciaModal}
                    disabled={incLoading}
                    className="flex-1 bg-gray-200 disabled:opacity-60 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
