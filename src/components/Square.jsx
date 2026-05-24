import React from 'react';

function Square({ value, onClick, disabled }) {
  const getMarkClass = () => {
    if (value === 'X') return 'mark-x';
    if (value === 'O') return 'mark-o';
    return '';
  };

  return (
    <button 
      className="square" 
      onClick={onClick} 
      disabled={disabled}
    >
      <span className={getMarkClass()}>{value}</span>
    </button>
  );
}

export default Square;
