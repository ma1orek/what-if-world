export default async function playNarration(summary?: string|null){
  if(!summary) return;
  
  // Sprawdź czy to urządzenie mobilne
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try{
    // Wybierz endpoint na podstawie urządzenia
    const endpoint = isMobile ? "/api/narrate" : "http://localhost:3002/api/narrate";
    console.log(`Using ${isMobile ? 'Vercel' : 'localhost'} endpoint for ${isMobile ? 'mobile' : 'desktop'}`);
    
    const r = await fetch(endpoint,{ 
      method:"POST", 
      headers:{ "Content-Type":"application/json" }, 
      body: JSON.stringify({ text: summary })
    });
    const { audioUrl } = await r.json();
    if (audioUrl) { 
      new Audio(audioUrl).play(); 
      return; 
    }
  }catch(error){
    console.log(`ElevenLabs failed on ${isMobile ? 'mobile' : 'desktop'}, falling back to Web Speech API:`, error);
  }

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