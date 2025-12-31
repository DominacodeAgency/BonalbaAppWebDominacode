import { useState } from "react";
import AdminUsers from "./admin/AdminUsers";
import AdminEquipment from "./admin/AdminEquipment";
import AdminExams from "./admin/AdminExams";
import AdminMessages from "./admin/AdminMessages";

interface AdminPanelProps {
  user: any;
  accessToken: string;
  projectId: string;
}

export default function AdminPanel({ user, accessToken, projectId }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<"users" | "equipment" | "exams" | "messages">("users");

  const sections = [
    { id: "users", label: "Gestión de usuarios" },
    { id: "equipment", label: "Gestión de equipos" },
    { id: "exams", label: "Exámenes" },
    { id: "messages", label: "Mensajería" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Administración</h2>
        <p className="text-gray-600">Gestión avanzada del sistema</p>
      </div>

      {/* Section selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
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

      {/* Content */}
      {activeSection === "users" && (
        <AdminUsers user={user} accessToken={accessToken} projectId={projectId} />
      )}
      {activeSection === "equipment" && (
        <AdminEquipment user={user} accessToken={accessToken} projectId={projectId} />
      )}
      {activeSection === "exams" && (
        <AdminExams user={user} accessToken={accessToken} projectId={projectId} />
      )}
      {activeSection === "messages" && (
        <AdminMessages user={user} accessToken={accessToken} projectId={projectId} />
      )}
    </div>
  );
}