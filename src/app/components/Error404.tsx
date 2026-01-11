export default function Error404() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Página no encontrada</p>
      </div>
    </div>
  );
}
