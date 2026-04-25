import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"
import useAuthStore from "../store/authStore"

export default function Billing() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const isPro = user?.plan === 'pro'

  useEffect(() => {
    if (isPro) {
      navigate("/app")
    }
    checkStatus()
  }, [isPro])

  const checkStatus = async () => {
    try {
      const res = await api.get("/subscribe/status")
      setStatus(res.data?.data)
    } catch (err) {
      console.error("Failed to get status:", err)
    }
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      const orderRes = await api.post("/subscribe/create-order")
      const { orderId, keyId } = orderRes.data?.data || {}

      if (!orderId || !keyId) {
        throw new Error("Failed to create order")
      }

      const options = {
        key: keyId,
        order_id: orderId,
        name: "FreelanceFlow",
        description: "Pro Plan - Monthly Subscription",
        amount: 149900,
        currency: "INR",
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/subscribe/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes.data?.success) {
              toast.success("Payment successful!")
              const meRes = await api.get("/auth/me")
              updateUser(meRes.data?.data)
              navigate("/app")
            }
          } catch (err) {
            toast.error("Payment verification failed")
          }
        },
        theme: { color: "#6c63ff" }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment")
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