import React from 'react';

export const PlayIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
    <path d="M2 1L8 5L2 9V1Z" />
  </svg>
);

export const Enso = ({ size = 120, opacity = 1, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ opacity }}>
    <circle 
      cx="100" 
      cy="100" 
      r="70" 
      fill="none" 
      stroke={color} 
      strokeWidth="18" 
      strokeLinecap="round" 
      strokeDasharray="380 60" 
      strokeDashoffset="30"
    />
  </svg>
);

export const InfoIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 10V16M11 7V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
