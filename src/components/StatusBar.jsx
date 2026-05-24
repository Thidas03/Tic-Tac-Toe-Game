import React from 'react';

function StatusBar({ gameActive, playersCount, turn, playerSymbol }) {
  const getStatusText = () => {
    if (playersCount < 2) {
      return (
        <>
          <span className="pulse-indicator"></span>
          Waiting for opponent...
        </>
      );
    }
    if (!gameActive) {
      return "Game Paused (Opponent disconnected)";
    }

    const isMyTurn = turn === playerSymbol;
    return isMyTurn ? "Your turn!" : `Opponent's turn (${turn})`;
  };

  return (
    <div className="status-bar">
      <span className="status-text">
        {getStatusText()}
      </span>
    </div>
  );
}

export default StatusBar;
