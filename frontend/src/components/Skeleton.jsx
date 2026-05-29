export default function Skeleton({ width = '100%', height = 16, radius = 6, className = '', style = {} }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{
        width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        ...style
      }}
      aria-hidden="true"
    />
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      <div className="table-skeleton__header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`h-${index}`} height={14} width="70%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`r-${rowIndex}`} className="table-skeleton__row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`c-${rowIndex}-${colIndex}`}
              height={14}
              width={colIndex === columns - 1 ? '40%' : `${60 + ((rowIndex + colIndex) % 4) * 8}%`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <article className="metric-card metric-card--skeleton" aria-hidden="true">
      <Skeleton width="60%" height={12} />
      <Skeleton width="80%" height={28} style={{ marginTop: 12 }} />
      <Skeleton width="100%" height={10} style={{ marginTop: 14 }} />
      <Skeleton width="70%" height={10} style={{ marginTop: 6 }} />
    </article>
  )
}

export function HealthCardSkeleton() {
  return (
    <section className="health-card health-card--skeleton" aria-hidden="true">
      <div className="health-card__main">
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="60%" height={26} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={12} style={{ marginTop: 10 }} />
        </div>
        <div>
          <Skeleton width={84} height={84} radius="50%" />
        </div>
      </div>
      <Skeleton width="100%" height={8} style={{ marginTop: 18 }} />
      <div className="health-metrics" style={{ marginTop: 18 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i}>
            <Skeleton width="60%" height={10} />
            <Skeleton width="40%" height={18} style={{ marginTop: 8 }} />
          </article>
        ))}
      </div>
    </section>
  )
}
