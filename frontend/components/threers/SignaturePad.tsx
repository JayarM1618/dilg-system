"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/* SignaturePad — authentic government-grade e-signature capture     */
/* Freehand Draw Signature (mouse / stylus / touch)                   */
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
    if (readOnly) return;
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
    if (!drawing || readOnly) return;
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
    const canvas = canvasRef.current;
    if (canvas && hasStrokes) {
      onSave(canvas.toDataURL("image/png"), val, position);
    } else {
      onSave("", val, position);
    }
  };

  const handlePositionChange = (val: string) => {
    setPosition(val);
    const canvas = canvasRef.current;
    if (canvas && hasStrokes) {
      onSave(canvas.toDataURL("image/png"), name, val);
    } else {
      onSave("", name, val);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#181126] p-5 shadow-xs ${className}`}>
      {/* Header & Attestation */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Official Certification &amp; Sign-off
            </h4>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &ldquo;I hereby certify under penalty of law that the statements made, narrative accomplishments, and attachments herein are true, accurate, and submitted under official authority.&rdquo;
            </p>
          </div>

          {readOnly && initialSignature && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap print:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Digitally Authenticated
            </span>
          )}
        </div>
      </div>

      {/* Signatory Info - Document Form Boxes */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Signatory Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            readOnly={readOnly}
            placeholder="e.g. Hon. Juan M. Dela Cruz"
            className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Official Designation / Position <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => handlePositionChange(e.target.value)}
            readOnly={readOnly}
            placeholder="e.g. Punong Barangay / Barangay Secretary"
            className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Signature Area Header */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Draw Electronic Signature <span className="text-rose-500">*</span>
        </label>
        {!readOnly && hasStrokes && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors print:hidden"
          >
            Clear / Redraw Signature
          </button>
        )}
      </div>

      {/* Official Signature Canvas Box (Government Document Paper Signature Box) */}
      <div className="relative rounded border border-slate-300 dark:border-white/20 bg-[#FAF9F6] dark:bg-white/5 overflow-hidden select-none">
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
          style={{ height: "140px" }}
        />

        {/* Placeholder guide text */}
        {!hasStrokes && !initialSignature && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
            <p className="text-xs font-medium">Draw signature here using your mouse, trackpad, or finger</p>
          </div>
        )}

        {/* Official Baseline Guide */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center gap-2 pointer-events-none">
          <span className="text-xs font-bold text-slate-400 select-none">✕</span>
          <div className="h-px flex-1 bg-slate-300 dark:bg-white/20" />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest select-none">Authorized Signatory</span>
        </div>
      </div>

      {/* Signatory Printed Block Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div>
          {name ? (
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {name}
            </p>
          ) : (
            <p className="italic text-slate-400">Signatory name will appear here</p>
          )}
          {position && <p className="text-[11px] text-slate-500 dark:text-slate-400">{position}</p>}
        </div>

        <div className="text-right text-[11px] text-slate-500">
          <p>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-[10px] text-slate-400 font-mono">DILG Electronic Signature Seal</p>
        </div>
      </div>
    </div>
  );
}
