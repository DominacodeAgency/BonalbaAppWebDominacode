import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { apiFetchAuth } from "@/auth/apiAuth";
import PageState from "@/components/PageState";
import { normalizeError } from "@/lib/normalizeError";

/**
 * AdminUsers: gestión de usuarios (crear / listar / eliminar).
 * Usa AuthContext + apiFetchAuth (sin props).
 */
const roleLabels: Record<string, string> = {
  admin: "Administrador",
  encargado_cocina: "Encargado de cocina",
  encargado_sala: "Encargado de sala",
  personal_cocina: "Personal de cocina",
  personal_sala: "Personal de sala",
};

export default function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchAuth<any[]>("/users", { method: "GET" });
      setUsers(data);
    } catch (e) {
      setError(normalizeError(e, "Error al cargar usuarios"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const userData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      username: formData.get("username") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
    };

    try {
      await apiFetchAuth("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      setShowModal(false);
      await fetchUsers();
      alert("Usuario creado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al crear usuario"));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      await apiFetchAuth(`/users/${userId}`, { method: "DELETE" });
      await fetchUsers();
      alert("Usuario eliminado correctamente");
    } catch (e) {
      alert(normalizeError(e, "Error al eliminar usuario"));
    }
  };

  if (!user) return null;

  return (
    <PageState
      loading={loading}
      error={error}
      onRetry={fetchUsers}
      title="No se pudieron cargar los usuarios"
    >
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Usuarios del sistema
            </h3>
            <p className="text-sm text-muted-foreground">
              Gestiona los usuarios y sus permisos
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Crear usuario
          </button>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha de creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-card divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {u.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{u.username}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{u.email}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-accent text-accent-foreground">
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("es-ES")}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-destructive hover:opacity-90 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No hay usuarios
              </div>
            )}
          </div>
        </div>

        {/* Create user modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
              <h3 className="font-bold text-lg mb-4 text-foreground">
                Crear nuevo usuario
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="juanperez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="juan@bonalba.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rol
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-border bg-input-background text-foreground rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border"
                  >
                    <option value="">Seleccionar rol...</option>
                    <option value="admin">Administrador</option>
                    <option value="encargado_cocina">
                      Encargado de cocina
                    </option>
                    <option value="encargado_sala">Encargado de sala</option>
                    <option value="personal_cocina">Personal de cocina</option>
                    <option value="personal_sala">Personal de sala</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Crear usuario
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
