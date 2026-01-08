import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * EmployeeExams: vista de exámenes para empleados.
 * - /exams es crítico: si falla => error de página
 * - /exams/results es opcional: si falla => results=[]
 */
export default function EmployeeExams() {
  const { user } = useAuth();

  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1) exams CRÍTICO
      const examsRes = await apiFetchAuth<any[]>("/exams", { method: "GET" });
      setExams(examsRes);

      // 2) results OPCIONAL
      const resultsRes = await apiFetchAuth<any[]>("/exams/results", {
        method: "GET",
      }).catch(() => null);

      if (resultsRes) {
        setResults(resultsRes.filter((r: any) => r.userId === user.id));
      } else {
        setResults([]);
      }
    } catch (e) {
      setError(normalizeError(e, "Error al cargar exámenes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startExam = (exam: any) => {
    setSelectedExam(exam);
    setAnswers(new Array(exam.questions.length).fill(-1));
    setShowResult(false);
    setLastResult(null);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitExam = async () => {
    if (!selectedExam) return;

    if (answers.some((a) => a === -1)) {
      alert("Por favor, responde todas las preguntas antes de enviar");
      return;
    }

    try {
      const result = await apiFetchAuth<any>(
        `/exams/${selectedExam.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      );

      setLastResult(result);
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
              className="text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              ← Volver a exámenes
            </button>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedExam.title}
              </h2>
              <p className="text-gray-600 mb-4">{selectedExam.description}</p>
              <p className="text-sm text-gray-500">
                {selectedExam.questions.length} preguntas
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {selectedExam.questions.map((q: any, qIndex: number) => (
              <div
                key={qIndex}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-4">
                  {qIndex + 1}. {q.question}
                </h3>

                <div className="space-y-2">
                  {q.options.map((option: string, optIndex: number) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex] === optIndex}
                        onChange={() => handleAnswerChange(qIndex, optIndex)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={submitExam}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enviar examen
            </button>
          </div>
        </div>
      )}

      {showResult && lastResult && (
        <div>
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Examen completado
              </h2>

              <div className="mb-6">
                <div
                  className={`text-6xl font-bold mb-2 ${
                    lastResult.score >= 70
                      ? "text-green-600"
                      : lastResult.score >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {lastResult.score.toFixed(0)}%
                </div>
                <p className="text-gray-600">
                  Has acertado {lastResult.correct} de {lastResult.total}{" "}
                  preguntas
                </p>
              </div>

              {lastResult.score >= 70 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    ¡Excelente trabajo! Has aprobado el examen.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">
                    No has alcanzado la puntuación mínima. Puedes volver a
                    realizar el examen.
                  </p>
                </div>
              )}

              <button
                onClick={closeExam}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Volver a exámenes
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedExam && !showResult && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Exámenes disponibles
            </h2>
            <p className="text-gray-600">
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {exam.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{exam.questions.length} preguntas</span>
                    {bestScore !== null && (
                      <>
                        <span>•</span>
                        <span
                          className={
                            bestScore >= 70
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          Mejor puntuación: {bestScore.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => startExam(exam)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {bestScore !== null ? "Repetir examen" : "Realizar examen"}
                  </button>
                </div>
              );
            })}
          </div>

          {exams.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No hay exámenes disponibles</p>
            </div>
          )}
        </div>
      )}
    </PageState>
  );
}
