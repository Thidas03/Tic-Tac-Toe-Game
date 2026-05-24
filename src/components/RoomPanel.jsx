import React from 'react';

function RoomPanel({ roomId, playerSymbol }) {
  return (
    <div className="room-header">
      <div>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Room</p>
        <span className="room-badge">{roomId}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', textAlign: 'right' }}>Your Role</p>
        <span className="player-badge">Player {playerSymbol}</span>
      </div>
    </div>
  );
}

export default RoomPanel;
