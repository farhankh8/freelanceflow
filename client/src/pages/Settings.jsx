import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import UpgradeModal from "../components/UpgradeModal"

const PLAN_FEATURES = {
  free: [
    "Up to 5 clients",
    "Up to 10 invoices",
    "Up to 5 projects",
    "Basic invoicing",
    "Time tracking",
    "Expense tracking",
    "Email support"
  ],
  pro: [
    "Unlimited clients",
    "Unlimited invoices",
    "Unlimited projects",
    "GST-compliant invoices",
    "AI-powered insights",
    "Advanced reports",
    "Custom branding",
    "Priority support"
  ]
}

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState("profile")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false, accountNumber: false, ifsc: false, razorpay: false })
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
      ifsc: '',
      razorpayKeyId: '',
      razorpayKeySecret: ''
    }
  })

  // Load latest user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await api.get('/auth/me')
        const userData = res.data?.user || res.data?.data
        if (userData) {
          updateUser(userData)
          setForm({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            settings: userData.settings || {
              currency: 'INR',
              timezone: 'Asia/Kolkata',
              gstin: '',
              businessName: '',
              businessAddress: '',
              upiId: '',
              bankName: '',
              accountNumber: '',
              ifsc: '',
              razorpayKeyId: '',
              razorpayKeySecret: ''
            }
          })
        }
      } catch (err) {
        console.error("Failed to load user data:", err)
      }
    }
    loadUserData()
  }, [])

  const handleSave = async (tabName) => {
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        settings: form.settings
      })
      const userData = res.data?.user || res.data?.data
      if (userData) {
        updateUser(userData)
      } else {
        updateUser({ name: form.name, phone: form.phone, settings: form.settings })
      }
      toast.success("Settings saved!")
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true)
  }

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword) { toast.error("Current password is required"); return }
    if (!pwForm.newPassword) { toast.error("New password is required"); return }
    if (pwForm.newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match"); return }
    setPwSaving(true)
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success("Password changed successfully!")
      setShowPasswordModal(false)
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password")
    } finally {
      setPwSaving(false)
    }
  }

  const toggleShow = (key) => setShowPass(prev => ({ ...prev, [key]: !prev[key] }))

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await api.get('/auth/sessions')
      setSessions(res.data?.sessions || [])
    } catch {
      toast.error("Failed to load sessions")
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleRevokeSession = async (index) => {
    try {
      await api.delete('/auth/sessions', { data: { sessionIndex: index } })
      toast.success("Session revoked")
      loadSessions()
    } catch {
      toast.error("Failed to revoke session")
    }
  }

  const handleViewSessions = () => {
    setShowSessionsModal(true)
    loadSessions()
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Settings</h1>
        <p style={{ color: "var(--text2)", fontSize: "14px" }}>Manage your account and preferences</p>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ width: "200px", flexShrink: 0, minWidth: "150px" }}>
          {["profile", "business", "billing", "security"].map(t => (
                <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} style={{ display: "block", width: "100%", padding: "10px 14px", marginBottom: "4px", background: tab === t ? "rgba(108,99,255,0.15)" : "transparent", border: tab === t ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent", borderRadius: "8px", color: tab === t ? "#6c63ff" : "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 600, textAlign: "left", textTransform: "capitalize" }}>
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
                <button onClick={() => handleSave('profile')} disabled={loading} style={{ padding: "12px 24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", alignSelf: "flex-start" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {tab === "business" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Business Settings</h2>
              <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "20px" }}>Configure your business details for invoices and compliance</p>
               
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
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
                  <div style={{ position: "relative" }}>
                    <input type={showPass.accountNumber ? "text" : "password"} value={form.settings.accountNumber} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, accountNumber: e.target.value } }))} placeholder="1234567890" style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                    <button type="button" onClick={() => toggleShow("accountNumber")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.accountNumber ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>IFSC Code</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPass.ifsc ? "text" : "password"} value={form.settings.ifsc} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, ifsc: e.target.value.toUpperCase() } }))} placeholder="HDFC0001234" maxLength={11} style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                    <button type="button" onClick={() => toggleShow("ifsc")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.ifsc ? "🙈" : "👁️"}</button>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", marginTop: "24px" }}>🟣 Razorpay Payment</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Razorpay Key ID</label>
                  <input value={form.settings.razorpayKeyId || ""} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, razorpayKeyId: e.target.value } }))} placeholder="rzp_live_xxxxxxxx" style={{ width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Razorpay Key Secret</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPass.razorpay ? "text" : "password"} value={form.settings.razorpayKeySecret || ""} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, razorpayKeySecret: e.target.value } }))} placeholder="xxxxxxxxxxxxxxxx" style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                    <button type="button" onClick={() => toggleShow("razorpay")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.razorpay ? "🙈" : "👁️"}</button>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "16px" }}>Get your Razorpay keys from <a href="https://dashboard.razorpay.com" target="_blank" style={{ color: "var(--accent)" }}>razorpay.com/dashboard</a></p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
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
              
              <button onClick={() => handleSave('business')} disabled={loading} style={{ padding: "12px 24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", alignSelf: "flex-start" }}>
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
                  <button onClick={() => setShowPasswordModal(true)} style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }} aria-label="Change password">Change</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>Add extra security to your account</div>
                  </div>
                  <button onClick={() => toast.success("Two-Factor Authentication is coming soon!")} aria-label="Enable two-factor authentication" style={{ padding: "8px 16px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "8px", color: "#00d97e", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Enable</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Active Sessions</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>Manage your active sessions</div>
                  </div>
                  <button onClick={handleViewSessions} style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }} aria-label="View active sessions">View</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showPasswordModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="change-password-title" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "440px" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="change-password-title" style={{ fontSize: "20px", fontWeight: 800 }}>Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} aria-label="Close dialog" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="current-password" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Current Password</label>
                <div style={{ position: "relative" }}>
                  <input id="current-password" type={showPass.current ? "text" : "password"} value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                  <button type="button" onClick={() => toggleShow("current")} aria-label={showPass.current ? "Hide current password" : "Show current password"} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.current ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div>
                <label htmlFor="new-password" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>New Password <span style={{ fontSize: "10px", fontWeight: 400, textTransform: "none" }}>(min 8 chars)</span></label>
                <div style={{ position: "relative" }}>
                  <input id="new-password" type={showPass.new ? "text" : "password"} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                  <button type="button" onClick={() => toggleShow("new")} aria-label={showPass.new ? "Hide new password" : "Show new password"} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.new ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input id="confirm-password" type={showPass.confirm ? "text" : "password"} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none" }} />
                  <button type="button" onClick={() => toggleShow("confirm")} aria-label={showPass.confirm ? "Hide confirm password" : "Show confirm password"} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px" }}>{showPass.confirm ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleChangePassword} disabled={pwSaving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: pwSaving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "14px", opacity: pwSaving ? 0.7 : 1 }}>
                  {pwSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      
      {showSessionsModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="sessions-title" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="sessions-title" style={{ fontSize: "20px", fontWeight: 800 }}>Active Sessions</h2>
              <button onClick={() => setShowSessionsModal(false)} aria-label="Close dialog" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px" }}>
              {sessionsLoading ? (
                <p style={{ color: "var(--text2)", textAlign: "center" }}>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p style={{ color: "var(--text2)", textAlign: "center" }}>No active sessions found</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sessions.map((session, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface2)", borderRadius: "12px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{session.userAgent || 'Unknown Device'}</div>
                        <div style={{ fontSize: "12px", color: "var(--text2)" }}>IP: {session.ip || 'Unknown'}</div>
                        <div style={{ fontSize: "11px", color: "var(--text2)" }}>{session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown time'}</div>
                      </div>
                      <button onClick={() => handleRevokeSession(session.id)} style={{ padding: "8px 12px", background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: "8px", color: "#ff5252", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Revoke</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
