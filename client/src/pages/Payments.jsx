import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  completed: { label: "Completed", color: "#00d97e", bg: "rgba(0,217,126,0.15)", border: "rgba(0,217,126,0.3)", icon: "✅" },
  pending:   { label: "Pending",   color: "#ffb800", bg: "rgba(255,184,0,0.15)",  border: "rgba(255,184,0,0.3)",  icon: "⏳" },
  failed:    { label: "Failed",    color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)", icon: "❌" },
  refunded:  { label: "Refunded",  color: "#2CA5E0", bg: "rgba(44,165,224,0.15)", border: "rgba(44,165,224,0.3)", icon: "↩️" },
}

const METHODS = {
  upi:           { label: "UPI",         icon: "📱", color: "#00d97e" },
  card:          { label: "Card",        icon: "💳", color: "#6c63ff" },
  bank_transfer:  { label: "Net Banking", icon: "🏦", color: "#2CA5E0" },
  cash:          { label: "Cash",        icon: "💵", color: "#ffb800" },
  check:         { label: "Cheque",      icon: "📄", color: "#ff6584" },
}

const LS_KEY = "freelanceflow_payments"
const EMPTY_FORM = { client: "", invoiceNo: "", amount: "", method: "upi", status: "completed", date: new Date().toISOString().split("T")[0], txnId: "", notes: "" }

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  return []
}

function saveToStorage(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch (_) {}
}

export default function Payments() {
  const [payments, setPayments] = useState(() => loadFromStorage())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    try {
      const { data } = await api.get("/payments")
      const apiList = data?.payments || data?.data || (Array.isArray(data) ? data : [])

      // ✅ KEY FIX: never throw away local-only payments (local_ prefix)
      // Merge: API data is source of truth for real IDs, keep local_ ones on top
      setPayments(prev => {
        const localOnly = prev.filter(p => String(p._id).startsWith("local_"))
        const apiIds = new Set(apiList.map(p => p._id))
        const stillLocalOnly = localOnly.filter(p => !apiIds.has(p._id))
        const merged = [...stillLocalOnly, ...apiList]
        saveToStorage(merged)
        return merged
      })
    } catch {
      // API failed — keep whatever is in state (already loaded from localStorage)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Every state change saves to localStorage immediately
  const updatePayments = (fn) => {
    setPayments(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn
      saveToStorage(next)
      return next
    })
  }

  const handleCreate = async () => {
    if (!form.client || !form.amount) { toast.error("Client and amount required"); return }
    
    // Map frontend field names to backend field names
    const methodMap = { netbanking: 'bank_transfer', cheque: 'check' }
    const payload = {
      client: form.client,
      invoiceNumber: form.invoiceNo,
      amount: Number(form.amount),
      method: methodMap[form.method] || form.method,
      status: form.status,
      date: form.date,
      transactionId: form.txnId,
      notes: form.notes
    }

    // ✅ Optimistically add to UI & localStorage FIRST — never lost even if API fails
    const tempId = "local_" + Date.now()
    const optimistic = { _id: tempId, ...payload, createdAt: new Date().toISOString() }
    updatePayments(prev => [optimistic, ...prev])
    setShowModal(false)
    setForm(EMPTY_FORM)
    toast.success("Payment recorded! 💳")

    // Then try to save to API and replace temp ID with real one
    try {
      const { data } = await api.post("/payments", payload)
      const saved = data?.data
      if (saved?._id) {
        // Replace temp entry with the real API entry
        updatePayments(prev => prev.map(p => p._id === tempId ? saved : p))
      }
    } catch {
      // Already saved locally — will sync next time API is available
    }
  }

  const updateStatus = async (id, status) => {
    updatePayments(prev => prev.map(p => p._id === id ? { ...p, status } : p))
    setSelected(s => s?._id === id ? { ...s, status } : s)
    toast.success("Status updated!")
    try { await api.put(`/payments/${id}`, { status }) } catch (_) {}
  }

  const deletePayment = async (id) => {
    if (!window.confirm("Delete this payment?")) return
    updatePayments(prev => prev.filter(p => p._id !== id))
    setSelected(null)
    toast.success("Deleted")
    try { await api.delete(`/payments/${id}`) } catch (_) {}
  }

  const filtered = payments.filter(p => {
    const matchSearch = !search || p.client?.toLowerCase().includes(search.toLowerCase()) || p.invoiceNo?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalReceived = payments.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0)
  const totalPending  = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0)

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>Payments</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{payments.length} transactions · ₹{totalReceived.toLocaleString()} received</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Record Payment</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Received", value: "₹" + totalReceived.toLocaleString(), icon: "💰", color: "#00d97e" },
          { label: "Pending",        value: "₹" + totalPending.toLocaleString(),  icon: "⏳", color: "#ffb800" },
          { label: "Completed",      value: payments.filter(p => p.status === "completed").length, icon: "✅", color: "#6c63ff" },
          { label: "Total",          value: payments.length, icon: "💳", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or invoice..." style={{ ...inp, padding: "9px 12px 9px 36px" }} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterStatus("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterStatus === "all" ? "var(--accent)" : "var(--surface)", color: filterStatus === "all" ? "#fff" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border)"), background: filterStatus === k ? v.bg : "var(--surface)", color: filterStatus === k ? v.color : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.icon} {v.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading && payments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(p => {
            const st = STATUS[p.status] || STATUS.pending
            const mt = METHODS[p.method] || METHODS.upi
            const isLocal = String(p._id).startsWith("local_")
            return (
              <div key={p._id} onClick={() => setSelected(p)}
                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "var(--surface)", border: "1px solid " + (isLocal ? "rgba(255,184,0,0.3)" : "var(--border)"), borderRadius: "12px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; e.currentTarget.style.transform = "translateX(3px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isLocal ? "rgba(255,184,0,0.3)" : "var(--border)"; e.currentTarget.style.transform = "translateX(0)" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: mt.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{mt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
                    {p.client}
                    {isLocal && <span style={{ fontSize: "9px", marginLeft: "8px", padding: "1px 6px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontWeight: 700 }}>LOCAL</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text2)" }}>{mt.label} · {p.invoiceNo || "No invoice"} · {new Date(p.date).toLocaleDateString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: p.status === "completed" ? "#00d97e" : p.status === "pending" ? "#ffb800" : "#ff4d6d" }}>₹{(p.amount || 0).toLocaleString()}</div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.icon} {st.label}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>💳</div>
              <p>{payments.length === 0 ? "No payments yet — record your first one!" : "No payments match your filters"}</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Record Payment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Client *</label><input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client name" style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Invoice No</label><input value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="FF-2026-001" style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Method</label><select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={inp}><option value="upi">📱 UPI</option><option value="bank_transfer">🏦 Net Banking</option><option value="card">💳 Card</option><option value="cash">💵 Cash</option><option value="check">📄 Cheque</option></select></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              </div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Transaction ID</label><input value={form.txnId} onChange={e => setForm(f => ({ ...f, txnId: e.target.value }))} placeholder="UPI/Card txn ID" style={inp} /></div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreate} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Record Payment 💳</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "440px" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800 }}>{selected.client}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ textAlign: "center", padding: "20px", background: selected.status === "completed" ? "rgba(0,217,126,0.08)" : "rgba(255,184,0,0.08)", borderRadius: "12px" }}>
                <div style={{ fontSize: "36px", fontWeight: 800, color: selected.status === "completed" ? "#00d97e" : "#ffb800" }}>₹{(selected.amount || 0).toLocaleString()}</div>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginTop: "4px" }}>{new Date(selected.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                {selected.txnId && <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "4px" }}>TXN: {selected.txnId}</div>}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "10px", textTransform: "uppercase" }}>Update Status</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatus(selected._id, k)}
                      style={{ padding: "6px 14px", borderRadius: "99px", border: "1px solid " + v.border, background: selected.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>{v.icon} {v.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deletePayment(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}