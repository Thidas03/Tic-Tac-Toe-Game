import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket/socket.js';
import RoomPanel from '../components/RoomPanel.jsx';
import Board from '../components/Board.jsx';
import StatusBar from '../components/StatusBar.jsx';

function Game() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve player symbol passed from navigation state (fallback if direct url entry)
  const playerSymbol = location.state?.playerSymbol || '';

  const [board, setBoard] = useState(Array(9).fill(''));
  const [turn, setTurn] = useState('X');
  const [gameActive, setGameActive] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // If player navigated directly without joining/creating, redirect home
    if (!playerSymbol) {
      navigate('/', { replace: true });
      return;
    }

    // Initialize state if we are the room creator (player X)
    if (playerSymbol === 'X') {
      setPlayers([{ id: socket.id, symbol: 'X' }]);
    }

    // Socket Event: Start Game (triggered when second player joins)
    socket.on('start_game', (roomState) => {
      console.log('Game starting with room state:', roomState);
      setBoard(roomState.board);
      setTurn(roomState.turn);
      setGameActive(roomState.gameActive);
      setPlayers(roomState.players);
    });

    // Socket Event: Opponent Left
    socket.on('player_left', ({ message }) => {
      console.log('Opponent left:', message);
      setGameActive(false);
      // Remove other players from list
      setPlayers(prev => prev.filter(p => p.id === socket.id));
    });

    // Cleanup listeners
    return () => {
      socket.off('start_game');
      socket.off('player_left');
    };
  }, [roomId, playerSymbol, navigate]);

  const handleSquareClick = (index) => {
    console.log(`Square clicked at index: ${index}`);
    // Emit make_move event to backend server
    socket.emit('make_move', { roomId, index });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="glass-card">
      <RoomPanel roomId={roomId} playerSymbol={playerSymbol} />

      <Board board={board} onSquareClick={handleSquareClick} />

      <StatusBar
        gameActive={gameActive}
        playersCount={players.length}
        turn={turn}
        playerSymbol={playerSymbol}
      />

      <button
        onClick={handleLeaveRoom}
        className="btn btn-secondary"
        style={{ marginTop: '0.5rem', width: 'auto', padding: '0.6rem 1.2rem' }}
      >
        Leave Room
      </button>
    </div>
  );
}

export default Game;
