export default function Timeline({ events }:{ events:any[] }){
  return (
    <div className="space-y-6">
      {events.map((e,i)=>(
        <div key={i} className="timeline-item border-l-2 border-white/20 pl-4 relative">
          <div className="absolute -left-3 top-0 w-5 h-5 bg-[var(--accent)] rounded-full border-2 border-white"></div>
          <h3 className="font-bold text-lg">{e.year} — {e.title}</h3>
          <p className="text-sm text-white/80">{e.description}</p>
        </div>
      ))}
    </div>
  );
}