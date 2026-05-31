/**
 * Order notification utility — Web Audio API "ding ding" + browser Notification.
 *
 * Design:
 *   - No external audio files; synth via Web Audio API.
 *   - Single shared AudioContext; resumed before each play (handles background tabs).
 *   - 2 000 ms debounce prevents duplicate sounds from reconnection bursts.
 *   - Mute preference and volume stored in localStorage.
 *   - Audio context must be unlocked by a user gesture first; call unlockAudio()
 *     from any click/keydown handler on the admin page.
 */

const STORAGE_MUTED  = 'bz_notif_muted';
const STORAGE_VOLUME = 'bz_notif_volume';
const DEBOUNCE_MS    = 2000;
const DEFAULT_VOLUME = 0.75;

let audioCtx    = null;
let lastPlayAt  = 0;

/* ── AudioContext — lazy, singleton ────────────────────── */
function getCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/* ── Preferences ───────────────────────────────────────── */
export function getMuted() {
  try { return localStorage.getItem(STORAGE_MUTED) === '1'; } catch { return false; }
}

export function setMuted(val) {
  try { localStorage.setItem(STORAGE_MUTED, val ? '1' : '0'); } catch {}
}

export function toggleMute() {
  const next = !getMuted();
  setMuted(next);
  return next;  // returns new muted state
}

export function getVolume() {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_VOLUME));
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : DEFAULT_VOLUME;
  } catch { return DEFAULT_VOLUME; }
}

export function setVolume(v) {
  try { localStorage.setItem(STORAGE_VOLUME, String(Math.max(0, Math.min(1, v)))); } catch {}
}

/* ── Unlock audio context after user gesture ───────────── */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch {}
}

/* ── Synthesise one bell strike ────────────────────────── */
function strike(ctx, compressor, freq, when, vol) {
  // Primary sine (clean bell)
  const osc1  = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, when);
  gain1.gain.setValueAtTime(0, when);
  gain1.gain.linearRampToValueAtTime(vol, when + 0.008);
  gain1.gain.exponentialRampToValueAtTime(0.0001, when + 0.60);
  osc1.connect(gain1);
  gain1.connect(compressor);
  osc1.start(when);
  osc1.stop(when + 0.65);

  // Subtle harmonic overtone (bell-body character)
  const osc2  = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.756, when); // inharmonic partial
  gain2.gain.setValueAtTime(0, when);
  gain2.gain.linearRampToValueAtTime(vol * 0.18, when + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  osc2.connect(gain2);
  gain2.connect(compressor);
  osc2.start(when);
  osc2.stop(when + 0.22);
}

/* ── Main: play the double-ding ────────────────────────── */
export async function playOrderNotification() {
  if (getMuted()) return;

  const now = Date.now();
  if (now - lastPlayAt < DEBOUNCE_MS) return;
  lastPlayAt = now;

  try {
    const ctx = getCtx();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Dynamic compressor prevents clipping at high volumes
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6,  ctx.currentTime);
    compressor.knee.setValueAtTime(3,        ctx.currentTime);
    compressor.ratio.setValueAtTime(4,       ctx.currentTime);
    compressor.attack.setValueAtTime(0.003,  ctx.currentTime);
    compressor.release.setValueAtTime(0.25,  ctx.currentTime);
    compressor.connect(ctx.destination);

    const t   = ctx.currentTime;
    const vol = getVolume();

    strike(ctx, compressor, 880,  t,        vol);  // A5 — first ding
    strike(ctx, compressor, 1175, t + 0.28, vol);  // D6 — second ding (perfect 4th above)
  } catch (err) {
    // Autoplay blocked or context unavailable — silent failure
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[notification] audio failed:', err.message);
    }
  }
}

/* ── Browser Notification API ──────────────────────────── */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission().catch(() => {});
  }
}

export function showBrowserNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag:  'bz-new-order',   // replaces the previous notification instead of stacking
      requireInteraction: false,
    });
    setTimeout(() => n.close(), 6000);
  } catch {}
}
