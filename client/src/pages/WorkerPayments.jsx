import { useState, useEffect } from "react"
import api from "../lib/api"
import useAuthStore from "../store/authStore"
import { Wallet, Loader2, CheckCircle, Clock } from "lucide-react"

const WorkerPayments = () => {
  const { user } = useAuthStore()
  const isManager = user?.role !== "worker"
  const [payments, setPayments] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ workerId: "", amount: "", notes: "" })

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const [payRes, workerRes] = await Promise.allSettled([
        api.get("/worker-payments"),
        isManager ? api.get("/workers") : Promise.resolve(null),
      ])
      setPayments(payRes.status === "fulfilled" ? payRes.value.data.data || [] : [])
      if (workerRes.status === "fulfilled" && workerRes.value) {
        setWorkers(workerRes.value.data.data || [])
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.workerId || !form.amount) return
    setSubmitting(true)
    try {
      await api.post("/worker-payments", { workerId: form.workerId, amount: Number(form.amount), notes: form.notes })
      setForm({ workerId: "", amount: "", notes: "" })
      setShowModal(false)
      fetchPayments()
    } catch (e) {
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/worker-payments/${id}`, { status })
      fetchPayments()
    } catch (e) {}
  }

  const deletePayment = async (id) => {
    if (!confirm("Delete this payment record?")) return
    try {
      await api.delete(`/worker-payments/${id}`)
      fetchPayments()
    } catch (e) {}
  }

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0)

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: "#fff" }}>
            {isManager ? "Worker Payments" : "My Payments"}
          </h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>
            {isManager ? "Track and manage team payments" : "View your payment history"}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, #6c63ff, #ff6584)",
              color: "#fff", border: "none", borderRadius: "12px",
              padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: "14px",
            }}
          >
            <Wallet size={18} /> Record Payment
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "14px", padding: "20px", border: "1px solid #2a2a4a" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Total Paid</p>
          <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 800, color: "#00d97e" }}>₹{totalPaid.toLocaleString()}</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "14px", padding: "20px", border: "1px solid #2a2a4a" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Pending</p>
          <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 800, color: "#ffb800" }}>₹{totalPending.toLocaleString()}</p>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "14px", padding: "20px", border: "1px solid #2a2a4a" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Records</p>
          <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{payments.length}</p>
        </div>
      </div>

      <div style={{ background: "#1a1a2e", borderRadius: "16px", border: "1px solid #2a2a4a", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Wallet size={48} style={{ marginBottom: "12px", opacity: 0.3 }} />
            <p>No payment records yet.</p>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f0f1a" }}>
                  {isManager && <th style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Worker</th>}
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Date</th>
                  {isManager && <th style={{ padding: "14px 16px", textAlign: "left", color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} style={{ borderTop: "1px solid #2a2a4a" }}>
                    {isManager && (
                      <td style={{ padding: "14px 16px", color: "#fff" }}>
                        {p.worker?.name || "Worker"}
                      </td>
                    )}
                    <td style={{ padding: "14px 16px", color: "#fff", fontWeight: 700 }}>₹{p.amount.toLocaleString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                        background: p.status === "paid" ? "rgba(0,217,126,0.15)" : "rgba(255,184,0,0.15)",
                        color: p.status === "paid" ? "#00d97e" : "#ffb800",
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                      {new Date(p.date).toLocaleDateString("en-IN")}
                    </td>
                    {isManager && (
                      <td style={{ padding: "14px 16px", display: "flex", gap: "8px" }}>
                        {p.status === "pending" && (
                          <button onClick={() => updateStatus(p._id, "paid")} style={{ background: "rgba(0,217,126,0.1)", border: "none", borderRadius: "6px", padding: "6px 10px", color: "#00d97e", cursor: "pointer", fontSize: "12px" }}>Mark Paid</button>
                        )}
                        <button onClick={() => deletePayment(p._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "6px", padding: "6px 10px", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a1a2e", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "440px", border: "1px solid #2a2a4a" }}>
            <h2 style={{ margin: "0 0 4px", color: "#fff", fontSize: "22px" }}>Record Payment</h2>
            <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>Add a payment for a worker</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Worker</label>
                <select
                  value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                  style={{ width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  required
                >
                  <option value="">Select worker</option>
                  {workers.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Amount (₹)</label>
                <input
                  type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="5000" min="1"
                  style={{ width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Notes</label>
                <input
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Monthly salary, bonus, etc."
                  style={{ width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit" disabled={submitting}
                style={{
                  background: submitting ? "#4a4a6a" : "linear-gradient(135deg, #6c63ff, #ff6584)",
                  color: "#fff", border: "none", borderRadius: "12px", padding: "14px",
                  fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontSize: "15px",
                }}
              >
                {submitting ? "Saving..." : "Record Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkerPayments
