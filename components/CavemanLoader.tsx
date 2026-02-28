"use client";

import { useEffect, useRef, useState } from "react";

type Mood = "curious" | "working" | "stressed" | "exhausted";

interface CavemanLoaderProps {
  isActive: boolean;
}

// ─── Eyebrow paths per mood ───────────────────────────────────────────────────
// Eyes sit at cx=76 and cx=124, cy=78.
// Brows sit roughly 14-18px above the eye centres.
const BROWS: Record<Mood, { left: string; right: string }> = {
  curious: {
    left:  "M 62 63 Q 76 58 90 63",   // gentle arch (neutral)
    right: "M 110 63 Q 124 58 138 63",
  },
  working: {
    left:  "M 62 60 Q 76 65 90 60",   // furrowed inward V (concentrating)
    right: "M 110 60 Q 124 65 138 60",
  },
  stressed: {
    left:  "M 62 66 Q 76 57 90 62",   // angled inner-up / outer-down (worried)
    right: "M 110 62 Q 124 57 138 66",
  },
  exhausted: {
    left:  "M 62 70 Q 76 76 90 70",   // droopy, heavy
    right: "M 110 70 Q 124 76 138 70",
  },
};

// ─── Mouth paths per mood ────────────────────────────────────────────────────
// Mouth sits in the beard area around y=116.
const MOUTH: Record<Mood, string> = {
  curious:   "M 84 115 Q 100 127 116 115",  // gentle smile
  working:   "M 86 119 Q 100 119 114 119",  // flat neutral line
  stressed:  "M 84 122 Q 100 114 116 122",  // slight frown
  exhausted: "M 82 126 Q 100 114 118 126",  // heavy downturned frown
};

// ─── Eye open height per mood ─────────────────────────────────────────────────
const EYE_RY: Record<Mood, number> = {
  curious:   12,   // wide, alert
  working:   10,   // slightly narrowed focus
  stressed:  13,   // wide with tension
  exhausted: 4,    // barely open
};

// ─── Body-level animation class per mood ─────────────────────────────────────
const ANIM: Record<Mood, string> = {
  curious:   "cm-idle",
  working:   "cm-tilt",
  stressed:  "cm-shake",
  exhausted: "cm-slump",
};

export default function CavemanLoader({ isActive }: CavemanLoaderProps) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const startRef = useRef(0);

  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [mood,  setMood]  = useState<Mood>("curious");
  const [blink, setBlink] = useState(false);

  // ── Mood timer: fits a 40-45s backend response window ──────────────────────
  useEffect(() => {
    if (!isActive) {
      setMood("curious");
      setPupil({ x: 0, y: 0 });
      return;
    }
    startRef.current = Date.now();
    const id = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      if      (s <  10) setMood("curious");
      else if (s <  22) setMood("working");
      else if (s <  35) setMood("stressed");
      else              setMood("exhausted");
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // ── Cursor tracking: pupils follow the mouse ────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      // Eye centre in screen coords, mapped from SVG (100, 80) in 200×290 space
      const cx = rect.left + (100 / 200) * rect.width;
      const cy = rect.top  + (80  / 290) * rect.height;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const max  = 4;
      setPupil({
        x: dist > 0 ? (dx / dist) * Math.min(dist * 0.05, max) : 0,
        y: dist > 0 ? (dy / dist) * Math.min(dist * 0.05, max) : 0,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isActive]);

  // ── Randomised blinking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 120);
      }, 2200 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(t);
  }, [isActive]);

  if (!isActive) return null;

  const eyeRy = blink ? 1.5 : EYE_RY[mood];

  return (
    <div className="cm-container">
      {/*
        ViewBox 0 0 200 290.
        Layers ordered back-to-front (painter's algorithm):
          1  feet          – dark ellipses behind everything
          2  legs          – skin below tunic
          3  tunic         – wide orange-yellow body with polka dots
          4  club          – stone + wooden handle, at left-hand side
          5  left-arm      – arm holding the club
          6  right-arm     – free hanging arm
          7  neck          – bridging head to body
          8  head          – all face features inside a single group
      */}
      <svg
        ref={svgRef}
        viewBox="0 0 200 290"
        width="150"
        height="218"
        className={`cm-svg ${ANIM[mood]}`}
        aria-hidden="true"
      >

        {/* ═══════════════════════════════════════════
            LAYER 1 — FEET
            Dark rounded shapes at the very bottom.
        ═══════════════════════════════════════════ */}
        <g id="layer-feet">
          <ellipse cx="76"  cy="280" rx="24" ry="10" fill="#1a0a02" />
          <ellipse cx="124" cy="280" rx="24" ry="10" fill="#1a0a02" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 2 — LEGS
            Skin-coloured rounded columns visible
            below the tunic hem.
        ═══════════════════════════════════════════ */}
        <g id="layer-legs">
          <rect x="62"  y="248" width="30" height="32" rx="12" fill="#F3B36D" />
          <rect x="108" y="248" width="30" height="32" rx="12" fill="#F3B36D" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 3 — TUNIC (orange-yellow, polka dots)
            Wide trapezoidal body, narrowing at the
            shoulders and flaring slightly at the hem.
        ═══════════════════════════════════════════ */}
        <g id="layer-tunic">
          {/* main tunic shape */}
          <path
            d="M 44 148 L 36 258 L 164 258 L 156 148
               Q 136 138 100 136 Q 64 138 44 148 Z"
            fill="#EE910F"
          />
          {/* polka dots – evenly spread, same orange-dark shade */}
          <circle cx="76"  cy="170" r="13" fill="#ED8F03" />
          <circle cx="116" cy="178" r="11" fill="#ED8F03" />
          <circle cx="90"  cy="200" r="10" fill="#ED8F03" />
          <circle cx="126" cy="210" r="12" fill="#ED8F03" />
          <circle cx="72"  cy="220" r="9"  fill="#ED8F03" />
          <circle cx="112" cy="234" r="11" fill="#ED8F03" />
          <circle cx="86"  cy="246" r="8"  fill="#ED8F03" />
          <circle cx="140" cy="192" r="8"  fill="#ED8F03" />
          <circle cx="58"  cy="196" r="7"  fill="#ED8F03" />
          <circle cx="138" cy="244" r="7"  fill="#ED8F03" />
          <circle cx="104" cy="256" r="6"  fill="#ED8F03" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 4 — STONE CLUB
            Wooden handle + oval matte-gray stone head.
            Positioned at the character's right hand
            (left side of screen).

            Stone specs:
              material : matte gray
              texture  : uneven, slightly chipped
              shape    : oval/teardrop tied to handle
              edges    : blunt, not sharp
              weight   : heavy/grounded impression
        ═══════════════════════════════════════════ */}
        <g id="layer-club">
          {/* wooden handle – dark brown, round-capped */}
          <line
            x1="30" y1="234"
            x2="22" y2="264"
            stroke="#6b4020" strokeWidth="9" strokeLinecap="round"
          />
          {/* binding wraps where stone meets handle */}
          <rect x="15" y="259" width="14" height="5" rx="2" fill="#5c3010" />
          <rect x="15" y="265" width="14" height="3" rx="1" fill="#4a2408" />
          {/* stone head – oval, matte gray base */}
          <ellipse cx="18" cy="275" rx="20" ry="15" fill="#787878" />
          {/* perimeter stroke – darker edge for weight impression */}
          <ellipse cx="18" cy="275" rx="20" ry="15" fill="none" stroke="#5a5a5a" strokeWidth="2" />
          {/* surface light highlight – upper-left catch light */}
          <ellipse cx="14" cy="268" rx="7" ry="4" fill="#9e9e9e" opacity="0.55" />
          {/* chipped / uneven texture marks */}
          <path d="M 6 268 Q 9 273 7 279"  stroke="#666" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 28 269 Q 30 274 28 280" stroke="#9a9a9a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="13" cy="273" rx="5" ry="3" fill="#959595" opacity="0.5" />
          <ellipse cx="25" cy="279" rx="4" ry="2.5" fill="#5c5c5c" opacity="0.4" />
          {/* subtle shadow under stone – grounds it visually */}
          <ellipse cx="20" cy="288" rx="18" ry="5" fill="#000" opacity="0.12" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 5 — LEFT ARM
            Thick rounded path from shoulder to wrist.
            3 horizontal wrist marks (tribal style).
        ═══════════════════════════════════════════ */}
        <g id="layer-left-arm">
          <path
            d="M 54 162 Q 30 194 30 230"
            stroke="#F3B36D" strokeWidth="26" fill="none" strokeLinecap="round"
          />
          {/* wrist markings – 3 dark horizontal stripes */}
          <line x1="20" y1="224" x2="40" y2="229" stroke="#2c1a08" strokeWidth="2.5" strokeLinecap="round" opacity="0.80" />
          <line x1="19" y1="230" x2="39" y2="235" stroke="#2c1a08" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
          <line x1="20" y1="236" x2="40" y2="241" stroke="#2c1a08" strokeWidth="2.0" strokeLinecap="round" opacity="0.50" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 6 — RIGHT ARM
            Mirror of left arm, no object held.
        ═══════════════════════════════════════════ */}
        <g id="layer-right-arm">
          <path
            d="M 146 162 Q 170 194 170 230"
            stroke="#F3B36D" strokeWidth="26" fill="none" strokeLinecap="round"
          />
          {/* wrist markings */}
          <line x1="160" y1="224" x2="180" y2="229" stroke="#2c1a08" strokeWidth="2.5" strokeLinecap="round" opacity="0.80" />
          <line x1="160" y1="230" x2="180" y2="235" stroke="#2c1a08" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
          <line x1="160" y1="236" x2="180" y2="241" stroke="#2c1a08" strokeWidth="2.0" strokeLinecap="round" opacity="0.50" />
        </g>

        {/* ═══════════════════════════════════════════
            LAYER 7 — NECK
            Short rounded rectangle bridging head
            to tunic.
        ═══════════════════════════════════════════ */}
        <rect x="87" y="130" width="26" height="20" rx="7" fill="#F3B36D" />

        {/* ═══════════════════════════════════════════
            LAYER 8 — HEAD
            All face content inside one group so it
            sits entirely above the body layers.

            Sub-layers inside head (back to front):
              a  head circle (skin)
              b  beard (dark, lower half)
              c  hair  (dark, upper half + sides)
              d  eyebrows (mood-driven)
              e  eye whites
              f  pupils + highlights
              g  nose
              h  cheeks
              i  mouth
              j  mood overlays (lids, sweat, focus)
        ═══════════════════════════════════════════ */}
        <g id="layer-head">

          {/* a – base skin circle */}
          <circle cx="100" cy="82" r="54" fill="#F3B36D" />

          {/* b – beard
              Covers lower face, cheeks, and hangs
              slightly below the head circle onto
              the neck/upper tunic area.
          */}
          <path
            d="M 50 108
               Q 46 133 52 153
               Q 60 171 76 178
               Q 88 184 100 182
               Q 112 184 124 178
               Q 140 171 148 153
               Q 154 133 150 108
               Q 138 122 126 124
               Q 114 128 104 122
               Q 100 125 96 122
               Q 86 128 74 124
               Q 62 122 50 108 Z"
            fill="#3d2008"
          />

          {/* c – hair
              Sits over the top and sides of the head,
              with natural rounded peaks.
          */}
          <path
            d="M 48 82
               Q 46 52 52 32
               Q 60 10 76 10
               Q 84 2 96 6
               Q 100 0 104 6
               Q 116 2 124 10
               Q 140 10 148 32
               Q 154 52 152 82
               Q 144 60 136 56
               Q 128 46 118 52
               Q 110 36 104 42
               Q 100 34 96 42
               Q 90 36 82 52
               Q 72 46 64 56
               Q 56 60 48 82 Z"
            fill="#3d2008"
          />

          {/* d – eyebrows, mood-driven */}
          <path
            d={BROWS[mood].left}
            stroke="#3d2008" strokeWidth="5" fill="none" strokeLinecap="round"
          />
          <path
            d={BROWS[mood].right}
            stroke="#3d2008" strokeWidth="5" fill="none" strokeLinecap="round"
          />

          {/* e – eye whites */}
          <ellipse cx="76"  cy="78" rx="14" ry={eyeRy} fill="white" />
          <ellipse cx="124" cy="78" rx="14" ry={eyeRy} fill="white" />

          {/* f – pupils + catch-light highlight */}
          {!blink && (
            <>
              <circle cx={76  + pupil.x} cy={78 + pupil.y} r="8"   fill="#1a0800" />
              <circle cx={124 + pupil.x} cy={78 + pupil.y} r="8"   fill="#1a0800" />
              <circle cx={78  + pupil.x} cy={75 + pupil.y} r="2.8" fill="white"   />
              <circle cx={126 + pupil.x} cy={75 + pupil.y} r="2.8" fill="white"   />
            </>
          )}

          {/* g – nose
              Large, round, bulbous. Pinkish-red with
              two subtle nostril shadows and a slight
              specular highlight at the top.
          */}
          <circle cx="100" cy="98" r="14" fill="#E98B5A" />
          <circle cx="94"  cy="94" r="4.5" fill="#C06838" opacity="0.38" />
          <circle cx="106" cy="94" r="4.5" fill="#C06838" opacity="0.38" />
          <ellipse cx="100" cy="101" rx="7" ry="4" fill="#D07848" opacity="0.22" />
          {/* slight specular top */}
          <ellipse cx="98" cy="93" rx="5" ry="3" fill="#F0A070" opacity="0.35" />

          {/* h – cheeks (rosy circles, semi-transparent) */}
          <circle cx="58"  cy="99" r="16" fill="#d85840" opacity="0.22" />
          <circle cx="142" cy="99" r="16" fill="#d85840" opacity="0.22" />

          {/* i – mouth, mood-driven */}
          <path
            d={MOUTH[mood]}
            stroke="#2c1a08" strokeWidth="4.5" fill="none" strokeLinecap="round"
          />

          {/* j – mood-specific overlays */}

          {/* working: two small concentration lines above brows */}
          {mood === "working" && (
            <>
              <line x1="94"  y1="50" x2="96"  y2="55" stroke="#F3B36D" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="106" y1="50" x2="104" y2="55" stroke="#F3B36D" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* stressed: sweat drop, top-right of head */}
          {mood === "stressed" && (
            <g className="cm-sweat">
              <path
                d="M 156 54 Q 152 63 158 70 Q 164 63 162 54 Q 158 48 156 54 Z"
                fill="#74b9d4"
              />
            </g>
          )}

          {/* exhausted: heavy skin-coloured eyelids drooping over eyes */}
          {mood === "exhausted" && (
            <>
              <path d="M 62 74 Q 76 70 90 74 L 90 81 Q 76 77 62 81 Z" fill="#F3B36D" />
              <path d="M 110 74 Q 124 70 138 74 L 138 81 Q 124 77 110 81 Z" fill="#F3B36D" />
            </>
          )}

        </g>{/* end layer-head */}

      </svg>
    </div>
  );
}
