'use client';

import React from 'react';

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; variant?: string; size?: string }) {
  const className = props.variant === "outline" 
    ? `px-3 py-1 border rounded ${props.className || ''}`
    : props.className || "px-4 py-2 bg-blue-500 text-white rounded";
  return <button className={className} {...props} />;
}
