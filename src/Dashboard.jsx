import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

import Ring from "./dashboard/components/Ring";
import DashboardTopbar from "./dashboard/components/DashboardTopbar";
import FloatingDrawer from "./dashboard/components/FloatingDrawer";
import { MONTHS, DAYS_SHORT, C, SUBJ_COLORS, DEFAULT_EXAMS } from "./dashboard/utils/dashboardConstants";
import { dateKey, getDaysInMonth, getFirstDay } from "./dashboard/utils/dateUtils";
import {
  buildAttendanceMap, pctFor, canSkip, needMore,
  ringColor, dayCompletion, dayDotColor,
} from "./dashboard/utils/attendanceMath";

export default function Dashboard({ user, onNavigate }) {
  const uid      = user.uid;
  const today    = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const subjCol = collection(db, "users", uid, "subjects");
  const calCol  = collection(db, "users", uid, "calendar");

  const [subjects,        setSubjects]       = useState([]);
  const [calData,         setCalData]        = useState({});
  const [calYear,         setCalYear]        = useState(today.getFullYear());
  const [calMonth,        setCalMonth]       = useState(today.getMonth());
  const [selDay,          setSelDay]         = useState(null);
  const [newName,         setNewName]        = useState("");
  const [showAdd,         setShowAdd]        = useState(false);
  const [calIn,           setCalIn]          = useState(false);
  const [menuOpen,        setMenuOpen]       = useState(false);
  const [target,          setTarget]         = useState(75);
  const [showTargetModal, setShowTargetModal]= useState(false);
  const [targetInput,     setTargetInput]    = useState("75");
  const [exams,           setExams]          = useState(() => {
    try {
      const saved = localStorage.getItem(`ktu_exams_${uid}`);
      return saved ? JSON.parse(saved) : DEFAULT_EXAMS;
    } catch { return DEFAULT_EXAMS; }
  });
  const [showExamEdit, setShowExamEdit] = useState(false);
  const [examDrafts,   setExamDrafts]   = useState([]);

  useEffect(()=>{ const t=setTimeout(()=>setCalIn(true),100); return()=>clearTimeout(t); },[]);
  useEffect(()=>onSnapshot(subjCol,snap=>setSubjects(snap.docs.map(d=>({id:d.id,...d.data()})))),[uid]);
  useEffect(()=>onSnapshot(calCol,snap=>{const obj={};snap.docs.forEach(d=>{obj[d.id]=d.data();});setCalData(obj);}),[uid]);
  useEffect(()=>{
    const settingsDoc = doc(db,"users",uid,"settings","preferences");
    return onSnapshot(settingsDoc,(snap)=>{
      if(snap.exists()){ setTarget(snap.data().attendanceTarget ?? 75); }
      else { setShowTargetModal(true); }
    });
  },[uid]);

  const attendance = buildAttendanceMap(subjects, calData);

  const pct     = (sid) => pctFor(sid, attendance);
  const skip    = (sid) => canSkip(sid, attendance, target);
  const need    = (sid) => needMore(sid, attendance, target);
  const dotColor = (dk) => dayDotColor(dayCompletion(dk, calData));

  const overallPct      = subjects.length ? Math.round(subjects.reduce((a,s)=>a+pct(s.id),0)/subjects.length) : 0;
  const safe            = overallPct >= target;
  const overallRingColor= ringColor(overallPct, target);

  const selKey      = selDay ? dateKey(calYear, calMonth, selDay) : null;
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDay(calYear, calMonth);

  const now = new Date(); now.setHours(0,0,0,0);
  const upcoming = exams.filter(e=>e.date).map(e=>{
    const d = new Date(e.date+"T00:00:00");
    return { ...e, diff: Math.ceil((d - now)/86400000) };
  }).filter(e=>e.diff>=0).sort((a,b)=>a.diff-b.diff);
  const nextExam = upcoming[0];
  const danger   = overallPct < target && nextExam && nextExam.diff <= 14;

  async function markDay(dk, sid, status){
    await setDoc(doc(db,"users",uid,"calendar",dk),{ ...(calData[dk]||{}), [sid]:status },{ merge:true });
  }
  async function addSubject(){
    if(!newName.trim()) return;
    await setDoc(doc(subjCol),{ name:newName.trim() });
    setNewName(""); setShowAdd(false);
  }
  async function deleteSubject(sid){
    await deleteDoc(doc(db,"users",uid,"subjects",sid));
  }
  function saveExams(drafts){
    setExams(drafts);
    localStorage.setItem(`ktu_exams_${uid}`,JSON.stringify(drafts));
    setShowExamEdit(false);
  }
  async function saveTarget(){
    const val=parseInt(targetInput);
    if(isNaN(val)||val<1||val>100) return;
    await setDoc(doc(db,"users",uid,"settings","preferences"),{ attendanceTarget:val },{ merge:true });
    setTarget(val);
    setShowTargetModal(false);
  }

  const S = {
    page: {
      minHeight:"100vh",
      background:"radial-gradient(circle at 12% 12%, rgba(192,193,255,.14) 0%, transparent 36%), radial-gradient(circle at 88% 86%, rgba(76,215,246,.12) 0%, transparent 36%), linear-gradient(135deg,#101014 0%,#131318 48%,#0b0d14 100%)",
      color:"#e5e2e3",
      fontFamily:"Inter, Outfit, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      width:"100%", overflowX:"hidden", position:"relative",
    },
    main: {
      position:"relative", zIndex:1, width:"100%", maxWidth:920,
      margin:"0 auto", padding:"28px clamp(14px,4vw,40px) 88px",
    },
    card: {
      background:"linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.045))",
      borderRadius:32, border:"1px solid rgba(255,255,255,.11)", marginBottom:18,
      backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,.13), 0 24px 70px rgba(0,0,0,.24)",
    },
  };

  return (
    <div style={S.page}>
      <div aria-hidden="true" style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle at 18% 28%, rgba(192,193,255,.12) 0%, transparent 38%), radial-gradient(circle at 82% 72%, rgba(76,215,246,.10) 0%, transparent 38%)",
      }}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{width:100%;background:#101014;overflow-x:hidden;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        .fu{animation:fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;}
        .fu1{animation-delay:.05s}.fu2{animation-delay:.10s}.fu3{animation-delay:.15s}.fu4{animation-delay:.20s}
        .day-pop{animation:popIn 0.2s cubic-bezier(.34,1.56,.64,1) both;}
        .hov-lift{transition:transform .15s,box-shadow .15s;}.hov-lift:hover{transform:translateY(-1px);}
        .btn-base{cursor:pointer;font-family:inherit;transition:all .15s;outline:none;border:none;}
        .del-x{background:transparent;border:none;cursor:pointer;color:rgba(255,255,255,.15);font-size:15px;padding:2px 5px;transition:color .15s;}
        .del-x:hover{color:#f87171;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1f1f35;border-radius:4px;}
        @media(max-width:500px){.hide-sm{display:none!important;}.mark-full{display:none!important;}.mark-short{display:inline!important;}}
        @media(min-width:501px){.mark-short{display:none!important;}}
      `}</style>

      <DashboardTopbar
        menuOpen={menuOpen}
        onMenuToggle={()=>setMenuOpen(o=>!o)}
        overallPct={overallPct}
        safe={safe}
      />

      {menuOpen && (
  <FloatingDrawer
    menuOpen={menuOpen}
    setMenuOpen={setMenuOpen}
    user={user}
    onNavigate={onNavigate}
    target={target}
    setTargetInput={setTargetInput}
    setShowTargetModal={setShowTargetModal}
  />
)}

      {/* MAIN */}
      <main style={S.main}>

        {/* OVERALL CARD */}
        <div className="fu" style={{ ...S.card, padding:"22px 22px",
          background:"linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.045))",
          border:"1px solid rgba(255,255,255,.12)", display:"flex", alignItems:"center", gap:20,
          position:"relative", overflow:"hidden",
          boxShadow:`inset 0 1px 0 rgba(255,255,255,.15), 0 24px 70px rgba(0,0,0,.24), 0 0 44px ${safe ? "rgba(52,211,153,.07)" : "rgba(248,113,113,.07)"}` }}>
          <div style={{ position:"absolute", right:-50, top:-50, width:220, height:220,
            borderRadius:"50%", pointerEvents:"none",
            background:`radial-gradient(circle,${safe?"rgba(52,211,153,.09)":"rgba(248,113,113,.09)"} 0%,transparent 70%)` }}/>
          <div style={{ flexShrink:0 }}>
            <div style={{ fontSize:"clamp(50px,12vw,72px)", fontWeight:850, letterSpacing:"-4px",
              lineHeight:1, color:"rgba(245,245,247,.96)", textShadow:`0 0 44px ${overallRingColor}55`,
              fontVariantNumeric:"tabular-nums" }}>
              {overallPct}<span style={{ fontSize:"clamp(22px,5vw,32px)", fontWeight:750, letterSpacing:"-1px", color:overallRingColor }}>%</span>
            </div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase",
              color:"rgba(229,226,227,.34)", marginTop:6 }}>Overall</p>
          </div>
          <div style={{ flex:1, zIndex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 14px",
              borderRadius:999, marginBottom:12,
              background: safe ? "rgba(52,211,153,.12)" : "rgba(248,113,113,.12)",
              border:`1px solid ${safe ? "rgba(52,211,153,.28)" : "rgba(248,113,113,.28)"}`,
              boxShadow:"inset 0 1px 0 rgba(255,255,255,.10)" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                background: safe ? C.safe : C.danger, boxShadow:`0 0 8px ${safe ? C.safe : C.danger}` }}/>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                color: safe ? C.safe : C.danger }}>{safe ? "You're safe" : "At risk"}</span>
            </div>
            <p style={{ fontSize:16, fontWeight:700, lineHeight:1.3, marginBottom:5 }}>
              {safe ? "Keep the streak going." : "Attend more sessions."}
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.38)", lineHeight:1.5 }}>
              {safe ? `${overallPct - target}% above your ${target}% target — you can relax.`
                    : `${target - overallPct}% short of ${target}% — focus this week.`}
            </p>
            <button className="btn-base" style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,.25)",
              textDecoration:"underline", textDecorationColor:"rgba(255,255,255,.1)", background:"transparent" }}
              onClick={()=>{ setTargetInput(String(target)); setShowTargetModal(true); }}>
              Change target ({target}%)
            </button>
          </div>
          <div style={{ position:"relative", flexShrink:0 }}>
            <Ring pct={overallPct} size={78} stroke={6} color={overallRingColor}/>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:12, fontWeight:800, color:overallRingColor }}>{overallPct}%</div>
          </div>
        </div>

        {/* EXAM COUNTDOWN */}
        <div className="fu fu1" style={{ ...S.card, padding:"18px 20px",
          background: danger ? "linear-gradient(145deg,rgba(248,113,113,.10),rgba(255,255,255,.04))"
                             : "linear-gradient(145deg,rgba(96,165,250,.10),rgba(255,255,255,.04))",
          border:`1px solid ${danger ? "rgba(248,113,113,.22)" : "rgba(255,255,255,.12)"}`,
          position:"relative", overflow:"hidden",
          boxShadow:`inset 0 1px 0 rgba(255,255,255,.15), 0 24px 70px rgba(0,0,0,.24), 0 0 42px ${danger ? "rgba(248,113,113,.07)" : "rgba(76,215,246,.06)"}` }}>
          <div style={{ position:"absolute", left:-30, bottom:-30, width:160, height:160,
            borderRadius:"50%", pointerEvents:"none",
            background:`radial-gradient(circle,${danger?"rgba(248,113,113,.09)":"rgba(96,165,250,.07)"} 0%,transparent 70%)` }}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase",
              color:"rgba(255,255,255,.22)" }}>Upcoming Exams</span>
            <button className="btn-base" style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600,
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", color:"rgba(255,255,255,.3)" }}
              onClick={()=>{ setExamDrafts(JSON.parse(JSON.stringify(exams))); setShowExamEdit(true); }}
              onMouseOver={e=>{ e.currentTarget.style.color=C.violet; e.currentTarget.style.borderColor="rgba(167,139,250,.3)"; }}
              onMouseOut={e=>{ e.currentTarget.style.color="rgba(255,255,255,.3)"; e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; }}>
              Edit dates
            </button>
          </div>
          {nextExam ? (
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", zIndex:1, position:"relative" }}>
              <div style={{ width:76, height:76, borderRadius:18, flexShrink:0,
                background: danger ? "rgba(248,113,113,.10)" : "rgba(96,165,250,.10)",
                border:`1px solid ${danger ? "rgba(248,113,113,.24)" : "rgba(96,165,250,.22)"}`,
                backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,.12)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:30, fontWeight:900, lineHeight:1,
                  color: danger ? C.danger : C.blue,
                  textShadow:`0 0 24px ${danger ? C.danger : C.blue}88` }}>{nextExam.diff}</span>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase",
                  color:"rgba(255,255,255,.25)", marginTop:2 }}>days</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:15, fontWeight:700, marginBottom:5 }}>
                  {nextExam.label}
                  <span style={{ color:"rgba(255,255,255,.32)", fontWeight:400 }}>
                    {" · "}{nextExam.diff===0?"today":nextExam.diff===1?"tomorrow":`in ${nextExam.diff} days`}
                  </span>
                </p>
                <p style={{ fontSize:12, fontWeight:600, color: danger ? C.danger : safe ? C.safe : C.warn }}>
                  {danger ? `⚠ ${overallPct}% — exam block risk!` : safe ? `✓ ${overallPct}% — you're clear` : `${overallPct}% — stay consistent`}
                </p>
                {upcoming.length > 1 && (
                  <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                    {upcoming.slice(1).map(e=>(
                      <span key={e.id} style={{ fontSize:11, fontWeight:500, padding:"3px 10px", borderRadius:20,
                        background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
                        color: e.diff<=7 ? C.danger : e.diff<=14 ? C.warn : "rgba(255,255,255,.4)" }}>
                        {e.label} · {e.diff===0?"today":`${e.diff}d`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button className="btn-base" style={{ width:"100%", padding:"14px 18px", borderRadius:14,
              textAlign:"left", background:"rgba(255,255,255,.02)", border:"1px dashed rgba(255,255,255,.1)",
              color:"rgba(255,255,255,.25)", fontSize:13, fontWeight:500 }}
              onClick={()=>{ setExamDrafts(JSON.parse(JSON.stringify(exams))); setShowExamEdit(true); }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor="rgba(167,139,250,.35)"; e.currentTarget.style.color=C.violet; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; e.currentTarget.style.color="rgba(255,255,255,.25)"; }}>
              + Set series exam dates →
            </button>
          )}
        </div>

        {/* BUNK PLANNER */}
        {subjects.length > 0 && (
          <div className="fu fu2" style={{ ...S.card, padding:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:12, flexShrink:0,
                background:"linear-gradient(135deg,rgba(167,139,250,.2),rgba(244,114,182,.15))",
                border:"1px solid rgba(167,139,250,.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🛌</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700 }}>Bunk Planner</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>exactly how many you can skip</p>
              </div>
              <div style={{ padding:"6px 14px", borderRadius:20,
                background: subjects.every(s=>pct(s.id)>=target) ? "rgba(52,211,153,.1)" : "rgba(248,113,113,.08)",
                border:`1px solid ${subjects.every(s=>pct(s.id)>=target) ? "rgba(52,211,153,.25)" : "rgba(248,113,113,.2)"}` }}>
                <span style={{ fontSize:18, fontWeight:900,
                  color: subjects.every(s=>pct(s.id)>=target) ? C.safe : C.danger }}>
                  {subjects.reduce((acc,s)=>acc+skip(s.id),0)}
                </span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontWeight:500, marginLeft:4 }}>skippable</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {subjects.map((s,i)=>{
                const { present, total } = attendance[s.id] || { present:0, total:0 };
                const p  = pct(s.id);
                const sk = skip(s.id);
                const nd = need(s.id);
                const isSafe  = p >= target;
                const atLimit = isSafe && sk === 0;
                const sc = SUBJ_COLORS[i % SUBJ_COLORS.length];
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"12px 14px", borderRadius:14,
                    background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                      background:sc.ring, boxShadow:`0 0 8px ${sc.ring}` }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>{present}/{total} · {p}%</p>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {isSafe && sk > 0 && <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(52,211,153,.1)", border:"1px solid rgba(52,211,153,.25)", color:C.safe }}>skip {sk} ✓</span>}
                      {atLimit && <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.25)", color:C.warn }}>at limit ⚡</span>}
                      {!isSafe && <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.25)", color:C.danger }}>+{nd} needed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBJECTS */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px", marginBottom:10 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,.22)" }}>Subjects</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>{subjects.length} tracked</span>
          </div>
          {subjects.map((s,i)=>{
            const p      = pct(s.id);
            const isSafe = p >= target;
            const rc     = ringColor(p, target);
            const { present, total } = attendance[s.id] || { present:0, total:0 };
            const cur    = (calData[todayKey] || {})[s.id] || "N";
            const sc     = SUBJ_COLORS[i % SUBJ_COLORS.length];
            return (
              <div key={s.id} className="fu hov-lift" style={{ ...S.card, overflow:"hidden", animationDelay:`${0.15 + i * 0.07}s` }}>
                <div style={{ height:3, background:`linear-gradient(90deg,${sc.ring} 0%,${C.pink} 60%,transparent 100%)` }}/>
                <div style={{ padding:"14px 16px 0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <Ring pct={p} size={54} stroke={5} color={rc}/>
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:9, fontWeight:800, color:rc }}>{p}%</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.2px",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{present}/{total}</span>
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20,
                          background:sc.pill, border:`1px solid ${sc.border}`, color:sc.text }}>
                          {isSafe ? skip(s.id) > 0 ? `skip ${skip(s.id)}` : "at limit" : `need ${need(s.id)}`}
                        </span>
                      </div>
                    </div>
                    <button className="del-x" onClick={()=>deleteSubject(s.id)}>✕</button>
                  </div>
                  <div style={{ height:3, background:"rgba(255,255,255,.05)", borderRadius:3, marginBottom:12, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3, width:`${p}%`,
                      background:`linear-gradient(90deg,${sc.ring},${rc})`, transition:"width .5s ease" }}/>
                  </div>
                </div>
                <div style={{ padding:"10px 16px 14px", borderTop:"1px solid rgba(255,255,255,.04)",
                  display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase",
                    color:"rgba(255,255,255,.18)", flexShrink:0, marginRight:4 }}>Today</span>
                  {[
                    { val:"P", full:"Present", short:"P", activeStyle:{ background:"linear-gradient(135deg,#052e16,#064e3b)", border:"1px solid #059669", color:C.safe, boxShadow:"0 0 14px rgba(5,150,105,.35)" } },
                    { val:"A", full:"Absent",  short:"A", activeStyle:{ background:"linear-gradient(135deg,#2d0a0a,#450a0a)", border:"1px solid #dc2626", color:C.danger, boxShadow:"0 0 14px rgba(220,38,38,.3)" } },
                    { val:"N", full:"No class",short:"—", activeStyle:{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)", color:"rgba(255,255,255,.7)", boxShadow:"none" } },
                  ].map(btn=>{
                    const active = cur === btn.val;
                    return (
                      <button key={btn.val} className="btn-base hov-lift" style={{
                        flex:1, padding:"8px 4px", borderRadius:10, fontSize:12, fontWeight:600,
                        textAlign:"center", transition:"all .15s",
                        ...(active ? btn.activeStyle : { background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", color:"rgba(255,255,255,.28)" }) }}
                        onClick={()=>markDay(todayKey, s.id, btn.val)}>
                        <span className="mark-full">{btn.full}</span>
                        <span className="mark-short">{btn.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ ...S.card, padding:16 }}>
            {showAdd ? (
              <div>
                <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter" && addSubject()} placeholder="e.g. Engineering Maths"
                  style={{ width:"100%", padding:"11px 14px", marginBottom:10,
                    background:"rgba(255,255,255,.04)", border:"1px solid rgba(167,139,250,.25)",
                    borderRadius:10, color:"#fff", fontSize:14, fontFamily:"inherit", fontWeight:500, outline:"none" }}/>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-base" style={{ flex:1, padding:11, borderRadius:10,
                    background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", color:"#fff",
                    fontWeight:700, fontSize:13, boxShadow:"0 4px 18px rgba(124,58,237,.4)" }}
                    onClick={addSubject}>Add Subject</button>
                  <button className="btn-base" style={{ padding:"11px 16px", borderRadius:10,
                    background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                    color:"rgba(255,255,255,.4)", fontSize:13 }}
                    onClick={()=>{ setShowAdd(false); setNewName(""); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-base" style={{ width:"100%", padding:"14px", borderRadius:14,
                background:"rgba(167,139,250,.03)", border:"1px dashed rgba(167,139,250,.2)",
                color:"rgba(167,139,250,.45)", fontSize:13, fontWeight:600 }}
                onClick={()=>setShowAdd(true)}
                onMouseOver={e=>{ e.currentTarget.style.background="rgba(167,139,250,.08)"; e.currentTarget.style.color=C.violet; e.currentTarget.style.borderColor="rgba(167,139,250,.4)"; }}
                onMouseOut={e=>{ e.currentTarget.style.background="rgba(167,139,250,.03)"; e.currentTarget.style.color="rgba(167,139,250,.45)"; e.currentTarget.style.borderColor="rgba(167,139,250,.2)"; }}>
                + Add Subject
              </button>
            )}
          </div>
        </div>

        {/* CALENDAR */}
        <div style={{ ...S.card, overflow:"hidden", opacity:calIn ? 1 : 0, transition:"opacity .4s ease" }}>
          <div style={{ padding:"16px 18px 14px",
            background:"linear-gradient(135deg,rgba(167,139,250,.07),rgba(244,114,182,.04))",
            borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              {[
                { dir:"prev", label:"‹", action:()=>{ setSelDay(null); if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); } },
                null,
                { dir:"next", label:"›", action:()=>{ setSelDay(null); if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); } },
              ].map((item,idx)=> item ? (
                <button key={item.dir} className="btn-base" style={{ width:32, height:32, borderRadius:9,
                  background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
                  color:"rgba(255,255,255,.4)", fontSize:17,
                  display:"flex", alignItems:"center", justifyContent:"center" }}
                  onClick={item.action}
                  onMouseOver={e=>{ e.currentTarget.style.background="rgba(167,139,250,.12)"; e.currentTarget.style.color=C.violet; }}
                  onMouseOut={e=>{ e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.color="rgba(255,255,255,.4)"; }}>
                  {item.label}
                </button>
              ) : (
                <div key="mid" style={{ textAlign:"center" }}>
                  <p style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.2px" }}>
                    {MONTHS[calMonth]}<span style={{ color:"rgba(255,255,255,.35)", fontWeight:400, marginLeft:6 }}>{calYear}</span>
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginTop:1 }}>tap a day to log attendance</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"12px 14px 18px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
              {DAYS_SHORT.map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700,
                  letterSpacing:"0.08em", textTransform:"uppercase",
                  color:"rgba(255,255,255,.18)", padding:"3px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
              {Array.from({ length: firstDay }).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({ length: daysInMonth }).map((_,i)=>{
                const day  = i + 1;
                const dk   = dateKey(calYear, calMonth, day);
                const dc   = dotColor(dk);
                const isToday = dk === todayKey;
                const isSel   = selDay === day;
                return (
                  <button key={day} className="btn-base day-pop" style={{ animationDelay:`${i * 10}ms`,
                    aspectRatio:"1", borderRadius:10, position:"relative",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    fontSize:"clamp(9px,2.5vw,11px)", fontWeight: isSel||isToday ? 700 : 400,
                    border:`1px solid ${isSel ? "rgba(167,139,250,.5)" : isToday ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.05)"}`,
                    background: isSel ? "rgba(167,139,250,.16)" : isToday ? "rgba(255,255,255,.06)" : "transparent",
                    color: isSel ? C.violet : isToday ? "#fff" : "rgba(255,255,255,.42)",
                    boxShadow: isSel ? "0 0 14px rgba(167,139,250,.2)" : "none" }}
                    onClick={()=>setSelDay(isSel ? null : day)}>
                    {day}
                    {dc && <span style={{ position:"absolute", bottom:3, width:4, height:4,
                      borderRadius:"50%", background:dc, boxShadow:`0 0 5px ${dc}` }}/>}
                  </button>
                );
              })}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:14, paddingTop:12,
              borderTop:"1px solid rgba(255,255,255,.04)", justifyContent:"center" }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginRight:4 }}>Attendance</span>
              {[[C.safe,"Full"],[C.warn,"Partial"],[C.danger,"Low"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}`, display:"inline-block" }}/>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontWeight:500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DAY DETAIL */}
        {selDay && selKey && (
          <div className="fu" style={{ ...S.card, padding:"16px 18px",
            border:"1px solid rgba(167,139,250,.2)", boxShadow:"0 0 28px rgba(167,139,250,.08)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase",
                  color:"rgba(255,255,255,.22)", marginBottom:4 }}>Mark attendance</p>
                <p style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.3px" }}>{MONTHS[calMonth]} {selDay}, {calYear}</p>
              </div>
              <button className="del-x" style={{ fontSize:18 }} onClick={()=>setSelDay(null)}>✕</button>
            </div>
            {subjects.length===0 && <p style={{ fontSize:12, color:"rgba(255,255,255,.3)" }}>No subjects yet.</p>}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {subjects.map((s,i)=>{
                const cur = (calData[selKey]||{})[s.id] || "N";
                const sc  = SUBJ_COLORS[i % SUBJ_COLORS.length];
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                    borderRadius:12, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:sc.ring, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                    <div style={{ display:"flex", gap:4 }}>
                      {[
                        { val:"P", icon:"✓", ac:{ background:"linear-gradient(135deg,#052e16,#064e3b)", border:"1px solid #059669", color:C.safe } },
                        { val:"A", icon:"✗", ac:{ background:"linear-gradient(135deg,#2d0a0a,#450a0a)", border:"1px solid #dc2626", color:C.danger } },
                        { val:"N", icon:"—", ac:{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)", color:"rgba(255,255,255,.7)" } },
                      ].map(btn=>{
                        const active = cur === btn.val;
                        return (
                          <button key={btn.val} className="btn-base" style={{ width:34, height:34, borderRadius:8, fontSize:13, fontWeight:700,
                            ...(active ? btn.ac : { background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", color:"rgba(255,255,255,.25)" }) }}
                            onClick={()=>markDay(selKey, s.id, btn.val)}>{btn.icon}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* EXAM EDIT MODAL */}
      {showExamEdit && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.82)",
          backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center",
          padding:20, animation:"overlayIn .2s ease both" }}
          onClick={()=>setShowExamEdit(false)}>
          <div className="fu" style={{ width:"100%", maxWidth:360, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>Exam Dates</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Set your series schedule</p>
              </div>
              <button className="del-x" style={{ fontSize:18 }} onClick={()=>setShowExamEdit(false)}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:18 }}>
              {examDrafts.map((exam,i)=>(
                <div key={exam.id}>
                  <label style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase",
                    color:"rgba(255,255,255,.35)", display:"block", marginBottom:6 }}>{exam.label}</label>
                  <input type="date" value={exam.date}
                    onChange={e=>{ const d=[...examDrafts]; d[i]={...d[i],date:e.target.value}; setExamDrafts(d); }}
                    style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,.04)",
                      border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff",
                      fontSize:13, fontFamily:"inherit", outline:"none", colorScheme:"dark" }}
                    onFocus={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.4)"}
                    onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.1)"}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-base" style={{ flex:1, padding:12,
                background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:10,
                color:"#fff", fontWeight:800, fontSize:13, boxShadow:"0 4px 18px rgba(124,58,237,.4)" }}
                onClick={()=>saveExams(examDrafts)}>Save dates</button>
              <button className="btn-base" style={{ padding:"12px 16px", borderRadius:10,
                background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                color:"rgba(255,255,255,.4)", fontSize:13 }}
                onClick={()=>setShowExamEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TARGET MODAL */}
      {showTargetModal && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.82)",
          backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div className="fu" style={{ width:"100%", maxWidth:360, background:"#0f0f1e",
            border:"1px solid rgba(167,139,250,.22)", borderRadius:22, padding:24,
            boxShadow:"0 0 60px rgba(167,139,250,.12)" }}>
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.3px" }}>Attendance Target</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:3 }}>Different colleges have different requirements.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
              {[75,80,85].map(v=>{
                const active = targetInput === String(v);
                return (
                  <button key={v} className="btn-base" style={{ padding:"13px 4px", borderRadius:12,
                    fontSize:16, fontWeight:900,
                    background: active ? "rgba(167,139,250,.15)" : "rgba(255,255,255,.03)",
                    border:`1px solid ${active ? "rgba(167,139,250,.45)" : "rgba(255,255,255,.09)"}`,
                    color: active ? C.violet : "rgba(255,255,255,.4)",
                    boxShadow: active ? "0 0 16px rgba(167,139,250,.2)" : "none" }}
                    onClick={()=>setTargetInput(String(v))}>{v}%</button>
                );
              })}
            </div>
            <input type="number" min={1} max={100} value={targetInput}
              onChange={e=>setTargetInput(e.target.value)} placeholder="Custom %"
              style={{ width:"100%", padding:"10px 14px", marginBottom:16,
                background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)",
                borderRadius:10, color:"#fff", fontSize:13, fontFamily:"inherit",
                outline:"none", colorScheme:"dark" }}
              onFocus={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.4)"}
              onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.1)"}/>
            <button className="btn-base" style={{ width:"100%", padding:13,
              background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:11,
              color:"#fff", fontWeight:800, fontSize:14, boxShadow:"0 4px 20px rgba(124,58,237,.45)" }}
              onClick={saveTarget}>Save & continue</button>
          </div>
        </div>
      )}
    </div>
  );
}