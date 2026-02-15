'use client';

import React from 'react';

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-lg bg-white">{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-500 text-white rounded" {...props}>{children}</button>;
}

export function Tabs({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) {
  return <div data-default-value={defaultValue}>{children}</div>;
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}

export function TabsTrigger({ children, value }: { children: React.ReactNode; value: string }) {
  return <button data-value={value} className="px-3 py-1 rounded">{children}</button>;
}

export function TabsContent({ children, value }: { children: React.ReactNode; value: string }) {
  return <div data-value={value}>{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 bg-gray-200 rounded text-sm">{children}</span>;
}

export function Alert({ children }: { children: React.ReactNode }) {
  return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">{children}</div>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-yellow-800">{children}</p>;
}
