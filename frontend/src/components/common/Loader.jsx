export function Spinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-sky-600 border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-200" />
          <div className="w-24 h-4 bg-slate-200 rounded" />
        </div>
        <div className="w-16 h-5 bg-slate-100 rounded-full" />
      </div>
      <div className="w-full h-5 bg-slate-200 rounded mt-2" />
      <div className="w-3/4 h-4 bg-slate-100 rounded" />
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex gap-2">
          <div className="w-14 h-4 bg-slate-100 rounded" />
          <div className="w-14 h-4 bg-slate-100 rounded" />
        </div>
        <div className="w-20 h-7 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function Loader({ text = "Loading question bank...", fullPage = false }) {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-inner">
            <img
              src="/cmrit/cmrit-logo.png"
              alt="CMRIT"
              className="w-10 h-10 object-contain animate-pulse"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-sky-500/20 animate-ping pointer-events-none" />
        </div>
        <p className="text-sm font-medium text-slate-700">{text}</p>
        <p className="text-xs text-slate-400 mt-1">CMR Institute of Technology · Placement Hub</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2.5 py-8 text-slate-500">
      <Spinner size="md" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

