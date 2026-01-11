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
        <div
          role="status"
          aria-label="Cargando"
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          role="alert"
          aria-live="polite"
          className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-8 max-w-lg w-full text-center"
        >
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{error || description}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
