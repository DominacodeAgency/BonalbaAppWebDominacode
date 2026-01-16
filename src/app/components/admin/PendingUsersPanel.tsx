import { useEffect, useState } from "react";
import {
  approveUser,
  fetchPendingUsers,
  type PendingProfile,
} from "@/auth/apiAuth";

export default function PendingUsersPanel() {
  const [items, setItems] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [roleById, setRoleById] = useState<
    Record<string, "empleado" | "encargado" | "admin">
  >({});

  const [areaById, setAreaById] = useState<
    Record<string, "cocina" | "sala" | "">
  >({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetchPendingUsers();
      setItems(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Solicitudes pendientes</h2>

        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay solicitudes pendientes.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((u) => {
            const role = roleById[u.id] ?? "empleado";
            const area = areaById[u.id] ?? "";

            return (
              <div
                key={u.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {u.full_name || u.username || u.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {u.email}
                      {u.phone ? ` • ${u.phone}` : ""}
                      {u.address ? ` • ${u.address}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Creado: {new Date(u.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="border border-border rounded-md px-2 py-2 bg-background"
                      value={role}
                      onChange={(e) =>
                        setRoleById((p) => ({
                          ...p,
                          [u.id]: e.target.value as any,
                        }))
                      }
                    >
                      <option value="empleado">Empleado</option>
                      <option value="encargado">Encargado</option>
                      <option value="admin">Admin</option>
                    </select>

                    <select
                      className="border border-border rounded-md px-2 py-2 bg-background"
                      value={area}
                      onChange={(e) =>
                        setAreaById((p) => ({
                          ...p,
                          [u.id]: e.target.value as any,
                        }))
                      }
                    >
                      <option value="">(sin área)</option>
                      <option value="cocina">Cocina</option>
                      <option value="sala">Sala</option>
                    </select>

                    <button
                      className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        await approveUser({
                          profileId: u.id,
                          role,
                          area: area ? (area as any) : null,
                        });
                        await load();
                      }}
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
