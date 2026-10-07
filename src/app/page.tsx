import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="rounded border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Panel principal</h2>
        <p className="mt-2 font-mono text-[13px] text-muted-foreground">
          Bienvenido a la Plataforma RAG.
        </p>
      </div>
    </MainLayout>
  );
}
