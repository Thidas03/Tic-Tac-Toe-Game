import React from 'react';

function StatusBar({ currentTurn, playerSymbol, gameStatus, gameOver }) {
  const renderContent = () => {
    // 1. Waiting state
    if (gameStatus === 'waiting') {
      return (
        <span className="status-text">
          <span className="pulse-indicator"></span>
          Waiting for opponent...
        </span>
      );
    }

    // 2. Disconnect state
    if (gameStatus === 'Opponent disconnected') {
      return (
        <span className="status-text" style={{ color: '#ec4899', fontWeight: 700 }}>
          Opponent disconnected
        </span>
      );
    }

    // 3. Game Over states
    if (gameOver) {
      if (gameStatus === "It's a Draw!") {
        return (
          <span className="status-text" style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '1.3rem'
          }}>
            It's a Draw!
          </span>
        );
      }
      
      const isXWinner = gameStatus.includes('X');
      return (
        <span className={`status-text ${isXWinner ? 'mark-x' : 'mark-o'}`} style={{
          fontWeight: 800,
          fontSize: '1.3rem',
          letterSpacing: '0.02em'
        }}>
          {gameStatus}
        </span>
      );
    }

    // 4. In-progress Turn states
    const isMyTurn = currentTurn === playerSymbol;
    if (isMyTurn) {
      return (
        <span className="status-text">
          Your turn! (<span className={playerSymbol === 'X' ? 'mark-x' : 'mark-o'}>{playerSymbol}</span>)
        </span>
      );
    } else {
      return (
        <span className="status-text">
          Opponent's turn (<span className={currentTurn === 'X' ? 'mark-x' : 'mark-o'}>{currentTurn}</span>)
        </span>
      );
    }
  };

  return (
    <div className="status-bar">
      {renderContent()}
    </div>
  );
}

export default StatusBar;
