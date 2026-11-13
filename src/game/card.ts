import { drawTeemo } from './art';
import { config, migrateLegacyAttribution } from '../config';

const WIDTH = 1400;
const HEIGHT = 1800;
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, angle = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
  ctx.fill();
}

function daisy(ctx: Ctx, x: number, y: number, scale: number, angle = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10;
    ellipse(ctx, Math.cos(a) * 17 * scale, Math.sin(a) * 17 * scale, 15 * scale, 7 * scale, '#fffef5', a);
  }
  ellipse(ctx, 0, 0, 12 * scale, 12 * scale, '#e3bb59');
  ellipse(ctx, -3 * scale, -3 * scale, 4 * scale, 3 * scale, '#f5d77e');
  ctx.restore();
}

function branch(ctx: Ctx, x: number, y: number, length: number, angle: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#8ca489';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-length * 0.12, -length * 0.5, 0, -length);
  ctx.stroke();
  for (let i = 1; i < 7; i++) {
    const yy = -length * (i / 7);
    const side = i % 2 ? -1 : 1;
    const leafLength = 27 * scale * (1 - i * 0.035);
    ctx.save();
    ctx.translate(-length * 0.04, yy);
    ctx.rotate(side * 0.8);
    ellipse(ctx, side * leafLength * 0.55, -leafLength * 0.45, leafLength, leafLength * 0.43, i % 3 ? '#a9bc9e' : '#c5ceb1', side * -0.7);
    ctx.restore();
  }
  ctx.restore();
}

function star(ctx: Ctx, x: number, y: number, size: number, color = '#d8b76a'): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.18, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.18, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.18, y - size * 0.18, x, y - size);
  ctx.fill();
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, 180);
}

/** Wraps long names, including a single long word, without escaping the card. */
function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) { lines.push(line); line = ''; }
    if (ctx.measureText(word).width <= maxWidth) { line = word; continue; }
    for (const char of Array.from(word)) {
      if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function nameLines(ctx: Ctx, text: string, initialSize: number, maxWidth: number): { lines: string[]; size: number } {
  let size = initialSize;
  let lines: string[] = [];
  do {
    ctx.font = `italic ${size}px Georgia, 'Times New Roman', serif`;
    lines = wrap(ctx, text, maxWidth);
    if (lines.length <= 2) break;
    size -= 2;
  } while (size > 22);
  return { lines, size };
}

/** Draws an export-quality, entirely original birthday keepsake. */
export function renderBirthdayCard(canvas: HTMLCanvasElement, recipientName: string, senderName: string): void {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browserul nu poate crea felicitarea. Încearcă un alt browser.');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#faf7ed';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Rounded, layered botanical shapes keep the card gentle and handmade.
  ellipse(ctx, 85, 120, 210, 275, '#e9eddd', -0.5);
  ellipse(ctx, 1360, 1740, 255, 330, '#e5ebd9', -0.3);
  ellipse(ctx, 1340, 65, 195, 185, '#f0ead5', 0.4);
  ellipse(ctx, 0, 1775, 150, 210, '#f2ecd9');

  ctx.strokeStyle = '#c7d1ba';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(58, 58, WIDTH - 116, HEIGHT - 116, 28);
  ctx.stroke();
  ctx.strokeStyle = '#e2dfca';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(72, 72, WIDTH - 144, HEIGHT - 144, 18);
  ctx.stroke();

  branch(ctx, 125, 390, 250, -0.3, 1.2);
  branch(ctx, 140, 305, 175, 0.55);
  branch(ctx, 1268, 150, 220, 2.7, 1.1);
  branch(ctx, 1280, 1570, 235, -0.5, 1.3);
  branch(ctx, 1300, 1580, 195, 0.3, 1.1);
  branch(ctx, 113, 1568, 210, -0.15, 1.15);

  daisy(ctx, 143, 170, 1.15, -0.1);
  daisy(ctx, 1260, 1610, 1.5, 0.25);
  daisy(ctx, 1184, 1658, 0.8, -0.2);
  daisy(ctx, 132, 1510, 1.05, 0.3);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#7e8d71';
  ctx.font = "500 21px Arial, Helvetica, sans-serif";
  ctx.fillText('O MICĂ AMINTIRE DIN AVENTURĂ', 700, 165);

  ctx.fillStyle = '#435a46';
  ctx.font = "italic 124px Georgia, 'Times New Roman', serif";
  ctx.fillText('La mulți ani!', 700, 313);
  const recipient = normalizeName(recipientName);
  if (recipient) {
    const { lines, size } = nameLines(ctx, recipient, 67, 930);
    ctx.fillStyle = '#76875e';
    lines.forEach((line, i) => ctx.fillText(line, 700, 402 + i * (size + 9)));
  } else {
    daisy(ctx, 700, 405, 0.75);
  }

  // An airy woodland medallion and a warm pool of light behind the scout.
  const light = ctx.createRadialGradient(700, 815, 60, 700, 815, 355);
  light.addColorStop(0, '#f5eac5');
  light.addColorStop(0.68, '#e9ecd7');
  light.addColorStop(1, '#e9ecd700');
  ctx.fillStyle = light;
  ctx.fillRect(170, 455, 1060, 790);
  ellipse(ctx, 700, 1090, 384, 83, '#dce4cc');
  ellipse(ctx, 700, 1115, 292, 46, '#c5d2b757');

  branch(ctx, 381, 1099, 185, -0.38, 1.1);
  branch(ctx, 1020, 1106, 190, 0.4, 1.25);
  branch(ctx, 1028, 1100, 145, -0.3, 0.9);
  daisy(ctx, 355, 1060, 1.25, -0.18);
  daisy(ctx, 413, 1127, 0.7, 0.4);
  daisy(ctx, 1010, 1120, 1.05, 0.15);
  daisy(ctx, 1080, 1085, 0.65, -0.3);
  drawTeemo(ctx, 665, 1125, 3.9, 0, false, true, 1);

  // Sparse gold sparks and paper confetti, all deterministic for repeat exports.
  [[407, 650, 16], [1020, 714, 18], [1090, 895, 11], [327, 886, 10], [906, 550, 11], [485, 1148, 8]].forEach(([x, y, size]) => star(ctx, x, y, size));
  [[490, 594, -0.4], [967, 926, 0.35], [387, 769, 0.2], [1003, 608, -0.6], [332, 1002, 0.4], [940, 1136, -0.1]].forEach(([x, y, angle], i) => {
    ellipse(ctx, x, y, 5, 12, i % 2 ? '#d7b4a0' : '#a9bb94', angle);
  });

  ctx.fillStyle = '#64715c';
  ctx.font = "40px Georgia, 'Times New Roman', serif";
  const message = wrap(ctx, 'Un strop de magie, o floare și multe motive să zâmbești.', 940);
  message.forEach((line, i) => ctx.fillText(line, 700, 1280 + i * 59));

  ctx.strokeStyle = '#d4d7bf';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(580, 1430); ctx.lineTo(654, 1430); ctx.moveTo(746, 1430); ctx.lineTo(820, 1430); ctx.stroke();
  daisy(ctx, 700, 1430, 0.55);
  ctx.fillStyle = '#8c967e';
  ctx.font = '24px Arial, Helvetica, sans-serif';
  ctx.fillText('Cu gânduri bune,', 700, 1500);
  const sender = normalizeName(migrateLegacyAttribution(senderName)) || config.senderName;
  const { lines: signature, size: signatureSize } = nameLines(ctx, sender, 42, 920);
  ctx.fillStyle = '#637655';
  signature.forEach((line, i) => ctx.fillText(line, 700, 1563 + i * (signatureSize + 7)));

  ctx.fillStyle = '#98a18b';
  ctx.font = '20px Arial, Helvetica, sans-serif';
  ctx.fillText("Teemo's Little Birthday Adventure", 700, 1690);
}

/** Renders locally and downloads a PNG; no image data is uploaded anywhere. */
export async function saveBirthdayCard(recipientName: string, senderName: string): Promise<void> {
  const canvas = document.createElement('canvas');
  renderBirthdayCard(canvas, recipientName, senderName);
  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error('Felicitarea nu a putut fi salvată. Încearcă din nou.'));
      }, 'image/png');
    } catch {
      reject(new Error('Browserul nu a putut exporta felicitarea. Încearcă un alt browser.'));
    }
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = normalizeName(recipientName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  link.href = url;
  link.download = `la-multi-ani${safeName ? `-${safeName}` : ''}.png`;
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    // Safari needs the object URL to outlive the synthetic click.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
