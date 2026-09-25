import React from 'react';

export const MineSafeLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <img
      src="/3rdvisionhorizontal.jpeg"
      alt="3rd Vision"
      width={854}
      height={192}
      decoding="async"
      fetchPriority="high"
      className={`h-auto w-full max-w-[320px] object-contain object-left ${className}`}
    />
  );
};

export const ThirdVisionLogo = MineSafeLogo;

