"use client";

import { useEffect, useRef, useState } from "react";

export type GNode = { id: string; label: string; kind?: "accent" | "metric" };
export type GLink = { s: string; t: string };

const W = 420;
const H = 340;

type P = Record<string, { x: number; y: number; vx: number; vy: number }>;

/**
 * Dependency-free force-directed graph. Repulsion + link springs + center
 * gravity, integrated with damping so it settles into ambient stillness.
 * Stops the animation loop once kinetic energy is low; honors reduced-motion.
 */
export function ForceGraph({ nodes, links }: { nodes: GNode[]; links: GLink[] }) {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p: P = {};
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      p[n.id] = { x: W / 2 + Math.cos(a) * 120, y: H / 2 + Math.sin(a) * 95, vx: 0, vy: 0 };
    });

    const snap = () => {
      const o: Record<string, { x: number; y: number }> = {};
      for (const k in p) o[k] = { x: p[k].x, y: p[k].y };
      return o;
    };

    const step = (): number => {
      for (let i = 0; i < nodes.length; i++) {
        const a = p[nodes[i].id];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = p[nodes[j].id];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy || 0.01;
          const d = Math.sqrt(d2);
          const f = 1100 / d2;
          a.vx += (dx / d) * f;
          a.vy += (dy / d) * f;
          b.vx -= (dx / d) * f;
          b.vy -= (dy / d) * f;
        }
      }
      for (const l of links) {
        const a = p[l.s];
        const b = p[l.t];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const f = (d - 74) * 0.02;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      let energy = 0;
      for (const n of nodes) {
        const q = p[n.id];
        q.vx += (W / 2 - q.x) * 0.004;
        q.vy += (H / 2 - q.y) * 0.004;
        q.vx *= 0.86;
        q.vy *= 0.86;
        q.x += q.vx;
        q.y += q.vy;
        energy += q.vx * q.vx + q.vy * q.vy;
      }
      return energy;
    };

    if (reduce) {
      for (let i = 0; i < 160; i++) step();
      setPos(snap());
      return;
    }

    for (let i = 0; i < 50; i++) step();
    setPos(snap());
    let frame = 0;
    const loop = () => {
      const energy = step();
      if (++frame % 2 === 0) setPos(snap());
      if (energy < 0.05) {
        setPos(snap());
        return; // settled
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [nodes, links]);

  if (!pos) return <div className="w-full" style={{ aspectRatio: `${W} / ${H}` }} aria-hidden />;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="ontology graph">
      {links.map((l, i) => {
        const a = pos[l.s];
        const b = pos[l.t];
        if (!a || !b) return null;
        const lit = hover === l.s || hover === l.t;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={lit ? "#34406b" : "#1d222b"}
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((n) => {
        const q = pos[n.id];
        if (!q) return null;
        const fill = n.kind === "accent" ? "#7fae93" : n.kind === "metric" ? "#d8a657" : "#3a4250";
        const r = n.kind ? 4.5 : 3;
        const lit = hover === n.id;
        return (
          <g
            key={n.id}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            className="cursor-default"
          >
            <circle cx={q.x} cy={q.y} r={lit ? r + 2 : r} fill={fill} />
            {lit && (
              <text
                x={q.x + 8}
                y={q.y + 3}
                fontSize="10"
                fill="#e6e8ec"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
