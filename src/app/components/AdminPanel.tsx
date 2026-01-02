import { useState } from "react";
import AdminUsers from "./admin/AdminUsers";
import AdminEquipment from "./admin/AdminEquipment";
import AdminExams from "./admin/AdminExams";
import AdminMessages from "./admin/AdminMessages";

/**
 * AdminPanel: panel de administración (solo admins).
 * Permite cambiar entre secciones: usuarios, equipos, exámenes y mensajes.
 */
interface AdminPanelProps {
  user: any;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<
    "users" | "equipment" | "exams" | "messages"
  >("users");

  const sections = [
    { id: "users", label: "Gestión de usuarios" },
    { id: "equipment", label: "Gestión de equipos" },
    { id: "exams", label: "Exámenes" },
    { id: "messages", label: "Mensajería" },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h2>
        <p className="text-gray-600">Gestión avanzada del sistema</p>
      </div>

      {/* Selector de sección */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {activeSection === "users" && <AdminUsers user={user} />}
      {activeSection === "equipment" && <AdminEquipment user={user} />}
      {activeSection === "exams" && <AdminExams user={user} />}
      {activeSection === "messages" && <AdminMessages user={user} />}
    </div>
  );
}
