import './ColorGuesser.css';
import Slider from './Slider';
import React from "react";

const MIN = 0;
const MAX = 255;

function ColorGuesser() {
  // Target color (what the user is trying to guess)
  const [targetRed, setTargetRed] = React.useState(getRandomIntegerBetween(MIN, MAX));
  const [targetGreen, setTargetGreen] = React.useState(getRandomIntegerBetween(MIN, MAX));
  const [targetBlue, setTargetBlue] = React.useState(getRandomIntegerBetween(MIN, MAX));

  // User's guess
  const [guessRed, setGuessRed] = React.useState(MIN);
  const [guessGreen, setGuessGreen] = React.useState(MIN);
  const [guessBlue, setGuessBlue] = React.useState(MIN);

  // Game state
  const [cheatingMode, setCheatingMode] = React.useState(false);
  const [showingFeedback, setShowingFeedback] = React.useState(false);

  

  const handleGuess = () => {
    setShowingFeedback(true);
  };

  const handleNext = () => {
    setTargetRed(getRandomIntegerBetween(MIN, MAX));
    setTargetGreen(getRandomIntegerBetween(MIN, MAX));
    setTargetBlue(getRandomIntegerBetween(MIN, MAX));
    setGuessRed(MIN);
    setGuessGreen(MIN);
    setGuessBlue(MIN);
    setShowingFeedback(false);
  };

  const onChangeCheatingMode = (e) => {
    setCheatingMode(e.target.checked);
  };

  // Determine if we should show the user's color (in cheating mode or after guess)
  const showUserColor = cheatingMode || showingFeedback;

  return (
    <div className="App">
      <label id="cheating-mode">
        Cheating mode <input type="checkbox" checked={cheatingMode} onChange={onChangeCheatingMode} />
      </label>
      
      <h2>Color Guesser</h2>
      <p>Try to guess the RGB values that make up the target color below:</p>
      
      {/* Target color display */}
      <div id="target-color" style={{backgroundColor: `rgb(${targetRed}, ${targetGreen}, ${targetBlue})`}} />
      
      {/* User's guess display (only shown in cheating mode or after guessing) */}
      {showUserColor && (
        <div id="guess-color" style={{backgroundColor: `rgb(${guessRed}, ${guessGreen}, ${guessBlue})`}} />
      )}
      
      {/* Color sliders */}
      <div id="color-picker">
        <div className="row">
          <span className="component-color-preview" style={{backgroundColor: `rgb(255, 0, 0, ${guessRed/MAX})`}}>Red:</span>
          <Slider min={MIN} max={MAX} startingValue={guessRed} onChange={r => setGuessRed(r)} disabled={showingFeedback} />
        </div>
        <div className="row">
          <span className="component-color-preview" style={{backgroundColor: `rgb(0, 255, 0, ${guessGreen/MAX})`}}>Green:</span>
          <Slider min={MIN} max={MAX} startingValue={guessGreen} onChange={g => setGuessGreen(g)} disabled={showingFeedback} />
        </div>
        <div className="row">
          <span className="component-color-preview" style={{backgroundColor: `rgb(0, 0, 255, ${guessBlue/MAX})`}}>Blue:</span>
          <Slider min={MIN} max={MAX} startingValue={guessBlue} onChange={b => setGuessBlue(b)} disabled={showingFeedback} />
        </div>
      </div>
      
      {/* Feedback display */}
      {showingFeedback && (
        <div className="feedback">
          <p>
            Your guess: rgb({guessRed}, {guessGreen}, {guessBlue}). Actual: <strong>rgb({targetRed}, {targetGreen}, {targetBlue})</strong><br />

          </p>
          <button onClick={handleNext}>Next Color</button>
        </div>
      )}
      
      {/* Guess button */}
      {!showingFeedback && (
        <button className="guess-button" onClick={handleGuess}>Guess</button>
      )}
    </div>
  );
}

// Helper function to get random integer
function getRandomIntegerBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default ColorGuesser;