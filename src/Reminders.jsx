import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, addDoc, deleteDoc,
  doc, updateDoc, serverTimestamp, orderBy, query } from "firebase/firestore";
 
/* ═══════════════════════════════════════════════════════════
   CollaDO — Tasks / Reminders  ·  FUNKY FANCY EDITION
   Matches Dashboard aesthetic exactly.
   All Firebase logic, state & calculations preserved.
   ═══════════════════════════════════════════════════════════ */
 
const TYPES = [
  { val:"assignment", label:"Assignment", color:"#fbbf24", pill:"rgba(251,191,36,.12)",  border:"rgba(251,191,36,.3)",  glow:"rgba(251,191,36,.2)"  },
  { val:"project",    label:"Project",    color:"#a78bfa", pill:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.3)", glow:"rgba(167,139,250,.2)" },
  { val:"reminder",   label:"Reminder",   color:"#60a5fa", pill:"rgba(96,165,250,.12)",  border:"rgba(96,165,250,.3)",  glow:"rgba(96,165,250,.2)"  },
];
 
function typeInfo(val){ return TYPES.find(t=>t.val===val) || TYPES[2]; }
 
export default function Reminders({ user, onNavigate }){
  const uid    = user.uid;
  const colRef = collection(db,"users",uid,"tasks");
  const q      = query(colRef, orderBy("createdAt","desc"));
 
  /* ── All original state ── */
  const [tasks,    setTasks]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [due,      setDue]      = useState("");
  const [type,     setType]     = useState("assignment");
  const [filter,   setFilter]   = useState("all");
 
  /* ── All original effects ── */
  useEffect(()=>onSnapshot(q,snap=>
    setTasks(snap.docs.map(d=>({id:d.id,...d.data()})))
  ),[uid]);
 
  /* ── All original handlers ── */
  async function addTask(){
    if(!title.trim()) return;
    await addDoc(colRef,{
      title:title.trim(), desc:desc.trim(),
      due, type, done:false,
      createdAt:serverTimestamp(),
    });
    setTitle(""); setDesc(""); setDue(""); setType("assignment");
    setShowForm(false);
  }
  async function toggleDone(task){
    await updateDoc(doc(db,"users",uid,"tasks",task.id),{ done:!task.done });
  }
  async function deleteTask(id){
    await deleteDoc(doc(db,"users",uid,"tasks",id));
  }
 
  function isOverdue(due,done){
    if(!due||done) return false;
    return new Date(due) < new Date(new Date().toDateString());
  }
  function daysLeft(due){
    if(!due) return null;
    const diff = Math.ceil((new Date(due)-new Date(new Date().toDateString()))/86400000);
    if(diff<0)   return { label:`${Math.abs(diff)}d overdue`, color:"#f87171" };
    if(diff===0) return { label:"Due today",                  color:"#fbbf24" };
    if(diff===1) return { label:"Tomorrow",                   color:"#fbbf24" };
    return { label:`${diff}d left`, color:"#34d399" };
  }
 
  const filtered = tasks.filter(t=>
    filter==="all"  ? true :
    filter==="done" ? t.done :
    filter==="todo" ? !t.done : t.type===filter
  );
  const pending = tasks.filter(t=>!t.done).length;
 
  /* ── Shared style atoms ── */
  const card    = { background:"#0f0f1c", borderRadius:20, border:"1px solid rgba(255,255,255,.07)", marginBottom:10 };
  const btnBase = { cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none", transition:"all .15s" };
 
  return(
    <div style={{ minHeight:"100vh", background:"#07070f",
      fontFamily:"'Outfit',sans-serif", color:"#fff",
      width:"100%", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{width:100%;background:#07070f;overflow-x:hidden;}
 
        @keyframes fadeUp {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes taskIn {from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
 
        .fu {animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;}
        .fu1{animation-delay:.05s}
        .fu2{animation-delay:.1s}
        .task-row{animation:taskIn .3s cubic-bezier(.22,1,.36,1) both;}
        .hov-lift{transition:transform .15s,box-shadow .15s;}
        .hov-lift:hover{transform:translateY(-1px);}
        .pill-btn{transition:all .15s;cursor:pointer;}
        .del-x{background:transparent;border:none;cursor:pointer;color:rgba(255,255,255,.12);font-size:14px;padding:2px 5px;transition:color .15s;font-family:inherit;}
        .del-x:hover{color:#f87171;}
        .check-box:hover{border-color:rgba(255,255,255,.3)!important;}
 
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#1f1f35;border-radius:4px;}
        @media(max-width:520px){.hide-sm{display:none!important;}}
      `}</style>
 
      {/* ═══ TOPBAR ═══ */}
      <header style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(7,7,15,.88)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,.06)",
        display:"flex", alignItems:"center", gap:12,
        padding:"0 16px", height:56,
      }}>
        {/* Back */}
        <button className="hov-lift" onClick={()=>onNavigate("dashboard")} style={{
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
            fontWeight:600, letterSpacing:"0.12em" }}>.tasks</span>
        </div>
 
        {/* Pending badge */}
        {pending > 0 && (
          <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:20,
            fontSize:12, fontWeight:700,
            background:"rgba(251,191,36,.12)",
            border:"1px solid rgba(251,191,36,.28)",
            color:"#fbbf24" }}>
            {pending} pending
          </div>
        )}
      </header>
 
      <main style={{ width:"100%", maxWidth:820, margin:"0 auto",
        padding:"20px clamp(14px,4vw,40px) 80px" }}>
 
        {/* ── Filter pills ── */}
        <div className="fu" style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {[
            { val:"all",        label:"All"         },
            { val:"todo",       label:"To do"       },
            { val:"assignment", label:"Assignments" },
            { val:"project",    label:"Projects"    },
            { val:"reminder",   label:"Reminders"   },
            { val:"done",       label:"Done ✓"      },
          ].map(f=>{
            const active = filter===f.val;
            const ti = f.val==="assignment" ? TYPES[0]
                     : f.val==="project"    ? TYPES[1]
                     : f.val==="reminder"   ? TYPES[2] : null;
            return(
              <button key={f.val} className="pill-btn" onClick={()=>setFilter(f.val)} style={{
                ...btnBase, padding:"6px 14px", borderRadius:20,
                fontSize:11, fontWeight:700,
                background: active
                  ? (ti ? ti.pill : "rgba(255,255,255,.1)")
                  : "rgba(255,255,255,.03)",
                color: active
                  ? (ti ? ti.color : "#fff")
                  : "rgba(255,255,255,.3)",
                border:`1px solid ${active
                  ? (ti ? ti.border : "rgba(255,255,255,.25)")
                  : "rgba(255,255,255,.07)"}`,
                boxShadow: active && ti ? `0 0 12px ${ti.glow}` : "none",
              }}>{f.label}</button>
            );
          })}
        </div>
 
        {/* ── Add form / button ── */}
        <div className="fu fu1" style={{ marginBottom:14 }}>
          {showForm ? (
            <div style={{ ...card, padding:"20px",
              border:"1px solid rgba(167,139,250,.2)",
              boxShadow:"0 0 28px rgba(167,139,250,.07)" }}>
              <p style={{ fontSize:14, fontWeight:800,
                letterSpacing:"-0.2px", marginBottom:16 }}>New Task</p>
 
              {/* Type selector */}
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {TYPES.map(t=>(
                  <button key={t.val} onClick={()=>setType(t.val)} style={{
                    ...btnBase, flex:1, padding:"9px 4px", borderRadius:10,
                    fontSize:11, fontWeight:700, border:"none",
                    background: type===t.val ? t.pill : "rgba(255,255,255,.03)",
                    color:      type===t.val ? t.color : "rgba(255,255,255,.3)",
                    border:`1px solid ${type===t.val ? t.border : "rgba(255,255,255,.07)"}`,
                    boxShadow:  type===t.val ? `0 0 12px ${t.glow}` : "none",
                  }}>{t.label}</button>
                ))}
              </div>
 
              {/* Title */}
              <input value={title} onChange={e=>setTitle(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTask()}
                placeholder="Title *"
                style={{ width:"100%", padding:"11px 14px", marginBottom:8,
                  background:"rgba(255,255,255,.04)",
                  border:"1px solid rgba(167,139,250,.2)",
                  borderRadius:10, color:"#fff", fontSize:14,
                  fontFamily:"inherit", fontWeight:500, outline:"none" }}
                onFocus={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.4)"}
                onBlur={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.2)"}/>
 
              {/* Description */}
              <textarea value={desc} onChange={e=>setDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                style={{ width:"100%", padding:"11px 14px", marginBottom:8,
                  background:"rgba(255,255,255,.04)",
                  border:"1px solid rgba(255,255,255,.08)",
                  borderRadius:10, color:"rgba(255,255,255,.7)", fontSize:13,
                  fontFamily:"inherit", outline:"none", resize:"vertical" }}
                onFocus={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.3)"}
                onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.08)"}/>
 
              {/* Due date */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em",
                  textTransform:"uppercase", color:"rgba(255,255,255,.25)",
                  flexShrink:0 }}>Due</span>
                <input type="date" value={due} onChange={e=>setDue(e.target.value)}
                  style={{ flex:1, padding:"9px 14px",
                    background:"rgba(255,255,255,.04)",
                    border:"1px solid rgba(255,255,255,.08)",
                    borderRadius:10, color:"#fff", fontSize:13,
                    fontFamily:"inherit", outline:"none", colorScheme:"dark" }}
                  onFocus={e=>e.currentTarget.style.borderColor="rgba(167,139,250,.3)"}
                  onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.08)"}/>
              </div>
 
              {/* Actions */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addTask} style={{ ...btnBase, flex:1, padding:11,
                  borderRadius:10, border:"none",
                  background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                  color:"#fff", fontWeight:800, fontSize:13,
                  boxShadow:"0 4px 18px rgba(124,58,237,.4)" }}>
                  Add Task
                </button>
                <button onClick={()=>{ setShowForm(false); setTitle(""); setDesc(""); setDue(""); }} style={{
                  ...btnBase, padding:"11px 16px", borderRadius:10,
                  background:"transparent", border:"1px solid rgba(255,255,255,.09)",
                  color:"rgba(255,255,255,.4)", fontSize:13 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowForm(true)} style={{
              ...btnBase, width:"100%", padding:14, borderRadius:18,
              background:"rgba(167,139,250,.03)",
              border:"1px dashed rgba(167,139,250,.2)",
              color:"rgba(167,139,250,.45)", fontSize:13, fontWeight:600 }}
              onMouseOver={e=>{ e.currentTarget.style.background="rgba(167,139,250,.08)";
                e.currentTarget.style.color="#a78bfa";
                e.currentTarget.style.borderColor="rgba(167,139,250,.4)"; }}
              onMouseOut={e=>{ e.currentTarget.style.background="rgba(167,139,250,.03)";
                e.currentTarget.style.color="rgba(167,139,250,.45)";
                e.currentTarget.style.borderColor="rgba(167,139,250,.2)"; }}>
              + Add Assignment / Project / Reminder
            </button>
          )}
        </div>
 
        {/* ── Stats row ── */}
        {tasks.length > 0 && (
          <div className="fu fu2" style={{ display:"grid",
            gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
            {[
              { label:"Total",   val:tasks.length,                                     color:"#a78bfa", glow:"rgba(167,139,250,.15)" },
              { label:"Pending", val:pending,                                           color:"#fbbf24", glow:"rgba(251,191,36,.15)"  },
              { label:"Done",    val:tasks.filter(t=>t.done).length,                   color:"#34d399", glow:"rgba(52,211,153,.15)"  },
            ].map(stat=>(
              <div key={stat.label} style={{ ...card, padding:"14px 12px",
                textAlign:"center", marginBottom:0, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, pointerEvents:"none",
                  background:`radial-gradient(circle at 50% 0%,${stat.glow} 0%,transparent 70%)` }}/>
                <p style={{ fontSize:"clamp(22px,6vw,30px)", fontWeight:900,
                  letterSpacing:"-1px", color:stat.color,
                  textShadow:`0 0 20px ${stat.color}44`,
                  marginBottom:4, position:"relative" }}>{stat.val}</p>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em",
                  textTransform:"uppercase", color:"rgba(255,255,255,.22)",
                  position:"relative" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}
 
        {/* ── Empty state ── */}
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"52px 0",
            color:"rgba(255,255,255,.12)" }}>
            <p style={{ fontSize:40, marginBottom:10 }}>✓</p>
            <p style={{ fontSize:14, fontWeight:600 }}>Nothing here</p>
            <p style={{ fontSize:12, marginTop:4, color:"rgba(255,255,255,.1)" }}>
              {filter==="done" ? "No completed tasks yet" : "Add a task to get started"}
            </p>
          </div>
        )}
 
        {/* ── Task list ── */}
        {filtered.map((task,i)=>{
          const ti      = typeInfo(task.type);
          const dl      = daysLeft(task.due);
          const overdue = isOverdue(task.due, task.done);
 
          return(
            <div key={task.id} className="task-row hov-lift" style={{
              animationDelay:`${i*0.05}s`,
              ...card,
              border:`1px solid ${
                overdue ? "rgba(248,113,113,.25)"
                : task.done ? "rgba(255,255,255,.04)"
                : "rgba(255,255,255,.07)"}`,
              opacity: task.done ? 0.55 : 1,
              overflow:"hidden",
              background: overdue ? "rgba(248,113,113,.04)" : "#0f0f1c",
            }}>
              {/* Top color accent per type */}
              {!task.done && (
                <div style={{ height:2,
                  background:`linear-gradient(90deg,${ti.color} 0%,transparent 100%)` }}/>
              )}
 
              <div style={{ padding:"14px 16px",
                display:"flex", alignItems:"flex-start", gap:12 }}>
 
                {/* Checkbox */}
                <button className="check-box" onClick={()=>toggleDone(task)} style={{
                  ...btnBase, width:22, height:22, borderRadius:7, flexShrink:0,
                  border:`1.5px solid ${task.done ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.15)"}`,
                  background: task.done ? "rgba(52,211,153,.15)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  marginTop:1,
                }}>
                  {task.done && (
                    <span style={{ color:"#34d399", fontSize:13, fontWeight:800 }}>✓</span>
                  )}
                </button>
 
                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Type badge + title */}
                  <div style={{ display:"flex", alignItems:"center",
                    gap:7, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontSize:9, fontWeight:800,
                      letterSpacing:"0.12em", textTransform:"uppercase",
                      padding:"2px 8px", borderRadius:20,
                      background:ti.pill, color:ti.color,
                      border:`1px solid ${ti.border}`, flexShrink:0 }}>
                      {ti.label}
                    </span>
                    <p style={{ fontWeight:700, fontSize:14,
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? "rgba(255,255,255,.3)" : "#fff",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {task.title}
                    </p>
                  </div>
 
                  {/* Description */}
                  {task.desc && (
                    <p style={{ color:"rgba(255,255,255,.35)", fontSize:12,
                      marginBottom:6, lineHeight:1.5 }}>{task.desc}</p>
                  )}
 
                  {/* Due date row */}
                  {task.due && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,.22)",
                        fontWeight:500 }}>
                        {new Date(task.due+"T00:00:00").toLocaleDateString("en-IN",
                          { day:"numeric", month:"short", year:"numeric" })}
                      </span>
                      {dl && !task.done && (
                        <span style={{ fontSize:11, fontWeight:700,
                          padding:"2px 9px", borderRadius:20,
                          background:`${dl.color}18`,
                          border:`1px solid ${dl.color}44`,
                          color:dl.color }}>
                          {dl.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
 
                {/* Delete */}
                <button className="del-x" onClick={()=>deleteTask(task.id)}>✕</button>
              </div>
            </div>
          );
        })}
 
      </main>
    </div>
  );
}