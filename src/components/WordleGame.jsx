import { useState, useEffect } from 'react';
import useWordleGame from '../hooks/useWordleGame';
import Board from './Board';
import Keyboard from './Keyboard';
import ResultModal from './ResultModal';
import '../App.css';

export default function WordleGame() {
  const {
    board,
    currentRow,
    gameStatus,
    targetWord,
    usedKeys,
    shakeRow,
    message,
    revealingRow,
    handleKeyPress,
    date,
    skillScore,
    elapsedTime,
    remainingCounts,
  } = useWordleGame();

  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open the result modal a moment after the game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const timer = setTimeout(() => setModalOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  return (
    <div className="wordle">
      <header className="wordle-header">
        <h1>Low Entropy Wordle</h1>
        {date && <div className="date">{date}</div>}
      </header>

      {message && <div className="message">{message}</div>}

      {gameStatus !== 'playing' && skillScore > 0 && (
        <div className="skill-indicator">
          <span className="skill-label">Skill Score:</span>
          <span className="skill-value">{skillScore.toFixed(2)}</span>
          <span className="skill-hint">(lower is better)</span>
        </div>
      )}

      <Board board={board} shakeRow={shakeRow} revealingRow={revealingRow} remainingCounts={remainingCounts} />

      <Keyboard usedKeys={usedKeys} onKeyPress={handleKeyPress} />

      <ResultModal
        isOpen={modalOpen}
        gameStatus={gameStatus}
        targetWord={targetWord}
        guesses={board}
        currentRow={currentRow}
        date={date}
        skillScore={skillScore}
        elapsedTime={elapsedTime}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
