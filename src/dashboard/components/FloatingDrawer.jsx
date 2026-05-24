import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { C } from "../utils/dashboardConstants";

const COLLADO_FOCUS_URL = "https://collado-focus.vercel.app/";

export default function FloatingDrawer({
  menuOpen,
  setMenuOpen,
  user,
  onNavigate,
  target = 75,
  setTargetInput,
  setShowTargetModal,
}) {
  if (!menuOpen) return null;

  const navItems = [
    { label:"Dashboard", page:"dashboard", color:C.violet, symbol:"◈" },
    { label:"Tasks",     page:"reminders", color:C.blue,   symbol:"◆" },
    { label:"Pomodoro",  page:"pomodoro",  color:C.pink,   symbol:"◎" },
  ];

  return (
    <div
      style={{
        position:"fixed",
        inset:0,
        zIndex:200,
        animation:"overlayIn .2s ease both",
        padding:"14px",
      }}
      onClick={()=>setMenuOpen?.(false)}
    >
      <div style={{
        position:"absolute",
        inset:0,
        background:"rgba(0,0,0,.58)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
      }}/>

      <aside onClick={e=>e.stopPropagation()} style={{
        position:"relative",
        height:"calc(100vh - 28px)",
        width:"min(310px, calc(100vw - 28px))",
        borderRadius:32,
        background:"linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.055))",
        border:"1px solid rgba(255,255,255,.13)",
        backdropFilter:"blur(32px)",
        WebkitBackdropFilter:"blur(32px)",
        boxShadow:"inset 0 1px 0 rgba(255,255,255,.16), 0 28px 80px rgba(0,0,0,.46)",
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        animation:"slideIn .32s cubic-bezier(.22,1,.36,1) both",
      }}>
        <div style={{ padding:"26px 22px 20px", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:42,
              height:42,
              borderRadius:16,
              background:"linear-gradient(135deg,#c0c1ff,#4cd7f6)",
              color:"#131449",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:18,
              fontWeight:900,
              boxShadow:"0 0 24px rgba(192,193,255,.32)",
              flexShrink:0,
            }}>
              C
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:20, fontWeight:850, letterSpacing:"-0.6px", color:"rgba(245,245,247,.95)", lineHeight:1 }}>
                CollaDO<span style={{ color:"rgba(229,226,227,.45)", fontSize:11, letterSpacing:"0.12em" }}>.track</span>
              </p>
              <p style={{
                fontSize:11,
                color:"rgba(76,215,246,.82)",
                fontWeight:700,
                letterSpacing:"0.12em",
                textTransform:"uppercase",
                marginTop:6,
              }}>
                Productivity Mode
              </p>
            </div>
          </div>

          <p style={{
            fontSize:12,
            color:"rgba(229,226,227,.38)",
            marginTop:14,
            overflow:"hidden",
            textOverflow:"ellipsis",
            whiteSpace:"nowrap",
          }}>
            {user?.email}
          </p>
        </div>

        <div style={{ flex:1, padding:"18px 14px", overflowY:"auto" }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,.2)", padding:"0 10px", marginBottom:8 }}>
            Navigate
          </p>
          {navItems.map(item=>(
            <button key={item.page} className="btn-base" style={{
              width:"100%",
              padding:"14px 16px",
              borderRadius:22,
              background:item.page==="dashboard" ? "rgba(192,193,255,.15)" : "transparent",
              border:item.page==="dashboard" ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
              color:item.page==="dashboard" ? "#c0c1ff" : "rgba(199,197,208,.68)",
              fontSize:15,
              fontWeight:item.page==="dashboard" ? 750 : 600,
              textAlign:"left",
              display:"flex",
              alignItems:"center",
              gap:14,
              marginBottom:6,
              boxShadow:item.page==="dashboard" ? "0 0 18px rgba(192,193,255,.12), inset 0 1px 0 rgba(255,255,255,.08)" : "none",
            }}
              onClick={()=>{ setMenuOpen?.(false); onNavigate?.(item.page); }}
              onMouseOver={e=>{ e.currentTarget.style.background=`${item.color}18`; e.currentTarget.style.color="#fff"; }}
              onMouseOut={e=>{ e.currentTarget.style.background=item.page==="dashboard" ? "rgba(192,193,255,.15)" : "transparent"; e.currentTarget.style.color=item.page==="dashboard" ? "#c0c1ff" : "rgba(199,197,208,.68)"; }}>
              <span style={{ color:item.page==="dashboard" ? "#4cd7f6" : item.color, fontSize:18, width:22, textAlign:"center" }}>
                {item.symbol}
              </span>
              {item.label}
            </button>
          ))}

          <div style={{
            margin:"16px 2px 0",
            padding:"16px",
            borderRadius:24,
            background:"linear-gradient(145deg,rgba(255,255,255,.085),rgba(255,255,255,.04))",
            border:"1px solid rgba(255,255,255,.10)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.12), 0 14px 38px rgba(0,0,0,.22), 0 0 34px rgba(76,215,246,.055)",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
              <span style={{
                width:34,
                height:34,
                borderRadius:14,
                flexShrink:0,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                background:"linear-gradient(135deg,rgba(192,193,255,.18),rgba(76,215,246,.12))",
                border:"1px solid rgba(192,193,255,.20)",
                color:"#c0c1ff",
                fontSize:15,
                fontWeight:900,
                boxShadow:"inset 0 1px 0 rgba(255,255,255,.12)",
              }}>
                ◌
              </span>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:850, color:"rgba(245,245,247,.94)", letterSpacing:"-0.2px" }}>
                  Focus Mode
                </p>
                <p style={{ fontSize:12, lineHeight:1.45, color:"rgba(229,226,227,.48)", marginTop:3 }}>
                  Open the standalone immersive focus timer.
                </p>
              </div>
            </div>
            <a
              href={COLLADO_FOCUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-base"
              style={{
                width:"100%",
                minHeight:42,
                borderRadius:18,
                background:"rgba(192,193,255,.13)",
                border:"1px solid rgba(192,193,255,.22)",
                color:"#c0c1ff",
                fontSize:12,
                fontWeight:850,
                textDecoration:"none",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,.12)",
              }}
              onMouseOver={e=>{
                e.currentTarget.style.background="rgba(76,215,246,.14)";
                e.currentTarget.style.borderColor="rgba(76,215,246,.28)";
                e.currentTarget.style.color="#4cd7f6";
              }}
              onMouseOut={e=>{
                e.currentTarget.style.background="rgba(192,193,255,.13)";
                e.currentTarget.style.borderColor="rgba(192,193,255,.22)";
                e.currentTarget.style.color="#c0c1ff";
              }}
            >
              Open CollaDO Focus
            </a>
          </div>
        </div>

        <div style={{ padding:"16px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
          <button
            className="btn-base"
            style={{
              width:"100%",
              padding:"13px 15px",
              borderRadius:22,
              marginBottom:10,
              background:"rgba(255,255,255,.055)",
              border:"1px solid rgba(255,255,255,.08)",
              color:"rgba(229,226,227,.68)",
              fontSize:13,
              fontWeight:650,
              textAlign:"left",
              display:"flex",
              alignItems:"center",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,.08)",
            }}
            onClick={()=>{ setTargetInput?.(String(target)); setShowTargetModal?.(true); setMenuOpen?.(false); }}
            onMouseOver={e=>{ e.currentTarget.style.color=C.violet; e.currentTarget.style.borderColor="rgba(167,139,250,.24)"; }}
            onMouseOut={e=>{ e.currentTarget.style.color="rgba(229,226,227,.68)"; e.currentTarget.style.borderColor="rgba(255,255,255,.08)"; }}
          >
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(229,226,227,.36)" }}>
              Target
            </span>
            <span style={{ marginLeft:"auto", color:"#c0c1ff", fontWeight:850, fontSize:15 }}>
              {target}%
            </span>
          </button>

          <button
            className="btn-base"
            style={{
              width:"100%",
              padding:"13px 15px",
              borderRadius:22,
              background:"rgba(248,113,113,.08)",
              border:"1px solid rgba(248,113,113,.18)",
              color:"#f87171",
              fontSize:13,
              fontWeight:800,
              boxShadow:"inset 0 1px 0 rgba(255,255,255,.06)",
            }}
            onClick={()=>signOut(auth)}
            onMouseOver={e=>e.currentTarget.style.background="rgba(248,113,113,.13)"}
            onMouseOut={e=>e.currentTarget.style.background="rgba(248,113,113,.08)"}
          >
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
