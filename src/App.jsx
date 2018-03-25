import React, { Component } from 'react';
import update from 'immutability-helper';
import Button from './Button';
import './App.css';


const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const maxTime = 90;
const initialState = {
  history: [{
    players: [maxTime, maxTime],
  }],
  maxTime,
  activePlayerIndex: 0,
  isGameStarted: false,
  isGameFinished: false,
  isConfigVisible: false,
};

class App extends Component {
  static beep(length, frequency = 1000) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0.5;
    oscillator.frequency.value = frequency;
    oscillator.type = 0;

    oscillator.start();

    setTimeout(
      () => { oscillator.stop(); },
      length,
    );
  }

  static shortBeep(frequency, type) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.connect(g);
    o.frequency.value = frequency;
    g.connect(audioCtx.destination);
    o.start(0);
    g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
  }

  static buttonPressedBeep() {
    App.shortBeep(440.0, 'sine');
  }

  constructor(props) {
    super(props);
    this.state = initialState;
  }

  resetGame(seconds) {
    clearInterval(this.interval);

    let newSeconds = seconds;
    if (!newSeconds) {
      newSeconds = 90;
    }

    this.setState({
      maxTime: newSeconds,
      history: [{
        players: [maxTime, maxTime],
      }],
      isGameStarted: false,
      isGameFinished: false,
      isConfigVisible: false,
    });
  }


  tick() {
    const { activePlayerIndex } = this.state;
    const currentIndex = this.state.history.length - 1;
    const current = this.state.history[currentIndex].players.slice();

    let newTime = current[activePlayerIndex] - 1;
    if (newTime <= 0) {
      App.beep(1000);
      newTime = 0;
      this.stopGame();
    } else if (newTime < 10) {
      App.beep(150);
    }

    const newHistory = update(this.state.history, {
      [currentIndex]: { players: { [activePlayerIndex]: { $set: newTime } } },
    });

    this.setState({
      history: newHistory,
    });
  }

  stopGame() {
    clearInterval(this.interval);

    this.setState({
      isGameFinished: true,
    });
  }

  clickButton(playerNumber) {
    if (this.state.isGameFinished) {
      return;
    }

    if (!this.state.isGameStarted) {
      App.buttonPressedBeep();

      this.interval = setInterval(this.tick.bind(this), 1000);
      this.setState({
        isGameStarted: true,
        activePlayerIndex: playerNumber,
      });

      return;
    }

    if (this.playerIsActive(playerNumber)) {
      const history = this.state.history.slice();
      const current = history[history.length - 1];

      App.buttonPressedBeep();

      clearInterval(this.interval);
      this.interval = setInterval(this.tick.bind(this), 1000);
      this.setState({
        activePlayerIndex: (this.state.activePlayerIndex + 1) % 2,
        history: history.concat(current),
      });
    }
  }

  playerIsActive(playerNumber) {
    const { activePlayerIndex } = this.state;
    return activePlayerIndex === playerNumber;
  }

  handleChooseTime(seconds) {
    this.resetGame(seconds);
  }

  renderButton(playerNumber) {
    const history = this.state.history.slice();
    const current = history[history.length - 1];

    return (
      <Button
        value={current.players[playerNumber]}
        isGameFinished={this.state.isGameFinished}
        isGameStarted={this.state.isGameStarted}
        onClick={() => this.clickButton(playerNumber)}
        playerWhite={playerNumber === 0}
        myTurn={this.playerIsActive(playerNumber)}
      />
    );
  }

  renderResetButton(isLeftSide) {
    return (
      <button
        className={`button--reset ${isLeftSide ? 'button--left' : 'button--right'}`}
        onClick={() => this.resetGame(this.state.maxTime)}
      >
        <span className="vertical">
          RESET<br />
          GAME
        </span>
      </button>
    );
  }

  renderConfigButton(isLeftSide) {
    return (
      <button
        className={`button--reset ${isLeftSide ? 'button--left' : 'button--right'}`}
        onClick={() => this.setState({ isConfigVisible: true })}
      >
        <span className="vertical">
          CONFIG
        </span>
      </button>
    );
  }

  renderConfig(visible) {
    return (
      <div className={`config ${visible ? '' : 'hide'}`}>
        {this.renderChooseTimeButton(60)}
        {this.renderChooseTimeButton(75)}
        {this.renderChooseTimeButton(90)}
        {this.renderChooseTimeButton(105)}
        {this.renderChooseTimeButton(120)}
      </div>
    );
  }

  renderChooseTimeButton(seconds) {
    return (
      <button
        className="button--time"
        onClick={() => this.handleChooseTime(seconds)}
      >
        {seconds}
      </button>
    );
  }

  render() {
    return (
      <div className="grid">
        {this.renderButton(0)}
        {this.renderButton(1)}
        {this.renderResetButton(true)}
        {this.renderConfigButton(false)}
        {this.renderConfig(this.state.isConfigVisible)}
      </div>
    );
  }
}


export default App;
