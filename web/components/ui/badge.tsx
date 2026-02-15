'use client';

import React from 'react';

export function Badge({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
  const baseClass = variant === 'secondary' ? "px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm" : "px-2 py-1 bg-blue-500 text-white rounded text-sm";
  return <span className={className ? `${baseClass} ${className}` : baseClass}>{children}</span>;
}

export function Alert({ children }: { children: React.ReactNode }) {
  return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">{children}</div>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-yellow-800">{children}</p>;
}
