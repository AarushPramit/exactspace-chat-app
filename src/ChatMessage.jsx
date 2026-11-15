import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import MessageAttachments from "./MessageAttachments";
import {
  ThumbsUp,
  Plus,
  MoreVertical,
  Reply,
  Forward,
  Pin,
  Flag,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ChatMessage({
  message,
  onLike,
  onReact,
  onReply,
  onForward,
  onPin,
  onReport,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [reason, setReason] = useState("");

  const displayName = message.isOwn ? "You" : message.name;

  function submitReport(event) {
    event.preventDefault();

    if (!reason.trim()) return;

    onReport(message.id, reason.trim());
    setReportOpen(false);
    setReason("");
  }

  return (
    <article
      className={`message-row ${message.isOwn ? "message-own" : ""}`}
    >
      <div className="message-avatar" aria-hidden="true">
        {displayName[0]}
      </div>

      <div className="message-stack">
        <div className="message-bubble">
          <h2>{displayName}</h2>

          {message.pinned && (
            <span className="message-tag">
              <Pin size={12} aria-hidden="true" />
              Pinned
            </span>
          )}

          {message.forwarded && (
            <span className="message-tag">
              <Forward size={12} aria-hidden="true" />
              Forwarded
            </span>
          )}

          {message.replyTo && (
            <blockquote className="reply-preview">
              <strong>{message.replyTo.name}</strong>
              <p>{message.replyTo.text}</p>
            </blockquote>
          )}

          {message.text && (
  <p className="message-text">{message.text}</p>
)}

<MessageAttachments items={message.attachments ?? []} />
        </div>

        <div className="message-actions">
          {/* Like / unlike */}
          <button
            type="button"
            className={`message-action ${
              message.liked ? "is-liked" : ""
            }`}
            onClick={() => onLike(message.id)}
            aria-pressed={Boolean(message.liked)}
            aria-label={
              message.liked ? "Remove like" : "Like message"
            }
            title={message.liked ? "Remove like" : "Like message"}
          >
            <ThumbsUp size={16} aria-hidden="true" />
          </button>

          {/* Emoji reactions already added */}
          {Object.keys(message.reactions ?? {}).map((emoji) => (
  <button
    key={emoji}
    type="button"
    className="reaction-chip is-selected"
    onClick={() => onReact(message.id, emoji)}
    aria-pressed={true}
    aria-label={`Remove ${emoji} reaction`}
    title="Remove reaction"
  >
    <span>{emoji}</span>
  </button>
))}

          {/* Open emoji picker */}
          <button
            type="button"
            className="message-action"
            onClick={() => setEmojiOpen(true)}
            aria-label="Add emoji reaction"
            title="Add reaction"
          >
            <Plus size={17} aria-hidden="true" />
          </button>

          {/* Message options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="message-action"
                aria-label="Message options"
                title="Message options"
              >
                <MoreVertical size={18} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onReply(message)}>
                <Reply size={16} aria-hidden="true" />
                Reply
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setForwardOpen(true)}
              >
                <Forward size={16} aria-hidden="true" />
                Forward
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => onPin(message.id)}>
                <Pin size={16} aria-hidden="true" />
                {message.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setReportOpen(true)}
              >
                <Flag size={16} aria-hidden="true" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {message.reported && (
          <p className="report-status">
            Report saved in this session only.
          </p>
        )}
      </div>

      {/* Emoji picker */}
      <Dialog open={emojiOpen} onOpenChange={setEmojiOpen}>
        <DialogContent forceMount className="emoji-dialog">
          <DialogHeader>
            <DialogTitle>Add a reaction</DialogTitle>
            <DialogDescription>
              Choose an emoji for this message.
            </DialogDescription>
          </DialogHeader>

          <EmojiPicker
            emojiStyle="native"
            lazyLoadEmojis={true}
            width="100%"
            height={360}
            previewConfig={{ showPreview: false }}
            onEmojiClick={(emojiData) => {
              onReact(message.id, emojiData.emoji);
              setEmojiOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Forward confirmation */}
      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward to Team chat?</DialogTitle>
            <DialogDescription>
              This will post a copy in the same shared conversation.
            </DialogDescription>
          </DialogHeader>

          <p className="forward-preview">{message.text}</p>

          <button
            type="button"
            className="dialog-submit"
            onClick={() => {
              onForward(message);
              setForwardOpen(false);
            }}
          >
            Forward message
          </button>
        </DialogContent>
      </Dialog>

      {/* Report form */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>
              This demo saves your report in the current session.
              It does not send it to a moderator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitReport} className="report-form">
            <label htmlFor={`report-${message.id}`}>
              Reason for reporting
            </label>

            <textarea
              id={`report-${message.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the issue..."
              required
              rows={3}
            />

            <button
              type="submit"
              className="dialog-submit"
              disabled={!reason.trim()}
            >
              Save report
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}