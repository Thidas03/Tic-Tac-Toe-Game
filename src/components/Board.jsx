import React from 'react';
import Square from './Square.jsx';

function Board({ board, onSquareClick }) {
  return (
    <div className="board-grid">
      {board.map((value, index) => (
        <Square
          key={index}
          value={value}
          onClick={() => onSquareClick(index)}
        />
      ))}
    </div>
  );
}

export default Board;
