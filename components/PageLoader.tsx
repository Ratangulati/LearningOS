"use client";

type PageLoaderProps = {
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export default function PageLoader({ title, subtitle, compact = false }: PageLoaderProps) {
  return (
    <div className={`w-full ${compact ? "py-8" : "min-h-[45vh]"} flex items-center justify-center`}>
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-8 md:p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-zinc-700 border-t-indigo-500 animate-spin" />
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">{title}</h2>
        {subtitle && <p className="text-zinc-400 text-sm md:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
