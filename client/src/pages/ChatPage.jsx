import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

let socket;

export default function ChatPage() {
  const { roomId, otherId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    socket.emit("user:online", user?._id);
    socket.emit("join", roomId);
    socket.on("message:receive", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("typing:start", ({ userName }) => setTypingUser(userName));
    socket.on("typing:stop", () => setTypingUser(""));
    return () => { socket.emit("leave", roomId); socket.disconnect(); };
  }, [roomId]);

  useEffect(() => {
    Promise.all([
      api.getMessages(roomId),
      otherId && otherId !== "0" ? api.getUser(otherId) : Promise.resolve(null),
      api.getConversations()
    ]).then(([msgs, other, convs]) => {
      setMessages(msgs?.data || []);
      setOtherUser(other);
      setConversations(convs || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [roomId, otherId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = { room: roomId, to: otherId !== "0" ? otherId : undefined, text };
    socket.emit("message:send", { room: roomId, message: { from: { _id: user._id, fullName: user.fullName, avatar: user.avatar }, text, createdAt: new Date() } });
    try { await api.sendMessage(msg); } catch {}
    setText("");
    socket.emit("typing:stop", { room: roomId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing:start", { room: roomId, userName: user?.fullName });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("typing:stop", { room: roomId }), 1500);
  };

  const isGeneral = roomId === "general";

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: "flex" }}>
        {/* Conversations List */}
        <div style={{ width: 260, background: "var(--bg2)", borderRight: "1px solid var(--border)", height: "100vh", overflow: "auto" }}>
          <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>💬 Messages</div>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <Link to="/chat/general/0" style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 8, background: isGeneral ? "var(--bg3)" : "transparent", textDecoration: "none", color: "var(--text)" }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>🌐</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>General Chat</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Community room</div>
              </div>
            </Link>
          </div>
          {conversations.map((c, i) => {
            const p = c.partner;
            const cRoomId = [user._id, p?._id].sort().join("_");
            return (
              <Link key={i} to={`/chat/${cRoomId}/${p?._id}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "var(--text)", background: roomId === cRoomId ? "var(--bg3)" : "transparent" }}>
                <div className="avatar avatar-sm">{p?.avatar ? <img src={p.avatar} alt="" /> : p?.fullName?.[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p?.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMessage}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header */}
          <div style={{ padding: "16px 24px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            {isGeneral ? (
              <>
                <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>🌐</div>
                <div><div style={{ fontWeight: 600 }}>General Chat</div><div style={{ fontSize: 13, color: "var(--text3)" }}>Community discussion room</div></div>
              </>
            ) : (
              <>
                <div className="avatar">{otherUser?.avatar ? <img src={otherUser.avatar} alt="" /> : otherUser?.fullName?.[0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{otherUser?.fullName || "Loading..."}</div>
                  <div style={{ fontSize: 13, color: "var(--text3)" }}>{otherUser?.company || otherUser?.role}</div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1 }}>
            {loading ? <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "auto" }} /></div> :
              messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>No messages yet. Start the conversation! 👋</div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.from?._id === user?._id || m.from === user?._id;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8 }}>
                      {!isMe && <div className="avatar avatar-sm">{m.from?.fullName?.[0]}</div>}
                      <div>
                        {!isMe && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>{m.from?.fullName}</div>}
                        <div className={`message-bubble ${isMe ? "me" : "them"}`}>
                          {m.text}
                          <div className="message-meta">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            }
            {typingUser && <div style={{ color: "var(--text3)", fontSize: 13, fontStyle: "italic" }}>{typingUser} is typing...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input value={text} onChange={handleTyping} placeholder="Type a message..." style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
            <button className="btn btn-primary" onClick={sendMessage} disabled={!text.trim()}>Send →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
