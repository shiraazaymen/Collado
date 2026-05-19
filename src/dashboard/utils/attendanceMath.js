import { C } from "./dashboardConstants";

export function buildAttendanceMap(subjects, calData) {
  const map = {};
  subjects.forEach(s => { map[s.id] = { present:0, total:0 }; });

  Object.values(calData).forEach(dayObj => {
    Object.entries(dayObj).forEach(([sid, status]) => {
      if (!map[sid]) return;
      if (status === "P") { map[sid].present++; map[sid].total++; }
      if (status === "A") { map[sid].total++; }
    });
  });

  return map;
}

export function pctFor(sid, attendance) {
  const { present, total } = attendance[sid] || { present:0, total:0 };
  return total === 0 ? 0 : Math.round((present / total) * 100);
}

export function canSkip(sid, attendance, target) {
  const { present, total } = attendance[sid] || { present:0, total:0 };
  let s = 0;
  while (Math.round((present / (total + s + 1)) * 100) >= target) s++;
  return s;
}

export function needMore(sid, attendance, target) {
  const { present, total } = attendance[sid] || { present:0, total:0 };
  const pct = total === 0 ? 0 : Math.round((present / total) * 100);
  if (pct >= target) return 0;

  let e = 0;
  while (Math.round(((present + e) / (total + e)) * 100) < target) e++;
  return e;
}

export function ringColor(pct, target) {
  if (pct >= target) return C.safe;
  if (pct >= target - 10) return C.warn;
  return C.danger;
}

export function dayCompletion(dk, calData) {
  const d = calData[dk];
  if (!d) return null;
  const active = Object.entries(d).filter(([,v]) => v === "P" || v === "A");
  if (!active.length) return null;
  return Math.round(active.filter(([,v]) => v === "P").length / active.length * 100);
}

export function dayDotColor(comp) {
  if (comp === null) return null;
  if (comp === 100) return C.safe;
  if (comp >= 60) return C.warn;
  return C.danger;
}
