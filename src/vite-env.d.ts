/// <reference types="vite/client" />
/**
 * Tipos de Vite para TypeScript.
 * Declara las variables de entorno (VITE_*) disponibles en import.meta.env
 * para evitar errores de tipado en el editor.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
