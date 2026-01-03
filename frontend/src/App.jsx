import React, { useState, useEffect } from 'react';
import { X, Circle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const TicTacToe = () => {
  const [gameState, setGameState] = useState('setup');
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [aiSymbol, setAiSymbol] = useState(null);
  const [board, setBoard] = useState(Array(9).fill('_'));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [lastAiMove, setLastAiMove] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = (boardState) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (boardState[a] !== '_' && 
          boardState[a] === boardState[b] && 
          boardState[a] === boardState[c]) {
        return { winner: boardState[a], line: pattern };
      }
    }
    return null;
  };

  const isBoardFull = (boardState) => {
    return boardState.every(cell => cell !== '_');
  };

  const callCppEngine = async (boardState, aiSym, humanSym) => {
    try {
      const response = await fetch(`${API_URL}/api/get-ai-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardState,
          aiSymbol: aiSym,
          humanSymbol: humanSym
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Engine call failed:', err);
      throw err;
    }
  };

  const handleSymbolChoice = async (symbol) => {
    setPlayerSymbol(symbol);
    const aiSym = symbol === 'X' ? 'O' : 'X';
    setAiSymbol(aiSym);
    setGameState('playing');
    setError(null);
    
    if (symbol === 'O') {
      setTimeout(() => makeAiMove(Array(9).fill('_'), 'X', symbol), 500);
    }
  };

  const makeAiMove = async (currentBoard, aiPlayer, humanPlayer) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await callCppEngine(currentBoard, aiPlayer, humanPlayer);
      
      setBoard(response.board);
      setLastAiMove(response.move);
      
      if (response.hasWinner) {
        const winResult = checkWinner(response.board);
        if (winResult) {
          setWinner(winResult.winner);
          setWinningLine(winResult.line);
        }
        setGameState('finished');
      } else if (response.isFull) {
        setGameState('finished');
      } else {
        setCurrentPlayer(humanPlayer);
      }
    } catch (err) {
      setError('Failed to get AI move. Make sure the backend is running.');
      setGameState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellClick = async (index) => {
    if (gameState !== 'playing' || 
        board[index] !== '_' || 
        currentPlayer !== playerSymbol ||
        isProcessing) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);
    setLastAiMove(null);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
      setGameState('finished');
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameState('finished');
      return;
    }

    setCurrentPlayer(aiSymbol);
    setTimeout(() => makeAiMove(newBoard, aiSymbol, playerSymbol), 500);
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayerSymbol(null);
    setAiSymbol(null);
    setBoard(Array(9).fill('_'));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setLastAiMove(null);
    setError(null);
    setIsProcessing(false);
  };

  const renderSymbol = (symbol) => {
    if (symbol === 'X') {
      return <X className="w-12 h-12" strokeWidth={3} />;
    } else if (symbol === 'O') {
      return <Circle className="w-12 h-12" strokeWidth={3} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-indigo-600">
          Tic-Tac-Toe
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Powered by C++ Engine
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {gameState === 'setup' && (
          <div className="text-center">
            <p className="text-lg mb-6 text-gray-700">
              Choose your symbol (X moves first):
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleSymbolChoice('X')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg text-2xl transition-all transform hover:scale-105"
              >
                X
              </button>
              <button
                onClick={() => handleSymbolChoice('O')}
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-lg text-2xl transition-all transform hover:scale-105"
              >
                O
              </button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'error') && (
          <div>
            <div className="text-center mb-6">
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Computer thinking...</span>
                </div>
              ) : (
                <p className="text-lg text-gray-700">
                  {currentPlayer === playerSymbol ? (
                    <span className="font-semibold text-indigo-600">Your turn ({playerSymbol})</span>
                  ) : (
                    <span className="font-semibold text-pink-600">Computer's turn ({aiSymbol})</span>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={`aspect-square bg-gray-50 border-2 rounded-lg flex items-center justify-center transition-all
                    ${winningLine.includes(index) ? 'bg-green-100 border-green-400' : 'border-gray-300'}
                    ${lastAiMove === index ? 'bg-pink-50 border-pink-300' : ''}
                    ${cell === '_' && currentPlayer === playerSymbol && !isProcessing ? 'hover:bg-indigo-50 cursor-pointer' : ''}
                    ${cell === 'X' ? 'text-indigo-600' : cell === 'O' ? 'text-pink-600' : ''}
                  `}
                  disabled={cell !== '_' || currentPlayer !== playerSymbol || isProcessing}
                >
                  {renderSymbol(cell === '_' ? null : cell)}
                </button>
              ))}
            </div>

            {gameState === 'error' && (
              <button
                onClick={resetGame}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Back to Menu
              </button>
            )}
          </div>
        )}

        {gameState === 'finished' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {board.map((cell, index) => (
                <div
                  key={index}
                  className={`aspect-square bg-gray-50 border-2 rounded-lg flex items-center justify-center
                    ${winningLine.includes(index) ? 'bg-green-100 border-green-400' : 'border-gray-300'}
                    ${cell === 'X' ? 'text-indigo-600' : cell === 'O' ? 'text-pink-600' : ''}
                  `}
                >
                  {renderSymbol(cell === '_' ? null : cell)}
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              {winner ? (
                <p className="text-2xl font-bold text-green-600">
                  {winner === playerSymbol ? 'You win! 🎉' : 'Computer wins! 🤖'}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-600">
                  It's a draw! 🤝
                </p>
              )}
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicTacToe;