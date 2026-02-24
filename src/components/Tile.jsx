/**
 * A single letter tile on the board.
 * state: "empty" | "tbd" | "correct" | "present" | "absent"
 * isRevealing: true while the flip animation is playing for this row
 */
export default function Tile({ letter, state, position, isRevealing }) {
  const tileClass = () => {
    if (state === 'empty') return '';
    if (state === 'tbd') return 'filled';
    return state; // "correct" | "present" | "absent"
  };

  return (
    <div
      className={`tile ${tileClass()} ${isRevealing ? 'revealing' : ''}`}
      style={{
        animationDelay: isRevealing ? `${position * 300}ms` : '0ms',
        transitionDelay: isRevealing ? `${position * 300}ms` : '0ms',
      }}
    >
      <div className="tile-inner">
        <div className="tile-front">{letter}</div>
        <div className="tile-back">{letter}</div>
      </div>
    </div>
  );
}
