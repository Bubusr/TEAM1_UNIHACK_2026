'use client';

import React from 'react';
import { BUS_LINES_DATA, TRANSIT_LEGS_DATA } from '@/data/transit';

export default function TransitGuide() {
  return (
    <div className="space-y-4">
      {/* Step by step itinerary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Hướng dẫn di chuyển từng chặng
          </h3>
          <span className="text-[10px] text-slate-400">Tối ưu thời gian</span>
        </div>

        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
          {TRANSIT_LEGS_DATA.map((leg, idx) => (
            <div key={idx} className="relative space-y-1">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>

              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>{leg.fromStop} &rarr; {leg.toStop}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {leg.estimatedTime}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {leg.instruction}
              </p>

              {leg.busOption && (
                <div className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Phương án xe buýt: {leg.busOption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bus Lines Available Cards */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Các chuyến xe buýt phục vụ lộ trình
          </h3>
          <span className="text-[10px] text-slate-400">Dữ liệu xe buýt TP.HCM</span>
        </div>

        <div className="space-y-2.5">
          {BUS_LINES_DATA.map((bus) => (
            <div
              key={bus.id}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-slate-900 text-white font-mono">
                    Tuyến {bus.routeNumber}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {bus.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Giờ chạy: {bus.operatingHours}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-700">{bus.ticketPrice}</div>
                  {bus.studentPrice && (
                    <div className="text-[10px] text-slate-400">SV: {bus.studentPrice}</div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {bus.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-400">
                <span>Tần suất: {bus.frequency}</span>
                <span>Đi qua: {bus.nearbyStops.join(' • ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* External App Link Banner */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/70 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-slate-800">Ứng dụng giao thông khuyến nghị</div>
          <p className="text-[11px] text-slate-400">Tra cứu trực tiếp thời gian thực xe buýt tới trạm</p>
        </div>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=10.7798,106.6990&travelmode=transit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 touch-press shrink-0"
        >
          Google Maps Transit &rarr;
        </a>
      </div>
    </div>
  );
}

