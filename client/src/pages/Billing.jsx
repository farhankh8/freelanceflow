import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

const RAZORPAY_KEY_ID = "rzp_test_SfH61mklxoBJWx"

export default function Billing() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const isPro = user?.plan === 'pro'

  useEffect(() => {
    if (isPro) {
      navigate("/app")
    }
  }, [isPro])

  const handlePay = async () => {
    setLoading(true)
    try {
      // Create payment link via Razorpay API
      const response = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST",
        headers: {
          "Authorization": btoa(`${RAZORPAY_KEY_ID}:8UBO39DQlrn23glGR7cuqlV8`),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 149900,
          currency: "INR",
          description: "FreelanceFlow Pro Plan",
          customer: {
            email: user?.email,
            name: user?.name
          },
          notify: {
            sms: true,
            email: true
          },
          callback_url: window.location.origin + "/app?payment=done",
          callback_method: "get"
        })
      })
      
      const data = await response.json()
      
      if (data.short_url) {
        // Open Razorpay payment page
        window.open(data.short_url, "_blank")
        toast.success("Payment page opened! Complete payment and come back.")
      } else {
        throw new Error(data.error?.description || "Failed to create payment link")
      }
    } catch (err) {
      console.error("Payment error:", err)
      toast.error(err.message || "Failed to create payment")
    }
    setLoading(false)
  }

  if (isPro) return null

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>💳</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Complete Payment
        </h1>
        <p style={{ color: "#71717a", fontSize: "15px", marginBottom: "32px" }}>
          Pay once to unlock all features forever
        </p>

        <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.12),rgba(255,101,132,0.12))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "20px", padding: "32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900 }}>₹1499</span>
            <span style={{ fontSize: "16px", color: "#71717a" }}>/mo</span>
          </div>
          
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Unlimited clients & projects", "GST-compliant invoices", "Custom branding", "AI-powered insights", "Priority support", "Advanced reports"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <span style={{ color: "#00d97e", fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handlePay} disabled={loading} style={{ width: "100%", padding: "16px", background: loading ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginBottom: "16px" }}>
          {loading ? "Processing..." : "Pay ₹1499 & Continue"}
        </button>

        <p style={{ fontSize: "12px", color: "#52525b" }}>
          Test card: 4111 1111 1111 1111 | any future date | any CVV
        </p>
      </div>
    </div>
  )
}