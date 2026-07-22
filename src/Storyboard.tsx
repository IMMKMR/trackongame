import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Droplets, Wind, Sparkles, Sprout, ShieldAlert, Award,
  Play, Trophy, Zap, Lock, Unlock, Gem,
  Star, Shield, AlertTriangle, CheckCircle, Magnet, Snowflake, TreePine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Shared primitives ──────────────────────────────────────────
const PhoneFrame = ({ children, glow }: { children: React.ReactNode; glow?: string }) => (
  <div className="relative flex-shrink-0 rounded-[28px] overflow-hidden border-2"
    style={{
      width: 220, height: 390,
      borderColor: glow ?? 'rgba(246,184,0,0.35)',
      boxShadow: `0 0 40px ${(glow ?? 'rgba(246,184,0,0.15)').replace(/[^,]+\)$/, '0.08)')}, inset 0 0 20px rgba(0,0,0,0.4)`,
      background: '#1a0e08',
    }}>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-50 flex items-center justify-center">
      <div className="w-4 h-1.5 bg-gray-800 rounded-full" />
    </div>
    <div className="w-full h-full overflow-hidden pt-4">{children}</div>
  </div>
);

const FlowArrow = ({ label }: { label?: string }) => (
  <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1" style={{ width: 56 }}>
    <div className="text-[10px] font-orbitron text-brand-gold/60 tracking-widest text-center leading-tight mb-1">{label}</div>
    <div className="flex items-center gap-0.5">
      <div className="w-6 h-[2px] bg-gradient-to-r from-brand-gold/30 to-brand-gold/70 rounded" />
      <div className="w-0 h-0 border-t-4 border-b-4 border-l-[8px] border-transparent border-l-brand-gold/70" />
    </div>
  </div>
);

const AnnotationTag = ({ text, color = '#F6B800' }: { text: string; color?: string }) => (
  <span className="inline-block text-[9px] font-orbitron font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
    style={{ color, borderColor: color + '55', background: color + '15' }}>
    {text}
  </span>
);

// ── Mini Oval Fingerprint Maze ─────────────────────────────────
const MiniFingerprint = ({ healPercent = 0, showPlayer = true, showEnemies = false, boost = false, enemyTypes = [] as string[] }) => {
  const COLS = 13, ROWS = 17;
  const cx = 6, cy = 8;
  const rx = 5.5, ry = 7.5;

  const grid: number[][] = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      const ex = (x - cx) / rx, ey = (y - cy) / ry;
      const d2 = ex * ex + ey * ey;
      if (d2 > 1.0) { grid[y][x] = -2; continue; }
      if (Math.sqrt(d2) > 0.87) { grid[y][x] = 1; continue; }
      const d = Math.sqrt(d2);
      const angle = Math.atan2(ey, ex);
      const spiral = (angle / (Math.PI * 2)) * 0.12;
      const adj = d + spiral;
      const ringVal = adj * 4 * 2;
      const phase = ((ringVal % 2) + 2) % 2;
      grid[y][x] = (phase >= 0.55 && phase < 1.45) ? 1 : 0;
    }
  }

  const wallColor = healPercent > 0.5 ? `rgba(63,175,58,${0.3 + healPercent * 0.4})` : '#3a2212';
  const orbColor = boost ? 'rgba(34,211,238,0.5)' : `rgba(246,184,0,${0.3 + healPercent * 0.4})`;

  // Enemy positions for display
  const enemyPositions = [
    { x: 3, y: 4 }, { x: 9, y: 4 }, { x: 3, y: 12 }, { x: 9, y: 12 },
  ];
  const enemyColors: Record<string, string> = {
    crawler: '#8B6914', runner: '#ef4444', teleporter: '#9b59b6', disruptor: '#e67e22',
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1,
      background: '#0d0805', padding: 2, borderRadius: '45% / 48%', overflow: 'hidden',
    }}>
      {grid.map((row, y) => row.map((cell, x) => {
        const isVoid = cell === -2;
        const isWall = cell === 1;
        const isPlayer = x === cx && y === cy && showPlayer;
        const enemyIdx = showEnemies ? enemyPositions.findIndex(ep => ep.x === x && ep.y === y) : -1;
        const isEnemy = enemyIdx >= 0 && enemyIdx < enemyTypes.length;
        const isFrozen = isEnemy && boost;

        return (
          <div key={`${x}-${y}`}
            style={{
              width: 12, height: 12,
              background: isVoid ? 'transparent' : isWall ? wallColor : 'rgba(15,8,4,0.6)',
              borderRadius: isWall ? 1 : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isVoid ? 0 : 1,
            }}>
            {!isWall && !isVoid && !isPlayer && !isEnemy && cell === 0 && (
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: orbColor }} />
            )}
            {isPlayer && (
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: boost ? '#22d3ee' : '#3FAF3A',
                boxShadow: boost ? '0 0 8px #22d3ee' : '0 0 6px #3FAF3A',
                border: '1px solid rgba(246,184,0,0.6)',
              }} />
            )}
            {isEnemy && !isFrozen && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: enemyColors[enemyTypes[enemyIdx]] || '#ef4444',
                boxShadow: `0 0 6px ${enemyColors[enemyTypes[enemyIdx]] || '#ef4444'}`,
              }} />
            )}
            {isFrozen && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e3a8a', opacity: 0.5 }} />
            )}
          </div>
        );
      }))}
    </div>
  );
};

// ── Fingerprint SVG ────────────────────────────────────────────
const FingerprintSVG = ({ alive = false, pct = 0 }) => {
  const c = alive ? `rgba(63,175,58,${0.3 + pct * 0.7})` : 'rgba(91,58,30,0.6)';
  return (
    <svg viewBox="0 0 100 130" width="90" height="117"
      style={{ filter: alive ? `drop-shadow(0 0 8px rgba(63,175,58,${pct}))` : 'none' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <ellipse key={i} cx="50" cy="65" rx={8 + i * 8} ry={10 + i * 10}
          fill="none" stroke={c} strokeWidth="2.5" strokeDasharray={i % 2 === 0 ? '6 3' : '8 4'}
          style={{ filter: alive ? `drop-shadow(0 0 3px rgba(63,175,58,0.8))` : 'none' }} />
      ))}
      <ellipse cx="50" cy="65" rx="4" ry="5" fill={alive ? '#3FAF3A' : '#5B3A1E'}
        style={{ filter: alive ? 'drop-shadow(0 0 6px #3FAF3A)' : 'none' }} />
    </svg>
  );
};

// ── Panel Components ───────────────────────────────────────────

const P0_Overview = () => (
  <div className="relative flex-shrink-0 rounded-[28px] overflow-hidden border-2 flex flex-col p-5"
    style={{
      width: 600, height: 390,
      borderColor: 'rgba(246,184,0,0.4)',
      boxShadow: '0 0 40px rgba(246,184,0,0.15), inset 0 0 20px rgba(0,0,0,0.4)',
      background: '#1a0e08',
    }}>
    <div className="text-center mb-4">
      <h2 className="text-3xl font-montserrat font-black text-brand-gold text-glow-gold">TRACKON GOLD</h2>
      <p className="text-brand-emerald font-orbitron text-sm tracking-widest mt-1">GAMIFICATION CONCEPT DOCUMENT</p>
    </div>

    <div className="flex gap-6 h-full">
      {/* Left Col: Loop & Desc */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 font-orbitron border-b border-white/10 pb-1">Game Description</h3>
          <p className="text-xs text-white/80 font-poppins leading-relaxed">
            Players become the <span className="text-brand-emerald font-bold">ORT Energy Core</span>, navigating an oval fingerprint maze. The soil has lost its vitality, and players must collect ORT Energy Orbs to restore the 8 essential nutrients and bring the Fingerprint of Prosperity back to life.
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 font-orbitron border-b border-white/10 pb-1">Core Game Loop</h3>
          <div className="flex items-center gap-2 text-xs font-poppins font-semibold text-white/90">
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center border border-brand-gold"><Zap className="w-3 h-3 text-brand-gold" /></div><span className="text-[8px] text-brand-gold">COLLECT ORBS</span></div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center border border-brand-orange"><Gem className="w-3 h-3 text-brand-orange" /></div><span className="text-[8px] text-brand-orange">FILL METER</span></div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-cyan-400/20 flex items-center justify-center border border-cyan-400"><Unlock className="w-3 h-3 text-cyan-400" /></div><span className="text-[8px] text-cyan-400">UNLOCK VAULT</span></div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-brand-emerald/20 flex items-center justify-center border border-brand-emerald"><Award className="w-3 h-3 text-brand-emerald" /></div><span className="text-[8px] text-brand-emerald">GET NUTRIENT</span></div>
          </div>
        </div>
      </div>

      {/* Right Col: Enemies & Powers */}
      <div className="flex-1 flex flex-col gap-4 border-l border-white/10 pl-6">
        <div>
          <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 font-orbitron border-b border-red-500/20 pb-1">Enemies (Avoid)</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: 'Crawler', c: '#8B6914', d: 'Slow patrol' },
              { n: 'Runner', c: '#ef4444', d: 'Chases you' },
              { n: 'Teleporter', c: '#9b59b6', d: 'Warps randomly' },
              { n: 'Disruptor', c: '#e67e22', d: 'Lunges fast' },
            ].map(e => (
              <div key={e.n} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: e.c, boxShadow: `0 0 6px ${e.c}` }} />
                <div>
                  <div className="text-[9px] font-bold text-white">{e.n}</div>
                  <div className="text-[7px] text-white/50">{e.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 font-orbitron border-b border-cyan-500/20 pb-1">Power-Ups (Collect)</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: 'ORT Boost', c: '#22d3ee', d: 'Invincible & 2x speed' },
              { n: 'Water Drop', c: '#3b82f6', d: 'Freezes enemies' },
              { n: 'Root Boost', c: '#22c55e', d: '+25% speed' },
              { n: 'Carbon', c: '#84cc16', d: 'Slows enemies' },
              { n: 'Magnet', c: '#a855f7', d: 'Auto-collects orbs' },
            ].map(e => (
              <div key={e.n} className="flex items-center gap-2">
                <div className="w-3 h-3 shrink-0" style={{ background: e.c, boxShadow: `0 0 6px ${e.c}`, borderRadius: e.n === 'ORT Boost' || e.n === 'Magnet' ? '2px' : '50%', transform: e.n === 'ORT Boost' || e.n === 'Magnet' ? 'rotate(45deg)' : 'none' }} />
                <div>
                  <div className="text-[9px] font-bold text-white">{e.n}</div>
                  <div className="text-[7px] text-white/50">{e.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const P1_Splash = () => (
  <PhoneFrame>
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'radial-gradient(ellipse at 50% 30%, #3a2212, #2A1A12)' }}>
      <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(246,184,0,0.15) 8px, rgba(246,184,0,0.15) 9px)' }} />
      {/* Fingerprint silhouette */}
      <div className="relative mb-3 z-10">
        <svg viewBox="0 0 60 80" width="50" height="67">
          {[0, 1, 2, 3].map(i => (
            <ellipse key={i} cx="30" cy="40" rx={6 + i * 6} ry={8 + i * 8} fill="none"
              stroke="rgba(246,184,0,0.25)" strokeWidth="1.5" strokeDasharray={i % 2 === 0 ? '4 2' : '6 3'} />
          ))}
          <ellipse cx="30" cy="40" rx="3" ry="4" fill="rgba(246,184,0,0.5)" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-brand-gold/40 flex items-center justify-center"
          style={{ boxShadow: '0 0 15px rgba(246,184,0,0.3)' }}>
          <Leaf className="w-5 h-5 text-brand-emerald" />
        </div>
      </div>
      <div className="text-center z-10 px-4">
        <div className="text-[9px] font-orbitron tracking-[0.3em] text-brand-gold/50 mb-1 uppercase">Fingerprint of Prosperity</div>
        <div className="text-xl font-montserrat font-extrabold text-white leading-tight">TRACKON</div>
        <div className="text-xl font-montserrat font-extrabold leading-tight" style={{ color: '#F6B800', textShadow: '0 0 15px rgba(246,184,0,0.7)' }}>GOLD</div>
        <div className="text-[8px] text-white/40 mt-2 font-poppins px-2">Every farm has its own Fingerprint.<br />Complete yours. Unlock Prosperity.</div>
      </div>
      <div className="mt-4 z-10 px-5 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: 'linear-gradient(90deg, #F6B800, #F89A1C)', color: '#2A1A12', boxShadow: '0 0 15px rgba(246,184,0,0.4)' }}>
        <span>START</span><Play className="w-3 h-3 fill-current" />
      </div>
    </div>
  </PhoneFrame>
);

const P2_Story = () => (
  <PhoneFrame glow="rgba(91,58,30,0.8)">
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4" style={{ background: '#1a0e08' }}>
      <div className="w-full rounded-2xl overflow-hidden mb-4 relative" style={{ height: 100, background: '#2A1A12', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sprout className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute top-2 right-3 text-[7px] font-orbitron" style={{ color: '#F6B800' }}>PROLOGUE</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-montserrat font-semibold text-white/90 leading-snug mb-2">
          Every farm has its own<br /><span className="text-brand-gold">Fingerprint of Prosperity</span>.
        </div>
        <div className="text-[9px] font-poppins px-2 leading-relaxed" style={{ color: '#3FAF3A' }}>
          You are the ORT Energy Core.<br />Restore the soil's 8 essential nutrients.
        </div>
      </div>
      <div className="mt-4 text-[7px] font-orbitron tracking-widest text-white/25 animate-pulse">AUTO-ADVANCING…</div>
    </div>
  </PhoneFrame>
);

const P3_Mission = () => (
  <PhoneFrame>
    <div className="w-full h-full flex flex-col items-center justify-center p-3" style={{ background: 'radial-gradient(ellipse at top, #2e1a0e, #2A1A12)' }}>
      <div className="w-full rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: 'rgba(42,26,18,0.8)', border: '1px solid rgba(246,184,0,0.25)' }}>
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(246,184,0,0.15)' }}>
          <ShieldAlert className="w-4 h-4" style={{ color: '#F6B800' }} />
          <span className="text-xs font-montserrat font-bold text-white tracking-widest">MISSION</span>
        </div>
        {[
          { icon: <Zap className="w-3 h-3" style={{ color: '#F6B800' }} />, text: 'Collect ORT Energy Orbs' },
          { icon: <Gem className="w-3 h-3" style={{ color: '#3FAF3A' }} />, text: 'Fill Energy Meter to 100%' },
          { icon: <Unlock className="w-3 h-3" style={{ color: '#F89A1C' }} />, text: 'Unlock Nutrient Vault' },
          { icon: <Award className="w-3 h-3" style={{ color: '#3FAF3A' }} />, text: 'Collect all 8 Nutrients' },
          { icon: <Wind className="w-3 h-3 text-red-400" />, text: 'Avoid enemies!' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[9px] font-poppins text-white/80">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{item.icon}</div>
            {item.text}
          </div>
        ))}
        <div className="mt-1 w-full py-2 rounded-xl text-[10px] font-bold text-white text-center" style={{ background: '#3FAF3A', boxShadow: '0 0 12px rgba(63,175,58,0.4)' }}>
          SELECT LEVEL →
        </div>
      </div>
    </div>
  </PhoneFrame>
);

const P4_LevelSelect = () => (
  <PhoneFrame glow="rgba(246,184,0,0.5)">
    <div className="w-full h-full flex flex-col items-center justify-start p-3 pt-5" style={{ background: '#1a0e08' }}>
      <div className="text-[10px] font-montserrat font-extrabold text-white mb-1">SELECT <span style={{ color: '#F6B800' }}>LEVEL</span></div>
      <div className="text-[7px] font-poppins text-white/30 mb-3">8 Nutrients · 8 Levels</div>
      <div className="grid grid-cols-4 gap-1.5 w-full px-1">
        {[
          { s: 'S', n: 'Sulphur', c: '#FFD700', done: true },
          { s: 'Mg', n: 'Magnesium', c: '#76D7C4', done: true },
          { s: 'Zn', n: 'Zinc', c: '#AED6F1', done: false },
          { s: 'Fe', n: 'Iron', c: '#E74C3C', done: false },
          { s: 'Ca', n: 'Calcium', c: '#F5CBA7', done: false },
          { s: 'Cu', n: 'Copper', c: '#F0B27A', done: false },
          { s: 'B', n: 'Boron', c: '#BB8FCE', done: false },
          { s: 'Mo', n: 'Molybdenum', c: '#85C1E9', done: false },
        ].map((l, i) => (
          <div key={i} className="rounded-xl p-1.5 flex flex-col items-center gap-1"
            style={{
              background: l.done ? `${l.c}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${l.done ? l.c + '50' : 'rgba(255,255,255,0.08)'}`,
              opacity: i <= 2 ? 1 : 0.4,
            }}>
            <div className="text-[6px] font-orbitron text-white/30">L{i + 1}</div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-orbitron font-bold"
              style={{
                background: l.done ? l.c : 'rgba(255,255,255,0.05)',
                color: l.done ? '#1a0e08' : 'rgba(255,255,255,0.2)',
                border: `1px solid ${l.done ? l.c : 'rgba(255,255,255,0.08)'}`,
              }}>
              {i <= 2 ? l.s : '🔒'}
            </div>
            <div className="text-[6px] font-poppins" style={{ color: i <= 2 ? l.c : 'rgba(255,255,255,0.2)' }}>{l.n}</div>
            {l.done && <div className="text-[7px]">✓</div>}
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const P5_MazeGameplay = () => (
  <PhoneFrame glow="rgba(63,175,58,0.5)">
    <div className="w-full h-full flex flex-col items-center justify-start p-3 pt-5" style={{ background: '#2A1A12' }}>
      {/* HUD */}
      <div className="w-full flex justify-between items-center mb-2 px-1 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div className="text-[6px] font-orbitron tracking-widest" style={{ color: 'rgba(246,184,0,0.5)' }}>L3 · ZINC</div>
          <div className="text-[8px] font-orbitron text-white">420</div>
        </div>
        <div className="flex-1 mx-2">
          <div className="text-[6px] font-orbitron text-center mb-0.5 text-white/30">ORT ENERGY</div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg, #F6B800, #F89A1C)' }} />
          </div>
          <div className="text-[6px] font-orbitron text-center mt-0.5" style={{ color: 'rgba(246,184,0,0.4)' }}>62%</div>
        </div>
      </div>
      {/* Oval fingerprint maze */}
      <div className="relative">
        <MiniFingerprint healPercent={0.3} showPlayer showEnemies enemyTypes={['runner']} />
      </div>
      {/* Controls preview */}
      <div className="mt-2 grid grid-cols-3 gap-0.5" style={{ width: 70 }}>
        {[null, '▲', null, '◀', '·', '▶', null, '▼', null].map((l, i) => (
          <div key={i} className="h-5 rounded flex items-center justify-center"
            style={{ background: l && l !== '·' ? 'rgba(255,255,255,0.1)' : 'transparent', fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const P6_Enemies = () => (
  <PhoneFrame glow="rgba(239,68,68,0.7)">
    <div className="w-full h-full flex flex-col items-center justify-start p-3 pt-5 relative" style={{ background: '#1a0808' }}>
      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-montserrat font-bold mb-3"
        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
        <AlertTriangle className="w-3 h-3" /> ENEMY TYPES
      </div>
      <div className="flex flex-col gap-2 w-full">
        {[
          { name: 'Soil Crawler', desc: 'Slow patrol, blocks paths', color: '#8B6914', diff: '⭐' },
          { name: 'Speed Runner', desc: 'Fast, chases player', color: '#ef4444', diff: '⭐⭐' },
          { name: 'Rift Teleporter', desc: 'Teleports randomly', color: '#9b59b6', diff: '⭐⭐⭐' },
          { name: 'ORT Disruptor', desc: 'Lunges at player', color: '#e67e22', diff: '⭐⭐⭐⭐' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg p-1.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${e.color}30` }}>
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: e.color, boxShadow: `0 0 8px ${e.color}` }}>
              <div className="w-2 h-2 rounded-full bg-white/80" />
            </div>
            <div className="flex-1">
              <div className="text-[8px] font-montserrat font-bold" style={{ color: e.color }}>{e.name}</div>
              <div className="text-[7px] font-poppins text-white/40">{e.desc}</div>
            </div>
            <div className="text-[7px]">{e.diff}</div>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <MiniFingerprint healPercent={0.2} showPlayer showEnemies enemyTypes={['crawler', 'runner', 'teleporter', 'disruptor']} />
      </div>
    </div>
  </PhoneFrame>
);

const P7_PowerUps = () => (
  <PhoneFrame glow="rgba(34,211,238,0.6)">
    <div className="w-full h-full flex flex-col items-center justify-start p-3 pt-5" style={{ background: '#020d14' }}>
      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.4), transparent 70%)' }} />
      <div className="text-[9px] font-montserrat font-bold text-cyan-400 mb-3 z-10">⚡ POWER-UPS</div>
      <div className="flex flex-col gap-1.5 w-full z-10">
        {[
          { name: 'ORT Boost', desc: '2× speed, invincible, magnet', dur: '10s', color: '#22d3ee', shape: 'diamond' },
          { name: 'Water Drop', desc: 'Freeze all enemies', dur: '5s', color: '#3b82f6', shape: 'circle' },
          { name: 'Root Boost', desc: '+25% player speed', dur: '10s', color: '#22c55e', shape: 'circle' },
          { name: 'Organic Carbon', desc: 'Slow all enemies', dur: '8s', color: '#84cc16', shape: 'circle' },
          { name: 'Magnet Field', desc: 'Auto-collect nearby orbs', dur: '8s', color: '#a855f7', shape: 'diamond' },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg p-1.5"
            style={{ background: `${p.color}10`, border: `1px solid ${p.color}30` }}>
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
              style={{
                background: p.color, boxShadow: `0 0 6px ${p.color}`,
                borderRadius: p.shape === 'diamond' ? '2px' : '50%',
                transform: p.shape === 'diamond' ? 'rotate(45deg)' : 'none',
              }} />
            <div className="flex-1">
              <div className="text-[8px] font-montserrat font-bold" style={{ color: p.color }}>{p.name}</div>
              <div className="text-[6px] font-poppins text-white/40">{p.desc}</div>
            </div>
            <div className="text-[7px] font-orbitron" style={{ color: p.color + '80' }}>{p.dur}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 z-10">
        <MiniFingerprint boost healPercent={0.5} showPlayer showEnemies={false} />
      </div>
    </div>
  </PhoneFrame>
);

const P8_NutrientVault = () => (
  <PhoneFrame glow="rgba(246,184,0,0.7)">
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative" style={{ background: '#1a0e08' }}>
      <div className="text-[9px] font-orbitron tracking-widest text-brand-gold/60 uppercase mb-4">Nutrient Vault Mechanic</div>
      {/* Locked state */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B6914, #F6B800)', border: '2px solid rgba(246,184,0,0.4)', boxShadow: '0 0 12px rgba(246,184,0,0.2)' }}>
            <Lock className="w-5 h-5 text-brand-soil" />
          </div>
          <div className="text-[7px] font-orbitron text-white/30">LOCKED</div>
        </div>
        <div className="text-white/30 text-lg">→</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[8px] font-orbitron text-brand-gold/60">100% ORT</div>
        </div>
        <div className="text-white/30 text-lg">→</div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3FAF3A, #F6B800)', border: '2px solid #3FAF3A', boxShadow: '0 0 15px rgba(63,175,58,0.5)' }}>
            <Unlock className="w-5 h-5 text-white" />
          </div>
          <div className="text-[7px] font-orbitron text-brand-emerald/60">UNLOCKED</div>
        </div>
      </div>
      {/* Energy bar */}
      <div className="w-full px-4 mb-3">
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #3FAF3A, #F6B800)', boxShadow: '0 0 10px rgba(63,175,58,0.6)' }} />
        </div>
        <div className="flex justify-between text-[7px] font-orbitron mt-0.5" style={{ color: '#3FAF3A' }}>
          <span>ORT ENERGY</span><span>100%</span>
        </div>
      </div>
      {/* Nutrient crystal */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-orbitron font-bold"
        style={{ background: '#AED6F1', color: '#1a0e08', boxShadow: '0 0 20px rgba(174,214,241,0.6)', border: '2px solid white' }}>
        Zn
      </div>
      <div className="text-[9px] font-poppins font-semibold mt-2" style={{ color: '#AED6F1' }}>Zinc Collected!</div>
    </div>
  </PhoneFrame>
);

const P9_LevelComplete = () => (
  <PhoneFrame glow="rgba(63,175,58,0.7)">
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'radial-gradient(ellipse at center, #0d2b0a, #1a0e08)' }}>
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, rgba(63,175,58,0.5), transparent 65%)' }} />
      <div className="z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-orbitron font-bold mb-3"
          style={{ background: '#FFD700', color: '#1a0e08', boxShadow: '0 0 25px rgba(255,215,0,0.6)', border: '2px solid white' }}>
          S
        </div>
        <div className="text-[11px] font-montserrat font-extrabold text-white text-center mb-1">LEVEL 1 COMPLETE</div>
        <div className="text-[10px] font-poppins font-semibold" style={{ color: '#FFD700' }}>Sulphur Restored!</div>
      </div>
      <div className="mt-4 z-10">
        <FingerprintSVG alive pct={0.3} />
      </div>
      <div className="mt-2 flex gap-1 z-10">
        {['S', 'Mg', 'Zn', 'Fe', 'Ca', 'Cu', 'B', 'Mo'].map((n, i) => (
          <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[5px] font-orbitron"
            style={{
              background: i < 1 ? 'rgba(63,175,58,0.8)' : 'rgba(255,255,255,0.06)',
              color: i < 1 ? 'white' : 'rgba(255,255,255,0.2)',
              border: `1px solid ${i < 1 ? '#3FAF3A' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const P10_FingerprintRestored = () => (
  <PhoneFrame glow="rgba(63,175,58,1)">
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: 'radial-gradient(ellipse at center, #143d10, #1a0e08)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(63,175,58,0.35), transparent 70%)' }} />
      <div className="z-10 relative">
        <div className="absolute inset-0 blur-3xl scale-150" style={{ background: 'rgba(63,175,58,0.4)' }} />
        <FingerprintSVG alive pct={1} />
      </div>
      <div className="mt-3 z-10 text-center">
        <div className="text-[11px] font-montserrat font-extrabold" style={{ color: '#3FAF3A', textShadow: '0 0 15px rgba(63,175,58,0.8)' }}>ALL 8 NUTRIENTS</div>
        <div className="text-[11px] font-montserrat font-extrabold text-white">RESTORED!</div>
      </div>
      <div className="mt-3 flex gap-1 flex-wrap justify-center z-10 px-4">
        {['S', 'Mg', 'Zn', 'Fe', 'Ca', 'Cu', 'B', 'Mo'].map((n, i) => (
          <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[6px] font-orbitron"
            style={{ background: 'rgba(63,175,58,0.9)', color: 'white', border: '1px solid #3FAF3A', boxShadow: '0 0 6px rgba(63,175,58,0.6)' }}>
            {n}
          </div>
        ))}
      </div>
      <div className="mt-3 z-10 w-full px-6">
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #3FAF3A, #F6B800)', boxShadow: '0 0 12px rgba(63,175,58,0.8)' }} />
        </div>
        <div className="flex justify-between text-[7px] font-orbitron mt-0.5" style={{ color: 'rgba(63,175,58,0.6)' }}>
          <span>RESTORATION</span><span>100%</span>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

const P11_Reveal = () => (
  <PhoneFrame glow="rgba(246,184,0,1)">
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #3d2a00, #2A1A12)' }}>
      <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(246,184,0,0.6), transparent 65%)' }} />
      <div className="relative z-10">
        <div className="absolute inset-0 blur-3xl scale-150" style={{ background: 'rgba(246,184,0,0.4)' }} />
        <div className="w-28 h-36 rounded-2xl flex flex-col items-center justify-center p-3 relative z-10"
          style={{ background: 'linear-gradient(160deg, #F6B800, #a17700)', border: '3px solid #fde68a', boxShadow: '0 15px 40px rgba(0,0,0,0.5), 0 0 40px rgba(246,184,0,0.4)' }}>
          <Leaf className="w-8 h-8 mb-1" style={{ color: '#2A1A12' }} />
          <div className="text-center font-montserrat font-black text-[11px] leading-tight" style={{ color: '#2A1A12' }}>TRACKON<br />GOLD</div>
          <div className="w-full h-px my-1.5" style={{ background: 'rgba(42,26,18,0.2)' }} />
          <div className="text-[6px] font-orbitron font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#2A1A12' }}>ORT TECHNOLOGY</div>
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="absolute" style={{
            width: 8, height: 8, borderRadius: '50%',
            background: ['#FFD700', '#76D7C4', '#AED6F1', '#E74C3C', '#F5CBA7', '#F0B27A', '#BB8FCE', '#85C1E9'][i],
            boxShadow: `0 0 6px ${['#FFD700', '#76D7C4', '#AED6F1', '#E74C3C', '#F5CBA7', '#F0B27A', '#BB8FCE', '#85C1E9'][i]}`,
            top: '50%', left: '50%',
            transform: `translate(-50%, -50%) translate(${Math.cos(i * Math.PI / 4) * 65}px, ${Math.sin(i * Math.PI / 4) * 65}px)`,
          }} />
        ))}
      </div>
      <div className="mt-4 z-10 text-center">
        <div className="text-[12px] font-montserrat font-bold text-white" style={{ textShadow: '0 0 15px rgba(246,184,0,0.8)' }}>FINGERPRINT<br />RESTORED</div>
      </div>
    </div>
  </PhoneFrame>
);

const P12_Reward = () => (
  <PhoneFrame glow="rgba(246,184,0,0.8)">
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4" style={{ background: 'radial-gradient(ellipse at top, rgba(246,184,0,0.2), #2A1A12)' }}>
      <div className="z-10 flex flex-col items-center">
        <Trophy className="w-12 h-12 mb-2" style={{ color: '#F6B800', filter: 'drop-shadow(0 0 15px rgba(246,184,0,0.7))' }} />
        <div className="text-[12px] font-montserrat font-extrabold text-white text-center" style={{ textShadow: '0 0 10px rgba(246,184,0,0.5)' }}>🎉 CONGRATULATIONS</div>
        <div className="text-[8px] font-poppins text-white/40 mt-0.5 mb-1">Fingerprint Restored</div>
        <div className="text-[10px] font-poppins font-semibold mb-3" style={{ color: '#3FAF3A' }}>🏆 Trackon Gold Unlocked</div>
        {/* Nutrient badges */}
        <div className="flex gap-1 mb-3">
          {['S', 'Mg', 'Zn', 'Fe', 'Ca', 'Cu', 'B', 'Mo'].map((n, i) => (
            <div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[5px] font-orbitron"
              style={{ background: ['#FFD700', '#76D7C4', '#AED6F1', '#E74C3C', '#F5CBA7', '#F0B27A', '#BB8FCE', '#85C1E9'][i], color: '#1a0e08' }}>
              {n}
            </div>
          ))}
        </div>
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full py-2 rounded-xl text-center text-[9px] font-bold uppercase tracking-wider"
            style={{ background: 'linear-gradient(90deg, #F6B800, #F89A1C)', color: '#2A1A12' }}>🎁 CLAIM REWARD</div>
          <div className="w-full py-1.5 rounded-xl text-center text-[9px] font-bold text-white uppercase"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>🔄 PLAY AGAIN</div>
          <div className="flex gap-1.5">
            <div className="flex-1 py-1 rounded-lg text-center text-[7px] font-bold text-white/40 uppercase"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>📖 Learn More</div>
            <div className="flex-1 py-1 rounded-lg text-center text-[7px] font-bold text-white/40 uppercase"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>📲 Scan QR</div>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

// ── Panel metadata ─────────────────────────────────────────────
const PANELS = [
  { id: '00', title: 'Game Overview', subtitle: 'Concept & Mechanics', tag: 'DOCUMENTATION', tagColor: '#a855f7',
    note: 'High-level overview of the game loop, enemies, and power-ups.', component: <P0_Overview />, width: 640, arrow: 'START' },
  { id: '01', title: 'Splash Screen', subtitle: 'Brand Intro', tag: 'ENTRY', tagColor: '#F6B800',
    note: 'Fingerprint silhouette + ORT logo. Premium intro animation.', component: <P1_Splash />, width: 260 },
  { id: '02', title: 'Story Intro', subtitle: 'Narrative Hook', tag: 'CINEMATIC', tagColor: '#F89A1C',
    note: '"Every farm has its Fingerprint of Prosperity." ORT Energy Core intro.', component: <P2_Story />, width: 260, arrow: 'AUTO' },
  { id: '03', title: 'Mission Brief', subtitle: 'Objectives', tag: 'BRIEFING', tagColor: '#22d3ee',
    note: 'Collect Orbs → Fill Meter → Unlock Vault → Collect Nutrient.', component: <P3_Mission />, width: 260, arrow: 'TAP' },
  { id: '04', title: 'Level Select', subtitle: '8 Nutrients', tag: 'SELECT', tagColor: '#F6B800',
    note: '8 levels, each with a unique nutrient. Locked progression.', component: <P4_LevelSelect />, width: 260, arrow: 'TAP' },
  { id: '05', title: 'Maze Gameplay', subtitle: 'Fingerprint Arena', tag: 'GAMEPLAY', tagColor: '#3FAF3A',
    note: 'Oval fingerprint maze. Collect ORT Energy Orbs. Avoid enemies.', component: <P5_MazeGameplay />, width: 260, arrow: 'TAP' },
  { id: '06', title: 'Enemy Types', subtitle: 'Threat Gallery', tag: 'THREAT', tagColor: '#ef4444',
    note: '4 enemy types: Crawler, Runner, Teleporter, Disruptor. Increasing difficulty.', component: <P6_Enemies />, width: 260, arrow: 'PLAY' },
  { id: '07', title: 'Power-Ups', subtitle: 'ORT Boost & More', tag: 'POWER-UP', tagColor: '#22d3ee',
    note: '5 power-ups: ORT Boost, Water Drop, Root Boost, Organic Carbon, Magnet.', component: <P7_PowerUps />, width: 260, arrow: 'PLAY' },
  { id: '08', title: 'Nutrient Vault', subtitle: 'Core Mechanic', tag: 'MECHANIC', tagColor: '#F6B800',
    note: '100% ORT Energy → Vault unlocks → Nutrient collected → Level complete.', component: <P8_NutrientVault />, width: 260, arrow: 'PLAY' },
  { id: '09', title: 'Level Complete', subtitle: 'Healing Animation', tag: 'TRANSITION', tagColor: '#3FAF3A',
    note: 'Nutrient crystal collected. Fingerprint glows. Progress tracked.', component: <P9_LevelComplete />, width: 260, arrow: 'AUTO' },
  { id: '10', title: 'Fingerprint Restored', subtitle: 'All 8 Done', tag: '8/8 DONE', tagColor: '#3FAF3A',
    note: 'All 8 nutrients restored. Full green glow, 100% restoration bar.', component: <P10_FingerprintRestored />, width: 260, arrow: 'AUTO' },
  { id: '11', title: 'Product Reveal', subtitle: 'Trackon Gold Rises', tag: 'REVEAL', tagColor: '#F6B800',
    note: 'Trackon Gold pack emerges from soil. 8 nutrient crystals orbit it.', component: <P11_Reveal />, width: 260, arrow: 'AUTO' },
  { id: '12', title: 'Reward Screen', subtitle: 'Victory & CTA', tag: 'FINALE', tagColor: '#F6B800',
    note: 'Claim Reward, Play Again, Learn More, Scan QR. Nutrient badges.', component: <P12_Reward />, width: 260, arrow: 'AUTO' },
];

// ── Legend ─────────────────────────────────────────────────────
const Legend = () => (
  <div className="flex flex-wrap gap-4 items-center">
    {[
      { color: '#F6B800', label: 'Brand / Entry' },
      { color: '#3FAF3A', label: 'Gameplay / Restore' },
      { color: '#22d3ee', label: 'Power-up / Mechanic' },
      { color: '#ef4444', label: 'Threat / Danger' },
      { color: '#F89A1C', label: 'Cinematic / Auto' },
    ].map(({ color, label }) => (
      <div key={label} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-poppins" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      </div>
    ))}
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        <div className="w-4 h-px" style={{ background: 'rgba(246,184,0,0.6)' }} />
        <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent" style={{ borderLeftColor: 'rgba(246,184,0,0.6)' }} />
      </div>
      <span className="text-[10px] font-poppins" style={{ color: 'rgba(255,255,255,0.5)' }}>Screen transition</span>
    </div>
  </div>
);

// ── Root Storyboard ────────────────────────────────────────────
export default function Storyboard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [printMode, setPrintMode] = React.useState(false);

  if (printMode) {
    return (
      <div className="bg-white min-h-screen font-poppins text-black w-full">
        {/* Print Header - Hidden on actual print, visible on screen */}
        <div className="fixed top-4 right-4 print:hidden flex gap-2 z-50">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold">Print to PDF</button>
          <button onClick={() => setPrintMode(false)} className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">Back to Screen View</button>
        </div>
        
        {PANELS.map((panel, idx) => (
          <div key={panel.id} className="flex flex-col items-center justify-center w-full min-h-screen py-10" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-montserrat font-black mb-2">{panel.title}</h1>
              <p className="text-gray-500 text-xl">{panel.subtitle}</p>
            </div>
            <div className="scale-125 transform origin-top mb-12 flex justify-center" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}>
              {panel.component}
            </div>
            <div className="max-w-md text-center">
              <span className="inline-block px-3 py-1 text-sm font-bold uppercase rounded-full mb-4"
                style={{ background: panel.tagColor + '20', color: panel.tagColor, border: `1px solid ${panel.tagColor}` }}>
                {panel.tag}
              </span>
              <p className="text-gray-600 text-lg">{panel.note}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-screen h-[100dvh] flex flex-col overflow-hidden select-none" style={{ background: '#180e07', fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: 'rgba(246,184,0,0.15)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3FAF3A, #F6B800)', boxShadow: '0 0 15px rgba(246,184,0,0.3)' }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-orbitron tracking-widest uppercase" style={{ color: 'rgba(246,184,0,0.6)' }}>Trackon Gold</div>
            <h1 className="text-lg font-montserrat font-extrabold text-white leading-none">Game Storyboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Legend />
          <div className="flex gap-2">
            <button onClick={() => setPrintMode(true)}
              className="text-[10px] font-orbitron tracking-widest uppercase px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ background: '#F6B800', color: '#1a0e08', border: '1px solid #F6B800' }}>
              Print to PDF
            </button>
            <button onClick={() => navigate('/')}
              className="text-[10px] font-orbitron tracking-widest uppercase px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
              ← Back to Game
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex-shrink-0 px-8 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[10px] font-poppins" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Fingerprint of Prosperity · 12-Screen Game Flow · Scroll horizontally to explore →
        </div>
        <div className="text-[10px] font-orbitron px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(63,175,58,0.1)', color: '#3FAF3A', border: '1px solid rgba(63,175,58,0.2)' }}>
          v2.0 CONCEPT
        </div>
      </div>

      {/* Scrollable Panels */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-start h-full" style={{ padding: '40px 60px', gap: 0, minWidth: 'max-content' }}>
          {PANELS.map((panel, idx) => (
            <React.Fragment key={panel.id}>
              <motion.div className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.5 }}
                style={{ width: panel.width || 260 }}>
                {/* Title */}
                <div className="flex items-center gap-2 mb-3 self-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-orbitron font-bold text-black"
                    style={{ background: '#F6B800', flexShrink: 0 }}>
                    {panel.id}
                  </div>
                  <div>
                    <div className="text-xs font-montserrat font-bold text-white leading-none">{panel.title}</div>
                    <div className="text-[9px] font-poppins mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{panel.subtitle}</div>
                  </div>
                </div>
                {/* Tag */}
                <div className="self-start mb-2">
                  <AnnotationTag text={panel.tag} color={panel.tagColor} />
                </div>
                {/* Phone */}
                <div className="relative">
                  {panel.component}
                  <div className="absolute top-0 left-0 right-[60%] bottom-0 rounded-[28px] pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
                </div>
                {/* Note */}
                <div className="mt-3 self-start" style={{ maxWidth: panel.width ? panel.width - 40 : 220 }}>
                  <div className="text-[9px] font-poppins leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {panel.note}
                  </div>
                </div>
              </motion.div>
              {/* Arrow */}
              {idx < PANELS.length - 1 && (
                <div className="flex items-center justify-center self-center" style={{ marginTop: -60 }}>
                  <FlowArrow label={PANELS[idx + 1].arrow} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-8 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="text-[9px] font-orbitron tracking-widest uppercase mr-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Flow</div>
        {PANELS.map((p, i) => {
          // Calculate offset dynamically based on previous widths
          const offset = PANELS.slice(0, i).reduce((sum, curr) => sum + (curr.width || 260) + 56, 0);
          return (
            <React.Fragment key={p.id}>
              <button onClick={() => { scrollRef.current && (scrollRef.current.scrollLeft = offset); }}
                className="flex items-center gap-1 text-[8px] font-orbitron px-2 py-1 rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${p.tagColor}33`, color: p.tagColor }}>
                <span>{p.id}</span>
              </button>
              {i < PANELS.length - 1 && <div className="w-2 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
