import { useState } from "react";

function MessagePanel() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages([...messages, { text, sender: "You" }]);
    setText("");
  };

  return (
    <div className="message-panel">
      <h3>Direct Messages</h3>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className="chat-msg">
            {msg.sender}: {msg.text}
          </div>
        ))}
      </div>

      <input
        placeholder="Type message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default MessagePanel;
