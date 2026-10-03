import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">
          Panel principal
        </h2>

        <p className="mt-2 text-gray-600">
          Bienvenido a la Plataforma RAG.
        </p>
      </div>
    </MainLayout>
  );
}