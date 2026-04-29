import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../lib/api"
import toast from "react-hot-toast"
import { Users, Plus, Trash2, Loader2, Mail, UserPlus, Search } from "lucide-react"

const Workers = () => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { fetchWorkers() }, [])

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get("/workers")
      setWorkers(data.data || [])
    } catch (e) {
      toast.error("Failed to load workers")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return toast.error("All fields are required")
    }
    if (form.password.length < 12) {
      return toast.error("Password must be at least 12 characters")
    }
    setSubmitting(true)
    try {
      await api.post("/workers", form)
      toast.success("Worker created successfully")
      setForm({ name: "", email: "", password: "" })
      setShowModal(false)
      fetchWorkers()
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create worker")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return
    try {
      await api.delete(`/workers/${id}`)
      toast.success("Worker removed")
      fetchWorkers()
    } catch (e) {
      toast.error("Failed to remove worker")
    }
  }

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: "#fff" }}>Workers</h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Manage your team members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "linear-gradient(135deg, #6c63ff, #ff6584)",
            color: "#fff", border: "none", borderRadius: "12px",
            padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: "14px",
          }}
        >
          <UserPlus size={18} /> Add Worker
        </button>
      </div>

      <div style={{
        background: "#1a1a2e", borderRadius: "16px", padding: "20px",
        border: "1px solid #2a2a4a",
      }}>
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workers..."
            style={{
              width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a",
              borderRadius: "10px", padding: "10px 12px 10px 40px",
              color: "#fff", fontSize: "14px", outline: "none",
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Users size={48} style={{ marginBottom: "12px", opacity: 0.3 }} />
            <p>{workers.length === 0 ? "No workers yet. Add your first team member." : "No matching workers found."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {filtered.map((w) => (
              <div key={w._id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#0f0f1a", borderRadius: "12px", padding: "16px",
                border: "1px solid #2a2a4a",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #6c63ff, #ff6584)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: "18px",
                  }}>
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: "#fff" }}>{w.name}</p>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} /> {w.email}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    background: "#1e293b", color: "#94a3b8", padding: "4px 10px",
                    borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                  }}>Worker</span>
                  <button
                    onClick={() => handleDelete(w._id, w.name)}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "8px",
                      padding: "8px", cursor: "pointer", color: "#ef4444",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1a1a2e", borderRadius: "20px", padding: "32px",
                width: "100%", maxWidth: "440px", border: "1px solid #2a2a4a",
              }}
            >
              <h2 style={{ margin: "0 0 4px", color: "#fff", fontSize: "22px" }}>Add Worker</h2>
              <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>Create login credentials for a team member</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Name</label>
                  <input
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Worker name"
                    style={{
                      width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a",
                      borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Email</label>
                  <input
                    type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="worker@email.com"
                    style={{
                      width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a",
                      borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
                    Password <span style={{ color: "#64748b", fontWeight: 400 }}>(min 12 chars)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••••••"
                      style={{
                        width: "100%", background: "#0f0f1a", border: "1px solid #2a2a4a",
                        borderRadius: "10px", padding: "12px 40px 12px 12px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit" disabled={submitting}
                  style={{
                    background: submitting ? "#4a4a6a" : "linear-gradient(135deg, #6c63ff, #ff6584)",
                    color: "#fff", border: "none", borderRadius: "12px", padding: "14px",
                    fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontSize: "15px",
                    marginTop: "8px",
                  }}
                >
                  {submitting ? "Creating..." : "Create Worker"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Workers
