import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket/socket.js';
import RoomPanel from '../components/RoomPanel.jsx';
import Board from '../components/Board.jsx';
import StatusBar from '../components/StatusBar.jsx';
import Chat from '../components/Chat.jsx';

const saveMatchToHistory = ({ roomId, playerSymbol, winner, reason }) => {
  try {
    const history = JSON.parse(localStorage.getItem('tic_tac_toe_history') || '[]');
    let result = 'draw';
    if (winner !== 'draw') {
      result = winner === playerSymbol ? 'win' : 'loss';
    }
    const newMatch = {
      id: Date.now().toString(),
      roomId,
      playerSymbol,
      opponentSymbol: playerSymbol === 'X' ? 'O' : 'X',
      winner,
      result,
      reason,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [newMatch, ...history].slice(0, 50);
    localStorage.setItem('tic_tac_toe_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving match history:', error);
  }
};

function Game() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve player symbol passed from navigation state
  const [playerSymbol] = useState(location.state?.playerSymbol || '');

  // Game state management - pre-initialize with values from navigation state
  const [board, setBoard] = useState(location.state?.initialBoard || Array(9).fill(''));
  const [currentTurn, setCurrentTurn] = useState(location.state?.initialTurn || 'X');
  const [gameStatus, setGameStatus] = useState(location.state?.gameStatus || 'waiting');
  const [gameOver, setGameOver] = useState(false);

  // Rematch request states
  const [requestedRestart, setRequestedRestart] = useState(false);
  const [opponentWantsRestart, setOpponentWantsRestart] = useState(false);

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
      console.log('Game starting/restarting with room state:', roomState);
      setBoard(roomState.board);
      setCurrentTurn(roomState.turn);
      setGameStatus('active');
      setGameOver(false);
      setRequestedRestart(false);
      setOpponentWantsRestart(false);
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
      
      saveMatchToHistory({
        roomId,
        playerSymbol,
        winner,
        reason: winner === 'draw' ? 'draw' : `${winner}_won`
      });
    };

    const handlePlayerLeft = ({ message }) => {
      console.log('Player left:', message);
      setGameOver((prevGameOver) => {
        if (!prevGameOver) {
          saveMatchToHistory({
            roomId,
            playerSymbol,
            winner: playerSymbol,
            reason: 'opponent_disconnected'
          });
        }
        return true;
      });
      setGameStatus('Opponent disconnected');
    };

    const handleInvalidMove = ({ message }) => {
      console.log('Invalid move:', message);
      setErrorMessage('Invalid move');
    };

    const handleRestartRequested = ({ requestedBy, totalRequests }) => {
      console.log('Restart requested by:', requestedBy, 'total:', totalRequests);
      if (requestedBy !== playerSymbol) {
        setOpponentWantsRestart(true);
      }
    };

    // Socket listeners registration
    socket.on('start_game', handleStartGame);
    socket.on('update_board', handleUpdateBoard);
    socket.on('game_over', handleGameOver);
    socket.on('player_left', handlePlayerLeft);
    socket.on('invalid_move', handleInvalidMove);
    socket.on('restart_requested', handleRestartRequested);

    // Cleanup listeners on unmount
    return () => {
      socket.off('start_game', handleStartGame);
      socket.off('update_board', handleUpdateBoard);
      socket.off('game_over', handleGameOver);
      socket.off('player_left', handlePlayerLeft);
      socket.off('invalid_move', handleInvalidMove);
      socket.off('restart_requested', handleRestartRequested);
    };
  }, [playerSymbol, roomId, navigate]);

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
    socket.emit('leave_room');
    navigate('/');
  };

  const handleTryAgain = () => {
    socket.emit('request_restart');
    setRequestedRestart(true);
  };

  // Determine if board clicks should be disabled
  const isBoardDisabled = gameOver || gameStatus === 'waiting' || currentTurn !== playerSymbol;

  return (
    <div className="game-container">
      <div className="glass-card game-main-card">
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

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
          {gameOver && (
            <button
              onClick={handleTryAgain}
              disabled={requestedRestart}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.2rem', marginTop: 0 }}
            >
              {requestedRestart 
                ? 'Waiting for Opponent...' 
                : opponentWantsRestart 
                  ? 'Accept Rematch!' 
                  : 'Try Again'}
            </button>
          )}

          <button
            onClick={handleLeaveRoom}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.6rem 1.2rem', marginTop: 0 }}
          >
            Leave Room
          </button>
        </div>
      </div>

      <Chat roomId={roomId} playerSymbol={playerSymbol} />
    </div>
  );
}

export default Game;
