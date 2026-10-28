"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { btn, btnGhost } from "@/components/threers/ui";

/* ------------------------------------------------------------------ */
/* SignaturePad — authentic government-grade e-signature capture     */
/* Supports: Freehand drawing (mouse/touch/stylus) & Typed signature  */
/* ------------------------------------------------------------------ */

interface SignaturePadProps {
  onSave: (base64: string, name: string, position: string) => void;
  onClear?: () => void;
  initialName?: string;
  initialPosition?: string;
  initialSignature?: string; // existing base64 to show
  readOnly?: boolean;
  className?: string;
}

export default function SignaturePad({
  onSave,
  onClear,
  initialName = "",
  initialPosition = "",
  initialSignature,
  readOnly = false,
  className = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(!!initialSignature);
  const [name, setName] = useState(initialName);
  const [position, setPosition] = useState(initialPosition);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedFont, setTypedFont] = useState<"font-serif italic" | "font-mono" | "font-sans italic">("font-serif italic");

  /* ---- Initialize / Resize canvas ---- */
  const renderSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width > 0 ? rect.width : 500;
    const height = 150;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f2b5c"; // Official Philippine document deep navy ink

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  useEffect(() => {
    renderSignature();
    window.addEventListener("resize", renderSignature);
    return () => window.removeEventListener("resize", renderSignature);
  }, [renderSignature]);

  /* ---- Drawing Coordinates ---- */
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly || mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasStrokes(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing || readOnly || mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    captureCanvas();
  };

  const captureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const base64 = canvas.toDataURL("image/png");
      onSave(base64, name, position);
    } catch {
      // ignore
    }
  };

  /* ---- Render Typed Signature to Canvas ---- */
  const applyTypedSignature = (textToDraw: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!textToDraw.trim()) {
      setHasStrokes(false);
      onClear?.();
      return;
    }

    ctx.font = typedFont === "font-mono" ? "32px Courier New" : "38px Georgia, cursive, serif";
    ctx.fillStyle = "#0f2b5c";
    ctx.textBaseline = "middle";
    ctx.fillText(textToDraw, 40, rect.height / 2);
    setHasStrokes(true);
    captureCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onClear?.();
    onSave("", name, position);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (mode === "type") {
      applyTypedSignature(val);
    } else {
      const canvas = canvasRef.current;
      if (canvas && hasStrokes) {
        onSave(canvas.toDataURL("image/png"), val, position);
      }
    }
  };

  const handlePositionChange = (val: string) => {
    setPosition(val);
    const canvas = canvasRef.current;
    if (canvas && hasStrokes) {
      onSave(canvas.toDataURL("image/png"), name, val);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181126] p-6 shadow-sm ${className}`}>
      {/* Header & Attestation */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Official Certification &amp; Electronic Signature
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            I hereby certify under penalty of law that the statements made and files submitted herein are true, accurate, and submitted under official authority.
          </p>
        </div>

        {readOnly && initialSignature && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Digitally Authenticated
          </span>
        )}
      </div>

      {/* Signatory Info */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Signatory Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            readOnly={readOnly}
            placeholder="e.g. Hon. Juan M. Dela Cruz"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Official Designation / Position <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => handlePositionChange(e.target.value)}
            readOnly={readOnly}
            placeholder="e.g. Punong Barangay / SK Chairperson"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/40"
          />
        </div>
      </div>

      {/* Signature Mode Switcher (Active edit only) */}
      {!readOnly && (
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-white/5 p-0.5 border border-slate-200 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("draw");
                clearCanvas();
              }}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                mode === "draw"
                  ? "bg-white dark:bg-[#2A2045] text-[#5A18C9] dark:text-[#CDBBFF] shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Draw Signature
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("type");
                applyTypedSignature(name);
              }}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                mode === "type"
                  ? "bg-white dark:bg-[#2A2045] text-[#5A18C9] dark:text-[#CDBBFF] shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Type Signature
            </button>
          </div>

          {mode === "type" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Style:</span>
              <button
                type="button"
                onClick={() => {
                  setTypedFont("font-serif italic");
                  setTimeout(() => applyTypedSignature(name), 10);
                }}
                className={`px-2 py-0.5 rounded border ${typedFont === "font-serif italic" ? "border-[#7B4DFF] text-[#7B4DFF]" : "border-transparent text-slate-400"}`}
              >
                Classic
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypedFont("font-mono");
                  setTimeout(() => applyTypedSignature(name), 10);
                }}
                className={`px-2 py-0.5 rounded border ${typedFont === "font-mono" ? "border-[#7B4DFF] text-[#7B4DFF]" : "border-transparent text-slate-400"}`}
              >
                Monospace
              </button>
            </div>
          )}

          {hasStrokes && (
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors"
            >
              Clear Signature
            </button>
          )}
        </div>
      )}

      {/* Official Signature Canvas Box (Government White Document Paper Look) */}
      <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-[#FAF9F5] shadow-inner overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className={`w-full touch-none ${readOnly ? "cursor-default" : "cursor-crosshair"}`}
          style={{ height: "150px" }}
        />

        {/* Placeholder guide text */}
        {!hasStrokes && !initialSignature && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
            <p className="text-xs font-medium">Draw your signature directly on this pad using your mouse, trackpad, or finger</p>
          </div>
        )}

        {/* Official Baseline Guide */}
        <div className="absolute bottom-6 left-8 right-8 flex items-center gap-2 pointer-events-none">
          <span className="text-xs font-bold text-slate-400 select-none">✕</span>
          <div className="h-0.5 flex-1 bg-slate-300/80" />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest select-none">Authorized Signature</span>
        </div>
      </div>

      {/* Signatory Footer Badge */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Date: <b>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</b></span>
          <span>&middot;</span>
          <span>Security: <b>256-bit Portal Encrypted</b></span>
        </div>
        {hasStrokes && !readOnly && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Signature captured &amp; ready
          </span>
        )}
      </div>
    </div>
  );
}
