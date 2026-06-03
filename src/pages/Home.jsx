import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket/socket';

function Home() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const [waitingRoomId, setWaitingRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load match history from localStorage
    try {
      const savedHistory = JSON.parse(localStorage.getItem('tic_tac_toe_history') || '[]');
      setHistory(savedHistory);
    } catch (e) {
      console.error('Error loading match history:', e);
    }

    // Explicitly make sure we leave any existing room when returning home
    socket.emit('leave_room');

    // 1. Listen for room creation
    socket.on('room_created', ({ roomId }) => {
      console.log(`Room created: ${roomId}`);
      setWaitingRoomId(roomId);
    });

    // 2. Listen for game starting (for both creator and joiner)
    socket.on('start_game', ({ roomId, symbol, board, turn }) => {
      console.log(`Game starting: ${roomId}, symbol: ${symbol}`);
      navigate(`/game/${roomId}`, { 
        state: { 
          playerSymbol: symbol,
          initialBoard: board,
          initialTurn: turn,
          gameStatus: 'active'
        } 
      });
    });

    // 3. Listen for errors
    socket.on('room_not_found', ({ message }) => {
      setError(message);
    });

    socket.on('error_room_not_found', ({ message }) => {
      setError(message);
    });

    socket.on('room_full', ({ message }) => {
      setError(message);
    });

    socket.on('error_room_full', ({ message }) => {
      setError(message);
    });

    // Cleanup listeners
    return () => {
      socket.off('room_created');
      socket.off('start_game');
      socket.off('room_not_found');
      socket.off('error_room_not_found');
      socket.off('room_full');
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
    socket.emit('join_room', { roomId: roomIdInput.trim() });
  };

  const handleClearHistory = () => {
    localStorage.removeItem('tic_tac_toe_history');
    setHistory([]);
  };

  // Calculate statistics from match history
  const stats = history.reduce(
    (acc, match) => {
      if (match.result === 'win') {
        acc.wins++;
      } else if (match.result === 'loss') {
        acc.losses++;
      } else {
        acc.draws++;
      }
      return acc;
    },
    { wins: 0, losses: 0, draws: 0 }
  );

  const totalGames = history.length;
  const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  if (waitingRoomId) {
    return (
      <div className="glass-card">
        <div style={{ textAlign: 'center' }}>
          <h1>Waiting Room</h1>
          <p style={{ marginTop: '0.5rem' }}>Invite your friend to join the game</p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid var(--color-glass-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Room ID
          </span>
          <span className="room-badge" style={{ fontSize: '1.75rem', padding: '0.5rem 1.5rem', borderRadius: '12px' }}>
            {waitingRoomId}
          </span>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(waitingRoomId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem', marginTop: '0.5rem' }}
          >
            {copied ? 'Copied ✓' : 'Copy Room ID'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'center',
          margin: '0.5rem 0'
        }}>
          <div className="pulse-indicator"></div>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            Waiting for Player O...
          </span>
        </div>

        <div className="btn-container">
          <button
            onClick={() => {
              socket.disconnect();
              socket.connect();
              setWaitingRoomId('');
              setError('');
            }}
            className="btn btn-secondary"
          >
            Cancel & Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="glass-card main-game-card">
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

      <div className="glass-card stats-card">
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h2>Match Dashboard</h2>
          <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>Your gaming history & stats</p>
        </div>

        <div className="stats-grid">
          <div className="stat-item stat-win">
            <span className="stat-label">Wins</span>
            <span className="stat-value">{stats.wins}</span>
          </div>
          <div className="stat-item stat-loss">
            <span className="stat-label">Losses</span>
            <span className="stat-value">{stats.losses}</span>
          </div>
          <div className="stat-item stat-draw">
            <span className="stat-label">Draws</span>
            <span className="stat-value">{stats.draws}</span>
          </div>
        </div>

        <div className="win-rate-banner">
          <span className="win-rate-text">Win Rate</span>
          <span className="win-rate-value">{winRate}%</span>
        </div>

        <div className="history-section">
          <div className="history-title-row">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent Matches ({totalGames})</span>
            {totalGames > 0 && (
              <button 
                onClick={handleClearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-pink)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'var(--transition-snappy)'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(236, 72, 153, 0.1)'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Clear History
              </button>
            )}
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="no-history">
                No match history yet. Play a game to record details!
              </div>
            ) : (
              history.map((match) => {
                const date = new Date(match.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={match.id} className="history-item">
                    <div className="history-info">
                      <span className="history-room">Room {match.roomId} ({match.playerSymbol})</span>
                      <span className="history-date">{date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`history-badge badge-${match.result}`}>
                        {match.result}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
