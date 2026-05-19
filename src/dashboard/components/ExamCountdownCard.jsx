import { C } from "../utils/dashboardConstants";

export default function ExamCountdownCard({
  exams = [],
  overallPct = 0,
  safe = false,
  target = 75,
  cardStyle = {},
  onOpenEdit,
}) {
  const now = new Date();
  now.setHours(0,0,0,0);

  const upcoming = exams
    .filter(e=>e.date)
    .map(e=>{
      const d = new Date(e.date + "T00:00:00");
      return { ...e, diff: Math.ceil((d - now)/86400000) };
    })
    .filter(e=>e.diff >= 0)
    .sort((a,b)=>a.diff-b.diff);

  const nextExam = upcoming[0];
  const danger = overallPct < target && nextExam && nextExam.diff <= 14;

  return (
    <div className="fu fu1" style={{
      ...cardStyle,
      padding:"18px 20px",
      background: danger
        ? "linear-gradient(145deg,rgba(248,113,113,.10),rgba(255,255,255,.04))"
        : "linear-gradient(145deg,rgba(96,165,250,.10),rgba(255,255,255,.04))",
      border:`1px solid ${danger ? "rgba(248,113,113,.22)" : "rgba(255,255,255,.12)"}`,
      position:"relative",
      overflow:"hidden",
      boxShadow:`inset 0 1px 0 rgba(255,255,255,.15), 0 24px 70px rgba(0,0,0,.24), 0 0 42px ${danger ? "rgba(248,113,113,.07)" : "rgba(76,215,246,.06)"}`,
    }}>
      <div style={{
        position:"absolute",
        left:-30,
        bottom:-30,
        width:160,
        height:160,
        borderRadius:"50%",
        pointerEvents:"none",
        background:`radial-gradient(circle,${danger ? "rgba(248,113,113,.09)" : "rgba(96,165,250,.07)"} 0%,transparent 70%)`,
      }}/>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{
          fontSize:10,
          fontWeight:700,
          letterSpacing:"0.2em",
          textTransform:"uppercase",
          color:"rgba(255,255,255,.22)",
        }}>
          Upcoming Exams
        </span>
        <button
          className="btn-base"
          style={{
            padding:"5px 12px",
            borderRadius:8,
            fontSize:11,
            fontWeight:600,
            background:"rgba(255,255,255,.04)",
            border:"1px solid rgba(255,255,255,.09)",
            color:"rgba(255,255,255,.3)",
          }}
          onClick={onOpenEdit}
          onMouseOver={e=>{ e.currentTarget.style.color=C.violet; e.currentTarget.style.borderColor="rgba(167,139,250,.3)"; }}
          onMouseOut={e=>{ e.currentTarget.style.color="rgba(255,255,255,.3)"; e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; }}
        >
          Edit dates
        </button>
      </div>

      {nextExam ? (
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", zIndex:1, position:"relative" }}>
          <div style={{
            width:76,
            height:76,
            borderRadius:18,
            flexShrink:0,
            background: danger ? "rgba(248,113,113,.10)" : "rgba(96,165,250,.10)",
            border:`1px solid ${danger ? "rgba(248,113,113,.24)" : "rgba(96,165,250,.22)"}`,
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.12)",
            display:"flex",
            flexDirection:"column",
            alignItems:"center",
            justifyContent:"center",
          }}>
            <span style={{
              fontSize:30,
              fontWeight:900,
              lineHeight:1,
              color: danger ? C.danger : C.blue,
              textShadow:`0 0 24px ${danger ? C.danger : C.blue}88`,
            }}>
              {nextExam.diff}
            </span>
            <span style={{
              fontSize:9,
              fontWeight:700,
              letterSpacing:"0.18em",
              textTransform:"uppercase",
              color:"rgba(255,255,255,.25)",
              marginTop:2,
            }}>
              days
            </span>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:700, marginBottom:5 }}>
              {nextExam.label}
              <span style={{ color:"rgba(255,255,255,.32)", fontWeight:400 }}>
                {" · "}{nextExam.diff===0 ? "today" : nextExam.diff===1 ? "tomorrow" : `in ${nextExam.diff} days`}
              </span>
            </p>
            <p style={{ fontSize:12, fontWeight:600, color: danger ? C.danger : safe ? C.safe : C.warn }}>
              {danger
                ? `⚠ ${overallPct}% — exam block risk!`
                : safe ? `✓ ${overallPct}% — you're clear`
                : `${overallPct}% — stay consistent`}
            </p>
            {upcoming.length > 1 && (
              <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                {upcoming.slice(1).map(e=>(
                  <span key={e.id} style={{
                    fontSize:11,
                    fontWeight:500,
                    padding:"3px 10px",
                    borderRadius:20,
                    background:"rgba(255,255,255,.04)",
                    border:"1px solid rgba(255,255,255,.08)",
                    color: e.diff<=7 ? C.danger : e.diff<=14 ? C.warn : "rgba(255,255,255,.4)",
                  }}>
                    {e.label} · {e.diff===0 ? "today" : `${e.diff}d`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          className="btn-base"
          style={{
            width:"100%",
            padding:"14px 18px",
            borderRadius:14,
            textAlign:"left",
            background:"rgba(255,255,255,.02)",
            border:"1px dashed rgba(255,255,255,.1)",
            color:"rgba(255,255,255,.25)",
            fontSize:13,
            fontWeight:500,
          }}
          onClick={onOpenEdit}
          onMouseOver={e=>{ e.currentTarget.style.borderColor="rgba(167,139,250,.35)"; e.currentTarget.style.color=C.violet; }}
          onMouseOut={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; e.currentTarget.style.color="rgba(255,255,255,.25)"; }}
        >
          + Set series exam dates →
        </button>
      )}
    </div>
  );
}
