import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Search,
  Pin,
  X,
  ArrowLeft,
} from "lucide-react";

import { io } from "socket.io-client";
import ChatSidebar from "./ChatSidebar";
import ChatComposer from "./ChatComposer";
import ChatMessage from "./ChatMessage";
import NavigationRail from "./NavigationRail";
import WorkspaceTopbar from "./WorkspaceTopbar";
import "./App.css";

const users = ["Alan", "Bob", "Carol", "Dean", "Elin"];

export default function App() {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [workspaceView, setWorkspaceView] = useState("open");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [assignmentMode, setAssignmentMode] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const messageListRef = useRef(null);
  const socketRef = useRef(null);

  const [clientId] = useState(() => {
    let id = sessionStorage.getItem("chat-client-id");

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("chat-client-id", id);
    }

    return id;
  });


useEffect(() => {
  const socket = io("http://127.0.0.1:3001", {
    reconnection: true,
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    setConnected(true);
    setConnectionError("");
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    setConnected(false);
  });

  socket.on("connect_error", (error) => {
    setConnected(false);
    setConnectionError(error.message);
    console.error("Socket connection error:", error);
  });

  socket.on("messages:history", (history) => {
    setMessages(
      history.map((message) => ({
        ...message,
        isOwn: message.senderId === clientId,
      }))
    );
  });

  socket.on("message:created", (message) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current;
      }

      return [
        ...current,
        {
          ...message,
          isOwn: message.senderId === clientId,
        },
      ];
    });
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [clientId]);


  
const query = search.trim().toLowerCase();

const displayMessages = messages;

const visibleMessages = displayMessages.filter((message) => {
  const name = message.isOwn ? "You" : message.name;

  return (
    message.text.toLowerCase().includes(query) ||
    name.toLowerCase().includes(query)
  );
});

const pinnedMessages = displayMessages.filter(
  (message) => message.pinned
);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  function createMessage(text, extra = {}) {
    return {
      id: crypto.randomUUID(),
      name: assignmentMode
        ? users[Math.floor(Math.random() * users.length)]
        : "You",
      isOwn: !assignmentMode,
      text,
      likes: 0,
      reactions: {},
      pinned: false,
      reported: false,
      ...extra,
    };
  }

async function sendMessage(event, attachments = []) {
  event.preventDefault();

  const text = draft.trim();

  if (!socketRef.current?.connected) {
    setConnectionError("Server disconnected. Your draft is still here.");
    return false;
  }

  if (attachments.length > 0) {
    setConnectionError(
      "Real-time attachments are not connected yet. Remove them to send text."
    );
    return false;
  }

  if (replyTo) {
    setConnectionError(
      "Real-time replies are not connected yet. Cancel the reply to send text."
    );
    return false;
  }

  if (!text) return false;

  setConnectionError("");

  return new Promise((resolve) => {
    socketRef.current
      .timeout(5000)
      .emit(
        "message:send",
        { text, clientId },
        (error, result) => {
          if (error || !result?.ok) {
            setConnectionError(
              result?.error ||
                "Delivery was not confirmed. Check the conversation before retrying."
            );
            resolve(false);
            return;
          }

          setDraft("");
          setSearch("");
          setReplyTo(null);
          resolve(true);
        }
      );
  });
}
  function likeMessage(id) {
  setMessages((current) =>
    current.map((message) =>
      message.id === id
        ? { ...message, liked: !message.liked }
        : message
    )
  );
}

  function reactToMessage(id, emoji) {
  if (emoji === "👍") {
    likeMessage(id);
    return;
  }

  setMessages((current) =>
    current.map((message) => {
      if (message.id !== id) return message;

      const reactions = { ...message.reactions };

      if (reactions[emoji]) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = 1;
      }

      return { ...message, reactions };
    })
  );
}

  function startReply(message) {
    setReplyTo(message);

    // Open the composer if it is collapsed.
    requestAnimationFrame(() => {
      const opener = document.querySelector(".composer-opener");

      if (opener) {
        opener.click();
      } else {
        document.getElementById("chat-draft")?.focus();
      }
    });
  }

  function forwardMessage(original) {
  const forwarded = createMessage(original.text, {
    forwarded: true,
    attachments: original.attachments ?? [],
  });

  setMessages((current) => [...current, forwarded]);
  setSearch("");
}

  function togglePin(id) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, pinned: !message.pinned }
          : message
      )
    );
  }

  function reportMessage(id, reason) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              reported: true,
              reportReason: reason,
            }
          : message
      )
    );
  }

  return (
    <main className="app-shell">
  <WorkspaceTopbar
    view={workspaceView}
    onViewChange={setWorkspaceView}
  />

  {workspaceView === "open" && (
  <NavigationRail onOpenChat={() => setMobileChatOpen(true)} />
)}

  <div
    className={`workspace ${
  mobileChatOpen ? "mobile-chat-open" : "mobile-menu-open"
}`}
    style={workspaceView !== "open" ? { display: "none" } : undefined}
  >
        <div className="sidebar-container">
  <ChatSidebar
    search={search}
    setSearch={setSearch}
    messages={messages}
  />

  <button
    type="button"
    className="mobile-chat-entry"
    onClick={() => setMobileChatOpen(true)}
  >
    <MessageCircle size={24} aria-hidden="true" />

    <span>
      <strong>Team chat</strong>
      <small>Alan, Bob, Carol, Dean & Elin</small>
    </span>

    <span aria-hidden="true">›</span>
  </button>
</div>

        <section className="chat-panel" aria-label="Team chat">
          <header className="chat-header">
            <button
  type="button"
  className="mobile-back-button"
  onClick={() => {
    setMobileChatOpen(false);
    setSearch("");
  }}
  aria-label="Back to chats"
>
  <ArrowLeft size={20} aria-hidden="true" />
</button>
            <div className="team-icon">
              <MessageCircle size={24} aria-hidden="true" />
            </div>

            <div className="chat-heading-copy">
              <h1>Team chat</h1>
              <p className="font-heading">
                {assignmentMode
                  ? "Random sender names · Assignment mode"
                  : "Your messages appear as You"}
              </p>
            </div>

            <label className="assignment-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={assignmentMode}
                onChange={(event) =>
                  setAssignmentMode(event.target.checked)
                }
              />
              <span>Assignment mode</span>
            </label>
          </header>

           <div className="connection-status" role="status">
            {connected ? "● Connected" : "○ Connecting…"}
            {connectionError && (
              <span> — {connectionError}</span>
            )}
          </div>

          {pinnedMessages.length > 0 && (
            <details className="pinned-panel">
              <summary>
                <Pin size={14} aria-hidden="true" />
                {pinnedMessages.length} pinned
                {pinnedMessages.length === 1 ? " message" : " messages"}
              </summary>

              <ul>
                {pinnedMessages.map((message) => (
                  <li key={message.id}>
                    <div>
                      <strong>
                        {message.isOwn ? "You" : message.name}
                      </strong>
                      <p>{message.text}</p>
                    </div>

                    <button
                      type="button"
                      className="message-action"
                      onClick={() => togglePin(message.id)}
                      aria-label="Unpin message"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div
            ref={messageListRef}
            className="message-list"
            role="log"
            aria-label="Messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && (
              <div className="empty-state">
                <MessageCircle size={36} aria-hidden="true" />
                <h2>A conversation starts with hello.</h2>
                <p>Send the first message to get things going.</p>
              </div>
            )}

            {messages.length > 0 && visibleMessages.length === 0 && (
              <div className="empty-state">
                <Search size={32} aria-hidden="true" />
                <h2>No matching messages</h2>
                <p>Try another word or a sender’s name.</p>
              </div>
            )}

            {visibleMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                assignmentMode={assignmentMode}
                onLike={likeMessage}
                onReact={reactToMessage}
                onReply={startReply}
                onForward={forwardMessage}
                onPin={togglePin}
                onReport={reportMessage}
              />
            ))}
          </div>

          {replyTo && (
            <div className="reply-draft" role="status">
              <div>
                <strong>
                  Replying to {replyTo.isOwn ? "You" : replyTo.name}
                </strong>
                <p>{replyTo.text}</p>
              </div>

              <button
                type="button"
                className="message-action"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}

          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={sendMessage}
          />
        </section>
      </div>
    </main>
  );
}