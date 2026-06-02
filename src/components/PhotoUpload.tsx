import { useRef, useState } from 'react';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
}

/** Downscale an uploaded image to keep localStorage / PDF size reasonable. */
function downscale(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const added = await Promise.all(Array.from(files).map((f) => downscale(f)));
      onChange([...photos, ...added]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(photos.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square">
            <img
              src={p}
              alt={`Foto ${i + 1}`}
              onClick={() => setZoom(p)}
              className="tap h-full w-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Foto entfernen"
              className="tap absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-sm text-white"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="tap flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 dark:border-slate-600"
        >
          <span className="text-2xl">{busy ? '…' : '＋'}</span>
          <span className="text-xs">Foto</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(null)}
        >
          <img src={zoom} alt="Foto groß" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
