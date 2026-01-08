// src/ui/ErrorState.tsx
// Estado visual centrado para errores (reutilizable en todas las páginas).

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Error cargando",
  message = "No se pudo cargar esta sección. Inténtalo de nuevo.",
  onRetry,
}: Props) {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
