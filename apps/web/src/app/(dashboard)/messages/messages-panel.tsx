"use client";
import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  role: string;
};
export function MessagesPanel({
  messages,
  currentUserId,
}: {
  messages: Item[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setError(body.error);
    setContent("");
    router.refresh();
  }
  return (
    <div className="content messages-page">
      <div className="page-heading">
        <h1>Nachrichten</h1>
        <p>Kommunikation mit deinem gesamten Team.</p>
      </div>
      <section className="panel message-shell">
        <div className="message-title">
          <div>
            <strong>Team-Chat</strong>
            <span>{messages.length} Nachrichten</span>
          </div>
        </div>
        <div className="message-list">
          {messages.length === 0 ? (
            <div className="empty">
              Starte die erste Unterhaltung mit deinem Team.
            </div>
          ) : (
            messages.map((item) => (
              <div
                className={`message-row ${item.authorId === currentUserId ? "mine" : ""}`}
                key={item.id}
              >
                <span className="message-avatar">
                  {item.authorName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <div className="message-meta">
                    <strong>{item.authorName}</strong>
                    <span>
                      {item.role} ·{" "}
                      {new Date(item.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <p>{item.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form className="message-compose" onSubmit={submit}>
          <textarea
            aria-label="Nachricht"
            maxLength={2000}
            placeholder="Nachricht an das Team schreiben …"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          {error && <span className="auth-error">{error}</span>}
          <button className="btn primary" disabled={busy || !content.trim()}>
            <Send size={16} />
            {busy ? "Senden …" : "Senden"}
          </button>
        </form>
      </section>
    </div>
  );
}
