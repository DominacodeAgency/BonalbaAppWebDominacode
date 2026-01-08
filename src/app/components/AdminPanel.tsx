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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h2>
        <p className="text-gray-600">Gestión avanzada del sistema</p>
      </div>

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

      {activeSection === "users" && <AdminUsers />}
      {activeSection === "equipment" && <AdminEquipment />}
      {activeSection === "exams" && <AdminExams />}
      {activeSection === "messages" && <AdminMessages />}
    </div>
  );
}
