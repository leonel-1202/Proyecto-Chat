import Avatar from "./Avatar";

export default function ChatItem({ chat, active, onClick }) {
  const last = chat.messages.at(-1);
  const unread = chat.unread || 0;

  return (
    <div
      className={`chatItem ${active ? "active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <Avatar initials={chat.initials} online={chat.online} isGroup={chat.isGroup} />

      <div className="chatItem-info">
        <div className="chatItem-row">
          <div className="chatItem-name">{chat.name}</div>
          {last?.time && <div className="chatItem-time">{last.time}</div>}
        </div>
        <div className="chatItem-bottom">
          <div className="chatItem-preview">
            {chat.isGroup && last?.sender ? `${last.sender}: ` : ""}
            {last?.text ?? ""}
          </div>
          {unread > 0 && (
            <div className="chatItem-badge">{unread > 99 ? "99+" : unread}</div>
          )}
        </div>
      </div>
    </div>
  );
}