import { useState, useEffect, useCallback, memo, useMemo } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

const INDUSTRIES = ["Technology", "Design", "Marketing", "E-commerce", "Education", "Healthcare", "Finance", "Real Estate", "Media", "Retail", "Other"]
const STATUSES = {
  active: { label: "Active", color: "#00d97e", bg: "rgba(0,217,126,0.15)", border: "rgba(0,217,126,0.3)" },
  inactive: { label: "Inactive", color: "#8b9cc8", bg: "rgba(139,156,200,0.15)", border: "rgba(139,156,200,0.3)" },
  prospect: { label: "Prospect", color: "#ffb800", bg: "rgba(255,184,0,0.15)", border: "rgba(255,184,0,0.3)" },
}
const COLORS = ["#6c63ff","#ff6584","#00d97e","#ffb800","#2CA5E0","#ff4d6d","#a78bfa","#00c9a7"]
const FREE_CLIENT_LIMIT = 2
const EMPTY_FORM = { name: "", email: "", phone: "", company: "", industry: "Technology", status: "active", hourlyRate: "", address: "", website: "", notes: "" }
const INPUT_STYLE = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }

export default function Clients() {
  const { user } = useAuthStore()
  const isPro = user?.plan === "pro"
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("grid")
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients")
      // Handle both old and new response formats
      const clientList = res.data.clients || res.data.data || []
      setClients(clientList)
    } catch (e) { 
      console.error("Fetch clients error:", e.response?.data)
      toast.error("Failed to load clients") 
    }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return }
    
    // Free tier limit check - only for new clients
    if (!isPro && !editMode && clients.length >= FREE_CLIENT_LIMIT) {
      toast.error(`Free plan limited to ${FREE_CLIENT_LIMIT} clients. Upgrade to Pro for unlimited!`, { duration: 5000 })
      return
    }
    
    setSaving(true)
    try {
      if (editMode && showDetail) {
        const { data } = await api.put(`/clients/${showDetail._id}`, form)
        const updatedClient = data.client || data.data
        setClients(prev => prev.map(c => c._id === showDetail._id ? updatedClient : c))
        setShowDetail(updatedClient)
        toast.success("Client updated! ✅")
        setShowModal(false)
      } else {
        const { data } = await api.post("/clients", form)
        const newClient = data.client || data.data
        setClients(prev => [newClient, ...prev])
        toast.success("Client added! 🎉")
        setShowModal(false)
      }
      setEditMode(false)
      setForm(EMPTY_FORM)
    } catch (e) {
      console.error("Save client error:", e.response?.data)
      toast.error(e.response?.data?.message || e.response?.data?.error || "Failed to save client")
    } finally { setSaving(false) }
  }

  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return
    try {
      await api.delete(`/clients/${id}`)
      setClients(prev => prev.filter(c => c._id !== id))
      setShowDetail(null)
      toast.success("Client deleted")
    } catch { toast.error("Failed to delete") }
  }

  const openEdit = (client) => {
    setForm({ name: client.name || "", email: client.email || "", phone: client.phone || "", company: client.company || "", industry: client.industry || "Technology", status: client.status || "active", hourlyRate: client.defaultHourlyRate || "", address: client.address || "", website: client.website || "", notes: client.notes || "" })
    setEditMode(true)
  }

  const filtered = useMemo(() => clients.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || c.status === filterStatus
    return matchSearch && matchStatus
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt)
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt)
    if (sortBy === "name") return a.name?.localeCompare(b.name)
    if (sortBy === "rate") return (b.defaultHourlyRate || 0) - (a.defaultHourlyRate || 0)
    return 0
  }), [clients, search, filterStatus, sortBy])

  const activeCount = clients.filter(c => c.status === "active").length
  const totalRevenue = clients.reduce((s, c) => s + (c.totalBilled || 0), 0)

  const handleFormChange = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditMode(false)
    setForm(EMPTY_FORM)
  }, [])

  const ModalContent = memo(({ isEdit }) => {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{isEdit ? "Edit Client" : "Add New Client"}</h2>
              <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>{isEdit ? "Update client information" : "Fill in client details"}</p>
            </div>
            <button onClick={handleCloseModal} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
          </div>
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px", background: "var(--surface2)", borderRadius: "12px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {form.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>{form.name || "Client Name"}</div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>{form.company || "Company"} · {form.industry}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Full Name *</label>
                <input value={form.name} onChange={e => handleFormChange("name", e.target.value)} placeholder="John Doe" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email *</label>
                <input type="email" value={form.email} onChange={e => handleFormChange("email", e.target.value)} placeholder="john@example.com" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</label>
                <input value={form.phone} onChange={e => handleFormChange("phone", e.target.value)} placeholder="9876543210" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company</label>
                <input value={form.company} onChange={e => handleFormChange("company", e.target.value)} placeholder="Company name" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Industry</label>
                <select value={form.industry} onChange={e => handleFormChange("industry", e.target.value)} style={INPUT_STYLE}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                <select value={form.status} onChange={e => handleFormChange("status", e.target.value)} style={INPUT_STYLE}>
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hourly Rate (₹)</label>
                <input type="number" value={form.hourlyRate} onChange={e => handleFormChange("hourlyRate", e.target.value)} placeholder="1500" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Website</label>
                <input value={form.website} onChange={e => handleFormChange("website", e.target.value)} placeholder="https://example.com" style={INPUT_STYLE} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Address</label>
              <input value={form.address} onChange={e => handleFormChange("address", e.target.value)} placeholder="City, State, Country" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</label>
              <textarea value={form.notes} onChange={e => handleFormChange("notes", e.target.value)} rows={3} placeholder="Any important notes about this client..." style={{ ...INPUT_STYLE, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
              <button onClick={handleCloseModal} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "12px", background: saving ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "15px" }}>
                {saving ? "Saving..." : isEdit ? "Save Changes ✅" : "Add Client 🎉"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  })

  return (
    <div style={{ maxWidth: "1300px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Clients</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{clients.length} total · {activeCount} active</p>
          {!isPro && (
            <div style={{ marginTop: "8px", padding: "8px 12px", background: clients.length >= FREE_CLIENT_LIMIT ? "rgba(255,77,109,0.15)" : "rgba(255,184,0,0.15)", borderRadius: "8px", border: "1px solid " + (clients.length >= FREE_CLIENT_LIMIT ? "rgba(255,77,109,0.3)" : "rgba(255,184,0,0.3)") }}>
              <span style={{ fontSize: "12px", color: clients.length >= FREE_CLIENT_LIMIT ? "#ff4d6d" : "#ffb800" }}>
                {clients.length}/{FREE_CLIENT_LIMIT} clients used
                {clients.length >= FREE_CLIENT_LIMIT ? " · Upgrade to Pro for unlimited" : " · " + (FREE_CLIENT_LIMIT - clients.length) + " remaining"}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {[{ id: "grid", label: "⊞ Grid" }, { id: "list", label: "☰ List" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "8px 14px", border: "none", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => { 
            if (!isPro && clients.length >= FREE_CLIENT_LIMIT) {
              toast.error(`Free plan limited to ${FREE_CLIENT_LIMIT} clients. Upgrade to Pro for unlimited!`)
              return
            }
            setShowModal(true); setForm(EMPTY_FORM); setEditMode(false) 
          }} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add Client</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Clients", value: clients.length, icon: "👥", color: "#6c63ff" },
          { label: "Active", value: activeCount, icon: "✅", color: "#00d97e" },
          { label: "Prospects", value: clients.filter(c => c.status === "prospect").length, icon: "🎯", color: "#ffb800" },
          { label: "Avg Rate", value: clients.length ? "₹" + Math.round(clients.reduce((s, c) => s + (c.defaultHourlyRate || 0), 0) / clients.length) + "/hr" : "—", icon: "💰", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div><div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, company..." style={{ ...INPUT_STYLE, padding: "10px 12px 10px 36px" }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setFilterStatus("all")} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterStatus === "all" ? "var(--accent)" : "var(--surface)", color: filterStatus === "all" ? "#fff" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
          {Object.entries(STATUSES).map(([k, v]) => (
            <button key={k} onClick={() => setFilterStatus(k)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border)"), background: filterStatus === k ? v.bg : "var(--surface)", color: filterStatus === k ? v.color : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.label}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...INPUT_STYLE, width: "auto", padding: "8px 14px" }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="rate">Highest rate</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text2)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <p>Loading clients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{search ? "No clients found" : "No clients yet"}</h3>
          <p style={{ fontSize: "14px", marginBottom: "20px" }}>{search ? "Try a different search term" : "Add your first client to get started"}</p>
          {!search && <button onClick={() => setShowModal(true)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Add First Client</button>}
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {filtered.map((c, idx) => {
            const color = COLORS[idx % COLORS.length]
            const st = STATUSES[c.status] || STATUSES.active
            return (
              <div key={c._id}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + "60"; e.currentTarget.style.transform = "translateY(-3px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}
                onClick={() => setShowDetail(c)}>
                {/* Top banner */}
                <div style={{ height: "6px", background: "linear-gradient(90deg," + color + "," + color + "88)" }} />
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg," + color + "," + color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fff" }}>
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "3px" }}>{c.name}</h3>
                  {c.company && <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "10px" }}>🏢 {c.company}</p>}
                  {c.industry && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "rgba(108,99,255,0.1)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.2)" }}>{c.industry}</span>}
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "5px" }}>
                    {c.email && <div style={{ fontSize: "11px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📧 {c.email}</div>}
                    {c.phone && <div style={{ fontSize: "11px", color: "var(--text2)" }}>📱 {c.phone}</div>}
                    {c.defaultHourlyRate && <div style={{ fontSize: "12px", fontWeight: 700, color: "#00d97e" }}>💰 ₹{c.defaultHourlyRate}/hr</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 120px", gap: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Client</span><span>Email</span><span>Company</span><span>Status</span><span>Rate</span><span>Actions</span>
          </div>
          {filtered.map((c, idx) => {
            const color = COLORS[idx % COLORS.length]
            const st = STATUSES[c.status] || STATUSES.active
            return (
              <div key={c._id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 120px", gap: "12px", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", alignItems: "center", transition: "border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                onClick={() => setShowDetail(c)}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg," + color + "," + color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{c.name}</div>
                    {c.phone && <div style={{ fontSize: "11px", color: "var(--text2)" }}>{c.phone}</div>}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>{c.company || "—"}</div>
                <div><span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span></div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: c.defaultHourlyRate ? "#00d97e" : "var(--text2)" }}>{c.defaultHourlyRate ? "₹" + c.defaultHourlyRate + "/hr" : "—"}</div>
                <div style={{ display: "flex", gap: "6px" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { openEdit(c); setShowDetail(c) }} style={{ padding: "5px 10px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "6px", color: "#6c63ff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Edit</button>
                  <button onClick={() => deleteClient(c._id)} style={{ padding: "5px 10px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "6px", color: "#ff4d6d", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && !editMode && <ModalContent isEdit={false} />}

      {/* EDIT MODAL */}
      {editMode && showDetail && <ModalContent isEdit={true} />}

      {/* DETAIL DRAWER */}
      {showDetail && !editMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", justifyContent: "flex-end" }} onClick={() => setShowDetail(null)}>
          <div style={{ width: "420px", background: "var(--surface)", height: "100%", overflowY: "auto", borderLeft: "1px solid var(--border)", animation: "slideIn 0.25s ease" }}
            onClick={e => e.stopPropagation()}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            {/* Banner */}
            {(() => {
              const color = COLORS[clients.findIndex(c => c._id === showDetail._id) % COLORS.length] || "#6c63ff"
              const st = STATUSES[showDetail.status] || STATUSES.active
              return (
                <>
                  <div style={{ height: "8px", background: "linear-gradient(90deg," + color + ",#ff6584)" }} />
                  <div style={{ padding: "24px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "linear-gradient(135deg," + color + "," + color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "#fff" }}>
                          {showDetail.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "3px" }}>{showDetail.name}</h2>
                          {showDetail.company && <p style={{ fontSize: "13px", color: "var(--text2)" }}>{showDetail.company}</p>}
                          <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                        </div>
                      </div>
                      <button onClick={() => setShowDetail(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "20px" }}>×</button>
                    </div>
                  </div>
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Quick Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                      <a href={"mailto:" + showDetail.email} style={{ padding: "10px 8px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "10px", color: "#6c63ff", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📧 Email</a>
                      <a href={"tel:" + showDetail.phone} style={{ padding: "10px 8px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "10px", color: "#00d97e", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📱 Call</a>
                      <a href={"https://wa.me/91" + showDetail.phone} target="_blank" rel="noreferrer" style={{ padding: "10px 8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", color: "#25D366", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>💬 WA</a>
                    </div>
                    {/* Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { label: "Email", value: showDetail.email || "—", icon: "📧" },
                        { label: "Phone", value: showDetail.phone || "—", icon: "📱" },
                        { label: "Company", value: showDetail.company || "—", icon: "🏢" },
                        { label: "Industry", value: showDetail.industry || "—", icon: "🏭" },
                        { label: "Hourly Rate", value: showDetail.defaultHourlyRate ? "₹" + showDetail.defaultHourlyRate + "/hr" : "—", icon: "💰" },
                        { label: "Website", value: showDetail.website || "—", icon: "🌐" },
                        { label: "Address", value: showDetail.address || "—", icon: "📍" },
                        { label: "Member Since", value: new Date(showDetail.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), icon: "📅" },
                      ].map(item => (
                        <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{item.icon} {item.label}</div>
                          <div style={{ fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {showDetail.notes && (
                      <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>📝 Notes</div>
                        <p style={{ fontSize: "13px", lineHeight: "1.6" }}>{showDetail.notes}</p>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                      <button onClick={() => openEdit(showDetail)} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>✏️ Edit Client</button>
                      <button onClick={() => deleteClient(showDetail._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️</button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}