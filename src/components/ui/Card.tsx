// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Sub-components for quick layouts
export function StatCard({ label, value, change, isPositive }: any) {
  return (
    <Card>
      <div className="stat-card">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        <span className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
    </Card>
  );
}