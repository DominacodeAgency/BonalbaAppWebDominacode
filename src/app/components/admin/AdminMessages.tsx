import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

type ApiList<T> = { ok: boolean; data: T[] };

type UserRow = {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  role?: string | null;
  area?: string | null;
};

type MessageRow = {
  id: string;
  senderId?: string;
  senderName?: string;
  recipientId: string; // "all" o userId
  subject: string;
  message: string;
  read: boolean;
  date: string;
};

export default function AdminMessages() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  const displayUser = (u?: UserRow | null) =>
    u?.full_name || u?.email || u?.username || "Usuario";

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [mRes, uRes] = await Promise.all([
        apiFetchAuth<ApiList<MessageRow>>("/messages", { method: "GET" }),
        apiFetchAuth<ApiList<UserRow>>("/users", { method: "GET" }),
      ]);

      setMessages(Array.isArray(mRes.data) ? mRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar mensajería"));
      setMessages([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const messageData = {
      recipientId: String(formData.get("recipientId") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
    };

    try {
      await apiFetchAuth<{ ok: boolean }>("/messages", {
        method: "POST",
        body: JSON.stringify(messageData),
      });

      setShowModal(false);
      await fetchData();
      alert("Mensaje enviado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al enviar mensaje"));
    }
  };

  if (!user) return null;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchData}
      title="No se pudo cargar mensajería"
    >
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Mensajería
            </h3>
            <p className="text-sm text-muted-foreground">
              Envía mensajes personalizados a los empleados
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Nuevo mensaje
          </button>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h4 className="font-semibold text-foreground mb-4">
            Mensajes enviados
          </h4>

          <div className="space-y-3">
            {messages.map((message) => {
              const recipient =
                message.recipientId === "all"
                  ? null
                  : users.find((u) => u.id === message.recipientId);

              return (
                <div
                  key={message.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-foreground">
                        {message.subject}
                      </h5>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {message.message}
                      </p>
                    </div>
                    {message.read && (
                      <span className="text-xs text-[var(--success)] font-medium">
                        Leído
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Para:{" "}
                      {message.recipientId === "all"
                        ? "Todos los empleados"
                        : displayUser(recipient)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(message.date).toLocaleString("es-ES")}
                    </span>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No has enviado mensajes todavía
              </p>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                Enviar mensaje
              </h3>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Destinatario
                  </label>
                  <select
                    name="recipientId"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                  >
                    <option value="">Seleccionar destinatario...</option>
                    <option value="all">Todos los empleados</option>

                    {users
                      .filter((u) => u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {displayUser(u)} — {u.role}
                          {u.area ? ` (${u.area})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="Asunto del mensaje"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <textarea
                    name="message"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    rows={6}
                    placeholder="Escribe tu mensaje..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Enviar mensaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
