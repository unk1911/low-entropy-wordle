import Row from './Row';

export default function Board({ board, shakeRow, revealingRow }) {
  return (
    <div className="board">
      {board.map((tiles, row) => (
        <Row
          key={row}
          tiles={tiles}
          isShaking={shakeRow === row}
          isRevealing={revealingRow === row}
          isInitialRow={row === 0}
        />
      ))}
    </div>
  );
}
