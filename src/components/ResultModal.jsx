import { useState } from 'react';
import { MAX_GUESSES, generateShareText, formatTime } from '../utils/gameLogic';

export default function ResultModal({
  isOpen,
  gameStatus,
  targetWord,
  guesses,
  currentRow,
  date,
  onClose,
  skillScore,
  elapsedTime,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = generateShareText(guesses, currentRow, gameStatus === 'won', date, elapsedTime);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 className="modal-title">
          {gameStatus === 'won' ? 'Congrats!' : 'Better luck next time!'}
        </h2>

        <p className="modal-message">
          {gameStatus === 'won'
            ? `You found the word in ${currentRow} ${currentRow === 1 ? 'guess' : 'guesses'}!`
            : `The word was: ${targetWord}`}
        </p>

        <div className="stats">
          <div className="stat">
            <span className="stat-value">{currentRow}</span>
            <span className="stat-label">{gameStatus === 'won' ? 'Guesses' : 'Attempts'}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{MAX_GUESSES}</span>
            <span className="stat-label">Max Allowed</span>
          </div>
	  <div className="stat">
	    <span className="stat-value">{skillScore?.toFixed(2)}</span>
	    <span className="stat-label">Skill Score</span>
	  </div>
          <div className="stat">
            <span className="stat-value">{formatTime(elapsedTime)}</span>
            <span className="stat-label">Time</span>
          </div>
        </div>

        <button className="share-button" onClick={handleShare}>
          {copied ? '✓ Copied!' : 'Share Results'}
        </button>
      </div>
    </div>
  );
}
