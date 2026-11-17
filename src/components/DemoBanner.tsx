'use client';

export default function DemoBanner() {
  return (
    <div className="bg-slate-900 text-slate-300 px-3 py-1.5 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-1.5 border-b border-slate-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      <span className="text-slate-400">Avalanche Fuji C-Chain</span>
      <span className="text-slate-600">•</span>
      <span className="text-slate-300">Bản demo kỹ thuật</span>
    </div>
  );
}
