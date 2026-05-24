/**
 * Check if there is a winner or a draw on the current board.
 * @param {Array} board - A 9-element array of strings ("X", "O", or "") representing the board.
 * @returns {string|null} - "X" or "O" if there is a winner, "draw" if it's a draw, or null if the game is still active.
 */
function checkWinner(board) {
  const winLines = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // columns
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // diagonals
    [2, 4, 6]
  ];

  // 1. Check for a winner
  for (let i = 0; i < winLines.length; i++) {
    const [a, b, c] = winLines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Returns "X" or "O"
    }
  }

  // 2. Check if the board is full (representing a draw)
  const isFull = board.every(cell => cell !== null && cell !== "");
  if (isFull) {
    return "draw";
  }

  // 3. Game is still active
  return null;
}

module.exports = {
  checkWinner
};
