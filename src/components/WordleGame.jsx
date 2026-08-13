import { useState, useEffect } from 'react';
import useWordleGame from '../hooks/useWordleGame';
import Board from './Board';
import Keyboard from './Keyboard';
import ResultModal from './ResultModal';
import DateSelector from './DateSelector';
import { getDateString } from '../utils/gameLogic';
import pkg from '../../package.json';
import '../App.css';

export default function WordleGame() {
  const [selectedDate, setSelectedDate] = useState(getDateString);

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
    isReplay,
  } = useWordleGame(selectedDate);

  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open the result modal a moment after the game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const timer = setTimeout(() => setModalOpen(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setModalOpen(false);
    }
  }, [gameStatus, selectedDate]);

  return (
    <div className="wordle">
      <header className="wordle-header">
        <h1>Low Entropy Wordle <span className="version-badge">v{pkg.version}</span></h1>
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </header>

      <p className="dedication">
        Dedicated to bebzer <span className="dedication-aka">(a.k.a. the love terrorist group)</span>
      </p>

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
        isReplay={isReplay}
      />

      <footer className="wordle-footer">
        <div>
          <a href="https://edeliverables.com">eDeliverables</a> (2026)
        </div>
        <div>
          Questions or feedback? Reach out at{' '}
          <a href="mailto:dolphin@edeliverables.com">dolphin@edeliverables.com</a>
        </div>
        <div>
          <a href="https://github.com/unk1911/low-entropy-wordle">View this project on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
