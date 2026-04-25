import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import axios from "axios"
import useAuthStore from "../store/authStore"

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, '')

const billingApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

billingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("ff_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

billingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

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
      const orderRes = await billingApi.post("/subscribe/create-order")
      const { orderId, keyId, url } = orderRes.data?.data || {}

      if (url) {
        window.location.href = url
        return
      }

      if (!orderId || !keyId) {
        throw new Error(orderRes.data?.message || "Failed to create order")
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
            const verifyRes = await billingApi.post("/subscribe/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes.data?.success) {
              toast.success("Payment successful!")
              const meRes = await billingApi.get("/auth/me")
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
      console.error("Payment error:", err)
      toast.error(err.response?.data?.message || err.message || "Failed to initiate payment")
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