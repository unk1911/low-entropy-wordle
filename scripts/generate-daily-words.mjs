/**
 * Generate daily-words.json mapping each date from 2026-02-24 through today
 * to the deterministic target word for that day.
 *
 * Uses the same seeded RNG and TARGET_WORDS as the game client.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Parse TARGET_WORDS from the source file
const wordsSource = readFileSync(join(ROOT, 'src/data/words.js'), 'utf-8');
const match = wordsSource.match(/export const TARGET_WORDS = \[([\s\S]*?)\];/);
if (!match) throw new Error('Could not parse TARGET_WORDS from src/data/words.js');
const TARGET_WORDS = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
console.log(`Loaded ${TARGET_WORDS.length} target words`);

// Same seeded RNG as src/utils/gameLogic.js
function createSeededRng(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

function checkGuess(guess, target) {
  const result = Array(5).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = '#';
      guessLetters[i] = '*';
    }
  }
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] !== '*') {
      const idx = targetLetters.indexOf(guessLetters[i]);
      if (idx !== -1) {
        result[i] = 'present';
        targetLetters[idx] = '#';
      }
    }
  }
  return result;
}

function getDailyWords(dateStr) {
  const rng = createSeededRng(dateStr);
  const targetIndex = Math.floor(rng() * TARGET_WORDS.length);
  const target = TARGET_WORDS[targetIndex].toUpperCase();

  // Pick an initial word that exposes at most 1 letter (yellow or green) against the target
  const candidates = TARGET_WORDS.filter((w) => {
    if (w.toUpperCase() === target) return false;
    const result = checkGuess(w.toUpperCase(), target);
    return result.filter((r) => r !== 'absent').length <= 1;
  });
  const initialIndex = Math.floor(rng() * candidates.length);
  const initialWord = candidates[initialIndex].toUpperCase();

  return { targetWord: target, initialWord };
}

// Get today in America/New_York
function getTodayET() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

const START_DATE = '2026-02-24';
const todayStr = getTodayET();
const result = {};

let d = new Date(START_DATE + 'T12:00:00'); // noon to avoid DST issues
const end = new Date(todayStr + 'T12:00:00');

while (d <= end) {
  const dateStr = d.toISOString().slice(0, 10);
  const { targetWord, initialWord } = getDailyWords(dateStr);
  result[dateStr] = { targetWord, initialWord };
  d.setDate(d.getDate() + 1);
}

const outPath = join(ROOT, 'public', 'daily-words.json');
writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(`Wrote ${Object.keys(result).length} entries to ${outPath}`);
