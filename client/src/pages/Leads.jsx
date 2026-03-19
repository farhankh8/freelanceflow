import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const STAGES = {
  new: { label: "New", color: "#6c63ff", bg: "rgba(108,99,255,0.15)", border: "rgba(108,99,255,0.3)" },
  contacted: { label: "Contacted", color: "#2CA5E0", bg: "rgba(44,165,224,0.15)", border: "rgba(44,165,224,0.3)" },
  proposal: { label: "Proposal Sent", color: "#ffb800", bg: "rgba(255,184,0,0.15)", border: "rgba(255,184,0,0.3)" },
  negotiation: { label: "Negotiating", color: "#ff6584", bg: "rgba(255,101,132,0.15)", border: "rgba(255,101,132,0.3)" },
  won: { label: "Won 🎉", color: "#00d97e", bg: "rgba(0,217,126,0.15)", border: "rgba(0,217,126,0.3)" },
  lost: { label: "Lost", color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("pipeline")
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", value: "", stage: "new", source: "Website", notes: "" })

  useEffect(() => { fetchLeads() }, [])

  const fetchLeads = async () => {
    try {
      const { data } = await api.get("/leads")
      setLeads(data.data || [])
    } catch { toast.error("Failed to load leads") }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.name) { toast.error("Name is required"); return }
    try {
      const { data } = await api.post("/leads", { ...form, value: Number(form.value) || 0 })
      setLeads(prev => [data.data, ...prev])
      toast.success("Lead added! 🎯")
      setShowModal(false)
      setForm({ name: "", company: "", email: "", phone: "", value: "", stage: "new", source: "Website", notes: "" })
    } catch { toast.error("Failed to add lead") }
  }

  const moveLead = async (id, stage) => {
    try {
      const { data } = await api.put(`/leads/${id}`, { stage })
      setLeads(prev => prev.map(l => l._id === id ? data.data : l))
      if (stage === "won") toast.success("Lead won! 🎉")
      else toast.success("Moved to " + STAGES[stage]?.label)
    } catch { toast.error("Failed to update") }
  }

  const deleteLead = async (id) => {
    if (!window.confirm("Delete this lead?")) return
    try {
      await api.delete(`/leads/${id}`)
      setLeads(prev => prev.filter(l => l._id !== id))
      setSelected(null)
      toast.success("Deleted")
    } catch { toast.error("Failed to delete") }
  }

  const filtered = leads.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()))
  const totalValue = leads.filter(l => l.stage !== "lost").reduce((s, l) => s + (l.value || 0), 0)
  const wonValue = leads.filter(l => l.stage === "won").reduce((s, l) => s + (l.value || 0), 0)
  const wonCount = leads.filter(l => l.stage === "won").length
  const convRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1300px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Leads</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{leads.length} total · {convRate}% conversion</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {[{ id: "pipeline", label: "🔀 Pipeline" }, { id: "list", label: "📋 List" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "8px 14px", border: "none", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add Lead</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Leads", value: leads.length, icon: "🎯", color: "#6c63ff" },
          { label: "Pipeline Value", value: "₹" + totalValue.toLocaleString(), icon: "💰", color: "#ffb800" },
          { label: "Won Value", value: "₹" + wonValue.toLocaleString(), icon: "🏆", color: "#00d97e" },
          { label: "Conversion Rate", value: convRate + "%", icon: "📈", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
            <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "400px" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ ...inp, padding: "10px 12px 10px 36px" }} />
      </div>

      {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div> : (
        <>
          {view === "pipeline" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px" }}>
              {["new", "contacted", "proposal", "negotiation", "won"].map(stageId => {
                const st = STAGES[stageId]
                const sl = filtered.filter(l => l.stage === stageId)
                return (
                  <div key={stageId}
                    onDragOver={e => { e.preventDefault(); setDragOver(stageId) }}
                    onDrop={() => { if (dragId) { moveLead(dragId, stageId); setDragId(null); setDragOver(null) } }}
                    style={{ background: dragOver === stageId ? st.bg : "var(--surface2)", border: "1px solid " + (dragOver === stageId ? st.border : "var(--border)"), borderRadius: "14px", padding: "14px", minHeight: "200px", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: st.color }}>{st.label}</span>
                      <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: st.bg, color: st.color, fontWeight: 700 }}>{sl.length}</span>
                    </div>
                    {sl.map(lead => (
                      <div key={lead._id} draggable onDragStart={() => setDragId(lead._id)} onClick={() => setSelected(lead)}
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", marginBottom: "8px", cursor: "grab", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = st.color; e.currentTarget.style.transform = "translateY(-1px)" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "3px" }}>{lead.name}</div>
                        {lead.company && <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "6px" }}>{lead.company}</div>}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)" }}>₹{(lead.value || 0).toLocaleString()}</span>
                          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "99px", background: "rgba(108,99,255,0.1)", color: "#6c63ff" }}>{lead.source}</span>
                        </div>
                      </div>
                    ))}
                    {sl.length === 0 && <div style={{ textAlign: "center", padding: "24px 8px", color: "var(--text2)", fontSize: "11px", border: "2px dashed var(--border)", borderRadius: "8px" }}>Drop here</div>}
                  </div>
                )
              })}
            </div>
          )}

          {view === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(lead => {
                const st = STAGES[lead.stage] || STAGES.new
                return (
                  <div key={lead._id} onClick={() => setSelected(lead)}
                    style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", alignItems: "center", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <div><div style={{ fontWeight: 700, fontSize: "14px" }}>{lead.name}</div><div style={{ fontSize: "11px", color: "var(--text2)" }}>{lead.email}</div></div>
                    <div style={{ fontSize: "13px", color: "var(--text2)" }}>{lead.company || "—"}</div>
                    <div style={{ fontWeight: 700, color: "var(--success)", fontSize: "14px" }}>₹{(lead.value || 0).toLocaleString()}</div>
                    <div><span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span></div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>{lead.source}</div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Add New Lead</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[{ label: "Name *", key: "name", type: "text", ph: "Full name" }, { label: "Company", key: "company", type: "text", ph: "Company" }, { label: "Email", key: "email", type: "email", ph: "email@example.com" }, { label: "Phone", key: "phone", type: "text", ph: "9876543210" }, { label: "Deal Value (₹)", key: "value", type: "number", ph: "50000" }].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px" }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inp} />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px" }}>Source</label>
                  <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={inp}>
                    {["Website", "Referral", "LinkedIn", "Instagram", "Cold Email", "WhatsApp", "Upwork", "Fiverr", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px" }}>Stage</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={inp}>
                    {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px" }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="What does this lead need?" style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreate} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>Add Lead 🎯</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>{selected.name}</h2>
                <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: STAGES[selected.stage]?.bg, color: STAGES[selected.stage]?.color, border: "1px solid " + STAGES[selected.stage]?.border, fontWeight: 700 }}>{STAGES[selected.stage]?.label}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[{ label: "Company", value: selected.company || "—" }, { label: "Deal Value", value: "₹" + (selected.value || 0).toLocaleString() }, { label: "Email", value: selected.email || "—" }, { label: "Phone", value: selected.phone || "—" }, { label: "Source", value: selected.source || "—" }].map(item => (
                  <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Move Stage</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {Object.entries(STAGES).map(([k, v]) => (
                    <button key={k} onClick={() => { moveLead(selected._id, k); setSelected(s => ({ ...s, stage: k })) }}
                      style={{ padding: "6px 12px", borderRadius: "99px", border: "1px solid " + v.border, background: selected.stage === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href={"mailto:" + selected.email} style={{ flex: 1, padding: "10px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>📧 Email</a>
                <a href={"tel:" + selected.phone} style={{ flex: 1, padding: "10px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "8px", color: "#00d97e", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>📱 Call</a>
                <a href={"https://wa.me/91" + selected.phone} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "8px", color: "#25D366", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>💬 WA</a>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteLead(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}