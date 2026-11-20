"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#5B7355", "#C89B3C", "#7C8A99", "#A23E32", "#C4BBA3",
  "#8A5A3A", "#6B5AA5", "#3A9A8A",
];

export default function Donut({ segments, total, centerLabel, onSlickClick }) {
  const [animatedIn, setAnimatedIn] = useState(false);
  const r = 80;
  const cx = 95;
  const cy = 95;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    setAnimatedIn(false);
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimatedIn(true))
    );
    return () => cancelAnimationFrame(t);
  }, [segments]);

  let cumulative = 0;
  const arcs = segments.map((s, i) => {
    const frac = total > 0 ? s.total / total : 0;
    const len = frac * circumference;
    const offset = animatedIn ? -cumulative : circumference - cumulative;
    const arc = { ...s, len, offset, color: COLORS[i % COLORS.length] };
    cumulative += len;
    return arc;
  });

  return (
    <div className="pie-wrap">
      <div className="stamp-ring">
        <div className="dash-border" />
        <svg width="190" height="190" viewBox="0 0 190 190">
          {arcs.map((a) => (
            <circle
              key={a.category_id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth="26"
              strokeDasharray={`${a.len} ${circumference - a.len}`}
              strokeDashoffset={a.offset}
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.2,1)",
                cursor: onSlickClick ? "pointer" : "default",
              }}
              onClick={() => onSlickClick && onSlickClick(a)}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
        </svg>
        <div className="donut-center">
          <div className="amt">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="lbl">{centerLabel}</div>
        </div>
      </div>
      <div className="legend">
        {arcs.map((a) => (
          <button
            key={a.category_id}
            className="legend-item"
            onClick={() => onSlickClick && onSlickClick(a)}
            type="button"
          >
            <span className="sw" style={{ background: a.color }} />
            {a.category_name || a.user_name}
          </button>
        ))}
      </div>
    </div>
  );
}
