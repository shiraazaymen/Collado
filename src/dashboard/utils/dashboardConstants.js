export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export const C = {
  safe:    "#34d399",
  warn:    "#fbbf24",
  danger:  "#f87171",
  violet:  "#a78bfa",
  pink:    "#f472b6",
  blue:    "#60a5fa",
  orange:  "#fb923c",
};

export const SUBJ_COLORS = [
  { ring: C.safe,   glow: "rgba(52,211,153,0.25)",   pill: "rgba(52,211,153,0.12)",   border: "rgba(52,211,153,0.3)",   text: C.safe   },
  { ring: C.blue,   glow: "rgba(96,165,250,0.25)",   pill: "rgba(96,165,250,0.12)",   border: "rgba(96,165,250,0.3)",   text: C.blue   },
  { ring: C.pink,   glow: "rgba(244,114,182,0.25)",  pill: "rgba(244,114,182,0.12)",  border: "rgba(244,114,182,0.3)",  text: C.pink   },
  { ring: C.orange, glow: "rgba(251,146,60,0.25)",   pill: "rgba(251,146,60,0.12)",   border: "rgba(251,146,60,0.3)",   text: C.orange },
  { ring: C.violet, glow: "rgba(167,139,250,0.25)",  pill: "rgba(167,139,250,0.12)",  border: "rgba(167,139,250,0.3)",  text: C.violet },
  { ring: C.warn,   glow: "rgba(251,191,36,0.25)",   pill: "rgba(251,191,36,0.12)",   border: "rgba(251,191,36,0.3)",   text: C.warn   },
];

export const DEFAULT_EXAMS = [
  { id:1, label:"Series 1", date:"" },
  { id:2, label:"Series 2", date:"" },
  { id:3, label:"Lab Exam", date:"" },
];
