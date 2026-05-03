export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse ${className}`}
    />
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`h-4 rounded-lg bg-white/[0.06] animate-pulse ${className}`} />
  );
}

export function SkeletonCircle({ size = 48 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white/[0.06] animate-pulse shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 animate-pulse">
      <div className="h-3 w-24 bg-white/[0.06] rounded mb-3" />
      <div className="h-8 w-32 bg-white/[0.08] rounded mb-1" />
      <div className="h-3 w-16 bg-white/[0.04] rounded" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-white/[0.06] rounded-2xl animate-pulse mb-4" />
        <div className="h-5 w-96 bg-white/[0.04] rounded-xl animate-pulse mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
