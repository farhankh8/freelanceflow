import { useState, useEffect } from "react"

const THOUGHTS = [
  "Loading your workspace...",
  "Preparing your dashboard...",
  "Setting up tools...",
  "Almost ready...",
  "Welcome to FreelanceFlow..."
]

export default function Splash({ onDone }) {
  const [thought, setThought] = useState(THOUGHTS[0])

  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setThought(prev => {
        const idx = THOUGHTS.indexOf(prev)
        return THOUGHTS[(idx + 1) % THOUGHTS.length]
      })
    }, 800)
    
    const t = setTimeout(() => {
      onDone()
    }, 2500)
    
    return () => {
      clearTimeout(t)
      clearInterval(thoughtInterval)
    }
  }, [onDone])

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.18),transparent 70%)", top: "-100px", left: "-100px" }}/>
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,101,132,0.15),transparent 70%)", bottom: "-100px", right: "-100px" }}/>
      </div>
      
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(108,99,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.05) 1px,transparent 1px)", backgroundSize: "60px 60px" }}/>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
        <div style={{ width: "90px", height: "90px", borderRadius: "24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", boxShadow: "0 0 60px rgba(108,99,255,0.5)" }}>
          💼
        </div>
        <div style={{ fontSize: "48px", fontWeight: "800", letterSpacing: "-1px", background: "linear-gradient(135deg,#fff 30%,#6c63ff 70%,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          FreelanceFlow
        </div>
        <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Manage · Invoice · Grow
        </div>
        <div style={{ width: "200px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", marginTop: "16px", overflow: "hidden" }}>
          <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#6c63ff,#ff6584)", borderRadius: "99px", animation: "loading 1.5s ease-in-out infinite" }}/>
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
          {thought}
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}