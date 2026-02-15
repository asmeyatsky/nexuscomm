'use client';

import React from 'react';

export function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className || "p-4 bg-yellow-50 border border-yellow-200 rounded"}>{children}</div>;
}

export function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className || "text-sm text-yellow-800"}>{children}</p>;
}
