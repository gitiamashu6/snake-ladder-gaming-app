import React, { useState, useEffect } from 'react';
import './Game.css';

const BOARD_SIZE = 100;

const Game = () => {
  const [board, setBoard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [diceValue, setDiceValue] = useState(1);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [numPlayers, setNumPlayers] = useState(null);
  const [playerColors, setPlayerColors] = useState([]);
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'finished'

  useEffect(() => {
    if (gameState === 'playing') {
      setBoard(createBoard());
      initializePlayers(playerColors);
      setWinner(null);
    }
  }, [gameState, playerColors]);

  const initializePlayers = (colors) => {
    const newPlayers = Array.from({ length: numPlayers }, (_, i) => ({
      id: `player${i + 1}`,
      name: `Player ${i + 1}`,
      position: 1,
      color: colors[i]
    }));
    setPlayers(newPlayers);
  };

  const createBoard = () => {
    const cells = Array.from({ length: BOARD_SIZE }, (_, i) => ({
      number: i + 1,
      type: 'normal',
    }));
    // Add some snakes and ladders
    cells[3].type = 'ladder';
    cells[3].to = 22;
    cells[15].type = 'ladder';
    cells[15].to = 44;
    cells[31].type = 'ladder';
    cells[31].to = 88;

    cells[24].type = 'snake';
    cells[24].to = 5;
    cells[56].type = 'snake';
    cells[56].to = 33;
    cells[98].type = 'snake';
    cells[98].to = 12;

    cells[10].type = 'trap';
    cells[40].type = 'trap';
    cells[70].type = 'trap';

    cells[20].type = 'boost';
    cells[50].type = 'boost';
    cells[80].type = 'boost';

    return cells;
  };

  const startGame = (playerCount, colors) => {
    setNumPlayers(playerCount);
    setPlayerColors(colors);
    setGameState('playing');
  }

  const restartGame = () => {
      setGameState('setup');
  }

  const rollDice = () => {
    if (winner || puzzle) return;
    const newValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(newValue);
    movePlayer(newValue);
  };

  const movePlayer = (steps) => {
    const currentPlayer = players[activePlayerIndex];
    const newPosition = currentPlayer.position + steps;

    if (newPosition >= BOARD_SIZE) {
      setWinner(currentPlayer);
      updatePlayerPosition(BOARD_SIZE);
    } else {
      const newCell = board[newPosition - 1];
      if (newCell.type === 'snake' || newCell.type === 'ladder') {
        updatePlayerPosition(newCell.to);
        switchTurn();
      } else if (newCell.type === 'trap' || newCell.type === 'boost') {
        setPuzzle({
          type: newCell.type,
          question: newCell.type === 'trap' ? '2 + 2 = ?' : 'What is 2 * 2?',
          answer: '4',
          onSolve: (correct) => {
            if (correct) {
              if (newCell.type === 'boost') {
                updatePlayerPosition(newPosition + 5); // Extra boost
              } else {
                updatePlayerPosition(newPosition);
              }
            } else {
              if (newCell.type === 'trap') {
                updatePlayerPosition(newPosition > 5 ? newPosition - 5 : 1); // Penalty
              } else {
                updatePlayerPosition(newPosition);
              }
            }
            setPuzzle(null);
            switchTurn();
          }
        });
      } else {
        updatePlayerPosition(newPosition);
        switchTurn();
      }
    }
  };

  const switchTurn = () => {
    setActivePlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  }

  const updatePlayerPosition = (newPosition) => {
    setPlayers(prev =>
      prev.map((p, index) =>
        index === activePlayerIndex ? { ...p, position: newPosition } : p
      )
    );
  };

  if (gameState === 'setup') {
    return <SetupScreen onStart={startGame} />;
  }

  return (
    <div className="game-container">
      <h1>AI Ladder: Rise of the Coders</h1>
      <Board board={board} players={players} />
      <div className="controls">
        <Dice onRoll={rollDice} value={diceValue} />
        {!winner && players.length > 0 && <h2>{`P${players[activePlayerIndex].id.replace('player', '')}`}'s Turn</h2>}
      </div>
      {puzzle && <PuzzleModal puzzle={puzzle} />}
      {winner && <WinnerModal winner={winner} onPlayAgain={restartGame} />}
    </div>
  );
};

const SetupScreen = ({ onStart }) => {
    const [numPlayers, setNumPlayers] = useState(null);
    const [playerInfo, setPlayerInfo] = useState([]);

    const handleNumPlayersChange = (num) => {
        setNumPlayers(num);
        setPlayerInfo(Array.from({ length: num }, (_, i) => ({
            id: `player${i + 1}`,
            name: `Player ${i + 1}`,
            color: ['#0000ff', '#ff0000', '#00ff00', '#ffff00'][i]
        })));
    };

    const handleColorChange = (index, color) => {
        const newPlayerInfo = [...playerInfo];
        newPlayerInfo[index].color = color;
        setPlayerInfo(newPlayerInfo);
    };

    const handleStart = () => {
        onStart(numPlayers, playerInfo.map(p => p.color));
    }

    return (
        <div className="setup-screen">
            <h2>Select Number of Players</h2>
            <div className="player-options">
                {[2, 3, 4].map(num => (
                    <button key={num} onClick={() => handleNumPlayersChange(num)}>
                        {num} Players
                    </button>
                ))}
            </div>

            {numPlayers && (
                <div className="player-setup">
                    <h3>Customize Players</h3>
                    {playerInfo.map((player, index) => (
                        <div key={index} className="player-config">
                            <span>{player.name}</span>
                            <input
                                type="color"
                                value={player.color}
                                onChange={(e) => handleColorChange(index, e.target.value)}
                            />
                        </div>
                    ))}
                    <button onClick={handleStart}>Start Game</button>
                </div>
            )}
        </div>
    )
}

const WinnerModal = ({ winner, onPlayAgain }) => {
    return (
        <div className="modal-overlay winner-overlay">
            <div className="modal">
                <h2>{`Player ${winner.id.replace('player', '')} Wins!`}</h2>
                <button onClick={onPlayAgain}>Play Again</button>
            </div>
        </div>
    )
}


const Board = ({ board, players }) => {
  return (
    <div className="board">
      {board.map(cell => (
        <Cell key={cell.number} cell={cell}>
          {players.map(p => p.position === cell.number && <Player key={p.id} player={p} />)}
        </Cell>
      ))}
    </div>
  );
};

const Cell = ({ cell, children }) => {
  return (
    <div className={`cell ${cell.type}`}>
      {cell.number}
      {(cell.type === 'snake' || cell.type === 'ladder') && <span className="goto-text"> &rarr; {cell.to}</span>}
      {children}
    </div>
  );
};

const Player = ({ player }) => {
  return <div className="player" style={{ backgroundColor: player.color }}>{`P${player.id.replace('player', '')}`}</div>;
}

const Dice = ({ onRoll, value }) => {
  return (
    <div className="dice-container">
      <div className="dice" onClick={onRoll}>
        {value}
      </div>
      <button onClick={onRoll}>Roll Dice</button>
    </div>
  );
};

const PuzzleModal = ({ puzzle }) => {
    const [answer, setAnswer] = useState('');

    const handleSubmit = () => {
        puzzle.onSolve(answer === puzzle.answer);
        setAnswer('');
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>{puzzle.type === 'trap' ? 'Trap Cell!' : 'AI Boost!'}</h3>
                <p>{puzzle.question}</p>
                <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    )
}


function App() {
  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;