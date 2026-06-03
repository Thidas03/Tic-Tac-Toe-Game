import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket/socket.js';

function Chat({ roomId, playerSymbol }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [opponentTyping, setOpponentTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emojis list for quick clicks
  const quickEmojis = ['😄', '🔥', '👍', '🎉', '😮', '😢', '😂', '🚀', '💯', '👏'];

  // Scroll to bottom whenever messages list updates or typing state updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, opponentTyping]);

  useEffect(() => {
    // 1. Listen for new messages
    const handleReceiveMessage = (messagePayload) => {
      setMessages((prev) => [...prev, messagePayload]);
    };

    // 2. Listen for opponent typing events
    const handlePlayerTyping = ({ user, isTyping }) => {
      if (user !== playerSymbol) {
        setOpponentTyping(isTyping);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('player_typing', handlePlayerTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('player_typing', handlePlayerTyping);
      
      // Reset typing state on leave
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [playerSymbol]);

  // Handle typing indicator trigger
  useEffect(() => {
    if (!inputText.trim()) {
      // If input cleared, immediately emit false
      socket.emit('typing', { roomId, user: playerSymbol, isTyping: false });
      return;
    }

    // Emit true since user is typing
    socket.emit('typing', { roomId, user: playerSymbol, isTyping: true });

    // Reset timeout on keypress
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // After 1.5 seconds of inactivity, emit false
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, user: playerSymbol, isTyping: false });
    }, 1500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, roomId, playerSymbol]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Emit message to room
    socket.emit('send_message', {
      roomId,
      user: playerSymbol,
      message: inputText.trim()
    });

    // Clear typing timeout and input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', { roomId, user: playerSymbol, isTyping: false });
    setInputText('');
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emoji) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-card">
      <div className="chat-header">Room Chat</div>

      <div className="chat-messages">
        {messages.map((msg, index) => {
          if (msg.isSystem) {
            return (
              <div key={index} className="message-bubble msg-system">
                {msg.message}
              </div>
            );
          }

          const isSelf = msg.user === playerSymbol;
          return (
            <div
              key={index}
              className={`message-bubble ${isSelf ? 'msg-self' : 'msg-opponent'}`}
            >
              <span className="msg-user">Player {msg.user}</span>
              <div>{msg.message}</div>
              <span className="msg-meta">{msg.time}</span>
            </div>
          );
        })}
        {opponentTyping && (
          <div className="typing-container">
            <span>Opponent is typing</span>
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-container">
        {/* Quick Emoji Bar */}
        <div className="emoji-quick-bar">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-btn"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem' }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
