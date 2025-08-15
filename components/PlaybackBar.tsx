interface PlaybackBarProps {
  playing: boolean;
  index: number;
  total: number;
  muted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
}

export default function PlaybackBar({ playing, index, total, muted, onPlay, onPause, onNext, onPrev, onRestart, onToggleMute }: PlaybackBarProps){
  return (
    <div className="absolute bottom-5 left-6 right-[460px] flex items-center justify-between glass rounded-[12px] px-4 py-3">
      <div className="text-sm opacity-70">{Math.min(index+1,total)}/{total||0}</div>
      <div className="flex gap-6 items-center">
        <button onClick={onRestart} className="btn">⟲ Restart</button>
        <div className="flex gap-2">
          <button onClick={onPrev} className="btn">⟵ Prev</button>
          {playing
            ? <button onClick={onPause} className="btn btn--accent">⏸ Pause</button>
            : <button onClick={onPlay} className="btn btn--accent">▶ Play</button>}
          <button onClick={onNext} className="btn">Next ⟶</button>
        </div>
      </div>
      <button onClick={onToggleMute} className="btn btn--icon" aria-label="Toggle narration">
        {muted
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5zM19 9l-6 6M13 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M17 7a7 7 0 010 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
      </button>
    </div>
  );
}