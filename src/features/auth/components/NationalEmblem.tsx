import React from 'react';

export const NationalEmblem: React.FC<{ className?: string }> = ({ className = 'w-8 h-10' }) => {
  return (
    <div className="flex items-center gap-2.5">
      {/* SVG rendition of the Lion Capital of Ashoka (Government of India Emblem) */}
      <svg
        viewBox="0 0 100 125"
        className={className}
        fill="currentColor"
        aria-label="National Emblem of India"
      >
        {/* Central & Lateral Lions */}
        <g fill="#1e293b">
          {/* Central Lion Head */}
          <path d="M50 8 C43 8 41 14 41 18 C41 23 44 26 44 31 C44 35 42 38 43 43 C44 47 47 50 50 50 C53 50 56 47 57 43 C58 38 56 35 56 31 C56 26 59 23 59 18 C59 14 57 8 50 8 Z" />
          {/* Mane details */}
          <path d="M43 16 C38 18 36 24 37 30 C38 35 41 39 42 44 C40 42 37 36 36 31 C35 25 38 19 43 16 Z" />
          <path d="M57 16 C62 18 64 24 63 30 C62 35 59 39 58 44 C60 42 63 36 64 31 C65 25 62 19 57 16 Z" />
          {/* Crown & Forehead */}
          <path d="M46 10 C48 9 52 9 54 10 C53 12 47 12 46 10 Z" />
          {/* Snout & whiskers */}
          <circle cx="48" cy="22" r="1.5" fill="#f8fafc" />
          <circle cx="52" cy="22" r="1.5" fill="#f8fafc" />
          <path d="M47 26 C49 27 51 27 53 26 C52 28 48 28 47 26 Z" fill="#0f172a" />
          {/* Chest & Body */}
          <path d="M45 50 L42 70 L58 70 L55 50 Z" />

          {/* Left Lion (profile) */}
          <path d="M38 22 C32 20 27 24 26 29 C25 34 28 39 30 43 C33 46 36 49 39 51 C37 47 34 43 33 39 C31 34 33 28 38 22 Z" />
          <path d="M35 51 L31 70 L41 70 L42 51 Z" />
          <circle cx="31" cy="28" r="1.2" fill="#f8fafc" />

          {/* Right Lion (profile) */}
          <path d="M62 22 C68 20 73 24 74 29 C75 34 72 39 70 43 C67 46 64 49 61 51 C63 47 66 43 67 39 C69 34 67 28 62 22 Z" />
          <path d="M65 51 L69 70 L59 70 L58 51 Z" />
          <circle cx="69" cy="28" r="1.2" fill="#f8fafc" />

          {/* Abacus Base Platform */}
          <rect x="22" y="71" width="56" height="5" rx="1.5" />
          <rect x="25" y="77" width="50" height="9" rx="1" />

          {/* Ashoka Chakra Wheel */}
          <circle cx="50" cy="81.5" r="3.8" fill="none" stroke="#f8fafc" strokeWidth="0.8" />
          <circle cx="50" cy="81.5" r="1" fill="#f8fafc" />
          {/* Wheel spokes */}
          <line x1="50" y1="77.8" x2="50" y2="85.2" stroke="#f8fafc" strokeWidth="0.5" />
          <line x1="46.3" y1="81.5" x2="53.7" y2="81.5" stroke="#f8fafc" strokeWidth="0.5" />
          <line x1="47.4" y1="78.9" x2="52.6" y2="84.1" stroke="#f8fafc" strokeWidth="0.5" />
          <line x1="47.4" y1="84.1" x2="52.6" y2="78.9" stroke="#f8fafc" strokeWidth="0.5" />

          {/* Galloping Horse (Left of Chakra) */}
          <path d="M32 80 C34 79 37 80 38 82 C37 83 35 83 34 84 L32 84 Z" fill="#f8fafc" />

          {/* Bull (Right of Chakra) */}
          <path d="M62 82 C64 80 67 80 68 81 C68 83 66 84 64 84 L62 84 Z" fill="#f8fafc" />

          {/* Lower plinth */}
          <rect x="20" y="87" width="60" height="3.5" rx="1" />
          <rect x="18" y="91" width="64" height="3" rx="0.8" />

          {/* Lotus Bell Base */}
          <path d="M30 95 C30 102 70 102 70 95 Z" fill="#334155" />
          <path d="M36 95 C36 100 64 100 64 95 Z" fill="#1e293b" />
          <path d="M42 95 C42 98 58 98 58 95 Z" fill="#475569" />

          {/* Motto inscription: Satyameva Jayate representation */}
          <rect x="30" y="104" width="40" height="3" rx="1" fill="#475569" />
          <text
            x="50"
            y="115"
            textAnchor="middle"
            fontSize="7"
            fontFamily="serif"
            fontWeight="bold"
            letterSpacing="1"
            fill="#1e293b"
          >
            सत्यमेव जयते
          </text>
        </g>
      </svg>

      <div className="text-left">
        <div className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
          Ministry of Mines
        </div>
        <div className="text-[10px] text-slate-600 font-medium tracking-tight">
          Government of India
        </div>
      </div>
    </div>
  );
};
