'use client';

import React from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className || "border rounded-lg bg-white"}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className || "p-4"}>{children}</div>;
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className || "p-4 border-b"}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={className || "text-lg font-semibold"}>{children}</h3>;
}
