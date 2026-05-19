export default function Ring({ pct, size, stroke, color, trackColor = "rgba(255,255,255,0.06)" }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;

  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", display:"block", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
      <circle
        cx={size/2}
        cy={size/2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}
