import Ring from "./Ring";
import { C } from "../utils/dashboardConstants";
import { ringColor } from "../utils/attendanceMath";

export default function OverallAttendanceCard({
  overallPct = 0,
  target = 75,
  safe = false,
  cardStyle = {},
  onChangeTarget,
}) {
  const overallRingColor = ringColor(overallPct, target);

  return (
    <div className="fu" style={{
      ...cardStyle,
      padding:"22px 22px",
      background:"linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.045))",
      border:"1px solid rgba(255,255,255,.12)",
      display:"flex",
      alignItems:"center",
      gap:20,
      position:"relative",
      overflow:"hidden",
      boxShadow:`inset 0 1px 0 rgba(255,255,255,.15), 0 24px 70px rgba(0,0,0,.24), 0 0 44px ${safe ? "rgba(52,211,153,.07)" : "rgba(248,113,113,.07)"}`,
    }}>
      <div style={{
        position:"absolute",
        right:-50,
        top:-50,
        width:220,
        height:220,
        borderRadius:"50%",
        pointerEvents:"none",
        background:`radial-gradient(circle,${safe ? "rgba(52,211,153,.09)" : "rgba(248,113,113,.09)"} 0%,transparent 70%)`,
      }}/>

      <div style={{ flexShrink:0 }}>
        <div style={{
          fontSize:"clamp(50px,12vw,72px)",
          fontWeight:850,
          letterSpacing:"-4px",
          lineHeight:1,
          color:"rgba(245,245,247,.96)",
          textShadow:`0 0 44px ${overallRingColor}55`,
          fontVariantNumeric:"tabular-nums",
        }}>
          {overallPct}<span style={{
            fontSize:"clamp(22px,5vw,32px)",
            fontWeight:750,
            letterSpacing:"-1px",
            color:overallRingColor,
          }}>%</span>
        </div>
        <p style={{
          fontSize:10,
          fontWeight:800,
          letterSpacing:"0.22em",
          textTransform:"uppercase",
          color:"rgba(229,226,227,.34)",
          marginTop:6,
        }}>
          Overall
        </p>
      </div>

      <div style={{ flex:1, zIndex:1 }}>
        <div style={{
          display:"inline-flex",
          alignItems:"center",
          gap:8,
          padding:"7px 14px",
          borderRadius:999,
          marginBottom:12,
          background: safe ? "rgba(52,211,153,.12)" : "rgba(248,113,113,.12)",
          border:`1px solid ${safe ? "rgba(52,211,153,.28)" : "rgba(248,113,113,.28)"}`,
          boxShadow:"inset 0 1px 0 rgba(255,255,255,.10)",
        }}>
          <span style={{
            width:6,
            height:6,
            borderRadius:"50%",
            flexShrink:0,
            background: safe ? C.safe : C.danger,
            boxShadow:`0 0 8px ${safe ? C.safe : C.danger}`,
          }}/>
          <span style={{
            fontSize:11,
            fontWeight:700,
            letterSpacing:"0.12em",
            textTransform:"uppercase",
            color: safe ? C.safe : C.danger,
          }}>
            {safe ? "You're safe" : "At risk"}
          </span>
        </div>
        <p style={{ fontSize:16, fontWeight:700, lineHeight:1.3, marginBottom:5 }}>
          {safe ? "Keep the streak going." : "Attend more sessions."}
        </p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,.38)", lineHeight:1.5 }}>
          {safe
            ? `${overallPct - target}% above your ${target}% target — you can relax.`
            : `${target - overallPct}% short of ${target}% — focus this week.`}
        </p>
        <button className="btn-base" style={{
          marginTop:10,
          fontSize:11,
          color:"rgba(255,255,255,.25)",
          textDecoration:"underline",
          textDecorationColor:"rgba(255,255,255,.1)",
          background:"transparent",
        }} onClick={onChangeTarget}>
          Change target ({target}%)
        </button>
      </div>

      <div style={{ position:"relative", flexShrink:0 }}>
        <Ring pct={overallPct} size={78} stroke={6} color={overallRingColor}/>
        <div style={{
          position:"absolute",
          inset:0,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          fontSize:12,
          fontWeight:800,
          color:overallRingColor,
        }}>
          {overallPct}%
        </div>
      </div>
    </div>
  );
}
