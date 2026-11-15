import { useState } from "react";
import {
  MessageCircle,
  Phone,
  CalendarDays,
  Megaphone,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const items = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "calls", label: "Call log", icon: Phone },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export default function NavigationRail({ onOpenChat }) {
  const [panel, setPanel] = useState(null);

  const selected = items.find((item) => item.id === panel);

  function openSection(id) {
    if (id === "chat") {
      setPanel(null);
      onOpenChat?.();

      const opener = document.querySelector(".composer-opener");

      if (opener) {
        opener.click();
      } else {
        document.getElementById("chat-draft")?.focus();
      }

      return;
    }

    setPanel(id);
  }

  return (
    <>
      <nav className="navigation-rail" aria-label="Workspace navigation">
        {items.map(({ id, label, icon: Icon }) => {
          const active = panel ? panel === id : id === "chat";

          return (
            <button
              key={id}
              type="button"
              className={`rail-button ${active ? "is-active" : ""}`}
              onClick={() => openSection(id)}
              aria-label={label}
              aria-current={active ? "true" : undefined}
              aria-haspopup={id === "chat" ? undefined : "dialog"}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />

              <span className="rail-tooltip" aria-hidden="true">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <Dialog
        open={Boolean(panel)}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent className="rail-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.label}</DialogTitle>

            <DialogDescription>
              {panel === "calls" &&
                "Your call history will appear here when calling is connected."}

              {panel === "calendar" &&
                "Choose a date to view it. Event scheduling is not connected yet."}

              {panel === "announcements" &&
                "Team updates will appear here when announcement publishing is added."}
            </DialogDescription>
          </DialogHeader>

          {panel === "calls" && (
            <div className="rail-empty-state">
              <Phone size={30} aria-hidden="true" />
              <p>No calls yet</p>
            </div>
          )}

          {panel === "calendar" && (
            <div className="rail-calendar">
              <label htmlFor="workspace-date">Select a date</label>
              <input id="workspace-date" type="date" />
            </div>
          )}

          {panel === "announcements" && (
            <div className="rail-empty-state">
              <Megaphone size={30} aria-hidden="true" />
              <p>No announcements yet</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}