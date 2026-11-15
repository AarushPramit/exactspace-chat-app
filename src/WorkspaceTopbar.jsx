import { useEffect, useState } from "react";
import {
  MoreHorizontal,
  Minus,
  Maximize2,
  Minimize2,
  X,
  UserRound,
  LogOut,
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

// A built-in illustrated profile picture; no external image service needed.
const avatarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="40" fill="#dedede"/>
  <path d="M10 80c1-21 13-31 30-31s29 10 30 31" fill="#454545"/>
  <ellipse cx="40" cy="33" rx="16" ry="19" fill="#faf9f6"/>
  <path d="M23 33c-5-18 7-25 18-25 16 0 22 13 16 28l-5-15
    c-8 5-17 5-24 3l-5 9" fill="#454545"/>
  <circle cx="34" cy="34" r="1.5" fill="#454545"/>
  <circle cx="46" cy="34" r="1.5" fill="#454545"/>
  <path d="M35 43q5 4 10 0" fill="none" stroke="#454545"
    stroke-width="2" stroke-linecap="round"/>
</svg>
`;

const avatarUrl =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg)}`;

export default function WorkspaceTopbar({ view, onViewChange }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function updateFullscreen() {
      setFullscreen(Boolean(document.fullscreenElement));
    }

    updateFullscreen();
    document.addEventListener("fullscreenchange", updateFullscreen);

    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  async function toggleFullscreen() {
    setError("");

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        setError("Fullscreen is unavailable in this browser.");
      }
    } catch {
      setError("Your browser could not enter fullscreen.");
    }
  }

  return (
    <>
      <div className="workspace-topbar">
        {view !== "open" && (
          <button
            type="button"
            className="workspace-reopen"
            onClick={() => onViewChange("open")}
          >
            Reopen workspace
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="topbar-control"
              aria-label="Workspace options"
              title="Workspace options"
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <UserRound size={16} />
              View profile
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => onViewChange("closed")}>
  <LogOut size={16} aria-hidden="true" />
  Log out
</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className="topbar-profile"
          onClick={() => setProfileOpen(true)}
          aria-label="View your profile"
          title="Your profile"
        >
          <img src={avatarUrl} alt="" />
        </button>

        <span className="topbar-divider" aria-hidden="true" />

        <button
          type="button"
          className="topbar-control desktop-window-control"
          onClick={() =>
            onViewChange(view === "open" ? "minimized" : "open")
          }
          aria-label={view === "open" ? "Minimize workspace" : "Restore workspace"}
          title={view === "open" ? "Minimize workspace" : "Restore workspace"}
        >
          <Minus size={17} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="topbar-control desktop-window-control"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? (
            <Minimize2 size={15} aria-hidden="true" />
          ) : (
            <Maximize2 size={15} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="topbar-control desktop-window-control"
          onClick={() => setCloseOpen(true)}
          aria-label="Close workspace view"
          title="Close workspace view"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div className="topbar-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="rail-dialog">
          <DialogHeader>
            <DialogTitle>Your profile</DialogTitle>
            <DialogDescription>
              Your local chat profile.
            </DialogDescription>
          </DialogHeader>

          <div className="profile-preview">
            <img src={avatarUrl} alt="Illustrated profile avatar" />
            <h2>Aarush</h2>
            <p>Displayed as “You” when Assignment mode is off.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="rail-dialog">
          <DialogHeader>
            <DialogTitle>Close the workspace view?</DialogTitle>
            <DialogDescription>
              Your messages will remain available in this session.
              You can reopen the workspace from the top bar.
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            className="dialog-submit"
            onClick={() => {
              onViewChange("closed");
              setCloseOpen(false);
            }}
          >
            Close workspace view
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}