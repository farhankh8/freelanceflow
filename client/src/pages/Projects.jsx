import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

// ✅ Status keys match backend enum exactly: planning, active, completed, cancelled
const STATUS = {
  planning:  { label: "Planning",   color: "#6c63ff", bg: "rgba(108,99,255,0.15)", border: "rgba(108,99,255,0.3)" },
  active:    { label: "In Progress",color: "#ffb800", bg: "rgba(255,184,0,0.15)",  border: "rgba(255,184,0,0.3)"  },
  completed: { label: "Completed",  color: "#00d97e", bg: "rgba(0,217,126,0.15)",  border: "rgba(0,217,126,0.3)"  },
  cancelled: { label: "Cancelled",  color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
}

const PRIORITY = {
  low:    { label: "Low",    color: "#00d97e" },
  medium: { label: "Medium", color: "#ffb800" },
  high:   { label: "High",   color: "#ff4d6d" },
}

const KANBAN_COLS = [
  { id: "planning",  label: "Planning",    icon: "📋" },
  { id: "active",    label: "In Progress", icon: "⚡" },
  { id: "completed", label: "Completed",   icon: "✅" },
  { id: "cancelled", label: "Cancelled",   icon: "🚫" },
]

function KanbanCard({ project, onDragStart, onClick }) {
  const pr = PRIORITY[project.priority] || PRIORITY.medium
  const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline) - new Date()) / 86400000) : null
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", cursor: "grab", marginBottom: "8px", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.5)"; e.currentTarget.style.transform = "translateY(-2px)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, flex: 1, marginRight: "8px", lineHeight: "1.4" }}>{project.title}</h4>
        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: pr.color + "20", color: pr.color, fontWeight: 700, flexShrink: 0 }}>{pr.label}</span>
      </div>
      {project.client && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff" }}>{project.client.name?.[0]}</div>
          <span style={{ fontSize: "11px", color: "var(--text2)" }}>{project.client.name}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--success)" }}>₹{(project.budget || 0).toLocaleString()}</span>
        {daysLeft !== null && <span style={{ fontSize: "10px", color: daysLeft < 0 ? "#ff4d6d" : daysLeft < 5 ? "#ffb800" : "var(--text2)" }}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}</span>}
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("kanban")
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [saving, setSaving] = useState(false)
  // ✅ Default status is "active" (matches backend enum), client is required
  const [form, setForm] = useState({ title: "", description: "", clientId: "", status: "active", budget: "", deadline: "" })

  useEffect(() => {
    fetchProjects()
    api.get("/clients").then(({ data }) => setClients(data.data || [])).catch(() => {})
  }, [])

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects")
      setProjects(data.data || [])
      setClients(data.data || [])
    } catch {
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    // ✅ Validate both title AND client (both required by backend)
    if (!form.title) { toast.error("Project title is required"); return }
    if (!form.clientId) { toast.error("Please select a client — it is required"); return }
    setSaving(true)
    try {
      const { data } = await api.post("/projects", {
        title: form.title,
        description: form.description,
        clientId: form.clientId,          // ✅ backend expects clientId
        status: form.status,              // ✅ only valid enum values shown in dropdown
        budget: Number(form.budget) || 0,
        deadline: form.deadline || undefined,
      })
      setProjects(prev => [data.data, ...prev])
      toast.success("Project created! 🚀")
      setShowModal(false)
      setForm({ title: "", description: "", clientId: "", status: "active", budget: "", deadline: "" })
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create project")
    } finally {
      setSaving(false)
    }
  }

  const moveProject = async (id, status) => {
    try {
      const { data } = await api.put(`/projects/${id}`, { status })
      setProjects(prev => prev.map(p => p._id === id ? data.data : p))
      toast.success(`Moved to ${STATUS[status]?.label}`)
    } catch {
      toast.error("Failed to update")
    }
  }

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(prev => prev.filter(p => p._id !== id))
      setSelected(null)
      toast.success("Deleted")
    } catch {
      toast.error("Failed to delete")
    }
  }

  const filtered = projects.filter(p =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const activeCount = projects.filter(p => p.status === "active").length
  const completedCount = projects.filter(p => p.status === "completed").length

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1300px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Projects</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{projects.length} total · {activeCount} active</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {[{ id: "kanban", label: "📌 Kanban" }, { id: "list", label: "📋 List" }, { id: "grid", label: "⊞ Grid" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "8px 14px", border: "none", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s" }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Project</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Projects", value: projects.length, icon: "🚀", color: "#6c63ff" },
          { label: "In Progress",    value: activeCount,     icon: "⚡", color: "#ffb800" },
          { label: "Completed",      value: completedCount,  icon: "✅", color: "#00d97e" },
          { label: "Total Value",    value: "₹" + totalBudget.toLocaleString(), icon: "💰", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "400px" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ ...inp, padding: "10px 12px 10px 36px" }} />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div>
      ) : (
        <>
          {/* KANBAN VIEW */}
          {view === "kanban" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(200px, 1fr))", gap: "16px", alignItems: "start", overflowX: "auto" }}>
              {KANBAN_COLS.map(col => {
                const colProjects = filtered.filter(p => p.status === col.id)
                const st = STATUS[col.id]
                return (
                  <div key={col.id}
                    onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                    onDrop={() => { if (dragId) { moveProject(dragId, col.id); setDragId(null); setDragOver(null) } }}
                    style={{ background: dragOver === col.id ? st.bg : "var(--surface2)", border: "1px solid " + (dragOver === col.id ? st.border : "var(--border)"), borderRadius: "16px", padding: "16px", minHeight: "200px", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: st.color }} />
                        <span style={{ fontSize: "13px", fontWeight: 700 }}>{col.icon} {col.label}</span>
                      </div>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: st.bg, color: st.color, fontWeight: 700 }}>{colProjects.length}</span>
                    </div>
                    {colProjects.map(p => (
                      <KanbanCard key={p._id} project={p} onDragStart={() => setDragId(p._id)} onClick={() => setSelected(p)} />
                    ))}
                    {colProjects.length === 0 && (
                      <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text2)", fontSize: "12px", border: "2px dashed var(--border)", borderRadius: "10px" }}>Drop here</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "600px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <span>Project</span><span>Client</span><span>Status</span><span>Budget</span><span>Deadline</span>
                </div>
                {filtered.map(p => {
                  const st = STATUS[p.status] || STATUS.planning
                  const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / 86400000) : null
                  return (
                    <div key={p._id} onClick={() => setSelected(p)}
                      style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", alignItems: "center", cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{p.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--text2)" }}>{p.client?.name || "—"}</div>
                      <div><span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span></div>
                      <div style={{ fontWeight: 700, color: "var(--success)", fontSize: "13px" }}>₹{(p.budget || 0).toLocaleString()}</div>
                      <div style={{ fontSize: "12px", color: daysLeft !== null && daysLeft < 0 ? "#ff4d6d" : daysLeft !== null && daysLeft < 5 ? "#ffb800" : "var(--text2)" }}>
                        {p.deadline ? new Date(p.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {view === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {filtered.map(p => {
                const st = STATUS[p.status] || STATUS.planning
                const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / 86400000) : null
                return (
                  <div key={p._id} onClick={() => setSelected(p)}
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; e.currentTarget.style.transform = "translateY(-3px)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "6px" }}>{p.title}</h3>
                    {p.client && <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "14px" }}>👤 {p.client.name}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--success)" }}>₹{(p.budget || 0).toLocaleString()}</span>
                      {daysLeft !== null && <span style={{ fontSize: "11px", color: daysLeft < 0 ? "#ff4d6d" : daysLeft < 5 ? "#ffb800" : "var(--text2)" }}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>New Project</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Fill in the project details</p></div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Project Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. E-commerce Website" style={inp} />
              </div>

              {/* ✅ Client is marked required */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Client * <span style={{ color: "#ff4d6d", fontSize: "11px", textTransform: "none", fontWeight: 400 }}>(required)</span>
                </label>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} style={{ ...inp, borderColor: !form.clientId ? "rgba(255,77,109,0.5)" : "var(--border)" }}>
                  <option value="">— Select a client —</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                {/* ✅ Status options match backend enum exactly */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                    <option value="planning">Planning</option>
                    <option value="active">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Budget (₹)</label>
                  <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inp} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "15px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Create Project 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT DETAIL MODAL */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>{selected.title}</h2>
                <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: STATUS[selected.status]?.bg, color: STATUS[selected.status]?.color, border: "1px solid " + STATUS[selected.status]?.border, fontWeight: 700 }}>{STATUS[selected.status]?.label}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {selected.description && <p style={{ color: "var(--text2)", fontSize: "14px", lineHeight: "1.6" }}>{selected.description}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Client",   value: selected.client?.name || "—" },
                  { label: "Budget",   value: "₹" + (selected.budget || 0).toLocaleString() },
                  { label: "Deadline", value: selected.deadline ? new Date(selected.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                  { label: "Hourly Rate", value: selected.hourlyRate ? "₹" + selected.hourlyRate + "/hr" : "—" },
                ].map(item => (
                  <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* ✅ Move status buttons use correct backend enum values */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Move to Status</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => { moveProject(selected._id, k); setSelected(s => ({ ...s, status: k })) }}
                      style={{ padding: "6px 14px", borderRadius: "99px", border: "1px solid " + v.border, background: selected.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>{v.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteProject(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}