import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  draft:    { label: "Draft",       color: "#a8aec0", bg: "rgba(168,174,192,0.15)", border: "rgba(168,174,192,0.3)" },
  sent:     { label: "Sent",        color: "#2CA5E0", bg: "rgba(44,165,224,0.15)",  border: "rgba(44,165,224,0.3)"  },
  viewed:   { label: "Viewed",      color: "#ffb800", bg: "rgba(255,184,0,0.15)",   border: "rgba(255,184,0,0.3)"   },
  accepted: { label: "Accepted ✓",  color: "#00d97e", bg: "rgba(0,217,126,0.15)",  border: "rgba(0,217,126,0.3)"  },
  declined: { label: "Declined",    color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
  expired:  { label: "Expired",     color: "#ff6584", bg: "rgba(255,101,132,0.15)",border: "rgba(255,101,132,0.3)"},
}

const EMPTY_FORM = { title: "", client: "", company: "", amount: "", validUntil: "", services: "", notes: "", status: "draft" }

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--surface2, #1a1a24)",
  border: "1px solid var(--border, rgba(255,255,255,0.1))",
  borderRadius: "8px", color: "var(--text, #fafafa)", fontSize: "13px",
}

function ProposalModal({ proposal, onSubmit, onClose }) {
  const [form, setForm] = useState(proposal ? {
    title: proposal.title, client: proposal.client, company: proposal.company || "",
    amount: proposal.amount || "", validUntil: proposal.validUntil || "",
    services: proposal.services?.join(", ") || "", notes: proposal.notes || "", status: proposal.status,
  } : EMPTY_FORM)

  const setField = useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }, [])

  const handleSubmit = () => {
    if (!form.title || !form.client) {
      toast.error("Title and client are required")
      return
    }
    const data = {
      ...form,
      amount: Number(form.amount) || 0,
      services: form.services ? form.services.split(",").map(s => s.trim()).filter(Boolean) : [],
    }
    if (proposal?._id) data._id = proposal._id
    onSubmit(data)
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>{proposal ? "Edit Proposal" : "New Proposal"}</h2><p style={{ fontSize: "13px", color: "var(--text2, #a1a1aa)", marginTop: "2px" }}>{proposal ? `Editing — ${proposal.title}` : "Create a professional proposal"}</p></div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Proposal Title *</label>
            <input type="text" value={form.title} onChange={e => setField("title", e.target.value)} placeholder="e.g. E-commerce Website Development" style={inputStyle} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Client Name *</label>
              <input type="text" value={form.client} onChange={e => setField("client", e.target.value)} placeholder="John Doe" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Company</label>
              <input type="text" value={form.company} onChange={e => setField("company", e.target.value)} placeholder="Company name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Total Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e => setField("amount", e.target.value)} placeholder="50000" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setField("validUntil", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Services (comma separated)</label>
            <input type="text" value={form.services} onChange={e => setField("services", e.target.value)} placeholder="Frontend Dev, Backend API..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Notes</label>
            <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3} placeholder="Project details..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>{proposal ? "Save Changes ✏️" : "Create Proposal 📝"}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ProposalDetail({ proposal, onEdit, onClose, onDelete, onUpdateStatus }) {
  const st = STATUS[proposal.status] || STATUS.draft
  const daysLeft = proposal.validUntil ? Math.ceil((new Date(proposal.validUntil) - new Date()) / 86400000) : null

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", padding: "32px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa", marginBottom: "4px" }}>💼 FreelanceFlow</div><div style={{ fontSize: "11px", color: "#7c6fcd" }}>Professional Proposal</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "2px" }}>PROPOSAL</div><div style={{ fontSize: "11px", color: "#a78bfa", marginTop: "2px" }}>#{String(proposal._id).slice(-6).toUpperCase()}</div></div>
          </div>
        </div>
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>{proposal.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>{proposal.client?.[0]?.toUpperCase()}</div>
              <div><div style={{ fontSize: "15px", fontWeight: 700 }}>{proposal.client}</div>{proposal.company && <div style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)" }}>{proposal.company}</div>}</div>
              <span style={{ marginLeft: "auto", fontSize: "11px", padding: "3px 12px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
            </div>
          </div>
          {proposal.services?.length > 0 && (
            <div>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "10px" }}>Services Included</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {proposal.services.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--surface2, #1a1a24)", borderRadius: "8px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff" }}>{i + 1}</div>
                    <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{s}</span>
                    <span style={{ color: "#00d97e" }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[{ label: "Total Amount", value: "₹" + (proposal.amount || 0).toLocaleString(), big: true }, { label: "Valid Until", value: proposal.validUntil || "—" }, { label: "Services", value: (proposal.services?.length || 0) + " included" }].map(item => (
              <div key={item.label} style={{ background: "var(--surface2, #1a1a24)", borderRadius: "10px", padding: "12px 16px" }}>
                <div style={{ fontSize: "10px", color: "var(--text2, #a1a1aa)", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: item.big ? "22px" : "14px", fontWeight: 800, color: item.big ? "#00d97e" : "var(--text, #fafafa)" }}>{item.value}</div>
              </div>
            ))}
          </div>
          {proposal.notes && <div style={{ background: "var(--surface2, #1a1a24)", borderRadius: "10px", padding: "16px" }}><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>📝 Notes</div><p style={{ fontSize: "13px" }}>{proposal.notes}</p></div>}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "10px" }}>Update Status</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => onUpdateStatus(proposal._id, k)} style={{ padding: "6px 12px", borderRadius: "99px", border: "1px solid " + v.border, background: proposal.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>{v.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onEdit} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700 }}>✏️ Edit</button>
            <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Close</button>
            <button onClick={() => onDelete(proposal._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editProposal, setEditProposal] = useState(null)
  const [viewProposal, setViewProposal] = useState(null)

  useEffect(() => {
    api.get("/proposals").then(({ data }) => {
      setProposals(data?.data || [])
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  const handleCreate = async (formData) => {
    try {
      const { data } = await api.post("/proposals", formData)
      setProposals(prev => [data.data, ...prev])
      toast.success("Proposal created! 📝")
      setShowModal(false)
    } catch (e) {
      toast.error("Failed to create proposal")
    }
  }

  const handleEdit = async (formData) => {
    if (!editProposal) return
    try {
      const { data } = await api.put(`/proposals/${editProposal._id}`, formData)
      setProposals(prev => (prev || []).map(p => p._id === editProposal._id ? data.data : p))
      setViewProposal(data.data)
      toast.success("Proposal updated!")
      setShowModal(false)
      setEditProposal(null)
    } catch (e) {
      toast.error("Failed to update proposal")
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/proposals/${id}`, { status })
      setProposals(prev => (prev || []).map(p => p._id === id ? data.data : p))
      setViewProposal(prev => prev?._id === id ? data.data : prev)
      toast.success(status === "accepted" ? "🎉 Accepted!" : "Status updated!")
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  const deleteProposal = async (id) => {
    if (!window.confirm("Delete this proposal?")) return
    try {
      await api.delete(`/proposals/${id}`)
      setProposals(prev => prev.filter(p => p._id !== id))
      setViewProposal(null)
      toast.success("Deleted")
    } catch (e) {
      toast.error("Failed to delete")
    }
  }

  const filtered = useMemo(() => proposals.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.client?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    return matchSearch && matchStatus
  }), [proposals, search, filterStatus])

  const totalValue = useMemo(() => proposals.reduce((s, p) => s + (p.amount || 0), 0), [proposals])
  const acceptedValue = useMemo(() => proposals.filter(p => p.status === "accepted").reduce((s, p) => s + (p.amount || 0), 0), [proposals])
  const acceptRate = useMemo(() => proposals.length ? Math.round((proposals.filter(p => p.status === "accepted").length / proposals.length) * 100) : 0, [proposals])

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div><h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>Proposals</h1><p style={{ color: "var(--text2, #a1a1aa)", fontSize: "14px" }}>{proposals.length} total · {acceptRate}% acceptance rate</p></div>
        <button onClick={() => { setEditProposal(null); setShowModal(true) }} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Proposal</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[{ label: "Total Proposals", value: proposals.length, icon: "📝", color: "#6c63ff" }, { label: "Total Value", value: "₹" + totalValue.toLocaleString(), icon: "💰", color: "#ffb800" }, { label: "Accepted Value", value: "₹" + acceptedValue.toLocaleString(), icon: "🏆", color: "#00d97e" }, { label: "Accept Rate", value: acceptRate + "%", icon: "📈", color: "#ff6584" }].map(s => (
          <div key={s.label} style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, maxWidth: "300px" }} />
        <button onClick={() => setFilterStatus("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border, rgba(255,255,255,0.1))", background: filterStatus === "all" ? "#6c63ff" : "transparent", color: filterStatus === "all" ? "#fff" : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border, rgba(255,255,255,0.1))"), background: filterStatus === k ? v.bg : "transparent", color: filterStatus === k ? v.color : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text2, #a1a1aa)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <p>Loading proposals...</p>
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface, #111118)", border: "2px dashed var(--border, rgba(255,255,255,0.1))", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📝</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No proposals yet</p>
          <button onClick={() => setShowModal(true)} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Create First Proposal</button>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map(p => {
            const st = STATUS[p.status] || STATUS.draft
            const daysLeft = p.validUntil ? Math.ceil((new Date(p.validUntil) - new Date()) / 86400000) : null
            return (
              <div key={p._id} onClick={() => setViewProposal(p)} style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "16px", padding: "20px", cursor: "pointer" }}>
                <button onClick={(e) => { e.stopPropagation(); setEditProposal(p); setShowModal(true) }} style={{ position: "absolute", top: "14px", right: "14px", background: "var(--surface2, #1a1a24)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "3px 8px", color: "var(--text2, #a1a1aa)" }}>✏️</button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingRight: "40px" }}>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                  {daysLeft !== null && <span style={{ fontSize: "10px", color: daysLeft < 0 ? "#ff4d6d" : daysLeft < 5 ? "#ffb800" : "var(--text2, #a1a1aa)", fontWeight: 600 }}>{daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today!" : `${daysLeft}d left`}</span>}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "8px" }}>{p.title}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff" }}>{p.client?.[0]?.toUpperCase()}</div>
                  <div><div style={{ fontSize: "13px", fontWeight: 700 }}>{p.client}</div>{p.company && <div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{p.company}</div>}</div>
                </div>
                {p.services?.length > 0 && <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "14px" }}>{p.services.slice(0, 3).map(s => <span key={s} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "rgba(108,99,255,0.1)", color: "#6c63ff" }}>{s}</span>)}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border, rgba(255,255,255,0.1))" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#00d97e" }}>₹{(p.amount || 0).toLocaleString()}</span>
                  <span style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{p.createdAt}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ProposalModal proposal={editProposal} onSubmit={editProposal ? handleEdit : handleCreate} onClose={() => { setShowModal(false); setEditProposal(null) }} />}
      {viewProposal && <ProposalDetail proposal={viewProposal} onEdit={() => { setEditProposal(viewProposal); setShowModal(true) }} onClose={() => setViewProposal(null)} onDelete={deleteProposal} onUpdateStatus={updateStatus} />}
    </div>
  )
}
