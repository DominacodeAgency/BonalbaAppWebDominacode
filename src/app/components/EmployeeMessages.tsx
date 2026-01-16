import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

type ApiList<T> = { ok: boolean; data: T[] };

type MessageRow = {
  id: string;
  senderId?: string | null;
  senderName?: string | null;
  recipientId: string; // "all" o userId
  subject: string;
  message: string;
  read?: boolean;
  date: string;
};

/**
 * EmployeeMessages: bandeja de mensajes del empleado.
 * Compatible con backend que responde { ok, data }.
 */
export default function EmployeeMessages() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(
    null
  );

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetchAuth<ApiList<MessageRow>>("/messages", {
        method: "GET",
      });

      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar mensajes"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (messageId: string) => {
    try {
      await apiFetchAuth<{ ok: boolean }>(`/messages/${messageId}/read`, {
        method: "PUT",
      });
      await fetchMessages();
    } catch (e) {
      alert(normalizeError(e, "Error al marcar como leído"));
    }
  };

  const openMessage = (message: MessageRow) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const unreadCount = (Array.isArray(messages) ? messages : []).filter(
    (m) => !m.read
  ).length;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchMessages}
      title="No se pudieron cargar los mensajes"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Mensajes</h2>
          <p className="text-muted-foreground">
            Mensajes de la administración • {unreadCount} sin leer
          </p>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              onClick={() => openMessage(message)}
              className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 cursor-pointer hover:shadow-md transition-shadow ${
                !message.read ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {message.subject}
                    </h3>
                    {!message.read && (
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <span>De: {message.senderName || "Administración"}</span>
                <span>•</span>
                <span>{new Date(message.date).toLocaleString("es-ES")}</span>
              </div>
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-12 text-center">
            <p className="text-muted-foreground">No tienes mensajes</p>
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">
                  {selectedMessage.subject}
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    <strong className="text-foreground">De:</strong>{" "}
                    {selectedMessage.senderName || "Administración"}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(selectedMessage.date).toLocaleString("es-ES")}
                  </span>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-foreground whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageState>
  );
}
