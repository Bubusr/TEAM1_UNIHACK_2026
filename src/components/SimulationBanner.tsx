'use client';

export default function SimulationBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className="bg-slate-800/95 text-slate-300 px-3 py-1.5 text-center text-[11px] font-medium flex items-center justify-center gap-1.5 border-b border-slate-700/60 backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      <span className="text-slate-300">Giả lập vị trí bật</span>
      <span className="text-slate-500">•</span>
      <span className="text-slate-400">Chế độ chấm thi Ban Giám Khảo</span>
    </div>
  );
}
