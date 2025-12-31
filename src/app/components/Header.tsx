interface HeaderProps {
  user: any;
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  encargado_cocina: "Encargado de cocina",
  encargado_sala: "Encargado de sala",
  personal_cocina: "Personal de cocina",
  personal_sala: "Personal de sala",
};

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Bonalba</h1>
            <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
