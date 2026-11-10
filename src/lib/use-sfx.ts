'use client';
// hooks/useSfx.ts — ITCamp sounds: click, correct, wrong + optional ambient loop.
// Off by default on every visit.
import { useCallback, useSyncExternalStore } from 'react';

export type SfxName = 'click' | 'correct' | 'wrong';

const FILES: Record<SfxName, string> = {
  click: '/sfx/click.mp3',
  correct: '/sfx/correct.mp3',
  wrong: '/sfx/wrong.mp3',
};
const AMBIENT_FILE = '/sfx/ambient.mp3';

// Keep it quiet.
const VOLUME: Record<SfxName, number> = { click: 0.4, correct: 0.45, wrong: 0.65 };
const AMBIENT_VOLUME = 0.45;

// Not saved anywhere: every visit and every reload starts with sound off.
// Moving between pages keeps the choice, because this module stays loaded.
let enabled = false;
const listeners = new Set<() => void>();
const cache = new Map<SfxName, HTMLAudioElement>();
let ambient: HTMLAudioElement | null = null;

function emit() { listeners.forEach((l) => l()); }

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// Ambient loads only after sound is on (it is ~180 KB). Browsers allow it
// because turning sound on is a click.
function syncAmbient() {
  if (typeof window === 'undefined') return;
  if (enabled) {
    if (!ambient) {
      ambient = new Audio(AMBIENT_FILE);
      ambient.loop = true;
      ambient.volume = AMBIENT_VOLUME;
    }
    ambient.play().catch(() => { /* blocked until a tap; ignore */ });
  } else {
    ambient?.pause();
  }
}

function setSfxEnabled(on: boolean) {
  enabled = on;
  syncAmbient();
  emit();
}

function playSfx(name: SfxName) {
  if (!enabled) return;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(FILES[name]);
    a.preload = 'auto';
    a.volume = VOLUME[name];
    cache.set(name, a);
  }
  a.currentTime = 0;
  a.play().catch(() => { /* ignore */ });
}

export function useSfx() {
  const soundOn = useSyncExternalStore(subscribe, () => enabled, () => false);
  const play = useCallback((name: SfxName) => playSfx(name), []);
  const toggle = useCallback(() => {
    const next = !enabled;
    setSfxEnabled(next);
    if (next) playSfx('click'); // confirms sound is on
  }, []);
  return { soundOn, play, toggle };
}

// Note: if a visitor reloads with sound already "on", the ambient loop stays silent
// until their first click, because browsers block audio before a gesture. To resume it
// then, call syncAmbient() from a one-time document click listener (optional).
