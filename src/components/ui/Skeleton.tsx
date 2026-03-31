import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton h-4 rounded animate-pulse ${className}`} />
);

export const CardSkeleton: React.FC = () => (
  <div className="card">
    <div className="card-body space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 p-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    ))}
  </div>
);
