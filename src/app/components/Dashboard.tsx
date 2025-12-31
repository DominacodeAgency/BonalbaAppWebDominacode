import { useState } from "react";
import { projectId } from "../../../utils/supabase/info";
import Header from "./Header";
import Checklists from "./Checklists";
import Incidencias from "./Incidencias";
import APPCC from "./APPCC";
import Historico from "./Historico";
import AdminPanel from "./AdminPanel";
import EmployeeExams from "./EmployeeExams";
import EmployeeMessages from "./EmployeeMessages";

interface DashboardProps {
  user: any;
  accessToken: string;
  onLogout: () => void;
}

export default function Dashboard({ user, accessToken, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("checklists");

  const canAccessAdmin = user.role === "admin";

  const tabs = [
    { id: "checklists", label: "Checklists" },
    { id: "incidencias", label: "Incidencias" },
    { id: "appcc", label: "APPCC" },
    { id: "historico", label: "Histórico" },
    { id: "exams", label: "Exámenes" },
    { id: "messages", label: "Mensajes" },
    ...(canAccessAdmin ? [{ id: "admin", label: "Administración" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "checklists" && (
          <Checklists user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "incidencias" && (
          <Incidencias user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "appcc" && (
          <APPCC user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "historico" && (
          <Historico user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "exams" && (
          <EmployeeExams user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "messages" && (
          <EmployeeMessages user={user} accessToken={accessToken} projectId={projectId} />
        )}
        {activeTab === "admin" && canAccessAdmin && (
          <AdminPanel user={user} accessToken={accessToken} projectId={projectId} />
        )}
      </div>
    </div>
  );
}