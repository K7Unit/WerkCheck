import type { DamagePhase, Inspection } from '../types/inspection';

// jsPDF + html2canvas are heavy (~500 kB). They are imported dynamically inside
// the functions below so the bundler splits them into a separate chunk that is
// only fetched when the user actually reaches the PDF step.

export interface MapImages {
  Ankunft: string | null;
  Abfahrt: string | null;
}

/** Render a DOM node (the damage map) to a PNG data URL. */
export async function captureNode(node: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(node, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

function fuelLabel(level: number): string {
  if (level <= 5) return 'leer';
  if (level >= 95) return 'voll';
  const eighths = Math.round(level / 12.5);
  return `${eighths}/8`;
}

const MARGIN = 12;

/** Build the one-page WerkCheck report and return it as a PDF Blob. */
export async function generatePdf(
  inspection: Inspection,
  maps: MapImages
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  // ---- Workshop header ----
  doc.setFillColor(225, 29, 72);
  doc.rect(MARGIN, y, 14, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('W', MARGIN + 7, y + 9.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text('WerkCheck', MARGIN + 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Fahrzeug-Übergabeprotokoll', MARGIN + 18, y + 12);

  const created = new Date(inspection.dateTime);
  doc.text(created.toLocaleString('de-DE'), pageW - MARGIN, y + 7, { align: 'right' });

  y += 20;
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 6;

  // ---- Vehicle info table ----
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Fahrzeugdaten', MARGIN, y);
  y += 5;

  const rows: [string, string][] = [
    ['Kennzeichen', inspection.licensePlate || '–'],
    ['Kunde', inspection.customerName || '–'],
    ['Fahrzeugtyp', inspection.vehicleType],
    ['Kilometerstand', inspection.mileage ? `${inspection.mileage} km` : '–'],
    ['Tankfüllung', `${fuelLabel(inspection.fuelLevel)} (${inspection.fuelLevel}%)`],
    ['Mechaniker', inspection.mechanicName || '–'],
  ];

  doc.setFontSize(9);
  const colW = (pageW - 2 * MARGIN) / 2;
  rows.forEach((row, i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 7;
    const x = MARGIN + col * colW;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${row[0]}:`, x, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], x + 30, rowY);
  });
  y += Math.ceil(rows.length / 2) * 7 + 4;

  // ---- Damage maps (Ankunft / Abfahrt) ----
  const phases: DamagePhase[] = ['Ankunft', 'Abfahrt'];
  const mapW = (pageW - 2 * MARGIN - 6) / 2;
  const mapH = 55;
  phases.forEach((phase, i) => {
    const x = MARGIN + i * (mapW + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(phase, x, y);
    const img = maps[phase];
    if (img) {
      // keep aspect ratio (outline is 300x640 ≈ 0.469)
      const drawW = Math.min(mapW, mapH * 0.469);
      doc.addImage(img, 'PNG', x + (mapW - drawW) / 2, y + 2, drawW, mapH);
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(x, y + 2, mapW, mapH);
  });
  y += mapH + 8;

  // ---- Damage list ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Schäden', MARGIN, y);
  y += 5;
  doc.setFontSize(8.5);

  let any = false;
  phases.forEach((phase) => {
    const list = inspection.damages[phase];
    if (!list.length) return;
    any = true;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(phase, MARGIN, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    list.forEach((d, i) => {
      const note = d.note ? ` – ${d.note}` : '';
      const text = `${i + 1}. ${d.type} (${d.severity})${note}`;
      const lines = doc.splitTextToSize(text, pageW - 2 * MARGIN - 4);
      doc.text(lines, MARGIN + 2, y);
      y += lines.length * 4 + 1;
    });
    y += 2;
  });
  if (!any) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Keine Schäden dokumentiert.', MARGIN + 2, y);
    y += 6;
  }

  // ---- Photos (max 6) ----
  const photos = phases
    .flatMap((p) => inspection.damages[p])
    .flatMap((d) => d.photos)
    .slice(0, 6);
  if (photos.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Fotos', MARGIN, y);
    y += 4;
    const thumbW = (pageW - 2 * MARGIN - 5 * 3) / 6;
    const thumbH = thumbW * 0.75;
    photos.forEach((p, i) => {
      const x = MARGIN + i * (thumbW + 3);
      try {
        doc.addImage(p, 'JPEG', x, y, thumbW, thumbH);
      } catch {
        /* ignore unsupported image */
      }
    });
    y += thumbH + 6;
  }

  // ---- Signature ----
  const sigY = Math.max(y, 250);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, sigY, pageW - MARGIN, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const confirmMark = inspection.confirmed ? '[x]' : '[ ]';
  doc.text(
    `${confirmMark} Ich bestätige den dokumentierten Fahrzeugzustand`,
    MARGIN,
    sigY + 5
  );

  if (inspection.signature) {
    try {
      doc.addImage(inspection.signature, 'PNG', MARGIN, sigY + 8, 60, 22);
    } catch {
      /* ignore */
    }
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(MARGIN, sigY + 32, MARGIN + 60, sigY + 32);
  doc.text(inspection.customerName || 'Kunde', MARGIN, sigY + 36);

  doc.text(inspection.mechanicName || 'Mechaniker', pageW - MARGIN, sigY + 36, {
    align: 'right',
  });
  doc.line(pageW - MARGIN - 60, sigY + 32, pageW - MARGIN, sigY + 32);
  doc.text('Mechaniker', pageW - MARGIN, sigY + 40, { align: 'right' });

  return doc.output('blob');
}

/** Share the PDF via the iOS share sheet, falling back to a download. */
export async function sharePdf(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'WerkCheck Protokoll',
        text: 'Fahrzeug-Übergabeprotokoll',
      });
      return;
    } catch (err) {
      // user cancelled the share sheet — do not fall back to download
      if ((err as Error).name === 'AbortError') return;
    }
  }

  // fallback: trigger a download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
