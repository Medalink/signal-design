/**
 * A voice note in a message. Controlled, with React as the only writer: the
 * app owns the audio element and passes what it plays, so nothing here makes
 * a sound. Seconds everywhere.
 */
import { createElement as h } from "react";
import { Icon } from "./icons.js";
import { cx } from "./util.js";

const SPEEDS = [1, 1.5, 2];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** 83 -> "1:23"; an hour or more -> "1:02:03". */
function clock(seconds) {
  const total = Math.floor(Math.max(0, seconds) || 0);
  const s = String(total % 60).padStart(2, "0");
  const m = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  return hours > 0 ? `${hours}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function VoiceNote({
  peaks = [],
  duration,
  position = 0,
  playing = false,
  speed = 1,
  onPlayingChange,
  onSeek,
  onSpeedChange,
  seekStep = 5,
  label = "Voice message",
  playLabel = "Play",
  pauseLabel = "Pause",
  seekLabel = "Seek",
  speedLabel = "Playback speed",
  className,
  ...props
}) {
  const length = Math.max(0, duration || 0);
  const at = clamp(position || 0, 0, length);
  const progress = length > 0 ? at / length : 0;
  const started = playing || at > 0;
  const seekFrom = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width > 0) onSeek?.(clamp((event.clientX - box.left) / box.width, 0, 1) * length);
  };
  const onWaveKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const to = {
      ArrowLeft: at - seekStep,
      ArrowDown: at - seekStep,
      ArrowRight: at + seekStep,
      ArrowUp: at + seekStep,
      Home: 0,
      End: length,
    }[event.key];
    if (event.key === " ") onPlayingChange?.(!playing);
    else if (to !== undefined) onSeek?.(clamp(to, 0, length));
    else return;
    event.preventDefault();
  };
  return h(
    "div",
    { role: "group", "aria-label": label, "data-playing": playing ? "" : undefined, className: cx("sd-voice", className), ...props },
    h(
      "button",
      { type: "button", className: "sd-btn sd-btn-icon sd-voice-play", "aria-label": playing ? pauseLabel : playLabel, onClick: () => onPlayingChange?.(!playing) },
      h(Icon, { name: playing ? "pause" : "play" }),
    ),
    h(
      "div",
      {
        className: "sd-voice-wave",
        role: "slider",
        tabIndex: 0,
        dir: "ltr",
        "aria-label": seekLabel,
        "aria-valuemin": 0,
        "aria-valuemax": length,
        "aria-valuenow": Number(at.toFixed(2)),
        "aria-valuetext": `${clock(at)} / ${clock(length)}`,
        style: { "--progress": progress.toFixed(4) },
        onPointerDown(event) {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          seekFrom(event);
        },
        onPointerMove(event) {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFrom(event);
        },
        onKeyDown: onWaveKeyDown,
      },
      peaks.map((peak, i) => h("i", { key: i, style: { "--h": clamp(peak, 0, 1).toFixed(3), "--at": ((i + 0.5) / peaks.length).toFixed(4) } })),
    ),
    h("time", { className: "sd-voice-time", dateTime: `PT${Math.floor(started ? at : length)}S` }, clock(started ? at : length)),
    h(
      "button",
      {
        type: "button",
        className: "sd-voice-speed",
        "aria-label": `${speedLabel} ${speed}×`,
        onClick: () => onSpeedChange?.(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]),
      },
      `${speed}×`,
    ),
  );
}
