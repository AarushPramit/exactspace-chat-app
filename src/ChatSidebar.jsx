import { Search, Users } from "lucide-react";

const members = ["Alan", "Bob", "Carol", "Dean", "Elin"];

export default function ChatSidebar({ search, setSearch, messages }) {
  return (
    <aside className="chat-sidebar" aria-label="Chat sidebar">
      <div className="sidebar-heading">
        <Users size={22} aria-hidden="true" />
        <h2>Your workspace</h2>
      </div>

      <label className="sidebar-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search messages or names</span>
        <input
          type="search"
          placeholder="Search messages..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="sidebar-section-heading">
        <h3>Team members</h3>
        <span>{members.length}</span>
      </div>

      <ul className="member-list">
        {members.map((name) => {
          const count = messages.filter(
            (message) => message.name === name
          ).length;

          return (
            <li key={name} className="member-card">
              <div className="message-avatar" aria-hidden="true">
                {name[0]}
              </div>

              <div>
                <h4>{name}</h4>
                <p>
                  {count} {count === 1 ? "message" : "messages"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="sidebar-note">
        One shared conversation. Five different voices.
      </p>
    </aside>
  );
}

