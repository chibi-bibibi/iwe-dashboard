export default function TableSkeleton() {
  return (
    <div className="mt-4 h-90 overflow-auto animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>
  );
}
