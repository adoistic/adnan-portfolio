"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type GNode = { id: string; label: string; kind?: "accent" | "metric" };
export type GLink = { s: string; t: string };

const W = 440;
const H = 360;

type P = Record<string, { x: number; y: number; vx: number; vy: number }>;

/**
 * Dependency-free force-directed graph. Repulsion + link springs + center
 * gravity with damping, plus a small continuous wander so it breathes instead
 * of freezing. Anchor nodes (accent/metric) are always labelled; hovering any
 * node reveals its label, lights its links, and surfaces its neighbours.
 * Honors prefers-reduced-motion (settles to a static layout, no loop).
 */
export function ForceGraph({ nodes, links }: { nodes: GNode[]; links: GLink[] }) {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  // Adjacency, for neighbour highlighting on hover.
  const adj = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    for (const n of nodes) m[n.id] = new Set();
    for (const l of links) {
      m[l.s]?.add(l.t);
      m[l.t]?.add(l.s);
    }
    return m;
  }, [nodes, links]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p: P = {};
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      p[n.id] = { x: W / 2 + Math.cos(a) * 130, y: H / 2 + Math.sin(a) * 100, vx: 0, vy: 0 };
    });

    const snap = () => {
      const o: Record<string, { x: number; y: number }> = {};
      for (const k in p) o[k] = { x: p[k].x, y: p[k].y };
      return o;
    };

    let t = 0;
    const step = (wander: boolean) => {
      t += 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = p[nodes[i].id];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = p[nodes[j].id];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy || 0.01;
          const d = Math.sqrt(d2);
          const f = 1200 / d2;
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
        const f = (d - 78) * 0.02;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      nodes.forEach((n, i) => {
        const q = p[n.id];
        q.vx += (W / 2 - q.x) * 0.004;
        q.vy += (H / 2 - q.y) * 0.004;
        // Gentle perpetual drift so the graph is alive, not frozen.
        if (wander) {
          q.vx += Math.sin(t * 0.02 + i * 1.7) * 0.18;
          q.vy += Math.cos(t * 0.017 + i * 2.3) * 0.18;
        }
        q.vx *= 0.94;
        q.vy *= 0.94;
        q.x = Math.max(14, Math.min(W - 14, q.x + q.vx));
        q.y = Math.max(14, Math.min(H - 14, q.y + q.vy));
      });
    };

    if (reduce) {
      for (let i = 0; i < 200; i++) step(false);
      setPos(snap());
      return;
    }

    for (let i = 0; i < 60; i++) step(false); // settle before first paint
    setPos(snap());
    let frame = 0;
    const loop = () => {
      step(true);
      if (++frame % 2 === 0) setPos(snap());
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [nodes, links]);

  if (!pos) return <div className="w-full" style={{ aspectRatio: `${W} / ${H}` }} aria-hidden />;

  const neighbours = hover ? adj[hover] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="ontology graph of thinkers, concepts, and projects">
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
            stroke={lit ? "#4a597f" : hover ? "#161a22" : "#1d222b"}
            strokeWidth={lit ? 1.4 : 1}
          />
        );
      })}
      {nodes.map((n) => {
        const q = pos[n.id];
        if (!q) return null;
        const isHover = hover === n.id;
        const isNeighbour = !!neighbours?.has(n.id);
        const active = isHover || isNeighbour;
        const anchor = n.kind != null; // accent/metric nodes are always labelled
        const showLabel = anchor || active;
        const fill = n.kind === "accent" ? "#7fae93" : n.kind === "metric" ? "#d8a657" : "#3a4250";
        const r = (n.kind ? 4.5 : 3) + (isHover ? 2.5 : isNeighbour ? 1 : 0);
        const labelLeft = q.x > W * 0.62;
        const dim = hover && !active ? 0.35 : 1;
        return (
          <g
            key={n.id}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer", opacity: dim }}
          >
            {/* Invisible larger hit area so hovering is easy. */}
            <circle cx={q.x} cy={q.y} r={13} fill="transparent" />
            <circle cx={q.x} cy={q.y} r={r} fill={fill} />
            {showLabel && (
              <text
                x={labelLeft ? q.x - 8 : q.x + 8}
                y={q.y + 3}
                textAnchor={labelLeft ? "end" : "start"}
                fontSize="9.5"
                fill={isHover ? "#e6e8ec" : "#8a93a0"}
                style={{ fontFamily: "var(--font-geist-mono)", pointerEvents: "none" }}
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
