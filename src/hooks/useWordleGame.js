import { useState, useCallback, useEffect } from 'react';
import {
  MAX_GUESSES,
  WORD_LENGTH,
  checkGuess,
  createEmptyBoard,
  updateUsedKeys,
  calculateSkillScore,
  getDailyWords,
  getDateString,
  isValidWord,
} from '../utils/gameLogic';

function buildInitialState() {
  const { targetWord, initialWord } = getDailyWords();
  const board = createEmptyBoard();

  // Pre-fill row 0 with the starting word and its letter states vs the target
  const initialStates = checkGuess(initialWord, targetWord);
  for (let col = 0; col < WORD_LENGTH; col++) {
    board[0][col] = { letter: initialWord[col], state: initialStates[col] };
  }

  // Pre-populate keyboard colors for the initial word
  const usedKeys = {};
  for (let col = 0; col < initialWord.length; col++) {
    const letter = initialWord[col];
    const state = initialStates[col];
    if (state === 'correct') {
      usedKeys[letter] = 'correct';
    } else if (state === 'present' && usedKeys[letter] !== 'correct') {
      usedKeys[letter] = 'present';
    } else if (!usedKeys[letter]) {
      usedKeys[letter] = state;
    }
  }

  return {
    guesses: board,
    currentRow: 1,     // Row 0 is pre-filled; player starts at row 1
    currentGuess: '',
    gameStatus: 'playing', // "playing" | "won" | "lost"
    targetWord,
    initialWord,
    usedKeys,
  };
}

export default function useWordleGame() {
  const [gameState, setGameState] = useState(buildInitialState);
  const [shakeRow, setShakeRow] = useState(null);
  const [message, setMessage] = useState('');
  const [revealingRow, setRevealingRow] = useState(null);

  // Show a temporary toast message
  const showMessage = useCallback((text, duration = 1500) => {
    setMessage(text);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const handleKeyPress = useCallback(
    (key) => {
      if (gameState.gameStatus !== 'playing' || revealingRow !== null) return;

      if (key === 'ENTER') {
        if (gameState.currentGuess.length !== WORD_LENGTH) {
          setShakeRow(gameState.currentRow);
          showMessage('Not enough letters');
          setTimeout(() => setShakeRow(null), 500);
          return;
        }
        if (!isValidWord(gameState.currentGuess)) {
          setShakeRow(gameState.currentRow);
          showMessage('Not in word list');
          setTimeout(() => setShakeRow(null), 500);
          return;
        }

        const letterStates = checkGuess(gameState.currentGuess, gameState.targetWord);
        setRevealingRow(gameState.currentRow);

        setGameState((prev) => {
          const newGuesses = [...prev.guesses];
          for (let col = 0; col < WORD_LENGTH; col++) {
            newGuesses[prev.currentRow][col] = {
              letter: prev.currentGuess[col],
              state: letterStates[col],
            };
          }
          const newUsedKeys = updateUsedKeys(prev.usedKeys, prev.currentGuess, letterStates);
          const won = prev.currentGuess === prev.targetWord;
          const lost = !won && prev.currentRow === MAX_GUESSES - 1;
          return {
            ...prev,
            guesses: newGuesses,
            currentRow: prev.currentRow + 1,
            currentGuess: '',
            gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
            usedKeys: newUsedKeys,
          };
        });

        // After the flip animation completes, show the result message
        setTimeout(() => {
          setRevealingRow(null);
          if (gameState.currentGuess === gameState.targetWord) {
            const winMessages = [
              'Genius!',
              'Magnificent!',
              'Impressive!',
              'Splendid!',
              'Great!',
              'Phew!',
            ];
            showMessage(winMessages[Math.min(gameState.currentRow, winMessages.length - 1)], 3000);
          } else if (gameState.currentRow === MAX_GUESSES - 1) {
            showMessage(gameState.targetWord, 5000);
          }
        }, WORD_LENGTH * 300 + 200);
      } else if (key === 'BACKSPACE') {
        setGameState((prev) => ({
          ...prev,
          currentGuess: prev.currentGuess.slice(0, -1),
        }));
      } else if (/^[A-Z]$/.test(key) && gameState.currentGuess.length < WORD_LENGTH) {
        setGameState((prev) => ({
          ...prev,
          currentGuess: prev.currentGuess + key,
        }));
      }
    },
    [gameState, revealingRow, showMessage]
  );

  // Physical keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  // Build the display board (includes current in-progress guess in the active row)
  const getDisplayBoard = useCallback(() => {
    const board = gameState.guesses.map((row) => [...row]);
    if (gameState.gameStatus === 'playing' && gameState.currentRow < MAX_GUESSES) {
      for (let col = 0; col < WORD_LENGTH; col++) {
        board[gameState.currentRow][col] = {
          letter: gameState.currentGuess[col] || '',
          state: gameState.currentGuess[col] ? 'tbd' : 'empty',
        };
      }
    }
    return board;
  }, [gameState]);

  return {
    board: getDisplayBoard(),
    currentRow: gameState.currentRow,
    gameStatus: gameState.gameStatus,
    targetWord: gameState.targetWord,
    initialWord: gameState.initialWord,
    usedKeys: gameState.usedKeys,
    shakeRow,
    message,
    revealingRow,
    handleKeyPress,
    date: getDateString(),
    skillScore: calculateSkillScore(gameState.guesses, gameState.currentRow, gameState.gameStatus),
  };
}
