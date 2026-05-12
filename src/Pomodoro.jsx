import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────

const DEFAULT_MODES = [
  { key:"focus",  label:"Focus",       minutes:25, color:"#34d399", glow:"rgba(52,211,153,.35)",  pill:"rgba(52,211,153,.12)",  border:"rgba(52,211,153,.28)"  },
  { key:"short",  label:"Short Break", minutes:5,  color:"#60a5fa", glow:"rgba(96,165,250,.35)",  pill:"rgba(96,165,250,.12)",  border:"rgba(96,165,250,.28)"  },
  { key:"long",   label:"Long Break",  minutes:15, color:"#a78bfa", glow:"rgba(167,139,250,.35)", pill:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.28)" },
];

// Feature 6: Categorized wallpapers
const WALLPAPER_CATEGORIES = {
  "None": [
    { label:"None", value:"none", preview:"#07070f" },
  ],
  "Nature": [
    { label:"Forest",    value:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80", preview:"#2d4a2d" },
    { label:"Ocean",     value:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80", preview:"#1a3a5c" },
    { label:"Mountains", value:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80", preview:"#3a3a4a" },
    { label:"Desert",    value:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80", preview:"#8b6347" },
  ],
  "Dark": [
    { label:"City Night", value:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80", preview:"#1a1a2e" },
    { label:"Aurora",     value:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80", preview:"#0d2137" },
  ],
  "Coffee": [
    { label:"Coffee Shop", value:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80", preview:"#3b2a1a" },
    { label:"Café Books",  value:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80", preview:"#4a3520" },
  ],
  "Rain": [
    { label:"Rain Window", value:"https://images.unsplash.com/photo-1501691223387-dd0500403074?w=1600&q=80", preview:"#2a3a4a" },
    { label:"Storm",       value:"https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1600&q=80", preview:"#1e2a35" },
  ],
  "Space": [
    { label:"Nebula",  value:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80", preview:"#0d0520" },
    { label:"Cosmos",  value:"https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600&q=80", preview:"#060610" },
  ],
  "Minimal": [
    { label:"Concrete", value:"https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80", preview:"#2a2a2a" },
    { label:"Gradient", value:"https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80", preview:"#1a1a3e" },
  ],
};

// All wallpapers flat list for finding by value
const ALL_WALLPAPERS = Object.values(WALLPAPER_CATEGORIES).flat();

// Feature 9: Ambient sounds
const AMBIENT_SOUNDS = [
  { key:"rain",      label:"🌧 Rain",      src:"https://cdn.freesound.org/previews/346/346170_5121236-lq.mp3" },
  { key:"thunder",   label:"⛈ Thunder",   src:"https://cdn.freesound.org/previews/398/398735_7364899-lq.mp3" },
  { key:"cafe",      label:"☕ Café",      src:"https://cdn.freesound.org/previews/537/537161_7723148-lq.mp3" },
  { key:"fireplace", label:"🔥 Fire",      src:"https://cdn.freesound.org/previews/476/476521_9509445-lq.mp3" },
  { key:"keyboard",  label:"⌨ Keys",      src:"https://cdn.freesound.org/previews/242/242401_4495061-lq.mp3" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(s){ return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function parseYouTubeId(url){
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /music\.youtube\.com\/watch\?v=([^&#]+)/,
  ];
  for(const p of patterns){ const m = url.match(p); if(m) return m[1]; }
  if(/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function parseSpotifyEmbed(url){
  const m = url.match(/spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/);
  if(m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
  return null;
}

// Debounce helper for localStorage writes
function debounce(fn, ms){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

// Feature 8: Extract dominant color from image (CSS-based approximation)
function getWallpaperAccent(wallpaperValue){
  if(wallpaperValue === "none") return null;
  const wp = ALL_WALLPAPERS.find(w => w.value === wallpaperValue);
  if(!wp || !wp.preview) return null;
  return wp.preview; // use preview color as accent seed
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function Ring({ pct, size, stroke, color, accentColor }){
  const r = (size - stroke*2) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct/100)*c;
  const ringColor = accentColor || color;
  return(
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block" }}>
      <defs>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        filter="url(#ring-glow)"
        style={{ transition:"stroke-dashoffset 0.5s ease, stroke 0.6s ease" }}/>
    </svg>
  );
}

// Feature 5: Lo-fi audio visualizer bars
function Visualizer({ active, color }){
  const bars = [3,6,9,5,8,4,7,3,6,9,5,8,4,7,3,6];
  return(
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:18, opacity: active ? 0.85 : 0.2, transition:"opacity 0.4s ease" }}>
      {bars.map((h,i)=>(
        <div key={i} style={{
          width:2, borderRadius:2,
          background: color,
          height: active ? `${h+2}px` : "3px",
          animation: active ? `vizBar${i%4} ${0.8+i*0.07}s ease-in-out infinite alternate` : "none",
          transition:"height 0.3s ease",
        }}/>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Pomodoro({ onNavigate }){
  // ── Core timer state ──
  const [modes,    setModes]    = useState(() => {
    try{ const s=localStorage.getItem("pomo_modes"); return s ? JSON.parse(s) : DEFAULT_MODES; }catch{ return DEFAULT_MODES; }
  });
  const [modeIdx,  setModeIdx]  = useState(() => {
    try{ return Number(localStorage.getItem("pomo_modeIdx"))||0; }catch{ return 0; }
  });
  const [seconds,  setSeconds]  = useState(()=>{
    try{
      const m=localStorage.getItem("pomo_modes");
      const idx=Number(localStorage.getItem("pomo_modeIdx"))||0;
      const parsed=m?JSON.parse(m):DEFAULT_MODES;
      return (parsed[idx]||DEFAULT_MODES[0]).minutes*60;
    }catch{ return DEFAULT_MODES[0].minutes*60; }
  });
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const [cycles,   setCycles]   = useState(0);
  const [log,      setLog]      = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editVals, setEditVals] = useState({ focus:25, short:5, long:15 });

  // ── Wallpaper state (Feature 1 + 4 + 7) ──
  const [wallpaper,     setWallpaper]     = useState(()=>{ try{ return localStorage.getItem("pomo_wallpaper")||"none"; }catch{ return "none"; } });
  const [customWpUrl,   setCustomWpUrl]   = useState(()=>{ try{ return localStorage.getItem("pomo_customWp")||""; }catch{ return ""; } });
  const [wpOverlay,     setWpOverlay]     = useState(()=>{ try{ return Number(localStorage.getItem("pomo_overlay"))||0.55; }catch{ return 0.55; } });
  const [showWpPanel,   setShowWpPanel]   = useState(false);
  const [wpInputVal,    setWpInputVal]    = useState("");
  const [wpCategory,    setWpCategory]    = useState("Nature");

  // Feature 1: Cinematic transition state
  const [prevWallpaper, setPrevWallpaper] = useState("none");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextWpLoaded, setNextWpLoaded]   = useState(true);

  // Feature 7: Video wallpaper
  const [videoWpUrl, setVideoWpUrl]     = useState(()=>{ try{ return localStorage.getItem("pomo_videoWp")||""; }catch{ return ""; } });
  const [videoInputVal, setVideoInputVal] = useState("");

  const fileInputRef  = useRef(null);
  const videoInputRef = useRef(null);

  // ── Music state (Feature 3 + 4) ──
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [musicTab,       setMusicTab]       = useState(()=>{ try{ return localStorage.getItem("pomo_musicTab")||"spotify"; }catch{ return "spotify"; } });
  const [spotifyInput,   setSpotifyInput]   = useState("");
  const [ytInput,        setYtInput]        = useState("");
  const [spotifyEmbed,   setSpotifyEmbed]   = useState(()=>{ try{ return localStorage.getItem("pomo_spotifyEmbed")||""; }catch{ return ""; } });
  const [ytId,           setYtId]           = useState(()=>{ try{ return localStorage.getItem("pomo_ytId")||""; }catch{ return ""; } });
  const [musicMinimized, setMusicMinimized] = useState(()=>{ try{ return localStorage.getItem("pomo_musicMin")==="1"; }catch{ return false; } });

  // Feature 10: Draggable floating player
  const [playerPos,  setPlayerPos]  = useState(()=>{ try{ const s=localStorage.getItem("pomo_playerPos"); return s?JSON.parse(s):{right:20,bottom:20}; }catch{ return {right:20,bottom:20}; } });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset   = useRef({x:0,y:0});
  const playerRef    = useRef(null);

  // Feature 9: Ambient sounds
  const [ambientKey,    setAmbientKey]    = useState("");
  const [ambientVol,    setAmbientVol]    = useState(0.4);
  const [ambientPlaying,setAmbientPlaying]= useState(false);
  const ambientAudioRef = useRef(null);

  // Feature 8: Theme accent from wallpaper
  const [accentColor, setAccentColor] = useState(null);

  // ── Refs ──
  const intervalRef = useRef(null);

  // ── Computed ──
  const mode     = modes[modeIdx];
  const total    = mode.minutes * 60;
  const pct      = ((total - seconds) / total) * 100;
  const ringSize = Math.min(260, (typeof window !== "undefined" ? window.innerWidth : 400) - 80);
  const hasMusic = spotifyEmbed || ytId;

  // Effective colors with accent override (Feature 8)
  const effectiveGlow   = accentColor ? `${accentColor}55` : mode.glow;
  const effectiveBorder = accentColor ? `${accentColor}44` : mode.border;
  const effectivePill   = accentColor ? `${accentColor}18` : mode.pill;

  // ── Feature 4: Debounced localStorage writes ──
  const saveToLS = useCallback(debounce((key, val) => {
    try{ localStorage.setItem(key, typeof val === "object" ? JSON.stringify(val) : String(val)); }catch{}
  }, 300), []);

  useEffect(()=>{ saveToLS("pomo_wallpaper",  wallpaper);     },[wallpaper]);
  useEffect(()=>{ saveToLS("pomo_customWp",   customWpUrl);   },[customWpUrl]);
  useEffect(()=>{ saveToLS("pomo_overlay",    wpOverlay);     },[wpOverlay]);
  useEffect(()=>{ saveToLS("pomo_videoWp",    videoWpUrl);    },[videoWpUrl]);
  useEffect(()=>{ saveToLS("pomo_musicTab",   musicTab);      },[musicTab]);
  useEffect(()=>{ saveToLS("pomo_spotifyEmbed",spotifyEmbed); },[spotifyEmbed]);
  useEffect(()=>{ saveToLS("pomo_ytId",       ytId);          },[ytId]);
  useEffect(()=>{ saveToLS("pomo_musicMin",   musicMinimized?"1":"0"); },[musicMinimized]);
  useEffect(()=>{ saveToLS("pomo_playerPos",  playerPos);     },[playerPos]);
  useEffect(()=>{ saveToLS("pomo_modes",      modes);         },[modes]);
  useEffect(()=>{ saveToLS("pomo_modeIdx",    modeIdx);       },[modeIdx]);

  // ── Feature 8: Extract accent color ──
  useEffect(()=>{
    if(wallpaper === "none"){ setAccentColor(null); return; }
    const accent = getWallpaperAccent(wallpaper);
    if(accent){
      // Smooth transition: set after short delay
      const t = setTimeout(()=>setAccentColor(accent), 300);
      return ()=>clearTimeout(t);
    }
  },[wallpaper]);

  // ── Feature 1: Cinematic wallpaper transition ──
  function transitionWallpaper(newVal){
    if(newVal === wallpaper) return;
    if(newVal === "none"){ setPrevWallpaper(wallpaper); setWallpaper(newVal); return; }

    setIsTransitioning(true);
    setPrevWallpaper(wallpaper);
    setNextWpLoaded(false);

    const img = new Image();
    img.onload = ()=>{
      setNextWpLoaded(true);
      setWallpaper(newVal);
      setTimeout(()=>{ setIsTransitioning(false); setPrevWallpaper("none"); }, 700);
    };
    img.onerror = ()=>{
      setNextWpLoaded(true);
      setWallpaper(newVal);
      setIsTransitioning(false);
    };
    img.src = newVal;
  }

  // ── Timer logic ──
  useEffect(()=>{
    if(running){
      intervalRef.current = setInterval(()=>{
        setSeconds(s=>{
          if(s<=1){ clearInterval(intervalRef.current); setRunning(false); handleComplete(); return 0; }
          return s-1;
        });
      },1000);
    } else { clearInterval(intervalRef.current); }
    return ()=>clearInterval(intervalRef.current);
  },[running, modeIdx]);

  // ── Feature 3: Intelligent Focus Music Mode ──
  // musicMinimized auto-expands when focus starts, dims on pause
  useEffect(()=>{
    if(running && modeIdx === 0 && hasMusic){
      setMusicMinimized(false); // auto-expand on focus start
    }
  },[running, modeIdx]);

  function handleComplete(){
    const now = new Date().toLocaleTimeString("en-IN",{ hour:"2-digit", minute:"2-digit" });
    if(modeIdx===0){
      const newSessions = sessions+1;
      setSessions(newSessions);
      setLog(l=>[`✓ Focus session — ${now}`,...l].slice(0,20));
      if(newSessions%4===0){ setCycles(c=>c+1); switchMode(2); }
      else switchMode(1);
    } else {
      setLog(l=>[`☕ Break ended — ${now}`,...l].slice(0,20));
      switchMode(0);
    }
  }

  function switchMode(idx){ setModeIdx(idx); setSeconds(modes[idx].minutes*60); setRunning(false); }
  function reset(){ setRunning(false); setSeconds(mode.minutes*60); }
  function skipToNext(){ setRunning(false); switchMode(modeIdx===0?1:0); }

  function saveSettings(){
    const updated=[
      { ...modes[0], minutes:Math.max(1,Math.min(90,Number(editVals.focus))) },
      { ...modes[1], minutes:Math.max(1,Math.min(30,Number(editVals.short))) },
      { ...modes[2], minutes:Math.max(1,Math.min(60,Number(editVals.long)))  },
    ];
    setModes(updated);
    setSeconds(updated[modeIdx].minutes*60);
    setRunning(false);
    setShowEdit(false);
  }

  function clampEdit(key,val){ setEditVals(e=>({...e,[key]:parseInt(val)||1})); }
  function openEdit(){
    setEditVals({ focus:modes[0].minutes, short:modes[1].minutes, long:modes[2].minutes });
    setShowEdit(true);
  }

  // ── Wallpaper handlers ──
  function applyPreset(val){ transitionWallpaper(val); setVideoWpUrl(""); }
  function applyCustomUrl(){
    if(wpInputVal.trim()){ transitionWallpaper(wpInputVal.trim()); setCustomWpUrl(wpInputVal.trim()); setVideoWpUrl(""); }
  }
  function handleFileUpload(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => { transitionWallpaper(ev.target.result); setCustomWpUrl(ev.target.result); setVideoWpUrl(""); };
    reader.readAsDataURL(file);
  }
  // Feature 7: video wallpaper handler
  function applyVideoWp(){
    if(videoInputVal.trim()){ setVideoWpUrl(videoInputVal.trim()); setWallpaper("none"); }
  }
  function handleVideoUpload(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    setVideoWpUrl(url); setWallpaper("none");
  }

  // ── Music handlers ──
  function loadSpotify(){
    const embed = parseSpotifyEmbed(spotifyInput);
    if(embed){ setSpotifyEmbed(embed); setMusicMinimized(false); }
    else alert("Paste a valid Spotify link (track, playlist, album, artist, or episode).");
  }
  function loadYouTube(){
    const id = parseYouTubeId(ytInput);
    if(id){ setYtId(id); setMusicMinimized(false); }
    else alert("Paste a valid YouTube or YT Music link, or an 11-character video ID.");
  }
  function clearMusic(){ setSpotifyEmbed(""); setYtId(""); }

  // ── Feature 9: Ambient sounds ──
  useEffect(()=>{
    if(!ambientAudioRef.current) return;
    ambientAudioRef.current.volume = ambientVol;
  },[ambientVol]);

  function toggleAmbient(key){
    const sound = AMBIENT_SOUNDS.find(s=>s.key===key);
    if(!sound) return;
    if(ambientKey === key && ambientPlaying){
      ambientAudioRef.current?.pause();
      setAmbientPlaying(false);
    } else {
      if(ambientAudioRef.current){
        ambientAudioRef.current.pause();
        ambientAudioRef.current.src = sound.src;
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = ambientVol;
        ambientAudioRef.current.play().catch(()=>{});
      }
      setAmbientKey(key);
      setAmbientPlaying(true);
    }
  }

  // ── Feature 10: Draggable player ──
  function onPlayerMouseDown(e){
    if(e.target.tagName === "BUTTON" || e.target.tagName === "IFRAME") return;
    e.preventDefault();
    const rect = playerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }

  useEffect(()=>{
    if(!isDragging) return;
    function onMove(e){
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      const maxX = window.innerWidth  - (playerRef.current?.offsetWidth  || 300) - 10;
      const maxY = window.innerHeight - (playerRef.current?.offsetHeight || 200) - 10;
      const cx = Math.max(10, Math.min(x, maxX));
      const cy = Math.max(10, Math.min(y, maxY));
      setPlayerPos({ left: cx, top: cy, right:"auto", bottom:"auto" });
    }
    function onUp(){
      setIsDragging(false);
      // corner snap
      if(!playerRef.current) return;
      const rect = playerRef.current.getBoundingClientRect();
      const cx = rect.left, cy = rect.top;
      const W = window.innerWidth, H = window.innerHeight;
      const snapR = cx + rect.width  > W/2;
      const snapB = cy + rect.height > H/2;
      setPlayerPos({
        left:  snapR ? "auto" : 20,
        right: snapR ? 20     : "auto",
        top:   snapB ? "auto" : 20,
        bottom:snapB ? 20     : "auto",
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return ()=>{ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
  },[isDragging]);

  // ── Styles ──
  const card = {
    background: wallpaper === "none" && !videoWpUrl
      ? "#0f0f1c"
      : `rgba(10,10,22,${0.72 + wpOverlay*0.2})`,
    borderRadius:20,
    border:"1px solid rgba(255,255,255,.07)",
    marginBottom:12,
    backdropFilter: (wallpaper !== "none" || videoWpUrl) ? "blur(18px)" : "none",
    WebkitBackdropFilter: (wallpaper !== "none" || videoWpUrl) ? "blur(18px)" : "none",
    boxShadow: (wallpaper !== "none" || videoWpUrl) ? "0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)" : "none",
  };

  const glassCard = {
    ...card,
    background: (wallpaper !== "none" || videoWpUrl)
      ? `rgba(8,8,20,${0.68 + wpOverlay*0.22})`
      : "#0f0f1c",
    border:`1px solid rgba(255,255,255,.09)`,
  };

  const btnBase = {
    cursor:"pointer", fontFamily:"'Outfit',sans-serif",
    outline:"none", transition:"all .15s",
  };

  const panelStyle = {
    position:"fixed", inset:0, zIndex:200,
    background:"rgba(0,0,0,.82)", backdropFilter:"blur(14px)",
    display:"flex", alignItems:"center", justifyContent:"center",
    padding:20, animation:"overlayIn .2s ease both",
  };

  const hasBg = wallpaper !== "none" || !!videoWpUrl;

  // Focus music opacity (Feature 3)
  const playerOpacity = running && modeIdx === 0 ? 1 : 0.75;

  return(
    <div style={{
      minHeight:"100vh",
      background: !hasBg ? "#07070f" : undefined,
      fontFamily:"'Outfit',sans-serif", color:"#fff",
      width:"100%", overflowX:"hidden",
      position:"relative",
    }}>

      {/* Hidden audio for ambient sounds */}
      <audio ref={ambientAudioRef} loop preload="none" style={{ display:"none" }}/>

      {/* Feature 7: Video wallpaper */}
      {videoWpUrl && (
        <video
          autoPlay muted loop playsInline
          style={{
            position:"fixed", inset:0, zIndex:0,
            width:"100%", height:"100%",
            objectFit:"cover",
            transform:"translateZ(0)", // GPU accelerated
          }}
          src={videoWpUrl}
        />
      )}

      {/* Feature 1: Cinematic layered wallpaper */}
      {/* Previous wallpaper layer (fades out) */}
      {prevWallpaper !== "none" && isTransitioning && (
        <div style={{
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
          backgroundImage:`url("${prevWallpaper}")`,
          backgroundSize:"cover", backgroundPosition:"center",
          backgroundAttachment:"fixed",
          opacity: isTransitioning ? 0 : 1,
          transition:"opacity 600ms ease",
          transform:"translateZ(0)",
        }}/>
      )}
      {/* Current wallpaper layer (fades in) */}
      {wallpaper !== "none" && (
        <div style={{
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
          backgroundImage:`url("${wallpaper}")`,
          backgroundSize:"cover", backgroundPosition:"center",
          backgroundAttachment:"fixed",
          opacity: nextWpLoaded ? 1 : 0,
          transition:"opacity 600ms ease",
          transform:"translateZ(0)",
          willChange:"opacity",
        }}/>
      )}

      {/* Wallpaper overlay */}
      {hasBg && (
        <div style={{
          position:"fixed", inset:0, zIndex:1, pointerEvents:"none",
          background:`rgba(7,7,15,${wpOverlay})`,
          transition:"background 0.4s ease",
        }}/>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{width:100%;overflow-x:hidden;}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn    {from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideUp  {from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vizBar0{from{height:3px}to{height:14px}}
        @keyframes vizBar1{from{height:3px}to{height:10px}}
        @keyframes vizBar2{from{height:3px}to{height:16px}}
        @keyframes vizBar3{from{height:3px}to{height:8px}}
        .fu {animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;}
        .fu1{animation-delay:.06s} .fu2{animation-delay:.12s}
        .fu3{animation-delay:.18s} .fu4{animation-delay:.24s}
        .pop{animation:popIn .35s cubic-bezier(.34,1.56,.64,1) both;}
        .pulse-dot{animation:pulse 1.4s ease infinite;}
        .ctrl:hover{filter:brightness(1.2);transform:scale(1.04);}
        .ctrl:active{transform:scale(.96);}
        .mode-tab:hover{opacity:.85;}
        .log-row{animation:fadeUp .25s ease both;}
        .icon-btn:hover{background:rgba(255,255,255,.08)!important;color:#fff!important;}
        .wp-preset:hover{transform:scale(1.06);box-shadow:0 0 0 2px rgba(255,255,255,.3);}
        .wp-preset{transition:all .15s;cursor:pointer;}
        .amb-btn:hover{filter:brightness(1.2);}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{opacity:1;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#1f1f35;border-radius:4px;}
        .music-float{animation:slideUp .3s cubic-bezier(.22,1,.36,1) both;}
        .player-drag{cursor:grab;user-select:none;}
        .player-drag:active{cursor:grabbing;}
      `}</style>

      {/* ═══ TOPBAR ═══ */}
      <header style={{
        position:"sticky", top:0, zIndex:50,
        background: hasBg
          ? `rgba(7,7,15,${0.82 + wpOverlay*0.1})`
          : "rgba(7,7,15,.88)",
        backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,.06)",
        display:"flex", alignItems:"center", gap:10,
        padding:"0 16px", height:56,
      }}>
        <button className="ctrl" onClick={()=>onNavigate("dashboard")} style={{
          ...btnBase, width:36, height:36, borderRadius:10,
          background:"rgba(255,255,255,.04)",
          border:"1px solid rgba(255,255,255,.08)",
          color:"rgba(255,255,255,.45)", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>←</button>

        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.6px",
            background:"linear-gradient(100deg,#a78bfa 0%,#f472b6 55%,#fb923c 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            CollaDO
          </span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontWeight:600, letterSpacing:"0.12em" }}>.focus</span>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          {sessions > 0 && (
            <div style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700,
              background:"rgba(52,211,153,.12)", border:"1px solid rgba(52,211,153,.28)", color:"#34d399" }}>
              {sessions} done ✓
            </div>
          )}
          <button className="icon-btn" onClick={()=>setShowMusicPanel(p=>!p)} style={{
            ...btnBase, padding:"5px 11px", borderRadius:9, fontSize:12, fontWeight:600,
            background: hasMusic ? "rgba(250,179,86,.1)" : "rgba(255,255,255,.04)",
            border: hasMusic ? "1px solid rgba(250,179,86,.3)" : "1px solid rgba(255,255,255,.09)",
            color: hasMusic ? "#fab356" : "rgba(255,255,255,.38)",
            display:"flex", alignItems:"center", gap:5,
          }}>
            🎵 Music {hasMusic ? "●" : ""}
          </button>
          <button className="icon-btn" onClick={()=>setShowWpPanel(p=>!p)} style={{
            ...btnBase, padding:"5px 11px", borderRadius:9, fontSize:12, fontWeight:600,
            background: hasBg ? "rgba(167,139,250,.1)" : "rgba(255,255,255,.04)",
            border: hasBg ? "1px solid rgba(167,139,250,.3)" : "1px solid rgba(255,255,255,.09)",
            color: hasBg ? "#a78bfa" : "rgba(255,255,255,.38)",
            display:"flex", alignItems:"center", gap:5,
          }}>
            🖼 Wallpaper
          </button>
          <button className="ctrl" onClick={openEdit} style={{
            ...btnBase, padding:"5px 12px", borderRadius:9, fontSize:12, fontWeight:600,
            background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)",
            color:"rgba(255,255,255,.38)",
          }}>Edit timer</button>
        </div>
      </header>

      {/* ═══ WALLPAPER PANEL ═══ */}
      {showWpPanel && (
        <div style={panelStyle} onClick={()=>setShowWpPanel(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:500, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)", maxHeight:"90vh", overflowY:"auto",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>🖼 Wallpaper</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Personalize your focus space</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none", color:"rgba(255,255,255,.2)", fontSize:18 }}
                onClick={()=>setShowWpPanel(false)}>✕</button>
            </div>

            {/* Feature 6: Category tabs */}
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
              {Object.keys(WALLPAPER_CATEGORIES).map(cat=>(
                <button key={cat} style={{
                  ...btnBase, padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600,
                  background: wpCategory===cat ? "rgba(167,139,250,.2)" : "rgba(255,255,255,.04)",
                  border: wpCategory===cat ? "1px solid rgba(167,139,250,.4)" : "1px solid rgba(255,255,255,.08)",
                  color: wpCategory===cat ? "#a78bfa" : "rgba(255,255,255,.4)",
                }} onClick={()=>setWpCategory(cat)}>{cat}</button>
              ))}
            </div>

            {/* Presets grid for selected category */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
              {WALLPAPER_CATEGORIES[wpCategory].map(wp=>(
                <div key={wp.label} className="wp-preset" onClick={()=>applyPreset(wp.value)}
                  style={{
                    borderRadius:12, overflow:"hidden", aspectRatio:"16/9", position:"relative",
                    backgroundImage: wp.value !== "none" ? `url("${wp.value}")` : undefined,
                    backgroundSize:"cover", backgroundPosition:"center",
                    background: wp.value === "none" ? wp.preview : undefined,
                    border: wallpaper===wp.value ? "2px solid #a78bfa" : "2px solid transparent",
                  }}>
                  <div style={{
                    position:"absolute", inset:0,
                    background: wp.value==="none" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.35)",
                    display:"flex", alignItems:"flex-end", padding:4,
                  }}>
                    <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.8)" }}>{wp.label}</span>
                  </div>
                  {wallpaper===wp.value && (
                    <div style={{ position:"absolute", top:4, right:4, width:14, height:14,
                      background:"#a78bfa", borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900 }}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom URL */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Custom Image URL</p>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              <input type="text" placeholder="https://example.com/image.jpg"
                value={wpInputVal} onChange={e=>setWpInputVal(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&applyCustomUrl()}
                style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                  background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                  color:"#fff", outline:"none", fontFamily:"inherit" }}/>
              <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none",
                color:"#fff", fontWeight:700, fontSize:12 }}
                onClick={applyCustomUrl}>Apply</button>
            </div>

            {/* Feature 7: Video wallpaper */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Video Wallpaper (mp4 / webm)</p>
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              <input type="text" placeholder="https://example.com/video.mp4"
                value={videoInputVal} onChange={e=>setVideoInputVal(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&applyVideoWp()}
                style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                  background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                  color:"#fff", outline:"none", fontFamily:"inherit" }}/>
              <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none",
                color:"#fff", fontWeight:700, fontSize:12 }}
                onClick={applyVideoWp}>Apply</button>
            </div>
            <button style={{ ...btnBase, width:"100%", padding:"10px 16px", borderRadius:10,
              background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.15)",
              color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, marginBottom:14 }}
              onClick={()=>videoInputRef.current?.click()}>
              🎬 Upload video file (MP4, WEBM)
            </button>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm"
              style={{ display:"none" }} onChange={handleVideoUpload}/>

            {/* File upload */}
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              color:"rgba(255,255,255,.3)", marginBottom:8 }}>Upload Image from Device</p>
            <button style={{ ...btnBase, width:"100%", padding:"11px 16px", borderRadius:10,
              background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.15)",
              color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600, marginBottom:18 }}
              onClick={()=>fileInputRef.current?.click()}>
              📁 Choose image file (JPG, PNG, WEBP)
            </button>
            <input ref={fileInputRef} type="file" accept="image/*"
              style={{ display:"none" }} onChange={handleFileUpload}/>

            {/* Overlay darkness */}
            {hasBg && (
              <>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
                  color:"rgba(255,255,255,.3)", marginBottom:8 }}>
                  Overlay Darkness — {Math.round(wpOverlay*100)}%
                </p>
                <input type="range" min={0} max={100} value={Math.round(wpOverlay*100)}
                  onChange={e=>setWpOverlay(Number(e.target.value)/100)}
                  style={{ width:"100%", accentColor:"#a78bfa", cursor:"pointer", marginBottom:4 }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                  color:"rgba(255,255,255,.25)", marginBottom:16 }}>
                  <span>Bright</span><span>Dark</span>
                </div>
              </>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...btnBase, flex:1, padding:11, borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff", fontWeight:800, fontSize:13 }}
                onClick={()=>setShowWpPanel(false)}>Done</button>
              {hasBg && (
                <button style={{ ...btnBase, padding:"11px 14px", borderRadius:10,
                  background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                  color:"rgba(255,255,255,.4)", fontSize:12 }}
                  onClick={()=>{ setWallpaper("none"); setCustomWpUrl(""); setVideoWpUrl(""); }}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MUSIC PANEL ═══ */}
      {showMusicPanel && (
        <div style={panelStyle} onClick={()=>setShowMusicPanel(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:440, background:"#0f0f1e",
            border:"1px solid rgba(250,179,86,.2)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(250,179,86,.08)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800 }}>🎵 Music Player</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Paste a link to start playing</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none", color:"rgba(255,255,255,.2)", fontSize:18 }}
                onClick={()=>setShowMusicPanel(false)}>✕</button>
            </div>

            <div style={{ display:"flex", gap:6, marginBottom:18, background:"rgba(255,255,255,.04)",
              borderRadius:12, padding:4 }}>
              {["spotify","youtube"].map(tab=>(
                <button key={tab} style={{ ...btnBase, flex:1, padding:"8px 0", borderRadius:9, fontSize:13,
                  fontWeight:700, border:"none",
                  background: musicTab===tab ? (tab==="spotify" ? "rgba(29,185,84,.15)" : "rgba(255,0,0,.12)") : "transparent",
                  color: musicTab===tab ? (tab==="spotify" ? "#1db954" : "#ff4444") : "rgba(255,255,255,.35)",
                }} onClick={()=>setMusicTab(tab)}>
                  {tab==="spotify" ? "🟢 Spotify" : "🔴 YouTube"}
                </button>
              ))}
            </div>

            {musicTab==="spotify" ? (
              <>
                <p style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginBottom:8 }}>
                  Works with tracks, playlists, albums, artists, episodes
                </p>
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  <input type="text" placeholder="https://open.spotify.com/track/..."
                    value={spotifyInput} onChange={e=>setSpotifyInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&loadSpotify()}
                    style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                      background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                      color:"#fff", outline:"none", fontFamily:"inherit" }}/>
                  <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                    background:"linear-gradient(135deg,#1db954,#17a349)", border:"none",
                    color:"#fff", fontWeight:700, fontSize:12 }}
                    onClick={loadSpotify}>Load</button>
                </div>
                {spotifyEmbed && (
                  <iframe src={spotifyEmbed}
                    width="100%" height="152" frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy" style={{ borderRadius:12 }}/>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginBottom:8 }}>
                  Works with YouTube & YouTube Music links or video IDs
                </p>
                <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                  <input type="text" placeholder="https://youtube.com/watch?v=... or video ID"
                    value={ytInput} onChange={e=>setYtInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&loadYouTube()}
                    style={{ flex:1, padding:"9px 12px", borderRadius:10, fontSize:12,
                      background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
                      color:"#fff", outline:"none", fontFamily:"inherit" }}/>
                  <button style={{ ...btnBase, padding:"9px 14px", borderRadius:10,
                    background:"linear-gradient(135deg,#ff4444,#cc2222)", border:"none",
                    color:"#fff", fontWeight:700, fontSize:12 }}
                    onClick={loadYouTube}>Load</button>
                </div>
                {ytId && (
                  <div style={{ borderRadius:12, overflow:"hidden", aspectRatio:"16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                      width="100%" height="100%" frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen style={{ display:"block" }}/>
                  </div>
                )}
              </>
            )}

            {hasMusic && (
              <button style={{ ...btnBase, width:"100%", marginTop:12, padding:10, borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,0,0,.2)",
                color:"rgba(255,100,100,.6)", fontSize:12 }}
                onClick={clearMusic}>Clear player</button>
            )}

            {/* Feature 9: Ambient sounds in music panel */}
            <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,.06)" }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
                color:"rgba(255,255,255,.3)", marginBottom:10 }}>🌿 Ambient Sounds</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {AMBIENT_SOUNDS.map(s=>(
                  <button key={s.key} className="amb-btn" style={{
                    ...btnBase, padding:"6px 10px", borderRadius:8, fontSize:12,
                    fontWeight:600,
                    background: ambientKey===s.key && ambientPlaying
                      ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.04)",
                    border: ambientKey===s.key && ambientPlaying
                      ? "1px solid rgba(52,211,153,.35)" : "1px solid rgba(255,255,255,.09)",
                    color: ambientKey===s.key && ambientPlaying ? "#34d399" : "rgba(255,255,255,.5)",
                    transition:"all .2s",
                  }} onClick={()=>toggleAmbient(s.key)}>
                    {s.label}
                    {ambientKey===s.key && ambientPlaying && " ▮▮"}
                  </button>
                ))}
              </div>
              {ambientPlaying && (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", flexShrink:0 }}>Vol</span>
                  <input type="range" min={0} max={100} value={Math.round(ambientVol*100)}
                    onChange={e=>setAmbientVol(Number(e.target.value)/100)}
                    style={{ flex:1, accentColor:"#34d399", cursor:"pointer" }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", width:28, flexShrink:0 }}>
                    {Math.round(ambientVol*100)}%
                  </span>
                </div>
              )}
            </div>

            <button style={{ ...btnBase, width:"100%", marginTop:12, padding:11, borderRadius:10,
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)",
              color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:600 }}
              onClick={()=>setShowMusicPanel(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ═══ FLOATING MINI MUSIC PLAYER (Feature 3 + 10) ═══ */}
      {hasMusic && !showMusicPanel && (
        <div
          ref={playerRef}
          className="music-float player-drag"
          onMouseDown={onPlayerMouseDown}
          style={{
            position:"fixed",
            ...playerPos,
            zIndex:100,
            background:"rgba(10,10,22,.93)",
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            border:"1px solid rgba(250,179,86,.2)",
            borderRadius:16,
            boxShadow:"0 8px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.07)",
            width: musicMinimized ? "auto" : (spotifyEmbed ? 300 : 320),
            overflow:"hidden",
            opacity: playerOpacity,
            transition:"opacity 0.4s ease, box-shadow 0.3s ease",
            cursor: isDragging ? "grabbing" : "grab",
          }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"8px 12px",
            borderBottom: musicMinimized ? "none" : "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.45)" }}>
                {spotifyEmbed ? "🟢 Spotify" : "🔴 YouTube"}
              </span>
              {/* Feature 5: Visualizer in mini player */}
              <Visualizer active={running && !musicMinimized} color={mode.color}/>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,255,255,.3)", fontSize:13, padding:"2px 5px" }}
                onClick={()=>setMusicMinimized(m=>!m)}>
                {musicMinimized ? "⬆" : "⬇"}
              </button>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,255,255,.3)", fontSize:13, padding:"2px 5px" }}
                onClick={()=>setShowMusicPanel(true)}>↗</button>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,100,100,.4)", fontSize:13, padding:"2px 5px" }}
                onClick={clearMusic}>✕</button>
            </div>
          </div>

          {!musicMinimized && (
            <div style={{ transition:"all 0.35s ease" }}>
              {spotifyEmbed && (
                <iframe src={spotifyEmbed}
                  width="300" height="80" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy" style={{ display:"block" }}/>
              )}
              {ytId && !spotifyEmbed && (
                <div style={{ aspectRatio:"16/9" }}>
                  <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                    width="320" height="180" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ display:"block" }}/>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && (
        <div style={panelStyle} onClick={()=>setShowEdit(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:380, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>Edit Timer</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Timer will reset after saving.</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,255,255,.2)", fontSize:18, padding:"2px 5px" }}
                onClick={()=>setShowEdit(false)}>✕</button>
            </div>
            {[
              { key:"focus", label:"Focus Session", color:"#34d399", max:90 },
              { key:"short", label:"Short Break",   color:"#60a5fa", max:30 },
              { key:"long",  label:"Long Break",    color:"#a78bfa", max:60 },
            ].map(item=>(
              <div key={item.key} style={{ marginBottom:12, padding:"14px 16px",
                background:"rgba(255,255,255,.025)",
                border:"1px solid rgba(255,255,255,.06)", borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.label}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,.2)" }}>max {item.max} min</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="range" min={1} max={item.max} value={editVals[item.key]}
                    onChange={e=>clampEdit(item.key, e.target.value)}
                    style={{ flex:1, accentColor:item.color, cursor:"pointer" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    {["-","+"].map((sym,si)=>(
                      <button key={sym} style={{ ...btnBase, width:26, height:26, borderRadius:7,
                        background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.09)",
                        color:"rgba(255,255,255,.5)", fontSize:14,
                        display:"flex", alignItems:"center", justifyContent:"center" }}
                        onClick={()=>clampEdit(item.key, editVals[item.key]+(si?1:-1))}>
                        {sym}
                      </button>
                    ))}
                    <input type="number" min={1} max={item.max} value={editVals[item.key]}
                      onChange={e=>clampEdit(item.key, e.target.value)}
                      style={{ width:44, padding:"4px 6px", textAlign:"center",
                        background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)",
                        borderRadius:7, color:item.color, fontSize:14,
                        fontWeight:800, fontFamily:"inherit", outline:"none" }}/>
                  </div>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontWeight:600 }}>min</span>
                </div>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button style={{ ...btnBase, flex:1, padding:12, borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff", fontWeight:800, fontSize:13,
                boxShadow:"0 4px 18px rgba(124,58,237,.4)" }}
                onClick={saveSettings}>Save & Reset</button>
              <button style={{ ...btnBase, padding:"12px 14px", borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                color:"rgba(255,255,255,.4)", fontSize:13 }}
                onClick={()=>setShowEdit(false)}>Cancel</button>
              <button style={{ ...btnBase, padding:"12px 14px", borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                color:"rgba(255,255,255,.3)", fontSize:11, fontWeight:600 }}
                onClick={()=>setEditVals({ focus:25, short:5, long:15 })}>Defaults</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <main style={{ position:"relative", zIndex:2, width:"100%", maxWidth:820, margin:"0 auto",
        padding:"20px clamp(14px,4vw,40px) 80px" }}>

        {/* Mode tabs */}
        <div className="fu" style={{ display:"flex", gap:8,
          justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
          {modes.map((m,i)=>(
            <button key={m.key} className="mode-tab" onClick={()=>switchMode(i)} style={{
              ...btnBase, padding:"8px 20px", borderRadius:20,
              fontSize:12, fontWeight:700,
              background: modeIdx===i ? (accentColor ? `${accentColor}18` : m.pill) : "rgba(255,255,255,.03)",
              color:       modeIdx===i ? (accentColor || m.color) : "rgba(255,255,255,.3)",
              border:`1px solid ${modeIdx===i ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.07)"}`,
              boxShadow:   modeIdx===i ? `0 0 16px ${accentColor ? accentColor+"44" : m.glow}` : "none",
              transition:"all 0.4s ease",
            }}>
              {m.label}
              <span style={{ fontSize:10, marginLeft:6,
                color: modeIdx===i ? `${accentColor || m.color}99` : "rgba(255,255,255,.2)" }}>
                {m.minutes}m
              </span>
            </button>
          ))}
        </div>

        {/* Ring card — Feature 2: enhanced glassmorphism */}
        <div className="fu fu1 pop" style={{
          ...glassCard,
          padding:"32px 20px 28px",
          background: hasBg
            ? `rgba(8,8,20,${0.60 + wpOverlay*0.22})`
            : "linear-gradient(135deg,#0f0f1c 0%,#130e1e 60%,#0c0f1a 100%)",
          border:`1px solid ${effectiveBorder}`,
          display:"flex", flexDirection:"column", alignItems:"center",
          position:"relative", overflow:"hidden",
          boxShadow: hasBg
            ? `0 16px 48px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08), 0 0 60px ${effectiveGlow}`
            : `0 0 60px ${effectiveGlow}`,
        }}>

          <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240,
            borderRadius:"50%", pointerEvents:"none",
            background:`radial-gradient(circle,${effectiveGlow} 0%,transparent 70%)`,
            transition:"background 0.6s ease",
          }}/>

          <div style={{ position:"relative", width:ringSize, height:ringSize,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ring pct={pct} size={ringSize} stroke={10} color={mode.color} accentColor={accentColor}/>
            <div style={{ position:"absolute", inset:0, display:"flex",
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span style={{ fontSize:"clamp(48px,13vw,78px)", fontWeight:900,
                letterSpacing:"-4px", lineHeight:1, color: accentColor || mode.color,
                textShadow:`0 0 50px ${(accentColor||mode.color)}66`,
                fontVariantNumeric:"tabular-nums", transition:"color 0.6s ease, text-shadow 0.6s ease" }}>
                {fmt(seconds)}
              </span>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em",
                textTransform:"uppercase", color:"rgba(255,255,255,.3)" }}>
                {mode.label}
              </span>
              {running && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%",
                    background: accentColor || mode.color,
                    boxShadow:`0 0 8px ${accentColor || mode.color}` }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:500 }}>
                    {Math.ceil(seconds/60)} min left
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feature 5: Visualizer below timer */}
          <div style={{ marginTop:16, marginBottom:-4 }}>
            <Visualizer active={running} color={accentColor || mode.color}/>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginTop:20, zIndex:1 }}>
            <button className="ctrl" onClick={reset} style={{ ...btnBase, width:46, height:46,
              borderRadius:14, background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}>↺</button>
            <button className="ctrl" onClick={()=>setRunning(r=>!r)} style={{ ...btnBase,
              width:72, height:72, borderRadius:"50%",
              background: running ? "rgba(255,255,255,.06)" : `linear-gradient(135deg,${accentColor||mode.color},${(accentColor||mode.color)}bb)`,
              border:`2px solid ${running ? "rgba(255,255,255,.12)" : (accentColor||mode.color)}`,
              color: running ? (accentColor||mode.color) : "#000",
              fontSize:22, fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: running ? "none" : `0 0 28px ${effectiveGlow}`,
              transition:"all 0.3s ease",
            }}>
              {running ? "⏸" : "▶"}
            </button>
            <button className="ctrl" onClick={skipToNext} style={{ ...btnBase, width:46, height:46,
              borderRadius:14, background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}>⏭</button>
          </div>
        </div>

        {/* Stats — Feature 2: glassmorphism */}
        <div className="fu fu2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
          {[
            { label:"Sessions",    val:sessions,                        color:"#34d399", glow:"rgba(52,211,153,.2)"  },
            { label:"Full Cycles", val:cycles,                          color:"#a78bfa", glow:"rgba(167,139,250,.2)" },
            { label:"Focus Time",  val:`${sessions*modes[0].minutes}m`, color:"#60a5fa", glow:"rgba(96,165,250,.2)"  },
          ].map(stat=>(
            <div key={stat.label} style={{ ...glassCard, padding:"16px 12px", textAlign:"center",
              marginBottom:0, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:20,
                background:`radial-gradient(circle at 50% 0%,${stat.glow} 0%,transparent 70%)`,
                pointerEvents:"none" }}/>
              <p style={{ fontSize:"clamp(22px,6vw,32px)", fontWeight:900, letterSpacing:"-1px",
                color:stat.color, textShadow:`0 0 24px ${stat.color}55`,
                marginBottom:5, position:"relative" }}>{stat.val}</p>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", color:"rgba(255,255,255,.22)", position:"relative" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Timer setup card — Feature 2: glassmorphism */}
        <div className="fu fu3" style={{ ...glassCard, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:"linear-gradient(135deg,rgba(167,139,250,.2),rgba(244,114,182,.15))",
                border:"1px solid rgba(167,139,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⏱</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>Timer Setup</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>
                  long break after 4 focus sessions
                </p>
              </div>
            </div>
            <button style={{ ...btnBase, padding:"5px 12px", borderRadius:9,
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)",
              color:"rgba(255,255,255,.35)", fontSize:11, fontWeight:600 }}
              onClick={openEdit}>Edit ✎</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {modes.map((m,i)=>(
              <div key={m.key} style={{ padding:"12px 10px",
                background:"rgba(255,255,255,.025)",
                border:`1px solid ${modeIdx===i ? (accentColor ? `${accentColor}44` : m.border) : "rgba(255,255,255,.05)"}`,
                borderRadius:12, textAlign:"center",
                boxShadow: modeIdx===i ? `0 0 12px ${effectiveGlow}` : "none",
                transition:"border-color 0.4s ease, box-shadow 0.4s ease",
              }}>
                <p style={{ fontSize:22, fontWeight:900, color: modeIdx===i ? (accentColor||m.color) : m.color,
                  letterSpacing:"-0.5px", textShadow:`0 0 16px ${(accentColor||m.color)}55`,
                  transition:"color 0.4s ease" }}>{m.minutes}m</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontWeight:500, marginTop:3 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session log */}
        {log.length > 0 && (
          <div className="fu fu4" style={{ ...glassCard, padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:"linear-gradient(135deg,rgba(96,165,250,.2),rgba(167,139,250,.15))",
                border:"1px solid rgba(96,165,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📋</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>Session Log</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>{log.length} entries today</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {log.map((entry,i)=>(
                <div key={i} className="log-row" style={{ animationDelay:`${i*0.04}s`,
                  padding:"9px 12px", borderRadius:10,
                  background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)",
                  fontSize:12, fontWeight:500,
                  color: entry.startsWith("✓") ? "#34d399" : "rgba(255,255,255,.4)" }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}