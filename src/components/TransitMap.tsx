'use client';

import React, { useState } from 'react';
import { TRANSIT_STOPS_DATA, TransitStopInfo } from '@/data/transit';

export default function TransitMap() {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const selectedStop: TransitStopInfo = TRANSIT_STOPS_DATA[selectedStopIndex];

  // Tọa độ bbox bao trọn cả 3 điểm: Nhà thờ Đức Bà, Bưu điện và Dinh Độc Lập
  const defaultBbox = '106.6920%2C10.7745%2C106.7025%2C10.7825';
  
  // Tọa độ tập trung khi chọn từng trạm
  const stopBboxes = [
    '106.6965%2C10.7780%2C106.7015%2C10.7815', // Nhà thờ Đức Bà
    '106.6975%2C10.7785%2C106.7020%2C10.7818', // Bưu điện
    '106.6935%2C10.7750%2C106.6975%2C10.7785', // Dinh Độc Lập
  ];

  const currentBbox = stopBboxes[selectedStopIndex] || defaultBbox;
  const currentMarkerLat = selectedStop.lat;
  const currentMarkerLng = selectedStop.lng;

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentBbox}&layer=mapnik&marker=${currentMarkerLat}%2C${currentMarkerLng}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden space-y-3">
      {/* Map Header with stop tabs */}
      <div className="p-4 pb-2 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Bản đồ Lộ trình Xe buýt Thực tế
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">OpenStreetMap</span>
        </div>

        {/* Quick Station Selectors */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {TRANSIT_STOPS_DATA.map((stop, i) => (
            <button
              key={stop.orderIndex}
              onClick={() => setSelectedStopIndex(i)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all touch-press flex items-center justify-center gap-1.5 ${
                selectedStopIndex === i
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  selectedStopIndex === i
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate">{stop.stopName.replace(' Sài Gòn', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Real Map View */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden border-y border-slate-100">
        <iframe
          title="Bản đồ tuyến xe buýt BusQuest"
          width="100%"
          height="100%"
          src={osmEmbedUrl}
          className="w-full h-full border-0 filter saturate-[0.95]"
          loading="lazy"
        />

        {/* Floating Route Badge */}
        <div className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-medium backdrop-blur-xs shadow-sm flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Trạm #{selectedStopIndex + 1}: {selectedStop.stopName}</span>
        </div>
      </div>

      {/* Selected Station Transit Info Card */}
      <div className="p-4 pt-1 space-y-3">
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Trạm dừng xe buýt gần nhất
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {selectedStop.nearbyBusStopName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {selectedStop.distanceToStop} • {selectedStop.walkingTip}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Tuyến đón:</span>
              <div className="flex gap-1">
                {selectedStop.servingBusLines.map((line) => (
                  <span
                    key={line}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <a
              href={selectedStop.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 touch-press"
            >
              <span>Chỉ đường buýt</span>
              <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

