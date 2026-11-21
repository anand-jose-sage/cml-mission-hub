import { BURSTS, BURST_PERIOD, VIDEO_FPS, VIDEO_SECONDS, easeOutCubic, sparkAt, sparksFor } from "@/lib/story-video-timeline";
import { exportPosterNode } from "./export-poster";

// Animated winner poster, ported from fest_hub's social-poster/story-video.ts:
// drawn frame by frame on a canvas and recorded with MediaRecorder (real time,
// VIDEO_SECONDS long). The poster itself comes from one snapshot of the
// rendered ResultPoster; the intro zoom and fireworks are drawn on top.
// shortcut: fest_hub's medal drop / ribbon shine / circuit pulses are tied to
// its own story-poster art and are not ported; add them if this poster gets
// separate medal/ribbon layers.

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function videoMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return ["video/mp4;codecs=avc1.42E01F", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

function drawFrame(ctx: CanvasRenderingContext2D, content: HTMLImageElement, t: number, sparks: ReturnType<typeof sparksFor>[]) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#FBF2DE";
  ctx.fillRect(0, 0, W, H);

  // Intro: poster settles in from a slight zoom over the first 0.8s.
  const k = easeOutCubic(t / 0.8);
  const s = 1.08 - 0.08 * k;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.65 * k;
  ctx.translate(W / 2, H / 2);
  ctx.scale(s, s);
  ctx.drawImage(content, -W / 2, -H / 2, W, H);
  ctx.restore();

  // Fireworks
  ctx.save();
  ctx.shadowBlur = 12;
  BURSTS.forEach((b, bi) => {
    for (const sp of sparks[bi]) {
      const age = (t % BURST_PERIOD) - b.at;
      const now = sparkAt(b, sp, age);
      const prev = sparkAt(b, sp, age - 0.06);
      if (!now || !prev) continue;
      ctx.globalAlpha = now.alpha;
      ctx.strokeStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(now.x, now.y);
      ctx.stroke();
    }
  });
  ctx.restore();
}

// Records the animated poster. `node` is the rendered (unscaled) ResultPoster root.
export async function recordStoryVideo(node: HTMLElement, onProgress?: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const mime = videoMimeType();
  if (!mime) throw new Error("This browser can't record video.");

  const content = await loadImage(await exportPosterNode(node));
  if (!content) throw new Error("Couldn't prepare the poster.");

  const canvas = document.createElement("canvas");
  // Phones crashed the tab at full 1080x1920 / 8Mbps (fest_hub); touch
  // devices record at 720x1280 and a lower bitrate.
  const phone = window.matchMedia("(pointer: coarse)").matches;
  const scale = phone ? 2 / 3 : 1;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  const sparks = BURSTS.map((_, i) => sparksFor(i));
  drawFrame(ctx, content, 0, sparks);

  // Frames are pushed by hand (captureStream(0) + requestFrame): Chrome's MP4
  // recorder times the video by frame count, so frame n always shows n/FPS.
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: phone ? 4_000_000 : 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<void>((resolve) => (rec.onstop = () => resolve()));

  rec.start(1000);
  const total = VIDEO_SECONDS * VIDEO_FPS;
  const start = performance.now();
  for (let n = 0; n < total; n++) {
    drawFrame(ctx, content, n / VIDEO_FPS, sparks);
    track.requestFrame?.();
    onProgress?.((n + 1) / total);
    const wait = start + ((n + 1) * 1000) / VIDEO_FPS - performance.now();
    await new Promise((r) => setTimeout(r, Math.max(0, wait)));
  }
  // Encoder runs behind real time; let it catch up before stopping.
  // shortcut: fixed grace period (from fest_hub); raise it if slow phones come out short.
  await new Promise((r) => setTimeout(r, VIDEO_SECONDS * 300));
  rec.stop();
  await done;
  stream.getTracks().forEach((tr) => tr.stop());
  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
}
