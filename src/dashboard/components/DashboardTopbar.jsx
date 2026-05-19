import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { C } from "../utils/dashboardConstants";

export default function DashboardTopbar({
  menuOpen,
  onMenuToggle,
  overallPct = 0,
  safe = false,
}) {
  return (
    <header style={{
      position:"sticky",
      top:0,
      zIndex:50,
      height:64,
      padding:"0 clamp(16px,4vw,40px)",
      display:"flex",
      alignItems:"center",
      gap:14,
      background:"rgba(255,255,255,.075)",
      backdropFilter:"blur(28px)",
      WebkitBackdropFilter:"blur(28px)",
      borderBottom:"1px solid rgba(255,255,255,.10)",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,.14), 0 12px 40px rgba(0,0,0,.18)",
    }}>
      <button
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
        className="btn-base"
        style={{
          width:40,
          height:40,
          borderRadius:999,
          background:"rgba(255,255,255,.10)",
          border:"1px solid rgba(255,255,255,.12)",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,.14)",
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          gap:4,
        }}
      >
        {[14,10,6].map((w,i)=>(
          <span
            key={i}
            style={{
              display:"block",
              width:w,
              height:1.5,
              background:"rgba(255,255,255,0.5)",
              borderRadius:2,
              transition:"all .25s",
              transform: menuOpen
                ? i===0
                  ? "rotate(45deg) translate(3.5px,3.5px)"
                  : i===2
                    ? "rotate(-45deg) translate(3.5px,-3.5px)"
                    : "scaleX(0)"
                : "none",
              opacity: menuOpen && i===1 ? 0 : 1,
            }}
          />
        ))}
      </button>

      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
        <span style={{
          fontSize:20,
          fontWeight:850,
          letterSpacing:"-0.6px",
          background:"linear-gradient(100deg,#c0c1ff 0%,#4cd7f6 100%)",
          WebkitBackgroundClip:"text",
          WebkitTextFillColor:"transparent",
        }}>
          CollaDO
        </span>
        <span style={{
          fontSize:10,
          color:"rgba(229,226,227,.48)",
          fontWeight:700,
          letterSpacing:"0.12em",
        }}>
          .track
        </span>
      </div>

      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          padding:"7px 13px",
          borderRadius:999,
          fontSize:12,
          fontWeight:850,
          background: safe ? "rgba(52,211,153,.13)" : "rgba(248,113,113,.13)",
          border:`1px solid ${safe ? "rgba(52,211,153,.30)" : "rgba(248,113,113,.30)"}`,
          color: safe ? C.safe : C.danger,
          boxShadow:"inset 0 1px 0 rgba(255,255,255,.10)",
        }}>
          {overallPct}% {safe ? "✓" : "⚠"}
        </div>

        <button
          type="button"
          onClick={()=>signOut(auth)}
          className="btn-base hide-sm"
          style={{
            padding:"8px 15px",
            borderRadius:999,
            fontSize:12,
            fontWeight:800,
            background:"rgba(255,255,255,.10)",
            border:"1px solid rgba(255,255,255,.12)",
            color:"rgba(229,226,227,.72)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.12)",
          }}
          onMouseOver={e=>{
            e.currentTarget.style.color=C.danger;
            e.currentTarget.style.borderColor="rgba(248,113,113,.3)";
          }}
          onMouseOut={e=>{
            e.currentTarget.style.color="rgba(229,226,227,.72)";
            e.currentTarget.style.borderColor="rgba(255,255,255,.12)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}