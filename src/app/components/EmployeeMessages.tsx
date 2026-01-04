import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/auth/apiAuth";

/**
 * EmployeeMessages: bandeja de mensajes del empleado.
 * Usa apiFetchAuth para autenticar automáticamente (sin props token/projectId).
 */
export default function EmployeeMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await apiFetchAuth<any[]>("/messages", { method: "GET" });
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await apiFetchAuth(`/messages/${messageId}/read`, { method: "PUT" });
      await fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const openMessage = (message: any) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mensajes</h2>
        <p className="text-gray-600">
          Mensajes de la administración • {unreadCount} sin leer
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            onClick={() => openMessage(message)}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${
              !message.read ? "border-l-4 border-l-blue-600" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {message.subject}
                  </h3>
                  {!message.read && (
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                      Nuevo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {message.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
              <span>De: {message.senderName}</span>
              <span>•</span>
              <span>{new Date(message.date).toLocaleString("es-ES")}</span>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No tienes mensajes</p>
        </div>
      )}

      {/* Message detail modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedMessage.subject}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <strong>De:</strong> {selectedMessage.senderName}
                </span>
                <span>•</span>
                <span>
                  {new Date(selectedMessage.date).toLocaleString("es-ES")}
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
