import { useState, useEffect } from "react";

interface ChecklistDetailProps {
  checklistId: string;
  user: any;
  accessToken: string;
  projectId: string;
  onBack: () => void;
}

export default function ChecklistDetail({
  checklistId,
  user,
  accessToken,
  projectId,
  onBack,
}: ChecklistDetailProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
  const [observations, setObservations] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [checklistId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/checklists/${checklistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: any) => {
    setSelectedTask(task);
    setObservations(task.observations || "");
  };

  const confirmComplete = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/checklists/${checklistId}/tasks/${selectedTask.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ observations }),
        }
      );

      if (response.ok) {
        await fetchTasks();
        setSelectedTask(null);
        setObservations("");
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleReportIncidencia = (task: any) => {
    setSelectedTask(task);
    setShowIncidenciaModal(true);
    setPhotoData(null);
    setPhotoPreview(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoData(base64String);
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/incidencias`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title,
            description,
            priority,
            checklistId,
            taskId: selectedTask.id,
            photoData,
          }),
        }
      );

      if (response.ok) {
        setShowIncidenciaModal(false);
        setSelectedTask(null);
        setPhotoData(null);
        setPhotoPreview(null);
        alert("Incidencia reportada correctamente");
      }
    } catch (error) {
      console.error("Error reporting incidencia:", error);
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
      <span className={`text-xs font-medium px-2 py-1 rounded ${styles[status as keyof typeof styles] || styles.pending}`}>
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
      <span className={`text-xs font-medium px-2 py-1 rounded ${styles[priority as keyof typeof styles] || ""}`}>
        Prioridad {priority}
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

  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
        >
          ← Volver a checklists
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{checklistId.replace(/-/g, " ")}</h2>

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
                  percentage === 100 ? "bg-green-600" : percentage > 0 ? "bg-blue-600" : "bg-gray-400"
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
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
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
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
                  onClick={() => handleCompleteTask(task)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Completar tarea
                </button>
                <button
                  onClick={() => handleReportIncidencia(task)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Reportar incidencia
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de completar tarea */}
      {selectedTask && !showIncidenciaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Completar tarea</h3>
            <p className="text-gray-700 mb-4">{selectedTask.title}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="Añade observaciones si es necesario..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmComplete}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setObservations("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de incidencia */}
      {showIncidenciaModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Reportar incidencia</h3>

            <form onSubmit={submitIncidencia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
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
                  name="description"
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
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="mb-4">
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
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Reportar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowIncidenciaModal(false);
                    setSelectedTask(null);
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