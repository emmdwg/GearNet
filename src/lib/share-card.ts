const STORY_W = 1080;
const STORY_H = 1920;

export type PostStoryInput = {
  imageUrl: string;
  username: string;
  displayName: string;
  caption: string;
  avatarUrl?: string;
  watermarkLabel?: string;
};

export type GarageStoryInput = {
  coverImageUrl: string;
  username: string;
  displayName: string;
  vehicleCount: number;
  modCount: number;
  headline?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBrandFooter(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, STORY_H - 280, 0, STORY_H);
  grad.addColorStop(0, "rgba(9,9,11,0)");
  grad.addColorStop(1, "rgba(9,9,11,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, STORY_H - 280, STORY_W, 280);

  ctx.fillStyle = "#f59e0b";
  roundRect(ctx, 48, STORY_H - 120, 56, 56, 12);
  ctx.fill();
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("âš¡", 64, STORY_H - 82);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.fillText("GearNet", 120, STORY_H - 78);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText("gearnetapp.com", 120, STORY_H - 42);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

async function drawHeroImage(ctx: CanvasRenderingContext2D, url: string, top: number, height: number) {
  try {
    const img = await loadImage(url);
    const scale = Math.max(STORY_W / img.width, height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (STORY_W - w) / 2;
    const y = top + (height - h) / 2;
    ctx.save();
    roundRect(ctx, 0, top, STORY_W, height, 0);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  } catch {
    const grad = ctx.createLinearGradient(0, top, STORY_W, top + height);
    grad.addColorStop(0, "#78350f");
    grad.addColorStop(1, "#09090b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, STORY_W, height);
  }
}

export async function renderPostStoryCard(input: PostStoryInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  await drawHeroImage(ctx, input.imageUrl, 0, 1280);

  const overlay = ctx.createLinearGradient(0, 900, 0, 1400);
  overlay.addColorStop(0, "rgba(9,9,11,0)");
  overlay.addColorStop(1, "rgba(9,9,11,0.92)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 900, STORY_W, 500);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("BUILD SPOTLIGHT", 48, 1360);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(`@${input.username}`, 48, 1430);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "32px system-ui, sans-serif";
  const lines = wrapText(ctx, input.caption || input.displayName, STORY_W - 96, 3);
  lines.forEach((ln, i) => ctx.fillText(ln, 48, 1490 + i * 44));

  if (input.watermarkLabel) {
    const fontSize = Math.max(14, Math.round(STORY_W * 0.035));
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(input.watermarkLabel, STORY_W - fontSize, 1280 - fontSize * 0.6);
  }

  drawBrandFooter(ctx);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png");
  });
}

export async function renderGarageStoryCard(input: GarageStoryInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  await drawHeroImage(ctx, input.coverImageUrl, 0, 1100);

  ctx.fillStyle = "rgba(9,9,11,0.75)";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("DIGITAL GARAGE", 48, 200);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, sans-serif";
  const title = input.headline ?? `${input.displayName}'s Garage`;
  const titleLines = wrapText(ctx, title, STORY_W - 96, 2);
  titleLines.forEach((ln, i) => ctx.fillText(ln, 48, 290 + i * 72));

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "36px system-ui, sans-serif";
  ctx.fillText(`@${input.username}`, 48, 290 + titleLines.length * 72 + 24);

  const boxY = 520;
  roundRect(ctx, 48, boxY, STORY_W - 96, 200, 24);
  ctx.fillStyle = "rgba(24,24,27,0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(245, 158, 11,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(input.vehicleCount), STORY_W * 0.25, boxY + 90);
  ctx.fillText(String(input.modCount), STORY_W * 0.75, boxY + 90);
  ctx.fillStyle = "#71717a";
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText("Vehicles", STORY_W * 0.25, boxY + 140);
  ctx.fillText("Mods", STORY_W * 0.75, boxY + 140);
  ctx.textAlign = "left";

  drawBrandFooter(ctx);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png");
  });
}

export async function downloadStoryBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyStoryBlob(blob: Blob) {
  if (!navigator.clipboard?.write) throw new Error("Clipboard image copy not supported");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export type CompareBuildCardInput = {
  vehicleALabel: string;
  vehicleBLabel: string;
  modsA: string[];
  modsB: string[];
  dynoA?: string;
  dynoB?: string;
};

export async function renderCompareBuildCard(input: CompareBuildCardInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText("Build Compare", 48, 120);

  const colW = (STORY_W - 120) / 2;
  [input.vehicleALabel, input.vehicleBLabel].forEach((label, i) => {
    const x = 48 + i * (colW + 24);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillText(label, x, 200);
    const mods = i === 0 ? input.modsA : input.modsB;
    ctx.fillStyle = "#d4d4d8";
    ctx.font = "22px system-ui, sans-serif";
    mods.slice(0, 8).forEach((m, j) => ctx.fillText(`â€¢ ${m}`, x, 250 + j * 36));
    const dyno = i === 0 ? input.dynoA : input.dynoB;
    if (dyno) {
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(dyno, x, 250 + Math.min(mods.length, 8) * 36 + 24);
    }
  });

  drawBrandFooter(ctx);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png");
  });
}
