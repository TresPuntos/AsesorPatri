import { UploadWidget } from "./upload-widget";

export function EmptyState() {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-dashed border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-10 text-white shadow-xl">
      <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),transparent_65%)] blur-2xl" />
      <div className="absolute right-10 bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.2),transparent_60%)] blur-2xl" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm uppercase tracking-[0.25em] text-white/60">
            Empecemos
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Sube tu histórico y activa tu plan de ahorro.
          </h2>
          <p className="max-w-xl text-sm text-white/70">
            Carga el archivo `@01.01-31.10 BBVA Patri.xlsx` para que pueda analizar tus movimientos,
            generar estadísticas y diseñar recomendaciones personalizadas. El objetivo: ahorrar al
            menos 200 € cada mes sin perder calidad de vida.
          </p>
        </div>
        <UploadWidget />
        <p className="text-xs text-white/50">
          Acepto archivos .xlsx, .xls o .csv. Los datos se procesan de forma segura en tu base de
          datos de Vercel.
        </p>
      </div>
    </section>
  );
}


