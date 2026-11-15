import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUp,
  MessageCircle,
  Plus,
  Smile,
  Mic,
  Square,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import MessageAttachments from "./MessageAttachments";

const STICKERS = ["HELLO!", "THANK YOU", "NICE!", "WOW!", "ON IT", "BRB"];
const MAX_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 6;

export default function ChatComposer({
  value,
  onChange,
  onSend,
  users = [],
}) {
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState("Emojis");
  const [recordingState, setRecordingState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(-1);

  const composerRef = useRef(null);
  const textareaRef = useRef(null);
  const openerRef = useRef(null);
  const fileRef = useRef(null);
  const gifRef = useRef(null);
  const recorderRef = useRef(null);
  const mountedRef = useRef(false);
  const selectionRef = useRef({ start: 0, end: 0 });

  const reduceMotion = useReducedMotion();
  const busy = recordingState !== "idle" || sending;
  const canSend = Boolean(value.trim() || attachments.length);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const recorder = recorderRef.current;
      if (!recorder) return;

      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;

      if (recorder.state !== "inactive") recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useLayoutEffect(() => {
    if (!expanded || !textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "0px";
    textarea.style.height =
      `${Math.min(160, Math.max(64, textarea.scrollHeight))}px`;
  }, [value, expanded]);

  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (recordingState !== "recording") return;

    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === "recording" && seconds >= 120) {
      stopRecording();
    }
  }, [seconds, recordingState]);

  useEffect(() => {
  if (!expanded || pickerOpen || busy) return;

  function handleOutsideClick(event) {
    if (
      event.target instanceof Node &&
      !composerRef.current?.contains(event.target)
    ) {
      setExpanded(false);
    }
  }

  document.addEventListener("pointerdown", handleOutsideClick);

  return () => {
    document.removeEventListener("pointerdown", handleOutsideClick);
  };
}, [expanded, pickerOpen, busy]);

function handleDraftChange(event) {
  const nextValue = event.target.value;
  const cursor = event.target.selectionStart;

  onChange(nextValue);

  const beforeCursor = nextValue.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)@([a-zA-Z]*)$/);

  if (match) {
    setMentionQuery(match[2]);
    setMentionStart(cursor - match[2].length - 1);
  } else {
    setMentionQuery(null);
    setMentionStart(-1);
  }
}

function selectMention(name) {
  const textarea = textareaRef.current;
  const cursor = textarea?.selectionStart ?? value.length;

  const before = value.slice(0, mentionStart);
  const after = value.slice(cursor);

  const nextValue = `${before}@${name} ${after}`;

  onChange(nextValue);
  setMentionQuery(null);
  setMentionStart(-1);

  restoreFocus(before.length + name.length + 2);
}

  function rememberSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    selectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  function restoreFocus(position) {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea?.focus();

      if (typeof position === "number") {
        textarea?.setSelectionRange(position, position);
      }
    });
  }

  function insertEmoji(emoji) {
    const start = Math.min(selectionRef.current.start, value.length);
    const end = Math.min(selectionRef.current.end, value.length);

    onChange(value.slice(0, start) + emoji + value.slice(end));

    const position = start + emoji.length;
    selectionRef.current = { start: position, end: position };
    setPickerOpen(false);
    restoreFocus(position);
  }

  function addFiles(files, gifsOnly = false) {
    const incoming = Array.from(files);
    const valid = incoming.filter((file) => {
      const isGif =
        file.type === "image/gif" || /\.gif$/i.test(file.name);

      return file.size <= MAX_SIZE && (!gifsOnly || isGif);
    });

    if (valid.length !== incoming.length) {
      setError(
        gifsOnly
          ? "Choose GIF files no larger than 20 MB."
          : "Each file must be 20 MB or smaller."
      );
    } else {
      setError("");
    }

    const newItems = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      kind:
        file.type.startsWith("image/") || /\.gif$/i.test(file.name)
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : "file",
    }));

    setAttachments((current) =>
      [...current, ...newItems].slice(0, MAX_FILES)
    );
  }

  function addSticker(text) {
    setAttachments((current) =>
      [
        ...current,
        {
          id: crypto.randomUUID(),
          kind: "sticker",
          text,
          name: `${text} sticker`,
        },
      ].slice(0, MAX_FILES)
    );

    setPickerOpen(false);
    restoreFocus();
  }

  function removeAttachment(id) {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== id)
    );
  }

  async function startRecording() {
    if (busy || attachments.length >= MAX_FILES) return;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Recording is unavailable. Open the app on localhost or HTTPS.");
      return;
    }

    setError("");
    setRecordingState("requesting");

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      const chunks = [];
      let failed = false;

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = () => {
        failed = true;
        stream.getTracks().forEach((track) => track.stop());

        if (mountedRef.current) {
          setError("The recording failed. Please try again.");
          setRecordingState("idle");
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;

        if (!mountedRef.current) return;

        if (!failed && chunks.length) {
          const type = recorder.mimeType || chunks[0].type;
          const extension = type.includes("mp4")
            ? "m4a"
            : type.includes("ogg")
              ? "ogg"
              : "webm";

          const file = new File(
            chunks,
            `voice-${Date.now()}.${extension}`,
            { type }
          );

          addFiles([file]);
        }

        setRecordingState("idle");
      };

      recorder.start();
      setSeconds(0);
      setRecordingState("recording");
    } catch {
      stream?.getTracks().forEach((track) => track.stop());

      if (mountedRef.current) {
        setRecordingState("idle");
        setError("Could not access your microphone. Check browser permissions.");
      }
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      setRecordingState("stopping");
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  function collapse() {
    setExpanded(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  async function submit(event) {
  event.preventDefault();

  if (!canSend || busy) return;

  setSending(true);

  try {
    const sent = await onSend(event, attachments);

    if (sent === false) return;

    setAttachments([]);
    setError("");
    collapse();
  } catch {
    setError("Could not send. Your draft has been preserved.");
  } finally {
    setSending(false);
  }
}

  const timeLabel =
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="composer-dock">
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <input
        ref={gifRef}
        type="file"
        accept="image/gif,.gif"
        hidden
        onChange={(event) => {
          addFiles(event.target.files, true);
          event.target.value = "";
          setPickerOpen(false);
          restoreFocus();
        }}
      />

      <motion.form
        ref={composerRef}
        className="morph-composer"
        onSubmit={submit}
        initial={false}
        animate={{
          width: expanded ? "100%" : "min(100%, 360px)",
          height: expanded ? "auto" : 56,
          borderRadius: expanded ? 24 : 28,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 30 }
        }
      >
        {!expanded ? (
          <button
            ref={openerRef}
            type="button"
            className="composer-opener"
            onClick={() => setExpanded(true)}
            aria-label="Open message textbox"
          >
            <MessageCircle size={19} aria-hidden="true" />
            <span>Write a message...</span>
            <span className="composer-open-icon">
              <ArrowUp size={18} aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div className="composer-expanded-content">
            <MessageAttachments
              items={attachments}
              onRemove={removeAttachment}
            />

            <label htmlFor="chat-draft" className="sr-only">
              Your message
            </label>

{mentionQuery !== null && (
  <div className="mention-suggestions" role="listbox" aria-label="Mention users">
    {users
      .filter((name) =>
        name.toLowerCase().startsWith(mentionQuery.toLowerCase())
      )
      .map((name) => (
        <button
          key={name}
          type="button"
          className="mention-option"
          role="option"
          aria-selected="false"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => selectMention(name)}
        >
          <span className="mention-avatar">{name[0]}</span>
          <span>{name}</span>
        </button>
      ))}

    {users.filter((name) =>
      name.toLowerCase().startsWith(mentionQuery.toLowerCase())
    ).length === 0 && (
      <p className="mention-empty">No users found</p>
    )}
  </div>
)}


            <textarea
              ref={textareaRef}
              id="chat-draft"
              value={value}
              onChange={handleDraftChange}
              onSelect={rememberSelection}
              placeholder="Write a message..."
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }

                if (
                  event.key === "Escape" &&
                  !canSend &&
                  !busy
                ) {
                  collapse();
                }
              }}
            />

            <div className="composer-toolbar">
              <div className="composer-tools">
                <button
                  type="button"
                  className="composer-tool"
                  aria-label="Attach files"
                  title="Attach files"
                  disabled={busy || attachments.length >= MAX_FILES}
                  onClick={() => fileRef.current?.click()}
                >
                  <Plus size={20} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="composer-tool"
                  aria-label="Emojis, GIFs and stickers"
                  title="Emojis, GIFs and stickers"
                  disabled={busy}
                  onClick={() => {
                    rememberSelection();
                    setPickerOpen(true);
                  }}
                >
                  <Smile size={20} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`composer-tool ${
                    busy ? "recording-active" : ""
                  }`}
                  aria-label={
                    recordingState === "recording"
                      ? "Stop recording"
                      : "Record voice message"
                  }
                  title={
                    recordingState === "recording"
                      ? "Stop recording"
                      : "Record voice message"
                  }
                  disabled={
                    recordingState === "requesting" ||
                    recordingState === "stopping" ||
                    (!busy && attachments.length >= MAX_FILES)
                  }
                  onClick={
                    recordingState === "recording"
                      ? stopRecording
                      : startRecording
                  }
                >
                  {recordingState === "recording" ? (
                    <Square size={17} aria-hidden="true" />
                  ) : (
                    <Mic size={20} aria-hidden="true" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="composer-send"
                aria-label="Send message"
                disabled={!canSend || busy}
              >
                <ArrowUp size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="composer-help" role="status">
              {recordingState === "recording"
                ? `Recording ${timeLabel} · Stop to preview · 2-minute limit`
                : recordingState === "requesting"
                  ? "Waiting for microphone permission..."
                  : recordingState === "stopping"
                    ? "Preparing voice preview..."
                    : "Enter to send · Shift + Enter for a new line"}
            </p>

            {attachments.length > 0 && (
              <p className="composer-help">
                {attachments.length}/{MAX_FILES} attachments · 20 MB each
              </p>
            )}

            {error && <p className="composer-error" role="alert">{error}</p>}
          </div>
        )}
      </motion.form>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent 
          forceMount
          className="emoji-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Emojis, GIFs & stickers</DialogTitle>
            <DialogDescription>
              Insert an emoji or attach a GIF or sticker.
            </DialogDescription>
          </DialogHeader>

          <div className="media-picker-tabs" aria-label="Media categories">
            {["Emojis", "GIFs", "Stickers"].map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={pickerTab === tab}
                onClick={() => setPickerTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div hidden={pickerTab !== "Emojis"}>
  <EmojiPicker
    emojiStyle="native"
    lazyLoadEmojis={true}
    width="100%"
    height={340}
    previewConfig={{ showPreview: false }}
    onEmojiClick={(data) => insertEmoji(data.emoji)}
  />
</div>

          {pickerTab === "GIFs" && (
            <div className="gif-upload-panel">
              <p>Choose an animated GIF from your device.</p>
              <button
                type="button"
                className="dialog-submit"
                disabled={attachments.length >= MAX_FILES}
                onClick={() => gifRef.current?.click()}
              >
                Upload GIF
              </button>
              <p>Online GIF search is not connected yet.</p>
            </div>
          )}

          {pickerTab === "Stickers" && (
            <div className="sticker-grid">
              {STICKERS.map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={attachments.length >= MAX_FILES}
                  onClick={() => addSticker(text)}
                  aria-label={`Attach ${text} sticker`}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}