import { useState, useEffect, useRef } from "react";
 
/* ═══════════════════════════════════════════════════════════
   CollaDO — Pomodoro  ·  FUNKY FANCY EDITION
   Matches Dashboard aesthetic exactly:
   · Outfit font, #07070f bg, gradient wordmark
   · Same card style, same color palette, same drawer vibe
   · All original logic 100% preserved
   ═══════════════════════════════════════════════════════════ */
 
const DEFAULT_MODES = [
  { key:"focus",  label:"Focus",       minutes:25, color:"#34d399", glow:"rgba(52,211,153,.35)",  pill:"rgba(52,211,153,.12)",  border:"rgba(52,211,153,.28)"  },
  { key:"short",  label:"Short Break", minutes:5,  color:"#60a5fa", glow:"rgba(96,165,250,.35)",  pill:"rgba(96,165,250,.12)",  border:"rgba(96,165,250,.28)"  },
  { key:"long",   label:"Long Break",  minutes:15, color:"#a78bfa", glow:"rgba(167,139,250,.35)", pill:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.28)" },
];
 
function fmt(s){
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}
 
function Ring({ pct, size, stroke, color }){
  const r   = (size - stroke*2) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - (pct/100)*c;
  return(
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}
 
export default function Pomodoro({ onNavigate }){
  const [modes,    setModes]    = useState(DEFAULT_MODES);
  const [modeIdx,  setModeIdx]  = useState(0);
  const [seconds,  setSeconds]  = useState(DEFAULT_MODES[0].minutes * 60);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const [cycles,   setCycles]   = useState(0);
  const [log,      setLog]      = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editVals, setEditVals] = useState({
    focus: DEFAULT_MODES[0].minutes,
    short: DEFAULT_MODES[1].minutes,
    long:  DEFAULT_MODES[2].minutes,
  });
  const intervalRef = useRef(null);
 
  const mode     = modes[modeIdx];
  const total    = mode.minutes * 60;
  const pct      = ((total - seconds) / total) * 100;
  const ringSize = Math.min(260, (typeof window !== "undefined" ? window.innerWidth : 400) - 80);
 
  /* ── All original effects & logic ── */
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
 
  function switchMode(idx){
    setModeIdx(idx);
    setSeconds(modes[idx].minutes*60);
    setRunning(false);
  }
 
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
 
  /* ── Shared styles matching Dashboard ── */
  const card = {
    background:"#0f0f1c", borderRadius:20,
    border:"1px solid rgba(255,255,255,.07)", marginBottom:12,
  };
 
  const btnBase = {
    cursor:"pointer", fontFamily:"'Outfit',sans-serif",
    outline:"none", transition:"all .15s",
  };
 
  return(
    <div style={{ minHeight:"100vh", background:"#07070f",
      fontFamily:"'Outfit',sans-serif", color:"#fff",
      width:"100%", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{width:100%;background:#07070f;overflow-x:hidden;}
 
        @keyframes fadeUp   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn    {from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.5}}
 
        .fu {animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;}
        .fu1{animation-delay:.06s}
        .fu2{animation-delay:.12s}
        .fu3{animation-delay:.18s}
        .fu4{animation-delay:.24s}
        .pop{animation:popIn .35s cubic-bezier(.34,1.56,.64,1) both;}
        .pulse-dot{animation:pulse 1.4s ease infinite;}
 
        .ctrl:hover{filter:brightness(1.2);transform:scale(1.04);}
        .ctrl:active{transform:scale(.96);}
        .mode-tab:hover{opacity:.85;}
        .log-row{animation:fadeUp .25s ease both;}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{opacity:1;}
 
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#1f1f35;border-radius:4px;}
      `}</style>
 
      {/* ═══ TOPBAR ═══ */}
      <header style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(7,7,15,.88)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,.06)",
        display:"flex", alignItems:"center", gap:12,
        padding:"0 16px", height:56,
      }}>
        {/* Back button */}
        <button className="ctrl" onClick={()=>onNavigate("dashboard")} style={{
          ...btnBase, width:36, height:36, borderRadius:10,
          background:"rgba(255,255,255,.04)",
          border:"1px solid rgba(255,255,255,.08)",
          color:"rgba(255,255,255,.45)", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>←</button>
 
        {/* Wordmark */}
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.6px",
            background:"linear-gradient(100deg,#a78bfa 0%,#f472b6 55%,#fb923c 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            CollaDO
          </span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,.2)",
            fontWeight:600, letterSpacing:"0.12em" }}>.focus</span>
        </div>
 
        {/* Right: sessions pill + edit */}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {sessions > 0 && (
            <div style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700,
              background:"rgba(52,211,153,.12)",
              border:"1px solid rgba(52,211,153,.28)", color:"#34d399" }}>
              {sessions} done ✓
            </div>
          )}
          <button className="ctrl" onClick={openEdit} style={{
            ...btnBase, padding:"5px 12px", borderRadius:9, fontSize:12, fontWeight:600,
            background:"rgba(255,255,255,.04)",
            border:"1px solid rgba(255,255,255,.09)",
            color:"rgba(255,255,255,.38)",
          }}
          onMouseOver={e=>{ e.currentTarget.style.color="#a78bfa"; e.currentTarget.style.borderColor="rgba(167,139,250,.3)"; }}
          onMouseOut={e=>{ e.currentTarget.style.color="rgba(255,255,255,.38)"; e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; }}>
            Edit timer
          </button>
        </div>
      </header>
 
      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && (
        <div style={{ position:"fixed", inset:0, zIndex:200,
          background:"rgba(0,0,0,.82)", backdropFilter:"blur(14px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:20, animation:"overlayIn .2s ease both" }}
          onClick={()=>setShowEdit(false)}>
          <div className="fu" onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:380, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start",
              justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>Edit Timer</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Timer will reset after saving.</p>
              </div>
              <button style={{ ...btnBase, background:"transparent", border:"none",
                color:"rgba(255,255,255,.2)", fontSize:18, padding:"2px 5px" }}
                onClick={()=>setShowEdit(false)}
                onMouseOver={e=>e.currentTarget.style.color="#f87171"}
                onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,.2)"}>✕</button>
            </div>
 
            {[
              { key:"focus", label:"Focus Session", color:"#34d399", max:90 },
              { key:"short", label:"Short Break",   color:"#60a5fa", max:30 },
              { key:"long",  label:"Long Break",    color:"#a78bfa", max:60 },
            ].map(item=>(
              <div key={item.key} style={{ marginBottom:12, padding:"14px 16px",
                background:"rgba(255,255,255,.025)",
                border:"1px solid rgba(255,255,255,.06)", borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:10 }}>
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
                        background:"rgba(255,255,255,.06)",
                        border:"1px solid rgba(255,255,255,.09)",
                        color:"rgba(255,255,255,.5)", fontSize:14,
                        display:"flex", alignItems:"center", justifyContent:"center" }}
                        onClick={()=>clampEdit(item.key, editVals[item.key]+(si?1:-1))}>
                        {sym}
                      </button>
                    ))}
                    <input type="number" min={1} max={item.max} value={editVals[item.key]}
                      onChange={e=>clampEdit(item.key, e.target.value)}
                      style={{ width:44, padding:"4px 6px", textAlign:"center",
                        background:"rgba(255,255,255,.05)",
                        border:"1px solid rgba(255,255,255,.09)",
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
      <main style={{ width:"100%", maxWidth:820, margin:"0 auto",
        padding:"20px clamp(14px,4vw,40px) 80px" }}>
 
        {/* Mode tabs */}
        <div className="fu" style={{ display:"flex", gap:8,
          justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
          {modes.map((m,i)=>(
            <button key={m.key} className="mode-tab" onClick={()=>switchMode(i)} style={{
              ...btnBase, padding:"8px 20px", borderRadius:20,
              fontSize:12, fontWeight:700,
              background: modeIdx===i ? m.pill : "rgba(255,255,255,.03)",
              color:       modeIdx===i ? m.color : "rgba(255,255,255,.3)",
              border:`1px solid ${modeIdx===i ? m.border : "rgba(255,255,255,.07)"}`,
              boxShadow:   modeIdx===i ? `0 0 16px ${m.glow}` : "none",
            }}>
              {m.label}
              <span style={{ fontSize:10, marginLeft:6,
                color: modeIdx===i ? `${m.color}99` : "rgba(255,255,255,.2)" }}>
                {m.minutes}m
              </span>
            </button>
          ))}
        </div>
 
        {/* ── Ring card ── */}
        <div className="fu fu1 pop" style={{ ...card,
          padding:"32px 20px 28px",
          background:"linear-gradient(135deg,#0f0f1c 0%,#130e1e 60%,#0c0f1a 100%)",
          border:`1px solid ${mode.border}`,
          display:"flex", flexDirection:"column", alignItems:"center",
          position:"relative", overflow:"hidden" }}>
 
          {/* bg orb */}
          <div style={{ position:"absolute", top:-60, right:-60,
            width:240, height:240, borderRadius:"50%", pointerEvents:"none",
            background:`radial-gradient(circle,${mode.glow} 0%,transparent 70%)` }}/>
 
          {/* Ring */}
          <div style={{ position:"relative", width:ringSize, height:ringSize,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ring pct={pct} size={ringSize} stroke={10} color={mode.color}/>
            <div style={{ position:"absolute", inset:0, display:"flex",
              flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
 
              {/* Timer digits */}
              <span style={{ fontSize:"clamp(48px,13vw,78px)", fontWeight:900,
                letterSpacing:"-4px", lineHeight:1,
                color:mode.color,
                textShadow:`0 0 50px ${mode.color}66`,
                fontVariantNumeric:"tabular-nums" }}>
                {fmt(seconds)}
              </span>
 
              {/* Mode label */}
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em",
                textTransform:"uppercase", color:"rgba(255,255,255,.3)" }}>
                {mode.label}
              </span>
 
              {/* Running pulse */}
              {running && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%",
                    background:mode.color,
                    boxShadow:`0 0 8px ${mode.color}` }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:500 }}>
                    {Math.ceil(seconds/60)} min left
                  </span>
                </div>
              )}
            </div>
          </div>
 
          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"center", gap:14, marginTop:28, zIndex:1 }}>
 
            {/* Reset */}
            <button className="ctrl" onClick={reset} style={{ ...btnBase,
              width:46, height:46, borderRadius:14,
              background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}>↺</button>
 
            {/* Play/Pause — big gradient button */}
            <button className="ctrl" onClick={()=>setRunning(r=>!r)} style={{ ...btnBase,
              width:72, height:72, borderRadius:"50%",
              background: running
                ? "rgba(255,255,255,.06)"
                : `linear-gradient(135deg,${mode.color},${mode.color}bb)`,
              border:`2px solid ${running ? "rgba(255,255,255,.12)" : mode.color}`,
              color: running ? mode.color : "#000",
              fontSize:22, fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: running ? "none" : `0 0 28px ${mode.glow}` }}>
              {running ? "⏸" : "▶"}
            </button>
 
            {/* Skip */}
            <button className="ctrl" onClick={skipToNext} style={{ ...btnBase,
              width:46, height:46, borderRadius:14,
              background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(255,255,255,.4)", fontSize:18,
              display:"flex", alignItems:"center", justifyContent:"center" }}>⏭</button>
          </div>
        </div>
 
        {/* ── Stats ── */}
        <div className="fu fu2" style={{ display:"grid",
          gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
          {[
            { label:"Sessions",    val:sessions,                        color:"#34d399", glow:"rgba(52,211,153,.2)"  },
            { label:"Full Cycles", val:cycles,                          color:"#a78bfa", glow:"rgba(167,139,250,.2)" },
            { label:"Focus Time",  val:`${sessions*modes[0].minutes}m`, color:"#60a5fa", glow:"rgba(96,165,250,.2)"  },
          ].map(stat=>(
            <div key={stat.label} style={{ ...card, padding:"16px 12px",
              textAlign:"center", marginBottom:0,
              position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:20,
                background:`radial-gradient(circle at 50% 0%,${stat.glow} 0%,transparent 70%)`,
                pointerEvents:"none" }}/>
              <p style={{ fontSize:"clamp(22px,6vw,32px)", fontWeight:900,
                letterSpacing:"-1px", color:stat.color,
                textShadow:`0 0 24px ${stat.color}55`,
                marginBottom:5, position:"relative" }}>{stat.val}</p>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em",
                textTransform:"uppercase", color:"rgba(255,255,255,.22)",
                position:"relative" }}>{stat.label}</p>
            </div>
          ))}
        </div>
 
        {/* ── Timer setup card ── */}
        <div className="fu fu3" style={{ ...card, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:14 }}>
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
              background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(255,255,255,.09)",
              color:"rgba(255,255,255,.35)", fontSize:11, fontWeight:600 }}
              onClick={openEdit}
              onMouseOver={e=>{ e.currentTarget.style.color="#a78bfa"; e.currentTarget.style.borderColor="rgba(167,139,250,.3)"; }}
              onMouseOut={e=>{ e.currentTarget.style.color="rgba(255,255,255,.35)"; e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; }}>
              Edit ✎
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {modes.map(m=>(
              <div key={m.key} style={{ padding:"12px 10px",
                background:"rgba(255,255,255,.025)",
                border:`1px solid ${modeIdx===modes.indexOf(m) ? m.border : "rgba(255,255,255,.05)"}`,
                borderRadius:12, textAlign:"center",
                boxShadow: modeIdx===modes.indexOf(m) ? `0 0 12px ${m.glow}` : "none" }}>
                <p style={{ fontSize:22, fontWeight:900,
                  color:m.color, letterSpacing:"-0.5px",
                  textShadow:`0 0 16px ${m.color}55` }}>{m.minutes}m</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)",
                  fontWeight:500, marginTop:3 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
 
        {/* ── Session log ── */}
        {log.length > 0 && (
          <div className="fu fu4" style={{ ...card, padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:10,
                background:"linear-gradient(135deg,rgba(96,165,250,.2),rgba(167,139,250,.15))",
                border:"1px solid rgba(96,165,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📋</div>
              <div>
                <p style={{ fontSize:13, fontWeight:700 }}>Session Log</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>
                  {log.length} entries today
                </p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {log.map((entry, i)=>(
                <div key={i} className="log-row" style={{
                  animationDelay:`${i*0.04}s`,
                  padding:"9px 12px", borderRadius:10,
                  background:"rgba(255,255,255,.025)",
                  border:"1px solid rgba(255,255,255,.05)",
                  fontSize:12, fontWeight:500,
                  color: entry.startsWith("✓")
                    ? "#34d399" : "rgba(255,255,255,.4)" }}>
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