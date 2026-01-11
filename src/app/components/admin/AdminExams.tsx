import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * AdminExams: gestión de exámenes y visualización de resultados.
 * - /exams es crítico
 * - /exams/results es opcional (si falla => [])
 */
export default function AdminExams() {
  const { user } = useAuth();

  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [questions, setQuestions] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const examsData = await apiFetchAuth<any[]>("/exams", { method: "GET" });
      setExams(examsData);

      const resultsData = await apiFetchAuth<any[]>("/exams/results", {
        method: "GET",
      }).catch(() => null);

      setResults(resultsData ?? []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar exámenes"));
      setExams([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const examData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      questions: questions.filter((q) => q.question.trim() !== ""),
    };

    if (examData.questions.length === 0) {
      alert("Debes añadir al menos una pregunta");
      return;
    }

    try {
      await apiFetchAuth("/exams", {
        method: "POST",
        body: JSON.stringify(examData),
      });

      setShowCreateModal(false);
      setQuestions([
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ]);
      await fetchData();
      alert("Examen creado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al crear examen"));
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: 0 },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  if (!user) return null;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchData}
      title="No se pudieron cargar los exámenes"
    >
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Gestión de exámenes
            </h3>
            <p className="text-sm text-muted-foreground">
              Crea y gestiona exámenes para el personal
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResultsModal(true)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver resultados
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Crear examen
            </button>
          </div>
        </div>

        {/* Exams list */}
        <div className="space-y-4">
          {exams.map((exam) => {
            const examResults = results.filter((r) => r.examId === exam.id);
            const avgScore =
              examResults.length > 0
                ? examResults.reduce((sum, r) => sum + r.score, 0) /
                  examResults.length
                : 0;

            return (
              <div
                key={exam.id}
                className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {exam.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {exam.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exam.questions.length} preguntas • Creado por{" "}
                      {exam.createdBy} el{" "}
                      {new Date(exam.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Realizaciones:
                    </span>
                    <span className="font-semibold text-foreground">
                      {examResults.length}
                    </span>
                  </div>
                  {examResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Puntuación media:
                      </span>
                      <span className="font-semibold text-[var(--success)]">
                        {avgScore.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-12 text-center">
              <p className="text-muted-foreground">No hay exámenes creados</p>
            </div>
          )}
        </div>

        {/* Create exam modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                Crear nuevo examen
              </h3>

              <form onSubmit={handleCreateExam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Título del examen
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="Ej: Seguridad alimentaria básica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    rows={2}
                    placeholder="Breve descripción del examen..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                      Preguntas
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-sm text-primary hover:opacity-90 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    >
                      + Añadir pregunta
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="border border-border rounded-lg p-4 bg-card text-card-foreground"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-foreground">
                            Pregunta {qIndex + 1}
                          </span>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(qIndex)}
                              className="text-sm text-destructive hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            updateQuestion(qIndex, "question", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border mb-3"
                          placeholder="Escribe la pregunta..."
                          required
                        />

                        <div className="space-y-2">
                          {q.options.map((opt: string, optIndex: number) => (
                            <div
                              key={optIndex}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswer === optIndex}
                                onChange={() =>
                                  updateQuestion(
                                    qIndex,
                                    "correctAnswer",
                                    optIndex
                                  )
                                }
                                className="accent-primary"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  updateOption(qIndex, optIndex, e.target.value)
                                }
                                className="flex-1 px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border text-sm"
                                placeholder={`Opción ${optIndex + 1}`}
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Selecciona la opción correcta con el botón radio
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Crear examen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setQuestions([
                        {
                          question: "",
                          options: ["", "", "", ""],
                          correctAnswer: 0,
                        },
                      ]);
                    }}
                    className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Results modal */}
        {showResultsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">
                  Resultados de exámenes
                </h3>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-muted-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {results.map((result) => {
                  const exam = exams.find((e) => e.id === result.examId);

                  return (
                    <div
                      key={result.id}
                      className="border border-border rounded-lg p-4 bg-card text-card-foreground"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {exam?.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.userName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(result.date).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-2xl font-bold ${
                              result.score >= 70
                                ? "text-[var(--success)]"
                                : result.score >= 50
                                ? "text-[var(--warning)]"
                                : "text-destructive"
                            }`}
                          >
                            {result.score.toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.correct} / {result.total} correctas
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {results.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay resultados todavía
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageState>
  );
}
