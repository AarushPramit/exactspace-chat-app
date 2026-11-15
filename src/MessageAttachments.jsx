import { useEffect, useState } from "react";
import { X } from "lucide-react";

function AttachmentItem({ item, onRemove }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!item.file) return;

    const preview = URL.createObjectURL(item.file);
    setUrl(preview);

    return () => URL.revokeObjectURL(preview);
  }, [item.file]);

  return (
    <div className="attachment-item">
      {item.kind === "sticker" ? (
        <span className="text-sticker">{item.text}</span>
      ) : (
        <>
          {url && item.kind === "image" && (
            <img src={url} alt={item.name} />
          )}

          {url && item.kind === "audio" && (
            <audio controls src={url} preload="metadata">
              Your browser cannot play this recording.
            </audio>
          )}

          {url && (
            <a href={url} download={item.name}>
              {item.name}
            </a>
          )}
        </>
      )}

      {onRemove && (
        <button
          type="button"
          className="attachment-remove"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function MessageAttachments({ items = [], onRemove }) {
  if (!items.length) return null;

  return (
    <div className="attachment-list">
      {items.map((item) => (
        <AttachmentItem
          key={item.id}
          item={item}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}