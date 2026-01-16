import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

type ApiList<T> = { ok: boolean; data: T[] };

type ExamQuestion = {
  question: string;
  options: string[];
};

type ExamRow = {
  id: string;
  title: string;
  description?: string | null;
  questions: ExamQuestion[];
};

type ExamResultRow = {
  id: string;
  userId: string;
  examId: string;
  score: number;
  correct: number;
  total: number;
  date?: string;
};

type SubmitResult = {
  ok?: boolean;
  score: number;
  correct: number;
  total: number;
};

export default function EmployeeExams() {
  const { user } = useAuth();

  const [exams, setExams] = useState<ExamRow[]>([]);
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<ExamRow | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1) exams CRÍTICO
      const examsRes = await apiFetchAuth<ApiList<ExamRow>>("/exams", {
        method: "GET",
      });
      const examsList = Array.isArray(examsRes.data) ? examsRes.data : [];
      setExams(examsList);

      // 2) results OPCIONAL
      const resultsRes = await apiFetchAuth<ApiList<ExamResultRow>>(
        "/exams/results",
        { method: "GET" }
      ).catch(() => null);

      if (resultsRes?.data && Array.isArray(resultsRes.data)) {
        setResults(resultsRes.data.filter((r) => r.userId === user.id));
      } else {
        setResults([]);
      }
    } catch (e) {
      setError(normalizeError(e, "Error al cargar exámenes"));
      setExams([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startExam = (exam: ExamRow) => {
    setSelectedExam(exam);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setShowResult(false);
    setLastResult(null);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = answerIndex;
      return next;
    });
  };

  const submitExam = async () => {
    if (!selectedExam) return;

    if (answers.some((a) => a === -1)) {
      alert("Por favor, responde todas las preguntas antes de enviar");
      return;
    }

    try {
      const res = await apiFetchAuth<SubmitResult>(
        `/exams/${selectedExam.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      );

      setLastResult(res);
      setShowResult(true);
    } catch (e) {
      alert(normalizeError(e, "Error al enviar el examen"));
    }
  };

  const closeExam = () => {
    setSelectedExam(null);
    setAnswers([]);
    setShowResult(false);
    setLastResult(null);
    fetchData();
  };

  if (!user) return null;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchData}
      title="No se pudieron cargar los exámenes"
    >
      {selectedExam && !showResult && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setSelectedExam(null)}
              className="text-primary hover:opacity-90 font-medium mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              ← Volver a exámenes
            </button>

            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {selectedExam.title}
              </h2>
              {selectedExam.description && (
                <p className="text-muted-foreground mb-4">
                  {selectedExam.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {selectedExam.questions.length} preguntas
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {selectedExam.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">
                  {qIndex + 1}. {q.question}
                </h3>

                <div className="space-y-2">
                  {q.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex] === optIndex}
                        onChange={() => handleAnswerChange(qIndex, optIndex)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-foreground">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={submitExam}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Enviar examen
            </button>
          </div>
        </div>
      )}

      {showResult && lastResult && (
        <div className="mb-6">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Examen completado
            </h2>

            <div className="mb-6">
              <div
                className={`text-6xl font-bold mb-2 ${
                  lastResult.score >= 70
                    ? "text-[var(--success)]"
                    : lastResult.score >= 50
                    ? "text-[var(--warning)]"
                    : "text-destructive"
                }`}
              >
                {lastResult.score.toFixed(0)}%
              </div>
              <p className="text-muted-foreground">
                Has acertado {lastResult.correct} de {lastResult.total}{" "}
                preguntas
              </p>
            </div>

            {lastResult.score >= 70 ? (
              <div className="bg-[var(--success-bg)] border border-[var(--success)]/30 rounded-lg p-4 mb-6">
                <p className="text-foreground font-medium">
                  ¡Excelente trabajo! Has aprobado el examen.
                </p>
              </div>
            ) : (
              <div className="bg-[var(--error-bg)] border border-destructive/30 rounded-lg p-4 mb-6">
                <p className="text-foreground font-medium">
                  No has alcanzado la puntuación mínima. Puedes volver a
                  realizar el examen.
                </p>
              </div>
            )}

            <button
              onClick={closeExam}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Volver a exámenes
            </button>
          </div>
        </div>
      )}

      {!selectedExam && !showResult && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Exámenes disponibles
            </h2>
            <p className="text-muted-foreground">
              Realiza los exámenes asignados por la administración
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => {
              const userResults = results.filter((r) => r.examId === exam.id);
              const bestScore =
                userResults.length > 0
                  ? Math.max(...userResults.map((r) => r.score))
                  : null;

              return (
                <div
                  key={exam.id}
                  className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {exam.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{exam.questions.length} preguntas</span>
                    {bestScore !== null && (
                      <>
                        <span>•</span>
                        <span
                          className={
                            bestScore >= 70
                              ? "text-[var(--success)] font-medium"
                              : "text-destructive font-medium"
                          }
                        >
                          Mejor puntuación: {bestScore.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => startExam(exam)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {bestScore !== null ? "Repetir examen" : "Realizar examen"}
                  </button>
                </div>
              );
            })}
          </div>

          {exams.length === 0 && (
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-12 text-center">
              <p className="text-muted-foreground">
                No hay exámenes disponibles
              </p>
            </div>
          )}
        </div>
      )}
    </PageState>
  );
}
