import { useState, useEffect } from "react";

interface AdminExamsProps {
  user: any;
  accessToken: string;
  projectId: string;
}

export default function AdminExams({ user, accessToken, projectId }: AdminExamsProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [questions, setQuestions] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/exams`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/exams/results`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
      ]);

      if (examsRes.ok && resultsRes.ok) {
        const examsData = await examsRes.json();
        const resultsData = await resultsRes.json();
        setExams(examsData);
        setResults(resultsData);
      }
    } catch (error) {
      console.error("Error fetching exams data:", error);
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-12488a14/exams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(examData),
        }
      );

      if (response.ok) {
        setShowCreateModal(false);
        setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
        fetchData();
        alert("Examen creado correctamente");
      } else {
        const error = await response.json();
        alert("Error al crear examen: " + error.error);
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Error al crear examen");
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de exámenes</h3>
          <p className="text-sm text-gray-600">Crea y gestiona exámenes para el personal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResultsModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Ver resultados
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
              ? examResults.reduce((sum, r) => sum + r.score, 0) / examResults.length
              : 0;

          return (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{exam.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                  <p className="text-xs text-gray-500">
                    {exam.questions.length} preguntas • Creado por {exam.createdBy} el{" "}
                    {new Date(exam.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Realizaciones:</span>
                  <span className="font-semibold text-gray-900">{examResults.length}</span>
                </div>
                {examResults.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Puntuación media:</span>
                    <span className="font-semibold text-green-600">
                      {avgScore.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No hay exámenes creados</p>
          </div>
        )}
      </div>

      {/* Create exam modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="font-bold text-lg mb-4">Crear nuevo examen</h3>

            <form onSubmit={handleCreateExam} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del examen
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: Seguridad alimentaria básica"
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
                  rows={2}
                  placeholder="Breve descripción del examen..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Preguntas</label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Añadir pregunta
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Pregunta {qIndex + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
                        placeholder="Escribe la pregunta..."
                        required
                      />

                      <div className="space-y-2">
                        {q.options.map((opt: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => updateQuestion(qIndex, "correctAnswer", optIndex)}
                              className="text-blue-600"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              placeholder={`Opción ${optIndex + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Selecciona la opción correcta con el botón radio
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Crear examen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
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

      {/* Results modal */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Resultados de exámenes</h3>
              <button
                onClick={() => setShowResultsModal(false)}
                className="text-gray-500 hover:text-gray-700"
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
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{exam?.title}</p>
                        <p className="text-sm text-gray-600">{result.userName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(result.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            result.score >= 70
                              ? "text-green-600"
                              : result.score >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.score.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.correct} / {result.total} correctas
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {results.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No hay resultados todavía
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
