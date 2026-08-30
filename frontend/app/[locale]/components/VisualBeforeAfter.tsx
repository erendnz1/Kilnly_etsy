"use client";

import { useState } from "react";

export default function VisualBeforeAfter() {
  const [position, setPosition] = useState(50);

  const beforeImage =
    "/visuals/ed.png";

  const afterImage =
    "/visuals/ed2.png";

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    if (
      event.type === "pointermove" &&
      !element.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const newPosition =
      ((event.clientX - rect.left) / rect.width) * 100;

    setPosition(Math.max(5, Math.min(95, newPosition)));
  }

  return (
    <div className="w-full max-w-[650px] select-none font-sans antialiased">
      {/* ANA KART */}
      <div className="rounded-[26px] border border-[#1b382b] bg-[#071913] p-4 shadow-2xl">
        {/* BAŞLIK */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-white">
            Ana ürün görseli
          </h3>

          <span className="flex items-center gap-1 rounded-full bg-[#107c57] px-2.5 py-1 text-[11px] font-semibold text-white">
            ✦ AI
          </span>
        </div>

        {/* BEFORE / AFTER - Siyah boşlukları kaldıran tam dolgu alanı */}
        <div
          className="
            relative
            aspect-[16/10]
            w-full
            overflow-hidden
            rounded-2xl
            bg-[#071913]
            cursor-ew-resize
            touch-none
          "
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            handleMove(event);
          }}
          onPointerMove={handleMove}
        >
          {/* ========================= */}
          {/* AI SONRASI - ALT KATMAN */}
          {/* ========================= */}
          <img
  src={afterImage}
  alt="AI Sonrası"
  className="
    pointer-events-none
    absolute
    inset-0
    z-10
    h-full
    w-full
    object-cover
    object-center
  "
 
  draggable={false}
/>


          {/* ========================= */}
          {/* ÖNCE - ÜST KATMAN */}
          {/* ========================= */}
          <img
  src={beforeImage}
  alt="Önce"
  className="
    pointer-events-none
    absolute
    inset-0
    z-10
    h-full
    w-full
    object-cover
    object-center
  "
  style={{
    clipPath: `inset(0 ${100 - position}% 0 0)`,
  }}
  draggable={false}
/>

          {/* ========================= */}
          {/* ÖNCE ETİKETİ */}
          {/* ========================= */}
          <span
            className="
              pointer-events-none
              absolute
              left-3
              top-3
              z-30
              rounded-md
              bg-black/55
              px-2.5
              py-1
              text-[10px]
              font-bold
              tracking-wider
              text-white
              backdrop-blur-sm
            "
          >
            ÖNCE
          </span>

          {/* ========================= */}
          {/* AI SONRASI ETİKETİ */}
          {/* ========================= */}
          <span
            className="
              pointer-events-none
              absolute
              right-3
              top-3
              z-30
              rounded-md
              bg-[#15966a]
              px-2.5
              py-1
              text-[10px]
              font-bold
              tracking-wider
              text-white
              shadow-lg
            "
          >
            AI SONRASI
          </span>

          {/* ========================= */}
          {/* SLIDER ÇİZGİSİ */}
          {/* ========================= */}
          <div
            className="
              pointer-events-none
              absolute
              inset-y-0
              z-40
              w-[2px]
              bg-white
              shadow-[0_0_12px_rgba(0,0,0,0.8)]
            "
            style={{
              left: `${position}%`,
            }}
          >
            {/* SLIDER BUTONU */}
            <div 
  className="
    absolute
    left-1/2
    top-1/2
    flex
    h-9
    w-9
    -translate-x-1/2
    -translate-y-1/2
    items-center
    justify-center
    rounded-full
    border
    border-white/90
    bg-white
    text-sm
    font-bold
    text-[#0d211a]
    shadow-[0_4px_18px_rgba(0,0,0,0.35)]
  "
>
  ←→
</div>
          </div>
        </div>
      </div>
    </div>
  );
}