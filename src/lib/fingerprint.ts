/**
 * Lightweight device fingerprint — survives incognito & cookie clearing.
 * Collects stable browser/device properties and hashes them with SHA-256.
 */

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("RPLExpo24", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("RPLExpo24", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "";
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  const nav = navigator as unknown as Record<string, unknown>;
  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    (navigator.hardwareConcurrency ?? "").toString(),
    (nav.deviceMemory ?? "").toString(),
    navigator.platform ?? "",
    getCanvasFingerprint(),
  ];

  const data = new TextEncoder().encode(components.join("|"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const VOTED_KEY = "rplexpo_voted";

export function markAsVoted() {
  try {
    localStorage.setItem(VOTED_KEY, "1");
  } catch {
    /* storage full or blocked — cookie fallback still works */
  }
}

export function hasVotedLocally(): boolean {
  try {
    return localStorage.getItem(VOTED_KEY) === "1";
  } catch {
    return false;
  }
}
