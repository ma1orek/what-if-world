export default function FilmGrainDefs(){
  return (
    <svg className="absolute inset-0 w-0 h-0 pointer-events-none" aria-hidden>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch" result="turb"/>
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.25"/>
        </feComponentTransfer>
      </filter>
    </svg>
  );
}