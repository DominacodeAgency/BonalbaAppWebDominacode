import { useState } from "react";
import AdminUsers from "./admin/AdminUsers";
import AdminEquipment from "./admin/AdminEquipment";
import AdminExams from "./admin/AdminExams";
import AdminMessages from "./admin/AdminMessages";
import { useAuth } from "@/auth/AuthContext";

/**
 * AdminPanel: panel de administración (solo admins).
 */
export default function AdminPanel() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<
    "users" | "equipment" | "exams" | "messages"
  >("users");

  const sections = [
    { id: "users", label: "Gestión de usuarios" },
    { id: "equipment", label: "Gestión de equipos" },
    { id: "exams", label: "Exámenes" },
    { id: "messages", label: "Mensajería" },
  ] as const;

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Panel de Administración
        </h2>
        <p className="text-muted-foreground">Gestión avanzada del sistema</p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:opacity-90"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === "users" && <AdminUsers />}
      {activeSection === "equipment" && <AdminEquipment />}
      {activeSection === "exams" && <AdminExams />}
      {activeSection === "messages" && <AdminMessages />}
    </div>
  );
}
