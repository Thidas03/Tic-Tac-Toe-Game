import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket/socket';

function Home() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listen for room creation
    socket.on('room_created', ({ roomId, player }) => {
      console.log(`Room created: ${roomId}, symbol: ${player}`);
      navigate(`/game/${roomId}`, { state: { playerSymbol: player } });
    });

    // 2. Listen for room join success
    socket.on('room_joined', ({ roomId, player }) => {
      console.log(`Room joined: ${roomId}, symbol: ${player}`);
      navigate(`/game/${roomId}`, { state: { playerSymbol: player } });
    });

    // 3. Listen for errors
    socket.on('error_room_not_found', ({ message }) => {
      setError(message);
    });

    socket.on('error_room_full', ({ message }) => {
      setError(message);
    });

    // Cleanup listeners
    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('error_room_not_found');
      socket.off('error_room_full');
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    setError('');
    socket.emit('create_room');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError('');
    if (!roomIdInput.trim()) {
      setError('Please enter a Room ID');
      return;
    }
    socket.emit('join_room', roomIdInput.trim());
  };

  return (
    <div className="glass-card">
      <div style={{ textAlign: 'center' }}>
        <h1>Tic Tac Toe</h1>
        <p style={{ marginTop: '0.5rem' }}>Real-time multiplayer gaming</p>
      </div>

      {error && (
        <div style={{
          width: '100%',
          background: 'rgba(236, 72, 153, 0.1)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: '#ec4899',
          padding: '0.75rem',
          borderRadius: '12px',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleJoinRoom} className="form-group">
        <label className="form-label" htmlFor="room-id">Join an existing game</label>
        <input
          id="room-id"
          className="input-field"
          type="text"
          placeholder="Enter Room ID"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          Join Room
        </button>
      </form>

      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-glass-border)' }}></div>
        <span style={{ fontSize: '0.875rem' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-glass-border)' }}></div>
      </div>

      <div className="btn-container">
        <button onClick={handleCreateRoom} className="btn btn-primary">
          Create New Room
        </button>
      </div>
    </div>
  );
}

export default Home;
