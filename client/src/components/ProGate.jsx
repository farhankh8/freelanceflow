import { useState } from "react"
import useAuthStore from "../store/authStore"
import toast from "react-hot-toast"

export default function ProGate({ children, feature, showModal = true }) {
  const { user } = useAuthStore()
  const [showUpgrade, setShowUpgrade] = useState(false)
  
  if (user?.plan === 'pro') {
    return children
  }

  if (!showModal) {
    return (
      <div style={{ opacity: 0.5, pointerEvents: "none", position: "relative" }}>
        {children}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--surface)",
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--accent)"
        }}>
          PRO
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <div style={{
          filter: "blur(4px)",
          opacity: 0.5,
          pointerEvents: "none"
        }}>
          {children}
        </div>
        
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          textAlign: "center",
          padding: "32px",
          background: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-xl)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
            {feature || "This feature"} is Pro
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", maxWidth: "300px" }}>
            Upgrade to Pro to unlock AI-powered features, advanced analytics, and automation.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => setShowUpgrade(true)}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Upgrade to Pro 🚀
            </button>
            <button
              onClick={() => toast.error("Feature locked. Upgrade to Pro!")}
              style={{
                padding: "12px 24px",
                background: "var(--surface-raised)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      {showUpgrade && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "480px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>💎</div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
              Upgrade to Pro
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Get unlimited access to all features
            </p>
            
            <div style={{ textAlign: "left", marginBottom: "24px" }}>
              {[
                "AI-powered invoice generation",
                "Smart payment predictions",
                "Advanced analytics & reports",
                "Auto payment reminders",
                "Recurring invoices",
                "Priority support"
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span style={{ fontSize: "14px" }}>{f}</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "48px", fontWeight: 800 }}>₹999</span>
              <span style={{ color: "var(--text-secondary)" }}>/month</span>
            </div>
            
            <button
              onClick={() => {
                toast.success("Payment page coming soon!")
                setShowUpgrade(false)
              }}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              Get Started 🚀
            </button>
            
            <button
              onClick={() => setShowUpgrade(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function useProPlan() {
  const { user } = useAuthStore()
  return {
    isPro: user?.plan === 'pro',
    isFree: user?.plan === 'free' || !user?.plan,
    plan: user?.plan || 'free'
  }
}
