import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/5',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 p-4', className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonHero({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 p-4 flex items-center gap-4', className)}>
      <Skeleton className="w-16 h-16 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonArtifact({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 p-3 flex items-center gap-3', className)}>
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

export function SkeletonBuilding({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 p-4', className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#E6EDF3] mb-2">{title}</h3>
      {description && (
        <p className="text-xs text-[#8B949E] max-w-xs">{description}</p>
      )}
    </div>
  );
}
