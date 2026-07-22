import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Droplets, Wind, Sparkles, Sprout, ShieldAlert, Award,
  ArrowRight, Play, RefreshCw, Trophy, Zap, LayoutGrid, Lock,
  Unlock, ChevronRight, Pause, Volume2, Star, Gem, Shield,
  BookOpen, QrCode, Snowflake, Magnet, TreePine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type GameScreen = 'SPLASH' | 'STORY' | 'MISSION' | 'LEVEL_SELECT' | 'GAME' | 'LEVEL_COMPLETE' | 'REVEAL' | 'REWARD';
type EnemyType = 'crawler' | 'runner' | 'teleporter' | 'disruptor';

interface Enemy {
  x: number; y: number;
  type: EnemyType;
  dir: { x: number; y: number };
  tickCount: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const COLS = 21;
const ROWS = 27;

// Cell types
const VOID = -2;
const COLLECTED = -1;
const ORB = 0;
const WALL = 1;
const VAULT = 2;
const P_ORT = 3;    // ORT Boost Crystal
const P_WATER = 4;  // Water Drop
const P_ROOT = 5;   // Root Boost
const P_CARBON = 6; // Organic Carbon
const P_MAGNET = 7; // Magnet Field
const B_GOLD = 8;   // Golden Granule
const B_ROOT = 9;   // Healthy Root

const NUTRIENTS = [
  { name: 'Sulphur', symbol: 'S', color: '#FFD700' },
  { name: 'Magnesium', symbol: 'Mg', color: '#76D7C4' },
  { name: 'Zinc', symbol: 'Zn', color: '#AED6F1' },
  { name: 'Iron', symbol: 'Fe', color: '#E74C3C' },
  { name: 'Calcium', symbol: 'Ca', color: '#F5CBA7' },
  { name: 'Copper', symbol: 'Cu', color: '#F0B27A' },
  { name: 'Boron', symbol: 'B', color: '#BB8FCE' },
  { name: 'Molybdenum', symbol: 'Mo', color: '#85C1E9' },
];

const LEVEL_ENEMIES: { type: EnemyType; count: number }[][] = [
  [],                                                          // L1 - Tutorial
  [{ type: 'crawler', count: 2 }],                             // L2
  [{ type: 'runner', count: 1 }],                              // L3
  [{ type: 'teleporter', count: 1 }],                          // L4
  [{ type: 'disruptor', count: 1 }],                           // L5
  [{ type: 'crawler', count: 1 }, { type: 'runner', count: 1 }],    // L6
  [{ type: 'runner', count: 1 }, { type: 'teleporter', count: 1 }], // L7
  [{ type: 'teleporter', count: 1 }, { type: 'disruptor', count: 1 }], // L8
];

// ═══════════════════════════════════════════════════════════════
// SEEDED RANDOM
// ═══════════════════════════════════════════════════════════════
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ═══════════════════════════════════════════════════════════════
// MAZE GENERATOR — Oval Fingerprint Shape
// ═══════════════════════════════════════════════════════════════
function isWalkable(x: number, y: number, maze: number[][]) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS &&
    maze[y]?.[x] !== undefined && maze[y][x] !== WALL && maze[y][x] !== VOID;
}

function generateFingerprintMaze(level: number) {
  const cx = Math.floor(COLS / 2);  // 10
  const cy = Math.floor(ROWS / 2);  // 13
  const rx = cx - 0.5;              // 9.5
  const ry = cy - 0.5;             // 12.5

  const rand = createRng((level + 1) * 31337);
  const grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(VOID));

  const numRings = 4 + (level % 3);
  const spiralDir = level % 2 === 0 ? 1 : -1;
  const spiralAmt = 0.12 + (level % 4) * 0.04;

  // 1. Mark cells inside ellipse
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ex = (x - cx) / rx;
      const ey = (y - cy) / ry;
      if (ex * ex + ey * ey <= 1.0) grid[y][x] = ORB;
    }
  }

  // 2. Boundary wall
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === VOID) continue;
      const ex = (x - cx) / rx, ey = (y - cy) / ry;
      if (Math.sqrt(ex * ex + ey * ey) > 0.87) grid[y][x] = WALL;
    }
  }

  // 3. Concentric fingerprint ridges
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== ORB) continue;
      const ex = (x - cx) / rx, ey = (y - cy) / ry;
      const d = Math.sqrt(ex * ex + ey * ey);
      const angle = Math.atan2(ey, ex);
      const spiral = (angle / (Math.PI * 2)) * spiralAmt * spiralDir;
      const adj = d + spiral;
      const ringVal = adj * numRings * 2;
      const phase = ((ringVal % 2) + 2) % 2;
      if (phase >= 0.55 && phase < 1.45) grid[y][x] = WALL;
    }
  }

  // 4. Add gaps in each ring for connectivity
  for (let ring = 1; ring <= numRings; ring++) {
    const ringDist = (ring / (numRings + 1)) * 0.85;
    const gapCount = 3 + Math.floor(rand() * 2);
    for (let g = 0; g < gapCount; g++) {
      const ga = (g / gapCount) * Math.PI * 2 + ring * 1.1 + level * 0.8;
      const gx = Math.round(cx + Math.cos(ga) * ringDist * rx);
      const gy = Math.round(cy + Math.sin(ga) * ringDist * ry);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = gy + dy, nx = gx + dx;
          if (ny > 0 && ny < ROWS - 1 && nx > 0 && nx < COLS - 1 && grid[ny][nx] === WALL) {
            const ed = ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2;
            if (ed < 0.83) grid[ny][nx] = ORB;
          }
        }
      }
    }
  }

  // 5. Random extra breaks for playability
  for (let y = 2; y < ROWS - 2; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      if (grid[y][x] === WALL && rand() < 0.1) {
        const ed = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (ed < 0.82) grid[y][x] = ORB;
      }
    }
  }

  // 6. Player start — bottom of oval
  let startY = ROWS - 3;
  while (startY > cy && grid[startY]?.[cx] !== ORB) startY--;
  const playerStart = { x: cx, y: startY };
  // Clear surroundings
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const ny = playerStart.y + dy, nx = playerStart.x + dx;
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && grid[ny][nx] === WALL) {
        const ed = ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2;
        if (ed < 0.85) grid[ny][nx] = ORB;
      }
    }

  // 7. Nutrient Vault at center
  grid[cy][cx] = VAULT;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const ny = cy + dy, nx = cx + dx;
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && grid[ny][nx] === WALL)
        grid[ny][nx] = ORB;
    }

  // 8. Place power-ups
  const puTypes = [P_ORT, P_WATER, P_ROOT, P_CARBON, P_MAGNET];
  const numPU = Math.min(2 + Math.floor(level / 2), 5);
  let placed = 0;
  for (let att = 0; att < 400 && placed < numPU; att++) {
    const px = Math.floor(rand() * COLS), py = Math.floor(rand() * ROWS);
    if (grid[py][px] === ORB && !(px === cx && py === cy) && !(px === playerStart.x && py === playerStart.y)) {
      const d = Math.sqrt(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2);
      if (d > 0.15 && d < 0.75) { grid[py][px] = puTypes[placed % puTypes.length]; placed++; }
    }
  }

  // 9. Scatter bonus collectibles
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (grid[y][x] === ORB && rand() < 0.025) grid[y][x] = rand() < 0.5 ? B_GOLD : B_ROOT;

  // 10. Enemy spawn positions (one per quadrant)
  const spawns: { x: number; y: number }[] = [];
  const quads = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [qx, qy] of quads) {
    const tx = Math.round(cx + qx * rx * 0.45);
    const ty = Math.round(cy + qy * ry * 0.45);
    let found = false;
    for (let r = 0; r < 6 && !found; r++)
      for (let dy = -r; dy <= r && !found; dy++)
        for (let dx = -r; dx <= r && !found; dx++) {
          const ny = ty + dy, nx = tx + dx;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && (grid[ny][nx] === ORB || grid[ny][nx] === COLLECTED)) {
            spawns.push({ x: nx, y: ny }); found = true;
          }
        }
  }

  return { grid, playerStart, vaultPos: { x: cx, y: cy }, enemySpawns: spawns };
}

// ═══════════════════════════════════════════════════════════════
// ENEMY AI
// ═══════════════════════════════════════════════════════════════
const DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

function moveCrawler(e: Enemy, maze: number[][]): Enemy {
  const nx = e.x + e.dir.x, ny = e.y + e.dir.y;
  if (isWalkable(nx, ny, maze)) return { ...e, x: nx, y: ny, tickCount: e.tickCount + 1 };
  // Turn clockwise
  const idx = DIRS.findIndex(d => d.x === e.dir.x && d.y === e.dir.y);
  for (let i = 1; i <= 4; i++) {
    const nd = DIRS[(idx + i) % 4];
    if (isWalkable(e.x + nd.x, e.y + nd.y, maze))
      return { ...e, x: e.x + nd.x, y: e.y + nd.y, dir: nd, tickCount: e.tickCount + 1 };
  }
  return { ...e, tickCount: e.tickCount + 1 };
}

function moveRunner(e: Enemy, maze: number[][], player: { x: number; y: number }): Enemy {
  let best = e.dir, bestDist = Infinity;
  for (const d of DIRS) {
    const nx = e.x + d.x, ny = e.y + d.y;
    if (isWalkable(nx, ny, maze)) {
      const dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
  }
  const nx = e.x + best.x, ny = e.y + best.y;
  if (isWalkable(nx, ny, maze)) return { ...e, x: nx, y: ny, dir: best, tickCount: e.tickCount + 1 };
  return { ...e, tickCount: e.tickCount + 1 };
}

function moveTeleporter(e: Enemy, maze: number[][]): Enemy {
  const tick = e.tickCount + 1;
  if (tick % 6 === 0) {
    // Teleport to random walkable cell
    for (let att = 0; att < 60; att++) {
      const rx = Math.floor(Math.random() * COLS), ry = Math.floor(Math.random() * ROWS);
      if (isWalkable(rx, ry, maze)) return { ...e, x: rx, y: ry, tickCount: tick };
    }
  }
  // Normal random walk
  const valid = DIRS.filter(d => isWalkable(e.x + d.x, e.y + d.y, maze));
  if (valid.length > 0) {
    const d = valid[Math.floor(Math.random() * valid.length)];
    return { ...e, x: e.x + d.x, y: e.y + d.y, dir: d, tickCount: tick };
  }
  return { ...e, tickCount: tick };
}

function moveDisruptor(e: Enemy, maze: number[][], player: { x: number; y: number }): Enemy {
  const tick = e.tickCount + 1;
  // 40% chance to lunge toward player
  if (Math.random() < 0.4) {
    let best = e.dir, bestDist = Infinity;
    for (const d of DIRS) {
      const nx = e.x + d.x, ny = e.y + d.y;
      if (isWalkable(nx, ny, maze)) {
        const dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
    }
    const n1x = e.x + best.x, n1y = e.y + best.y;
    if (isWalkable(n1x, n1y, maze)) {
      // Try double step (lunge)
      const n2x = n1x + best.x, n2y = n1y + best.y;
      if (isWalkable(n2x, n2y, maze)) return { ...e, x: n2x, y: n2y, dir: best, tickCount: tick };
      return { ...e, x: n1x, y: n1y, dir: best, tickCount: tick };
    }
  }
  // Random walk
  const valid = DIRS.filter(d => isWalkable(e.x + d.x, e.y + d.y, maze));
  if (valid.length > 0) {
    const d = valid[Math.floor(Math.random() * valid.length)];
    return { ...e, x: e.x + d.x, y: e.y + d.y, dir: d, tickCount: tick };
  }
  return { ...e, tickCount: tick };
}

function moveEnemy(e: Enemy, maze: number[][], player: { x: number; y: number }): Enemy {
  switch (e.type) {
    case 'crawler': return moveCrawler(e, maze);
    case 'runner': return moveRunner(e, maze, player);
    case 'teleporter': return moveTeleporter(e, maze);
    case 'disruptor': return moveDisruptor(e, maze, player);
  }
}

// ═══════════════════════════════════════════════════════════════
// ENEMY VISUAL CONFIG
// ═══════════════════════════════════════════════════════════════
const ENEMY_STYLE: Record<EnemyType, { bg: string; shadow: string; anim: string; label: string }> = {
  crawler: { bg: '#8B6914', shadow: '0 0 8px #8B6914', anim: 'animate-enemy-crawler', label: 'Soil Crawler' },
  runner: { bg: '#ef4444', shadow: '0 0 10px #ef4444', anim: 'animate-enemy-runner', label: 'Speed Runner' },
  teleporter: { bg: '#9b59b6', shadow: '0 0 10px #9b59b6', anim: 'animate-enemy-teleporter', label: 'Rift Teleporter' },
  disruptor: { bg: '#e67e22', shadow: '0 0 12px #e67e22', anim: 'animate-enemy-disruptor', label: 'ORT Disruptor' },
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: SPLASH
// ═══════════════════════════════════════════════════════════════
const Splash = ({ onNext }: { onNext: () => void }) => (
  <motion.div className="flex flex-col items-center justify-center w-full h-full p-6 text-center relative overflow-hidden"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {/* Background pattern */}
    <motion.div className="absolute inset-0 opacity-15 z-0"
      style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(246,184,0,0.1) 10px, rgba(246,184,0,0.1) 11px)' }}
      animate={{ backgroundPosition: ['0px 0px', '50px 50px'] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />

    {/* Fingerprint silhouette */}
    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }} className="relative mb-10 z-10">
      <div className="absolute inset-0 bg-brand-gold/20 blur-[80px] rounded-full scale-150" />
      <svg viewBox="0 0 120 160" width="140" height="187" className="relative z-10">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <motion.ellipse key={i} cx="60" cy="80" rx={8 + i * 8} ry={10 + i * 11}
            fill="none" stroke="rgba(246,184,0,0.3)" strokeWidth="2"
            strokeDasharray={i % 2 === 0 ? '8 4' : '12 5'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 + i * 0.08 }}
            transition={{ duration: 1.5, delay: i * 0.15 }} />
        ))}
        <motion.ellipse cx="60" cy="80" rx="5" ry="6" fill="#F6B800"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }} />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-brand-gold/40 flex items-center justify-center z-20"
        style={{ boxShadow: '0 0 30px rgba(246,184,0,0.3)' }}>
        <Leaf className="w-10 h-10 text-brand-emerald" />
      </div>
    </motion.div>

    <motion.div className="text-[11px] font-orbitron tracking-[0.35em] text-brand-gold/50 uppercase mb-2 z-10"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
      Fingerprint of Prosperity
    </motion.div>
    <motion.h1 className="text-5xl font-montserrat font-extrabold text-white mb-1 tracking-tight z-10"
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
      TRACKON <span className="text-brand-gold text-glow-gold">GOLD</span>
    </motion.h1>
    <motion.p className="text-base text-white/60 mb-12 max-w-sm z-10 font-poppins"
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
      Every farm has its own Fingerprint. Complete yours. Unlock Prosperity.
    </motion.p>

    <motion.button onClick={onNext}
      className="relative group overflow-hidden rounded-full bg-gradient-to-r from-brand-gold to-brand-orange px-12 py-4 text-brand-soil font-bold text-xl uppercase tracking-wider flex items-center gap-3 z-10 active:scale-95 transition-transform"
      style={{ boxShadow: '0 0 30px rgba(246,184,0,0.4)' }}
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <span className="relative z-10">START</span>
      <Play className="w-6 h-6 relative z-10 fill-brand-soil" />
    </motion.button>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// SCREEN: STORY
// ═══════════════════════════════════════════════════════════════
const Story = ({ onNext }: { onNext: () => void }) => {
  useEffect(() => { const t = setTimeout(onNext, 6000); return () => clearTimeout(t); }, [onNext]);
  return (
    <motion.div className="flex flex-col items-center justify-center w-full h-full p-8 text-center"
      initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 1 }}>

      <motion.div className="w-full max-w-md h-48 mb-8 rounded-3xl bg-brand-soil border border-white/5 relative overflow-hidden"
        initial={{ filter: 'grayscale(0%) brightness(1)' }}
        animate={{ filter: 'grayscale(100%) brightness(0.3)' }}
        transition={{ duration: 3 }}>
        <div className="absolute inset-0 bg-brand-maze/10" />
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <Sprout className="w-16 h-16 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        {/* Progress dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <motion.div key={i} className="h-1 rounded-full"
              style={{ width: 20, background: i === 1 ? '#3FAF3A' : 'rgba(255,255,255,0.15)' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.3 }} />
          ))}
        </div>
      </motion.div>

      <motion.h2 className="text-2xl font-montserrat font-semibold text-white/90 leading-relaxed max-w-md"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        Every farm has its own <span className="text-brand-gold text-glow-gold">Fingerprint of Prosperity</span>.
        <br />
        <span className="text-lg text-white/60 block mt-3 font-poppins">
          The soil has lost its essential nutrients. You are the <span className="text-brand-emerald">ORT Energy Core</span> — sent to restore the soil.
        </span>
      </motion.h2>

      <motion.div className="mt-6 text-xs font-orbitron tracking-widest text-white/25 animate-pulse"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
        AUTO-ADVANCING…
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: MISSION
// ═══════════════════════════════════════════════════════════════
const Mission = ({ onNext }: { onNext: () => void }) => (
  <motion.div className="flex flex-col items-center justify-center w-full h-full p-6"
    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
    <div className="glass-card w-full max-w-sm p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-brand-gold/20 pb-4">
        <ShieldAlert className="w-8 h-8 text-brand-gold" />
        <h2 className="text-3xl font-montserrat font-bold text-white tracking-widest">MISSION</h2>
      </div>
      <div className="flex flex-col gap-5">
        {[
          { icon: <Zap className="w-5 h-5 text-brand-gold" />, text: 'Collect ORT Energy Orbs' },
          { icon: <Gem className="w-5 h-5 text-brand-emerald" />, text: 'Fill the Energy Meter to 100%' },
          { icon: <Unlock className="w-5 h-5 text-brand-orange" />, text: 'Unlock the Nutrient Vault' },
          { icon: <Award className="w-5 h-5 text-brand-emerald" />, text: 'Collect all 8 Nutrients' },
          { icon: <Wind className="w-5 h-5 text-red-400" />, text: 'Avoid enemies!' },
        ].map((item, i) => (
          <motion.div key={i} className="flex items-center gap-4 text-lg font-poppins text-white/90"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 + 0.3 }}>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
              {item.icon}
            </div>
            {item.text}
          </motion.div>
        ))}
      </div>
      <motion.button onClick={onNext}
        className="mt-4 w-full rounded-2xl bg-brand-emerald hover:bg-brand-maze px-6 py-4 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        style={{ boxShadow: '0 0 20px rgba(63,175,58,0.4)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        SELECT LEVEL <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// SCREEN: LEVEL SELECT
// ═══════════════════════════════════════════════════════════════
const LevelSelect = ({ completedLevels, onSelect }: { completedLevels: boolean[]; onSelect: (lvl: number) => void }) => (
  <motion.div className="flex flex-col items-center justify-start w-full h-full p-6 overflow-y-auto"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <h2 className="text-3xl font-montserrat font-extrabold text-white mb-1 mt-6 tracking-tight">
      SELECT <span className="text-brand-gold text-glow-gold">LEVEL</span>
    </h2>
    <p className="text-sm text-white/40 font-poppins mb-8">Collect all 8 nutrients to unlock Trackon Gold</p>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-xl">
      {NUTRIENTS.map((n, i) => {
        const unlocked = i === 0 || completedLevels[i - 1];
        const completed = completedLevels[i];
        return (
          <motion.button key={i} onClick={() => unlocked && onSelect(i)}
            className={`relative rounded-2xl p-5 flex flex-col items-center gap-3 border transition-all ${unlocked ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-40'
              } ${completed ? 'border-brand-emerald/50 bg-brand-emerald/10' : 'border-white/10 bg-white/5'}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            {/* Level number */}
            <div className="text-xs font-orbitron tracking-widest text-white/30">LEVEL {i + 1}</div>
            {/* Nutrient crystal */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-orbitron font-bold"
              style={{
                background: completed ? n.color : 'rgba(255,255,255,0.05)',
                color: completed ? '#1a0e08' : n.color,
                boxShadow: completed ? `0 0 15px ${n.color}60` : 'none',
                border: `2px solid ${completed ? n.color : 'rgba(255,255,255,0.1)'}`,
              }}>
              {unlocked ? n.symbol : <Lock className="w-5 h-5 text-white/30" />}
            </div>
            <div className="text-sm font-poppins font-semibold" style={{ color: unlocked ? n.color : 'rgba(255,255,255,0.3)' }}>
              {n.name}
            </div>
            {completed && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-emerald flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>}
            {/* Enemy indicator */}
            {unlocked && !completed && LEVEL_ENEMIES[i].length > 0 && (
              <div className="flex gap-1 mt-1">
                {LEVEL_ENEMIES[i].map((e, j) => (
                  <div key={j} className="w-3 h-3 rounded-full" style={{ background: ENEMY_STYLE[e.type].bg, boxShadow: ENEMY_STYLE[e.type].shadow }} />
                ))}
              </div>
            )}
            {i === 0 && !completed && <div className="text-[10px] font-orbitron text-brand-gold/60 tracking-wider">TUTORIAL</div>}
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// SCREEN: GAME (Main Gameplay)
// ═══════════════════════════════════════════════════════════════
const Game = ({ level, onComplete, onBack }: { level: number; onComplete: (score: number) => void; onBack: () => void }) => {
  const mazeData = useMemo(() => generateFingerprintMaze(level), [level]);
  const [maze, setMaze] = useState<number[][]>([]);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [collected, setCollected] = useState(0);
  const [totalOrbs, setTotalOrbs] = useState(1);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [nutrientGot, setNutrientGot] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [flash, setFlash] = useState<{ text: string; color: string } | null>(null);
  const [trails, setTrails] = useState<{ x: number; y: number }[]>([]);
  const [paused, setPaused] = useState(false);

  // Power-up timers
  const [ortBoost, setOrtBoost] = useState(false);
  const [waterDrop, setWaterDrop] = useState(false);
  const [rootBoost, setRootBoost] = useState(false);
  const [carbonSlow, setCarbonSlow] = useState(false);
  const [magnetField, setMagnetField] = useState(false);

  const playerRef = useRef(player);
  playerRef.current = player;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Initialize level
  useEffect(() => {
    const { grid, playerStart, enemySpawns } = mazeData;
    const m = grid.map(r => [...r]);
    setMaze(m);
    setPlayer(playerStart);
    setScore(0); setCollected(0); setVaultOpen(false); setNutrientGot(false);
    setGameOver(false); setTrails([]); setPaused(false);
    setOrtBoost(false); setWaterDrop(false); setRootBoost(false); setCarbonSlow(false); setMagnetField(false);

    // Count orbs
    let orbs = 0;
    m.forEach(row => row.forEach(c => { if (c === ORB || c === B_GOLD || c === B_ROOT) orbs++; }));
    setTotalOrbs(Math.max(orbs, 1));

    // Create enemies
    const eList: Enemy[] = [];
    const config = LEVEL_ENEMIES[level] || [];
    let spawnIdx = 0;
    for (const ec of config) {
      for (let i = 0; i < ec.count; i++) {
        const sp = enemySpawns[spawnIdx % enemySpawns.length] || { x: 5, y: 5 };
        eList.push({ x: sp.x, y: sp.y, type: ec.type, dir: DIRS[spawnIdx % 4], tickCount: 0 });
        spawnIdx++;
      }
    }
    setEnemies(eList);
    setFlash(null);
  }, [level, mazeData]);

  const energyPct = totalOrbs > 0 ? Math.min(collected / totalOrbs, 1) : 0;

  // Vault unlock
  useEffect(() => {
    if (energyPct >= 1 && !vaultOpen) {
      setVaultOpen(true);
      showFlash('🔓 NUTRIENT VAULT UNLOCKED!', '#3FAF3A');
    }
  }, [energyPct, vaultOpen]);

  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    setTimeout(() => setFlash(null), 1800);
  }

  function activatePowerUp(cellType: number) {
    const names: Record<number, string> = {
      [P_ORT]: 'ORT BOOST ACTIVATED!', [P_WATER]: '💧 WATER DROP — Enemies Frozen!',
      [P_ROOT]: '🌱 ROOT BOOST — Speed +25%!', [P_CARBON]: '🍃 ORGANIC CARBON — Enemies Slowed!',
      [P_MAGNET]: '🧲 MAGNET FIELD ACTIVE!',
    };
    const colors: Record<number, string> = {
      [P_ORT]: '#22D3EE', [P_WATER]: '#3b82f6', [P_ROOT]: '#3FAF3A',
      [P_CARBON]: '#84cc16', [P_MAGNET]: '#a855f7',
    };
    showFlash(names[cellType] || 'POWER UP!', colors[cellType] || '#F6B800');

    const setters: Record<number, [React.Dispatch<React.SetStateAction<boolean>>, number]> = {
      [P_ORT]: [setOrtBoost, 10000], [P_WATER]: [setWaterDrop, 5000],
      [P_ROOT]: [setRootBoost, 10000], [P_CARBON]: [setCarbonSlow, 8000],
      [P_MAGNET]: [setMagnetField, 8000],
    };
    const [setter, dur] = setters[cellType] || [null, 0];
    if (setter) { setter(true); setTimeout(() => setter(false), dur); }
    setScore(s => s + 50);
  }

  // Movement
  const move = useCallback((dx: number, dy: number) => {
    if (gameOver || nutrientGot || paused) return;
    const steps = ortBoost ? 2 : 1;

    setPlayer(prev => {
      let cx = prev.x, cy = prev.y;
      for (let i = 0; i < steps; i++) {
        const nx = cx + dx, ny = cy + dy;
        if (!isWalkable(nx, ny, maze)) break;
        cx = nx; cy = ny;

        const cell = maze[ny][nx];
        if (cell === ORB) {
          setMaze(m => { const n = m.map(r => [...r]); n[ny][nx] = COLLECTED; return n; });
          setScore(s => s + 10); setCollected(c => c + 1);
        } else if (cell === VAULT && vaultOpen) {
          setNutrientGot(true);
          showFlash(`✨ ${NUTRIENTS[level].name} COLLECTED!`, NUTRIENTS[level].color);
          setTimeout(() => onCompleteRef.current(scoreRef.current), 2000);
        } else if (cell >= P_ORT && cell <= P_MAGNET) {
          setMaze(m => { const n = m.map(r => [...r]); n[ny][nx] = COLLECTED; return n; });
          activatePowerUp(cell);
        } else if (cell === B_GOLD) {
          setMaze(m => { const n = m.map(r => [...r]); n[ny][nx] = COLLECTED; return n; });
          setScore(s => s + 50); setCollected(c => c + 1);
          showFlash('✨ +50 Golden Granule!', '#F6B800');
        } else if (cell === B_ROOT) {
          setMaze(m => { const n = m.map(r => [...r]); n[ny][nx] = COLLECTED; return n; });
          setScore(s => s + 25); setCollected(c => c + 1);
          showFlash('🌱 +25 Healthy Root!', '#3FAF3A');
        }
      }
      setTrails(t => [...t.slice(-10), { x: cx, y: cy }]);
      return { x: cx, y: cy };
    });
  }, [maze, gameOver, nutrientGot, paused, ortBoost, vaultOpen, level]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': move(1, 0); break;
        case 'Escape': case 'p': case 'P': setPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [move]);

  // Enemy AI tick
  useEffect(() => {
    if (gameOver || nutrientGot || paused || enemies.length === 0) return;
    if (waterDrop) return; // frozen
    const speed = carbonSlow ? 1000 : 550;
    const timer = setInterval(() => {
      setEnemies(prev => prev.map(e => moveEnemy(e, maze, playerRef.current)));
    }, speed);
    return () => clearInterval(timer);
  }, [maze, gameOver, nutrientGot, paused, waterDrop, carbonSlow, enemies.length]);

  // Collision
  useEffect(() => {
    if (gameOver || nutrientGot) return;
    for (const e of enemies) {
      if (e.x === player.x && e.y === player.y) {
        if (ortBoost) {
          setEnemies(prev => prev.filter(en => !(en.x === player.x && en.y === player.y)));
          setScore(s => s + 200);
          showFlash('💥 ENEMY DESTROYED! +200', '#22D3EE');
        } else {
          setGameOver(true);
        }
        break;
      }
    }
  }, [player, enemies, ortBoost, gameOver, nutrientGot]);

  // Magnet effect
  useEffect(() => {
    if (!magnetField && !ortBoost) return;
    const radius = 3;
    let anyCollected = false;
    setMaze(m => {
      const n = m.map(r => [...r]);
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = player.y + dy, nx = player.x + dx;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && n[ny][nx] === ORB) {
            n[ny][nx] = COLLECTED; anyCollected = true;
            setScore(s => s + 10); setCollected(c => c + 1);
          }
        }
      return anyCollected ? n : m;
    });
  }, [player, magnetField, ortBoost]);

  // ── Render ──
  const hasBoostVisual = ortBoost;
  const cellBg = (cell: number, x: number, y: number) => {
    if (cell === VOID) return 'transparent';
    if (cell === WALL) return 'linear-gradient(135deg, #3a2212, #2A1A12)';
    return 'rgba(15,8,4,0.7)';
  };

  return (
    <div className="flex flex-col items-center w-full h-full relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 transition-colors duration-1000"
        style={{ background: `radial-gradient(ellipse at center, ${hasBoostVisual ? 'rgba(34,211,238,0.1)' : 'rgba(63,175,58,0.05)'}, #2A1A12)` }} />

      {/* ── HUD ── */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 mt-1 glass-panel z-20"
        style={{ background: hasBoostVisual ? 'rgba(34,211,238,0.08)' : undefined, borderColor: hasBoostVisual ? 'rgba(34,211,238,0.3)' : undefined }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <div className="text-[9px] font-orbitron tracking-widest text-brand-gold/50 uppercase">Level {level + 1}</div>
            <div className="text-sm font-montserrat font-bold" style={{ color: NUTRIENTS[level].color }}>{NUTRIENTS[level].name}</div>
          </div>
        </div>
        <div className="text-center flex-1 mx-4">
          <div className="text-[9px] font-orbitron tracking-widest text-white/40 uppercase mb-1">ORT Energy</div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${energyPct * 100}%` }}
              style={{ background: energyPct >= 1 ? 'linear-gradient(90deg, #3FAF3A, #F6B800)' : 'linear-gradient(90deg, #F6B800, #F89A1C)', boxShadow: energyPct >= 1 ? '0 0 12px rgba(63,175,58,0.6)' : '0 0 6px rgba(246,184,0,0.4)' }} />
          </div>
          <div className="text-[10px] font-orbitron mt-0.5" style={{ color: energyPct >= 1 ? '#3FAF3A' : 'rgba(246,184,0,0.5)' }}>
            {Math.floor(energyPct * 100)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-orbitron tracking-widest text-brand-gold/50 uppercase">Score</div>
          <div className="text-lg font-orbitron text-white text-glow-gold">{score}</div>
        </div>
      </div>

      {/* Active power-up indicators */}
      <div className="flex gap-2 mt-1 h-6 z-20">
        {ortBoost && <span className="text-[9px] font-orbitron px-2 py-0.5 rounded-full bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 animate-pulse">⚡ ORT BOOST</span>}
        {waterDrop && <span className="text-[9px] font-orbitron px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 border border-blue-500/30">💧 FREEZE</span>}
        {rootBoost && <span className="text-[9px] font-orbitron px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-500/30">🌱 SPEED</span>}
        {carbonSlow && <span className="text-[9px] font-orbitron px-2 py-0.5 rounded-full bg-lime-900/50 text-lime-400 border border-lime-500/30">🍃 SLOW</span>}
        {magnetField && <span className="text-[9px] font-orbitron px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-400 border border-purple-500/30">🧲 MAGNET</span>}
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 text-lg font-montserrat font-bold whitespace-nowrap px-4 py-1.5 rounded-full"
            style={{ color: flash.color, textShadow: `0 0 12px ${flash.color}`, background: 'rgba(0,0,0,0.6)' }}>
            {flash.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAZE ── */}
      <div className="flex-1 flex items-center justify-center w-full px-2 py-1 z-10">
        <div className={`relative overflow-hidden transition-all duration-500 ${hasBoostVisual ? 'shadow-[0_0_40px_rgba(34,211,238,0.2)]' : ''}`}
          style={{
            display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '1px',
            width: '100%', maxWidth: '520px', aspectRatio: `${COLS}/${ROWS}`,
            background: 'rgba(10,5,2,0.5)', borderRadius: '45% / 48%', padding: '2px',
          }}>
          {maze.map((row, y) => row.map((cell, x) => {
            const isPlayer = player.x === x && player.y === y;
            const enemyHere = enemies.filter(e => e.x === x && e.y === y);
            const isTrail = trails.some(t => t.x === x && t.y === y);
            const isVoid = cell === VOID;

            return (
              <div key={`${x}-${y}`} className="relative flex items-center justify-center"
                style={{
                  background: isVoid ? 'transparent' : cellBg(cell, x, y),
                  opacity: isVoid ? 0 : 1,
                  borderRadius: cell === WALL ? '2px' : '50%',
                  boxShadow: cell === WALL && energyPct > 0.3 ? 'inset 0 0 2px rgba(63,175,58,0.15)' : undefined,
                }}>
                {/* Trail */}
                {isTrail && !isVoid && cell !== WALL && (
                  <div className="absolute inset-0 rounded-full animate-trail-fade"
                    style={{ background: hasBoostVisual ? 'rgba(34,211,238,0.2)' : 'rgba(246,184,0,0.15)' }} />
                )}

                {/* ORT Energy Orb */}
                {cell === ORB && !isPlayer && (
                  <div className="w-[5px] h-[5px] rounded-full bg-brand-gold animate-orb-glow" />
                )}

                {/* Nutrient Vault */}
                {cell === VAULT && !isPlayer && (
                  <div className={`w-[80%] h-[80%] rounded-lg flex items-center justify-center ${vaultOpen ? 'animate-vault-unlocked' : 'animate-vault-locked'}`}
                    style={{
                      background: vaultOpen ? 'linear-gradient(135deg, #3FAF3A, #F6B800)' : 'linear-gradient(135deg, #8B6914, #F6B800)',
                      border: `1.5px solid ${vaultOpen ? '#3FAF3A' : 'rgba(246,184,0,0.5)'}`,
                    }}>
                    {vaultOpen ? <Unlock className="w-2.5 h-2.5 text-white" /> : <Lock className="w-2.5 h-2.5 text-brand-soil" />}
                  </div>
                )}

                {/* Power-ups */}
                {cell === P_ORT && !isPlayer && (
                  <div className="w-[70%] h-[70%] bg-cyan-400 rounded-sm rotate-45 animate-powerup-spin"
                    style={{ boxShadow: '0 0 8px #22d3ee' }} />
                )}
                {cell === P_WATER && !isPlayer && (
                  <div className="w-[70%] h-[70%] bg-blue-400 rounded-full animate-crystal-float"
                    style={{ boxShadow: '0 0 6px #3b82f6' }} />
                )}
                {cell === P_ROOT && !isPlayer && (
                  <div className="w-[70%] h-[70%] bg-green-500 rounded-full animate-crystal-float"
                    style={{ boxShadow: '0 0 6px #22c55e' }} />
                )}
                {cell === P_CARBON && !isPlayer && (
                  <div className="w-[60%] h-[60%] bg-lime-400 rounded-full animate-crystal-float"
                    style={{ boxShadow: '0 0 6px #84cc16' }} />
                )}
                {cell === P_MAGNET && !isPlayer && (
                  <div className="w-[70%] h-[70%] bg-purple-400 rounded-sm rotate-45 animate-powerup-spin"
                    style={{ boxShadow: '0 0 8px #a855f7' }} />
                )}

                {/* Bonus collectibles */}
                {cell === B_GOLD && !isPlayer && (
                  <div className="w-[6px] h-[6px] rounded-full animate-orb-glow"
                    style={{ background: '#FFD700', boxShadow: '0 0 6px #FFD700' }} />
                )}
                {cell === B_ROOT && !isPlayer && (
                  <div className="w-[5px] h-[5px] rounded-sm animate-orb-glow"
                    style={{ background: '#3FAF3A', boxShadow: '0 0 5px #3FAF3A' }} />
                )}

                {/* ── PLAYER (ORT Energy Core) ── */}
                {isPlayer && (
                  <motion.div layoutId="player"
                    className={`absolute inset-[-30%] rounded-full z-30 flex items-center justify-center ${hasBoostVisual ? 'animate-ort-boost' : 'animate-ort-pulse'}`}
                    style={{
                      background: hasBoostVisual ? 'radial-gradient(circle, #22d3ee, #0891b2)' : 'radial-gradient(circle, #3FAF3A, #2d8a28)',
                      border: `2px solid ${hasBoostVisual ? '#67e8f9' : '#F6B800'}`,
                    }}>
                    {/* Golden rotating ring */}
                    <div className="absolute inset-[-4px] rounded-full border border-brand-gold/40 animate-ort-ring" />
                    {/* Inner glow */}
                    <div className="w-[40%] h-[40%] rounded-full bg-white/80 blur-[1px]" />
                  </motion.div>
                )}

                {/* ── ENEMIES ── */}
                {enemyHere.map((en, i) => {
                  const st = ENEMY_STYLE[en.type];
                  return (
                    <div key={i}
                      className={`absolute inset-[-10%] rounded-full z-20 flex items-center justify-center ${waterDrop ? 'opacity-40' : st.anim}`}
                      style={{ background: waterDrop ? '#1e3a8a' : st.bg, boxShadow: waterDrop ? '0 0 4px #1e3a8a' : st.shadow }}>
                      <div className="w-[30%] h-[30%] rounded-full bg-white/80" />
                    </div>
                  );
                })}
              </div>
            );
          }))}

          {/* ── Pause Overlay ── */}
          {paused && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-[45%/48%]">
              <Pause className="w-12 h-12 text-brand-gold mb-4" />
              <h3 className="text-2xl font-montserrat font-bold text-white mb-6">PAUSED</h3>
              <button onClick={() => setPaused(false)}
                className="rounded-full bg-brand-emerald px-8 py-3 text-white font-bold mb-3 hover:bg-brand-maze transition-colors">
                RESUME
              </button>
              <button onClick={onBack}
                className="rounded-full bg-white/10 px-8 py-3 text-white/70 font-bold hover:bg-white/20 transition-colors">
                QUIT
              </button>
            </div>
          )}

          {/* ── Game Over Overlay ── */}
          <AnimatePresence>
            {gameOver && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center rounded-[45%/48%]">
                <h3 className="text-3xl font-montserrat font-bold text-red-500 mb-2 text-glow-red">NUTRIENTS LOST</h3>
                <p className="text-white/50 mb-2 font-poppins text-sm">Score: {score}</p>
                <p className="text-white/40 mb-6 font-poppins text-xs">The soil needs you. Try again.</p>
                <button onClick={() => {
                  const { grid, playerStart, enemySpawns } = generateFingerprintMaze(level);
                  setMaze(grid.map(r => [...r]));
                  setPlayer(playerStart);
                  let orbs = 0;
                  grid.forEach(row => row.forEach(c => { if (c === ORB || c === B_GOLD || c === B_ROOT) orbs++; }));
                  setTotalOrbs(Math.max(orbs, 1));
                  setCollected(0); setScore(0); setVaultOpen(false); setNutrientGot(false);
                  setGameOver(false); setTrails([]);
                  setOrtBoost(false); setWaterDrop(false); setRootBoost(false); setCarbonSlow(false); setMagnetField(false);
                  const eList: Enemy[] = [];
                  let si = 0;
                  for (const ec of (LEVEL_ENEMIES[level] || [])) {
                    for (let i = 0; i < ec.count; i++) {
                      const sp = enemySpawns[si % enemySpawns.length] || { x: 5, y: 5 };
                      eList.push({ x: sp.x, y: sp.y, type: ec.type, dir: DIRS[si % 4], tickCount: 0 });
                      si++;
                    }
                  }
                  setEnemies(eList);
                }}
                  className="rounded-full bg-white/10 hover:bg-white/20 px-8 py-3 text-white font-bold flex items-center gap-2 transition-colors">
                  <RefreshCw className="w-5 h-5" /> RESTART
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div className="flex items-center gap-6 pb-3 z-20">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1.5" style={{ width: 130 }}>
          <div />
          <button className="bg-white/10 active:bg-white/25 rounded-xl flex items-center justify-center h-10 transition-colors"
            onClick={() => move(0, -1)}>
            <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[10px] border-transparent border-b-white/80" />
          </button>
          <div />
          <button className="bg-white/10 active:bg-white/25 rounded-xl flex items-center justify-center h-10 transition-colors"
            onClick={() => move(-1, 0)}>
            <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-r-[10px] border-transparent border-r-white/80" />
          </button>
          <div className="bg-white/5 rounded-xl flex items-center justify-center h-10">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-gold/20" />
          </div>
          <button className="bg-white/10 active:bg-white/25 rounded-xl flex items-center justify-center h-10 transition-colors"
            onClick={() => move(1, 0)}>
            <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[10px] border-transparent border-l-white/80" />
          </button>
          <div />
          <button className="bg-white/10 active:bg-white/25 rounded-xl flex items-center justify-center h-10 transition-colors"
            onClick={() => move(0, 1)}>
            <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] border-transparent border-t-white/80" />
          </button>
          <div />
        </div>

        {/* Pause */}
        <button onClick={() => setPaused(p => !p)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <Pause className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: LEVEL COMPLETE
// ═══════════════════════════════════════════════════════════════
const LevelComplete = ({ level, score, onNext }: { level: number; score: number; onNext: () => void }) => {
  useEffect(() => { const t = setTimeout(onNext, 4000); return () => clearTimeout(t); }, [onNext]);
  return (
    <motion.div className="flex flex-col items-center justify-center w-full h-full p-6 relative overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, rgba(63,175,58,0.15), #2A1A12)' }} />

      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }} className="z-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-orbitron font-bold mb-6"
          style={{
            background: NUTRIENTS[level].color, color: '#1a0e08',
            boxShadow: `0 0 40px ${NUTRIENTS[level].color}80`, border: `3px solid white`,
          }}>
          {NUTRIENTS[level].symbol}
        </div>
        <h2 className="text-3xl font-montserrat font-extrabold text-white mb-1 text-glow-emerald">LEVEL {level + 1} COMPLETE</h2>
        <p className="text-xl font-poppins font-semibold mb-2" style={{ color: NUTRIENTS[level].color }}>
          {NUTRIENTS[level].name} Restored!
        </p>
        <p className="text-brand-gold font-orbitron text-sm">Score: {score}</p>
      </motion.div>

      {/* Fingerprint glow effect */}
      <motion.div className="absolute bottom-10 z-10" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}>
        <svg viewBox="0 0 120 160" width="120" height="160">
          {[0, 1, 2, 3, 4].map(i => (
            <ellipse key={i} cx="60" cy="80" rx={12 + i * 10} ry={16 + i * 14}
              fill="none" stroke={NUTRIENTS[level].color} strokeWidth="1.5" strokeDasharray="8 5" opacity={0.3 + i * 0.1} />
          ))}
        </svg>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: FINAL REVEAL (after all 8 levels)
// ═══════════════════════════════════════════════════════════════
const Reveal = ({ onNext }: { onNext: () => void }) => {
  useEffect(() => { const t = setTimeout(onNext, 7000); return () => clearTimeout(t); }, [onNext]);
  return (
    <motion.div className="flex flex-col items-center justify-center w-full h-full p-6 relative overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}>
      <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, #3d2a00, #2A1A12)' }} />
      <motion.div className="absolute inset-0 opacity-30 z-0"
        style={{ background: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
        animate={{ backgroundPosition: ['0px 0px', '100px 100px'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div initial={{ y: 150, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, ease: 'easeOut' }} className="relative">
          {/* Glow aura */}
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-brand-gold blur-[100px] rounded-full scale-150" />
          {/* Product package */}
          <div className="w-56 h-72 bg-gradient-to-b from-brand-gold to-[#a17700] rounded-2xl relative border-4 border-yellow-200 flex flex-col items-center justify-center p-6 z-20"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(246,184,0,0.4)' }}>
            <Leaf className="w-16 h-16 text-brand-soil mb-4" />
            <h2 className="text-4xl font-montserrat font-black text-brand-soil tracking-tighter text-center leading-none">TRACKON<br />GOLD</h2>
            <div className="w-full h-1 bg-brand-soil/20 my-4" />
            <div className="text-brand-soil font-orbitron font-bold text-sm bg-white/20 px-4 py-1 rounded-full">ORT TECHNOLOGY</div>
          </div>
          {/* Orbiting nutrient crystals */}
          {NUTRIENTS.map((n, i) => (
            <motion.div key={i} className="absolute top-1/2 left-1/2 z-10"
              style={{ marginTop: -14, marginLeft: -14 }}
              animate={{
                x: [Math.cos(i * Math.PI / 4) * 170, Math.cos((i * Math.PI / 4) + Math.PI * 2) * 170],
                y: [Math.sin(i * Math.PI / 4) * 170, Math.sin((i * Math.PI / 4) + Math.PI * 2) * 170],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-orbitron font-bold"
                style={{ background: n.color, color: '#1a0e08', boxShadow: `0 0 12px ${n.color}` }}>
                {n.symbol}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.h2 className="text-5xl font-montserrat font-bold text-white mt-16 text-glow-gold text-center"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}>
          FINGERPRINT<br />RESTORED
        </motion.h2>
        <motion.p className="text-sm font-poppins text-brand-emerald mt-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
          ✅ All 8 Nutrients Collected · ✅ ORT Technology Activated
        </motion.p>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCREEN: REWARD
// ═══════════════════════════════════════════════════════════════
const Reward = ({ onRestart }: { onRestart: () => void }) => (
  <motion.div className="flex flex-col items-center justify-center w-full h-full p-8 text-center relative overflow-hidden"
    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/20 via-brand-soil to-brand-soil -z-10" />

    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
      <Trophy className="w-28 h-28 text-brand-gold mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(246,184,0,0.8))' }} />
    </motion.div>

    <h1 className="text-4xl md:text-5xl font-montserrat font-extrabold text-white mb-2 text-glow-gold tracking-tight">
      🎉 CONGRATULATIONS
    </h1>
    <p className="text-lg text-white/50 mb-2 font-poppins">Fingerprint Restored</p>
    <p className="text-xl text-brand-emerald font-poppins font-semibold mb-10">🏆 Trackon Gold Unlocked</p>

    {/* Collected nutrients */}
    <div className="flex gap-2 mb-10 flex-wrap justify-center">
      {NUTRIENTS.map((n, i) => (
        <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-orbitron font-bold"
          style={{ background: n.color, color: '#1a0e08', boxShadow: `0 0 8px ${n.color}60` }}>
          {n.symbol}
        </div>
      ))}
    </div>

    <div className="w-full max-w-sm flex flex-col gap-3">
      <button className="w-full rounded-2xl bg-gradient-to-r from-brand-gold to-brand-orange px-6 py-5 text-brand-soil font-bold text-lg transition-transform hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 0 30px rgba(246,184,0,0.4)' }}>
        🎁 CLAIM REWARD
      </button>
      <button onClick={onRestart}
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white font-bold text-lg hover:bg-white/10 transition-colors">
        🔄 PLAY AGAIN
      </button>
      <div className="flex gap-3 w-full">
        <button className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors">
          📖 Learn More
        </button>
        <button className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/60 font-bold text-sm hover:bg-white/10 transition-colors">
          📲 Scan QR
        </button>
      </div>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<GameScreen>('SPLASH');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<boolean[]>(Array(8).fill(false));
  const [totalScore, setTotalScore] = useState(0);
  const navigate = useNavigate();

  const handleLevelComplete = (levelScore: number) => {
    setTotalScore(s => s + levelScore);
    setCompletedLevels(prev => {
      const n = [...prev]; n[currentLevel] = true; return n;
    });
    // Check if all 8 done
    const allDone = completedLevels.filter(Boolean).length >= 7; // this was the 8th
    if (allDone) {
      setScreen('REVEAL');
    } else {
      setScreen('LEVEL_COMPLETE');
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-brand-soil text-white">

      <AnimatePresence mode="wait">
        {screen === 'SPLASH' && <Splash key="splash" onNext={() => setScreen('STORY')} />}
        {screen === 'STORY' && <Story key="story" onNext={() => setScreen('MISSION')} />}
        {screen === 'MISSION' && <Mission key="mission" onNext={() => setScreen('LEVEL_SELECT')} />}
        {screen === 'LEVEL_SELECT' && (
          <LevelSelect key="levelsel" completedLevels={completedLevels}
            onSelect={(lvl) => { setCurrentLevel(lvl); setScreen('GAME'); }} />
        )}
        {screen === 'GAME' && (
          <Game key={`game-${currentLevel}`} level={currentLevel}
            onComplete={handleLevelComplete} onBack={() => setScreen('LEVEL_SELECT')} />
        )}
        {screen === 'LEVEL_COMPLETE' && (
          <LevelComplete key="lvlcomplete" level={currentLevel} score={totalScore}
            onNext={() => setScreen('LEVEL_SELECT')} />
        )}
        {screen === 'REVEAL' && <Reveal key="reveal" onNext={() => setScreen('REWARD')} />}
        {screen === 'REWARD' && <Reward key="reward" onRestart={() => {
          setCompletedLevels(Array(8).fill(false));
          setTotalScore(0); setCurrentLevel(0); setScreen('SPLASH');
        }} />}
      </AnimatePresence>
    </div>
  );
}
