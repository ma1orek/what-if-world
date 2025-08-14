export default async function playNarration(summary?: string|null){
  if(!summary) return;
  try{
    const r = await fetch("http://localhost:3002/api/narrate",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: summary })});
    const { audioUrl } = await r.json();
    if (audioUrl) { new Audio(audioUrl).play(); return; }
  }catch{}

  // Web Speech fallback – wybierz męski
  const pickMale = () => {
    const voices = window.speechSynthesis.getVoices();
    const prefer = [
      /English.*Male/i,
      /Google UK English Male/i,
      /Microsoft.*Guy|George|Ryan|Brandon/i,
      /en-US/i
    ];
    for (const re of prefer){
      const v = voices.find(v=>re.test(`${v.name} ${v.voiceURI}`));
      if (v) return v;
    }
    return voices[0] || null;
  };
  const speak = () => {
    const u = new SpeechSynthesisUtterance(summary);
    u.rate = 0.95; u.pitch = 0.9; u.lang = "en-US";
    const v = pickMale(); if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };
  // czasem lista głosów ładuje się asynchronicznie
  if (window.speechSynthesis.getVoices().length) speak();
  else window.speechSynthesis.onvoiceschanged = speak;
}