export default function Loading() {
  return (
    <div
      className="mx-auto py-3xl px-l"
      style={{ maxWidth: "var(--layout-max-w)" }}
    >
      <div className="flex gap-l items-start animate-pulse">
        <div className="w-24 h-24 rounded-pill bg-bg-surface-2" />
        <div className="flex-1 flex flex-col gap-m">
          <div className="h-10 bg-bg-surface-2 rounded w-1/2" />
          <div className="h-4 bg-bg-surface-2 rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}
