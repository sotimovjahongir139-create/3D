function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function SemiDonutGauge({ percentage }: { percentage: number }) {
  const pct = Math.max(0, Math.min(100, percentage));
  const cx = 100;
  const cy = 100;
  const r = 78;
  const angle = 180 + (pct / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 115" className="w-full max-w-[220px]">
        <path d={describeArc(cx, cy, r, 180, 360)} stroke="#F3F4F6" strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, 180, angle)} stroke="#5B4FE9" strokeWidth={16} fill="none" strokeLinecap="round" />
      </svg>
      <div className="-mt-10 text-center">
        <div className="font-display text-3xl font-extrabold text-ink">{Math.round(pct)}%</div>
        <div className="text-xs text-ink/50">bajarildi</div>
      </div>
    </div>
  );
}
