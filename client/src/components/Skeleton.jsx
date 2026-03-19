export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        background: "linear-gradient(90deg, var(--surface-raised) 25%, var(--surface-overlay) 50%, var(--surface-raised) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-loading 1.5s infinite",
        borderRadius: "8px",
        ...style
      }}
    />
  )
}

export function SkeletonText({ lines = 3, lastLineWidth = "60%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: "14px",
            width: i === lines - 1 ? lastLineWidth : "100%"
          }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "16px",
      padding: "24px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <Skeleton style={{ width: 48, height: 48, borderRadius: "12px" }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ width: "60%", height: "16px", marginBottom: "8px" }} />
          <Skeleton style={{ width: "40%", height: "12px" }} />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "16px",
      overflow: "hidden"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
        gap: "16px",
        padding: "16px 20px",
        background: "var(--surface-raised)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        {[100, 60, 80, 80, 60].map((w, i) => (
          <Skeleton key={i} style={{ height: "12px", width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
            gap: "16px",
            padding: "16px 20px",
            borderBottom: i < rows - 1 ? "1px solid var(--border-subtle)" : "none"
          }}
        >
          {[100, 60, 80, 80, 60].map((w, j) => (
            <Skeleton key={j} style={{ height: "14px", width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function LoadingSpinner({ size = 24 }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid var(--border-default)`,
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
  )
}

export function PageLoader() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      gap: "16px"
    }}>
      <LoadingSpinner size={40} />
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading...</p>
    </div>
  )
}

export function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>{icon}</div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px", maxWidth: "320px" }}>
        {description}
      </p>
      {action}
    </div>
  )
}
