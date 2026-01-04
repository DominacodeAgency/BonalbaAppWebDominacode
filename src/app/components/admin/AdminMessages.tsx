import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";

/**
 * AdminMessages: mensajería para admins.
 * Usa AuthContext + apiFetchAuth (sin props de token/projectId).
 */
export default function AdminMessages() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [messagesData, usersData] = await Promise.all([
        apiFetchAuth<any[]>("/messages", { method: "GET" }),
        apiFetchAuth<any[]>("/users", { method: "GET" }),
      ]);

      setMessages(messagesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const messageData = {
      recipientId: formData.get("recipientId") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      await apiFetchAuth("/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      setShowModal(false);
      fetchData();
      alert("Mensaje enviado correctamente");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar mensaje");
    }
  };

  if (!user) return null;

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
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Mensajería
          </h3>
          <p className="text-sm text-gray-600">
            Envía mensajes personalizados a los empleados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Nuevo mensaje
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Mensajes enviados</h4>

        <div className="space-y-3">
          {messages.map((message) => {
            const recipient = users.find((u) => u.id === message.recipientId);

            return (
              <div
                key={message.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {message.subject}
                    </h5>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {message.message}
                    </p>
                  </div>
                  {message.read && (
                    <span className="text-xs text-green-600 font-medium">
                      Leído
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Para:{" "}
                    {message.recipientId === "all"
                      ? "Todos los empleados"
                      : recipient?.name || "Usuario"}
                  </span>
                  <span>•</span>
                  <span>{new Date(message.date).toLocaleString("es-ES")}</span>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No has enviado mensajes todavía
            </p>
          )}
        </div>
      </div>

      {/* Send message modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Enviar mensaje</h3>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatario
                </label>
                <select
                  name="recipientId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar destinatario...</option>
                  <option value="all">Todos los empleados</option>
                  {users
                    .filter((u) => u.id !== user.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  name="message"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={6}
                  placeholder="Escribe tu mensaje..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Enviar mensaje
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
