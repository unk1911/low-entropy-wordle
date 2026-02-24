import Tile from './Tile';

/**
 * A row of 5 tiles.
 * isInitialRow: true for row 0, which gets a star marker and special styling.
 */
export default function Row({ tiles, isShaking, isRevealing, isInitialRow }) {
  return (
    <div className={`row ${isShaking ? 'shake' : ''} ${isInitialRow ? 'initial-row' : ''}`}>
      {tiles.map((tile, col) => (
        <Tile
          key={col}
          letter={tile.letter}
          state={tile.state}
          position={col}
          isRevealing={isRevealing}
        />
      ))}
    </div>
  );
}
