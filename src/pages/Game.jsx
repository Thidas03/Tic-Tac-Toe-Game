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

  // Retrieve player symbol passed from navigation state
  const [playerSymbol] = useState(location.state?.playerSymbol || '');

  // Game state management
  const [board, setBoard] = useState(Array(9).fill(''));
  const [currentTurn, setCurrentTurn] = useState('X');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOver, setGameOver] = useState(false);

  // Temporary error message for invalid moves
  const [errorMessage, setErrorMessage] = useState('');

  // Automatically clear error message after 2.5 seconds
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => {
      setErrorMessage('');
    }, 2500);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    // If player navigated directly without joining/creating, redirect home
    if (!playerSymbol) {
      navigate('/', { replace: true });
      return;
    }

    const handleStartGame = (roomState) => {
      console.log('Game starting with room state:', roomState);
      setBoard(roomState.board);
      setCurrentTurn(roomState.turn);
      setGameStatus('active');
      setGameOver(false);
    };

    const handleUpdateBoard = ({ board, turn }) => {
      console.log('Board updated:', board, turn);
      setBoard(board);
      setCurrentTurn(turn);
    };

    const handleGameOver = ({ winner }) => {
      console.log('Game over:', winner);
      setGameOver(true);
      if (winner === 'draw') {
        setGameStatus("It's a Draw!");
      } else {
        setGameStatus(`Player ${winner} Wins!`);
      }
    };

    const handlePlayerLeft = ({ message }) => {
      console.log('Player left:', message);
      setGameOver(true);
      setGameStatus('Opponent disconnected');
    };

    const handleInvalidMove = ({ message }) => {
      console.log('Invalid move:', message);
      setErrorMessage('Invalid move');
    };

    // Socket listeners registration
    socket.on('start_game', handleStartGame);
    socket.on('update_board', handleUpdateBoard);
    socket.on('game_over', handleGameOver);
    socket.on('player_left', handlePlayerLeft);
    socket.on('invalid_move', handleInvalidMove);

    // Cleanup listeners on unmount
    return () => {
      // Disconnect and reconnect to trigger backend cleanups and keep client ready
      socket.disconnect();
      socket.connect();

      socket.off('start_game', handleStartGame);
      socket.off('update_board', handleUpdateBoard);
      socket.off('game_over', handleGameOver);
      socket.off('player_left', handlePlayerLeft);
      socket.off('invalid_move', handleInvalidMove);
    };
  }, [playerSymbol, navigate]);

  const handleSquareClick = (index) => {
    // ONLY allow move if:
    // - game not over
    // - cell empty
    // - currentTurn === playerSymbol
    if (gameOver) return;
    if (board[index] !== '') return;
    if (currentTurn !== playerSymbol) return;

    // Emit: make_move
    socket.emit('make_move', { roomId, index });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  // Determine if board clicks should be disabled
  const isBoardDisabled = gameOver || gameStatus === 'waiting' || currentTurn !== playerSymbol;

  return (
    <div className="glass-card">
      {/* Temporary Alert Banner for Invalid Moves */}
      {errorMessage && <div className="alert-banner">{errorMessage}</div>}

      <RoomPanel roomId={roomId} playerSymbol={playerSymbol} />

      <Board 
        board={board} 
        onSquareClick={handleSquareClick} 
        disabled={isBoardDisabled} 
      />

      <StatusBar
        currentTurn={currentTurn}
        playerSymbol={playerSymbol}
        gameStatus={gameStatus}
        gameOver={gameOver}
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
