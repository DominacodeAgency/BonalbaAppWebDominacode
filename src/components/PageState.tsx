import React from "react";

type Props = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * PageState: wrapper de página para manejar loading/error/success sin render parcial.
 */
export default function PageState({
  loading,
  error,
  onRetry,
  title = "Error cargando",
  description = "No hemos podido cargar esta información. Reintenta.",
  children,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-lg w-full text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{error || description}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
