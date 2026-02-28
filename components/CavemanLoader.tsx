"use client";

import { useEffect, useRef, useState } from "react";

type Mood = "curious" | "working" | "stressed" | "exhausted";

interface CavemanLoaderProps {
  isActive: boolean;
}

// Eyebrow SVG paths for each mood
const BROWS: Record<Mood, { left: string; right: string }> = {
  curious: {
    left:  "M 70 68 Q 81 63 92 68",
    right: "M 108 68 Q 119 63 130 68",
  },
  working: {
    left:  "M 70 64 Q 81 68 92 64",
    right: "M 108 64 Q 119 68 130 64",
  },
  stressed: {
    left:  "M 70 70 Q 81 61 92 65",
    right: "M 108 65 Q 119 61 130 70",
  },
  exhausted: {
    left:  "M 70 75 Q 81 80 92 75",
    right: "M 108 75 Q 119 80 130 75",
  },
};

// Mouth paths for each mood
const MOUTH: Record<Mood, string> = {
  curious:   "M 86 112 Q 100 122 114 112",
  working:   "M 88 113 Q 100 113 112 113",
  stressed:  "M 86 118 Q 100 112 114 118",
  exhausted: "M 84 120 Q 100 112 116 120",
};

// Eye open height per mood (closed on blink)
const EYE_RY: Record<Mood, number> = {
  curious:   9,
  working:   8,
  stressed:  11,
  exhausted: 5,
};

// CSS animation class per mood
const ANIM: Record<Mood, string> = {
  curious:   "cm-idle",
  working:   "cm-tilt",
  stressed:  "cm-shake",
  exhausted: "cm-slump",
};

export default function CavemanLoader({ isActive }: CavemanLoaderProps) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const startRef = useRef(0);

  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [mood,  setMood]  = useState<Mood>("curious");
  const [blink, setBlink] = useState(false);

  // Mood timer: curiosity -> focus -> stress -> exhaustion
  useEffect(() => {
    if (!isActive) {
      setMood("curious");
      setPupil({ x: 0, y: 0 });
      return;
    }
    startRef.current = Date.now();
    const id = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      if      (s < 22) setMood("curious");
      else if (s < 48) setMood("working");
      else if (s < 88) setMood("stressed");
      else             setMood("exhausted");
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // Cursor tracking - pupils follow the mouse
  useEffect(() => {
    if (!isActive) return;
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      // Eye centre in screen coords (SVG avg eye centre is ~100, 80 in 200x300 space)
      const cx = rect.left + (100 / 200) * rect.width;
      const cy = rect.top  + (80  / 300) * rect.height;
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

  // Randomised blinking
  useEffect(() => {
    if (!isActive) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 130);
      }, 2400 + Math.random() * 3600);
    };
    schedule();
    return () => clearTimeout(t);
  }, [isActive]);

  if (!isActive) return null;

  const eyeRy = blink ? 1.5 : EYE_RY[mood];

  return (
    <div className="cm-container">
      <svg
        ref={svgRef}
        viewBox="0 0 200 300"
        width="150"
        height="225"
        className={`cm-svg ${ANIM[mood]}`}
        aria-hidden="true"
      >
        {/* feet */}
        <ellipse cx="80"  cy="279" rx="22" ry="8" fill="#2c1a0e" />
        <ellipse cx="120" cy="279" rx="22" ry="8" fill="#2c1a0e" />

        {/* tunic body */}
        <path d="M 65 154 L 44 277 L 156 277 L 135 154 Z" fill="#d4952a" />
        <ellipse cx="88"  cy="203" rx="13" ry="9"  fill="#a06820" opacity="0.55" />
        <ellipse cx="115" cy="226" rx="9"  ry="7"  fill="#a06820" opacity="0.50" />
        <ellipse cx="77"  cy="233" rx="10" ry="7"  fill="#a06820" opacity="0.48" />
        <ellipse cx="111" cy="197" rx="6"  ry="5"  fill="#a06820" opacity="0.36" />

        {/* left arm */}
        <path
          d="M 70 162 Q 48 190 42 218 Q 39 234 45 244"
          stroke="#c87a50" strokeWidth="15" fill="none" strokeLinecap="round"
        />

        {/* right arm - holds the rope */}
        <path
          d="M 130 162 Q 157 190 162 218 Q 165 234 160 244"
          stroke="#c87a50" strokeWidth="15" fill="none" strokeLinecap="round"
        />

        {/* rope dangling from right hand */}
        <path
          d="M 160 244 Q 164 258 159 270 Q 156 280 162 289 Q 165 296 161 300"
          stroke="#8b6410" strokeWidth="4.5" fill="none" strokeLinecap="round"
          className="cm-rope"
        />

        {/* neck */}
        <rect x="88" y="138" width="24" height="18" rx="5" fill="#c87a50" />

        {/* head */}
        <circle cx="100" cy="88" r="52" fill="#c87a50" />

        {/* beard */}
        <path
          d="M 53 108
             Q 51 128 55 144
             Q 61 161 75 166
             Q 87 171 100 169
             Q 113 171 125 166
             Q 139 161 145 144
             Q 149 128 147 108
             Q 137 118 127 121
             Q 115 124 105 119
             Q 100 122 95 119
             Q 85 124 73 121
             Q 63 118 53 108 Z"
          fill="#3d2310"
        />

        {/* hair */}
        <path
          d="M 51 76
             Q 48 52 53 35
             Q 59 16 73 16
             Q 81 7  93 11
             Q 100 4  107 11
             Q 119 7  127 16
             Q 141 16 147 35
             Q 152 52 149 76
             Q 143 57 137 53
             Q 131 45 123 49
             Q 115 35 105 39
             Q 100 32  95 39
             Q 85 35  77 49
             Q 69 45  63 53
             Q 57 57  51 76 Z"
          fill="#2c1a0e"
        />

        {/* eyebrows - per mood */}
        <path
          d={BROWS[mood].left}
          stroke="#2c1a0e" strokeWidth="4" fill="none" strokeLinecap="round"
        />
        <path
          d={BROWS[mood].right}
          stroke="#2c1a0e" strokeWidth="4" fill="none" strokeLinecap="round"
        />

        {/* eye whites */}
        <ellipse cx="82"  cy="80" rx="10" ry={eyeRy} fill="white" />
        <ellipse cx="118" cy="80" rx="10" ry={eyeRy} fill="white" />

        {/* pupils - track cursor */}
        {!blink && (
          <>
            <circle cx={82  + pupil.x} cy={80 + pupil.y} r="5.5" fill="#1a0800" />
            <circle cx={118 + pupil.x} cy={80 + pupil.y} r="5.5" fill="#1a0800" />
            <circle cx={84  + pupil.x} cy={78 + pupil.y} r="1.8" fill="white" />
            <circle cx={120 + pupil.x} cy={78 + pupil.y} r="1.8" fill="white" />
          </>
        )}

        {/* nose */}
        <ellipse cx="100" cy="97" rx="8"   ry="6"   fill="#b56a42" />
        <circle  cx="96"  cy="97" r="2.8"          fill="#954e30" opacity="0.5" />
        <circle  cx="104" cy="97" r="2.8"          fill="#954e30" opacity="0.5" />

        {/* mouth - per mood */}
        <path
          d={MOUTH[mood]}
          stroke="#2c1a0e" strokeWidth="3.5" fill="none" strokeLinecap="round"
        />

        {/* stress: sweat drop */}
        {mood === "stressed" && (
          <g className="cm-sweat">
            <path
              d="M 152 58 Q 149 65 154 71 Q 159 65 157 58 Q 154 53 152 58 Z"
              fill="#74b9d4"
            />
          </g>
        )}

        {/* exhausted: heavy drooping eyelids */}
        {mood === "exhausted" && (
          <>
            <path d="M 72 76 Q 82 74 92 76 L 92 82 Q 82 79 72 82 Z" fill="#c87a50" />
            <path d="M 108 76 Q 118 74 128 76 L 128 82 Q 118 79 108 82 Z" fill="#c87a50" />
          </>
        )}

        {/* working: small concentration lines above brows */}
        {mood === "working" && (
          <>
            <line x1="93"  y1="56" x2="95"  y2="60" stroke="#c87a50" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="107" y1="56" x2="105" y2="60" stroke="#c87a50" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* mood label - subtle text below */}
      <p className="cm-mood-label">
        {mood === "curious"   && "Looking around..."}
        {mood === "working"   && "Thinking hard..."}
        {mood === "stressed"  && "Almost there..."}
        {mood === "exhausted" && "Any moment now..."}
      </p>
    </div>
  );
}
