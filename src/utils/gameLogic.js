import { TARGET_WORDS } from '../data/words';
import wordListRaw from '../data/5-letter-words.txt?raw';

export const MAX_GUESSES = 6;
export const WORD_LENGTH = 5;

// Full universe of valid words (used for guess validation and search space calculation)
export const WORD_LIST = wordListRaw.split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean);
const VALID_WORDS = new Set(WORD_LIST);

/**
 * Check a guess against the target word.
 * Returns an array of states: "correct" | "present" | "absent" for each letter.
 */
export function checkGuess(guess, target) {
  const result = Array(WORD_LENGTH).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');

  // First pass: mark correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = '#';
      guessLetters[i] = '*';
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
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

/**
 * Create an empty 6x5 board where each cell is { letter: "", state: "empty" }.
 */
export function createEmptyBoard() {
  return Array(MAX_GUESSES)
    .fill(null)
    .map(() =>
      Array(WORD_LENGTH)
        .fill(null)
        .map(() => ({ letter: '', state: 'empty' }))
    );
}

/**
 * Update the keyboard color state map after a guess.
 * Correct > Present > Absent (correct always wins).
 */
export function updateUsedKeys(usedKeys, guess, letterStates) {
  const updated = { ...usedKeys };
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];
    const state = letterStates[i];
    const current = updated[letter];
    if (state === 'correct') {
      updated[letter] = 'correct';
    } else if (state === 'present' && current !== 'correct') {
      updated[letter] = 'present';
    } else if (!current) {
      updated[letter] = state;
    }
  }
  return updated;
}

/**
 * Calculate skill score based on weighted letter discovery.
 * Each row is weighted by how early it is — finding letters sooner scores more.
 * Correct letter = 1 pt, present letter = 0.5 pt, multiplied by row weight.
 * Higher score = better play.
 */
export function calculateSkillScore(guesses, currentRow, gameStatus) {
  if (gameStatus === 'playing') return 0;
  const rowsUsed = gameStatus === 'won' ? currentRow : MAX_GUESSES;
  let score = 0;
  for (let row = 0; row < rowsUsed; row++) {
    const weight = (MAX_GUESSES - row) / MAX_GUESSES;
    let lettersFound = 0;
    for (let col = 0; col < WORD_LENGTH; col++) {
      const cell = guesses[row][col];
      if (cell.state === 'correct') lettersFound += 1;
      else if (cell.state === 'present') lettersFound += 0.5;
    }
    score += lettersFound * weight;
  }
  return score;
}

/**
 * Generate the emoji share text for the result.
 */
export function generateShareText(guesses, rowsUsed, won, dateString, elapsedTime) {
  const stateEmoji = {
    correct: '🟩',
    present: '🟨',
    absent: '⬛',
    empty: '⬜',
    tbd: '⬜',
  };
  const header = `Low Entropy Wordle ${dateString}\n${won ? rowsUsed : 'X'}/${MAX_GUESSES}\n\n`;
  const grid = guesses
    .slice(0, rowsUsed)
    .map((row) => row.map((cell) => stateEmoji[cell.state]).join(''))
    .join('\n');
  const score = calculateSkillScore(guesses, rowsUsed, 'won');
  const scoreRounded = score.toFixed(2);
  return header + grid + '\n' + `Tie-Breaker Score: ${scoreRounded}` + '\n' + `Time: ${formatTime(elapsedTime)}`;
}

/**
 * Get today's date as a string in America/New_York timezone: "YYYY-MM-DD".
 */
export function getDateString() {
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

/**
 * Create a deterministic pseudo-random number generator seeded by a string.
 */
export function createSeededRng(seed) {
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

/**
 * Return true if the two words share at least one letter.
 */
export function hasSharedLetters(word1, word2) {
  const letters = new Set(word1.toLowerCase());
  for (const char of word2.toLowerCase()) {
    if (letters.has(char)) return true;
  }
  return false;
}

/**
 * Pick today's target word and the pre-filled starting word (which shares letters
 * with the target to give the player an entropic head-start).
 */
export function getDailyWords() {
  const dateStr = getDateString();
  const rng = createSeededRng(dateStr);
  const targetIndex = Math.floor(rng() * TARGET_WORDS.length);
  const target = TARGET_WORDS[targetIndex].toUpperCase();

  // Pick an initial word that shares at least one letter with the target
  const candidates = TARGET_WORDS.filter(
    (w) => w.toUpperCase() !== target && hasSharedLetters(w, target)
  );
  const initialIndex = Math.floor(rng() * candidates.length);
  const initialWord = candidates[initialIndex].toUpperCase();

  return { targetWord: target, initialWord };
}

/**
 * Return true if the word is in the valid-guesses dictionary.
 */
export function isValidWord(word) {
  return VALID_WORDS.has(word.toLowerCase());
}

/**
 * Count how many words in WORD_LIST are still consistent with all submitted guesses.
 * A candidate is consistent if simulating each guess against it produces the same
 * letter states that were actually revealed.
 */
export function calculateRemainingWords(guesses, currentRow) {
  const submitted = [];
  for (let row = 0; row < currentRow; row++) {
    const cells = guesses[row];
    if (!cells || cells[0].state === 'empty' || cells[0].state === 'tbd') continue;
    const word = cells.map((c) => c.letter).join('').toLowerCase();
    const states = cells.map((c) => c.state);
    submitted.push({ word, states });
  }
  if (submitted.length === 0) return WORD_LIST.length;
  return WORD_LIST.filter((candidate) => {
    for (const { word, states } of submitted) {
      const simulated = checkGuess(word, candidate);
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (simulated[i] !== states[i]) return false;
      }
    }
    return true;
  }).length;
}

/**
 * Format elapsed seconds as M:SS.
 */
export function formatTime(seconds) {
  if (seconds == null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
