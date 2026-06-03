import { useEffect, useRef } from 'react';

interface Props {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

/**
 * Full-width touch/stylus signature pad. Draws on a hi-dpi canvas and emits a
 * PNG data URL on every stroke end.
 */
export default function SignatureCanvas({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasContent = useRef(false);

  // size the canvas to its container at device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      // restore previously saved signature after a resize
      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = value;
        hasContent.current = true;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // iOS Safari ignores preventDefault from React's passive pointer/touch
    // handlers, so attach a non-passive touchmove listener to stop the page
    // from scrolling/zooming while the customer is signing.
    const blockScroll = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchmove', blockScroll, { passive: false });

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchmove', blockScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasContent.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasContent.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasContent.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-white dark:border-slate-600">
        <canvas
          ref={canvasRef}
          className="h-48 w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-500">
            Hier unterschreiben
          </span>
        )}
      </div>
      <button type="button" className="btn-ghost w-full" onClick={clear}>
        Unterschrift löschen
      </button>
    </div>
  );
}
