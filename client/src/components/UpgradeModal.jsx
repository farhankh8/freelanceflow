import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const FREE_LIMITS = {
  clients: 5,
  invoices: 10,
  projects: 5,
  leads: 20,
  tasks: 20,
  contacts: 20,
  contracts: 5,
  expenses: 10
};

export default function UpgradeModal({ isOpen, onClose, currentResource }) {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [checkingLimits, setCheckingLimits] = useState(false);

  const isPro = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date();
  const proPrice = 1499;

  useEffect(() => {
    if (isOpen && !isPro) {
      checkCurrentUsage();
    }
  }, [isOpen, isPro]);

  const checkCurrentUsage = async () => {
    setCheckingLimits(true);
    try {
      const res = await api.get("/subscribe/status");
      if (res.data?.data) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error("Failed to get status:", err);
    }
    setCheckingLimits(false);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Step 1: Create Razorpay order
      console.log("Creating order...");
      const orderRes = await api.post("/subscribe/create-order");
      console.log("Order response:", orderRes.data);
      const { orderId, keyId } = orderRes.data?.data || {};

      if (!orderId || !keyId) {
        console.error("Missing orderId or keyId:", orderRes.data);
        throw new Error(orderRes.data?.message || "Failed to create order");
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId,
        order_id: orderId,
        name: "FreelanceFlow",
        description: "Pro Plan - Monthly Subscription",
        amount: 149900,
        currency: "INR",
        handler: async (response) => {
          try {
            // Step 3: Verify payment
            const verifyRes = await api.post("/subscribe/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data?.success) {
              toast.success("🎉 Pro plan activated!");
              // Refresh user data
              const meRes = await api.get("/auth/me");
              updateUser(meRes.data?.data);
              onClose();
            } else {
              toast.error(verifyRes.data?.message || "Verification failed");
            }
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment verification failed");
          }
        },
        theme: {
          color: "#6c63ff",
          hide_topbar: false
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Upgrade error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || err.message || "Failed to initiate payment");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const limits = status?.limits?.free || FREE_LIMITS;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "480px",
        padding: "32px"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "var(--text2)",
            cursor: "pointer",
            fontSize: "24px"
          }}
        >×</button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚀</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>
            {isPro ? "You're on Pro! 🎉" : "Upgrade to Pro"}
          </h2>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>
            {isPro 
              ? `Your Pro plan expires on ${new Date(user.planExpiry).toLocaleDateString('en-IN')}`
              : "Unlock unlimited everything"
            }
          </p>
        </div>

        {!isPro && (
          <>
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--text2)" }}>
                Current Free Limits:
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {Object.entries(limits).map(([key, value]) => (
                  <div key={key} style={{
                    padding: "12px",
                    background: "var(--surface2)",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent)" }}>{value}</div>
                    <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "capitalize" }}>
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "20px",
              background: "linear-gradient(135deg,rgba(108,99,255,0.15),rgba(255,101,132,0.15))",
              border: "1px solid rgba(108,99,255,0.3)",
              borderRadius: "12px",
              marginBottom: "24px"
            }}>
              <div style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>
                {"₹" + proPrice}<span style={{ fontSize: "14px", fontWeight: 400 }}>/month</span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text2)" }}>
                Unlimited clients, invoices, projects & more
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading || isPro}
          style={{
            width: "100%",
            padding: "14px",
            background: isPro 
              ? "var(--success)" 
              : "linear-gradient(135deg,#6c63ff,#ff6584)",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            cursor: loading || isPro ? "not-allowed" : "pointer"
          }}
        >
          {loading 
            ? "Processing..." 
            : isPro 
              ? "Pro Plan Active ✓" 
              : `Upgrade for ₹${proPrice}/month`
          }
        </button>

        {!isPro && (
          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text2)", marginTop: "16px" }}>
            Test card: 4111 1111 1111 1111 | Any future date | Any CVV
          </p>
        )}
      </div>
    </div>
  );
}