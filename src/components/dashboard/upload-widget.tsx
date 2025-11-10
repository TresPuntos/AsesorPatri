"use client";

import { useRef, useState, useTransition } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { uploadTransactionsAction } from "@/app/actions/upload-transactions";

interface UploadState {
  status: "idle" | "success" | "error";
  message?: string;
}

interface UploadWidgetProps {
  variant?: "default" | "compact";
  hint?: string;
}

export function UploadWidget({ variant = "default", hint }: UploadWidgetProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const containerClasses =
    variant === "compact"
      ? "flex flex-col gap-3 rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-500/10 p-4 text-cyan-100 transition hover:border-cyan-300/80 hover:bg-cyan-500/20"
      : "flex flex-col gap-4 rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-500/10 p-6 text-cyan-100 transition hover:border-cyan-300/80 hover:bg-cyan-500/20";

  const labelClasses =
    variant === "compact"
      ? "flex flex-col gap-2 rounded-2xl border border-cyan-400/10 bg-black/20 p-3 text-xs text-cyan-50/80 cursor-pointer"
      : "flex flex-col gap-3 rounded-2xl border border-cyan-400/10 bg-black/20 p-4 text-sm text-cyan-50/80 cursor-pointer";

  const buttonClasses =
    variant === "compact"
      ? "inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60"
      : "inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60";

  return (
    <form
      ref={formRef}
      className={containerClasses}
      onSubmit={(event) => {
        event.preventDefault();
        const fileElement = fileInputRef.current;

        if (!fileElement || !fileElement.files || fileElement.files.length === 0) {
          setState({
            status: "error",
            message: "Selecciona primero el extracto que quieres analizar.",
          });
          return;
        }

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await uploadTransactionsAction(formData);
          setState({
            status: result.success ? "success" : "error",
            message: result.message,
          });
          if (result.success) {
            formRef.current?.reset();
          }
        });
      }}
    >
      <div
        className={`flex items-center gap-3 uppercase tracking-[0.2em] text-cyan-200 ${
          variant === "compact" ? "text-xs" : "text-sm"
        }`}
      >
        <CloudUpload className="size-5" />
        Actualiza tus datos
      </div>
      <label className={labelClasses}>
        <span>
          Arrastra tu extracto mensual (.xlsx o .csv) o haz clic para elegir un
          archivo.
        </span>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className={buttonClasses}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Procesando...
          </>
        ) : (
          "Cargar último mes"
        )}
      </button>
      {state.status !== "idle" ? (
        <p
          className={`${
            variant === "compact" ? "text-xs" : "text-sm"
          } ${state.status === "success" ? "text-emerald-200" : "text-rose-200"}`}
        >
          {state.message}
        </p>
      ) : null}
      {hint ? (
        <p
          className={`${
            variant === "compact" ? "text-xs" : "text-sm"
          } text-white/50`}
        >
          {hint}
        </p>
      ) : null}
    </form>
  );
}


