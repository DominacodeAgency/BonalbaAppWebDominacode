//Mapa de permisos
// src/auth/rbac.ts
export type Role = "admin" | "encargado" | "empleado";

// Secciones lógicas de la app (ajústalas a tu menú/rutas)
export type Section =
  | "common" // todos logueados
  | "admin" // solo admin
  | "manager" // encargado + admin
  | "staff"; // empleado + encargado + admin (si quieres diferenciar)

const ROLE_ACCESS: Record<Role, Section[]> = {
  admin: ["common", "admin", "manager", "staff"],
  encargado: ["common", "manager", "staff"],
  empleado: ["common", "staff"],
};

export function canAccess(role: Role | undefined, section: Section) {
  if (!role) return false;
  return ROLE_ACCESS[role]?.includes(section) ?? false;
}
