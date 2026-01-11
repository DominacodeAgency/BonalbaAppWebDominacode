import { useState } from "react";
import Header from "./Header";
import Checklists from "./Checklists";
import Incidencias from "./Incidencias";
import APPCC from "./APPCC";
import Historico from "./Historico";
import AdminPanel from "./AdminPanel";
import EmployeeExams from "./EmployeeExams";
import EmployeeMessages from "./EmployeeMessages";
import { useAuth } from "@/auth/AuthContext";

/**
 * Dashboard: contenedor principal tras login.
 * Lee user/logout desde AuthContext (sin props).
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("checklists");

  if (!user) return null;

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
    <div className="min-h-screen bg-background text-foreground">
      <Header user={user} onLogout={logout} />

      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "checklists" && <Checklists />}
        {activeTab === "incidencias" && <Incidencias />}
        {activeTab === "appcc" && <APPCC />}
        {activeTab === "historico" && <Historico />}
        {activeTab === "exams" && <EmployeeExams />}
        {activeTab === "messages" && <EmployeeMessages />}
        {activeTab === "admin" && canAccessAdmin && <AdminPanel />}
      </div>
    </div>
  );
}
