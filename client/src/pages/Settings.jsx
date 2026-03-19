import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

const PLAN_FEATURES = {
  free: [
    "Up to 2 clients",
    "Basic invoicing",
    "Time tracking",
    "Project management",
    "Email support"
  ],
  pro: [
    "Unlimited clients",
    "GST-compliant invoices",
    "AI-powered insights",
    "Advanced reports",
    "Recurring invoices",
    "Payment reminders",
    "Custom branding",
    "Priority support"
  ]
}

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState("profile")
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    settings: user?.settings || {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      gstin: '',
      businessName: '',
      businessAddress: '',
      upiId: '',
      bankName: '',
      accountNumber: '',
      ifsc: ''
    }
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        settings: form.settings
      })
      updateUser({ name: form.name, phone: form.phone, settings: form.settings })
      toast.success("Settings saved!")
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleUpgrade = () => {
    toast.success("Redirecting to payment page... (Coming soon!)")
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Settings</h1>
        <p style={{ color: "var(--text2)", fontSize: "14px" }}>Manage your account and preferences</p>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ width: "200px", flexShrink: 0 }}>
          {["profile", "business", "billing", "security"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: "4px", background: tab === t ? "rgba(108,99,255,0.15)" : "transparent", border: tab === t ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent", borderRadius: "8px", color: tab === t ? "#6c63ff" : "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 600, textAlign: "left", textTransform: "capitalize" }}>
              {t === "profile" && "👤 "}{t === "business" && "🏢 "}{t === "billing" && "💳 "}{t === "security" && "🔒 "}
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {tab === "profile" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Profile Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Email</label>
                  <input value={form.email} disabled style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <button onClick={handleSave} disabled={loading} style={{ padding: "12px 24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", alignSelf: "flex-start" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {tab === "business" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Business Settings</h2>
              <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "20px" }}>Configure your business details for invoices and compliance</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Business Name</label>
                  <input value={form.settings.businessName} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, businessName: e.target.value } }))} placeholder="Your Business Name" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>GSTIN</label>
                  <input value={form.settings.gstin} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, gstin: e.target.value.toUpperCase() } }))} placeholder="27AABCU9603R1ZM" maxLength={15} style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Business Address</label>
                <textarea value={form.settings.businessAddress} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, businessAddress: e.target.value } }))} rows={3} placeholder="Your business address..." style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", resize: "vertical" }} />
              </div>
              
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>💳 Payment Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>UPI ID</label>
                  <input value={form.settings.upiId} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, upiId: e.target.value } }))} placeholder="yourname@upi" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Bank Name</label>
                  <input value={form.settings.bankName} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, bankName: e.target.value } }))} placeholder="HDFC Bank" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Account Number</label>
                  <input value={form.settings.accountNumber} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, accountNumber: e.target.value } }))} placeholder="1234567890" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>IFSC Code</label>
                  <input value={form.settings.ifsc} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, ifsc: e.target.value.toUpperCase() } }))} placeholder="HDFC0001234" maxLength={11} style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Currency</label>
                  <select value={form.settings.currency} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, currency: e.target.value } }))} style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px" }}>
                    <option value="INR">🇮🇳 INR (Indian Rupee)</option>
                    <option value="USD">🇺🇸 USD (US Dollar)</option>
                    <option value="EUR">🇪🇺 EUR (Euro)</option>
                    <option value="GBP">🇬🇧 GBP (British Pound)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Timezone</label>
                  <select value={form.settings.timezone} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, timezone: e.target.value } }))} style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px" }}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              
              <button onClick={handleSave} disabled={loading} style={{ padding: "12px 24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", alignSelf: "flex-start" }}>
                {loading ? "Saving..." : "Save Business Settings"}
              </button>
            </div>
          )}

          {tab === "billing" && (
            <div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Current Plan</h2>
                    <p style={{ fontSize: "13px", color: "var(--text2)" }}>You're on the {user?.plan || 'free'} plan</p>
                  </div>
                  <div style={{ padding: "8px 16px", borderRadius: "99px", background: user?.plan === 'pro' ? "rgba(0,217,126,0.15)" : "rgba(255,184,0,0.15)", color: user?.plan === 'pro' ? "#00d97e" : "#ffb800", fontWeight: 700, textTransform: "uppercase", fontSize: "12px" }}>
                    {user?.plan || 'free'} Plan
                  </div>
                </div>
                
                <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Features included:</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {(user?.plan === 'pro' ? PLAN_FEATURES.pro : PLAN_FEATURES.free).map((feature, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                      <span style={{ color: "#00d97e" }}>✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
              {user?.plan !== 'pro' && (
                <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.15),rgba(255,101,132,0.15))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "16px", padding: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Upgrade to Pro</h3>
                  <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px" }}>Get access to all features including GST invoices, AI insights, and more</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800 }}>₹999</span>
                    <span style={{ fontSize: "14px", color: "var(--text2)" }}>/month</span>
                    <span style={{ fontSize: "12px", padding: "4px 10px", background: "#ff6584", borderRadius: "99px", color: "#fff", fontWeight: 700 }}>Save 20%</span>
                  </div>
                  <button onClick={handleUpgrade} style={{ padding: "12px 32px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
                    Upgrade Now 🚀
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "security" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Security Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Change Password</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>Update your password regularly</div>
                  </div>
                  <button style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Change</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>Add extra security to your account</div>
                  </div>
                  <button style={{ padding: "8px 16px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "8px", color: "#00d97e", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Enable</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Active Sessions</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>Manage your active sessions</div>
                  </div>
                  <button style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>View</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
