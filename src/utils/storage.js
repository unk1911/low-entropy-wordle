const KEY_PREFIX = 'lew-state-';

export function saveGameState(dateStr, state) {
  try {
    const data = {
      guesses: state.guesses,
      currentRow: state.currentRow,
      currentGuess: state.currentGuess,
      gameStatus: state.gameStatus,
      targetWord: state.targetWord,
      initialWord: state.initialWord,
      usedKeys: state.usedKeys,
      elapsedSeconds: state.elapsedSeconds,
    };
    localStorage.setItem(KEY_PREFIX + dateStr, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadGameState(dateStr) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + dateStr);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Basic validation
    if (!data.guesses || !data.targetWord || typeof data.currentRow !== 'number') {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
