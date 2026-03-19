import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  todo: { label: "To Do", color: "#6c63ff", bg: "rgba(108,99,255,0.15)", border: "rgba(108,99,255,0.3)" },
  in_progress: { label: "In Progress", color: "#ffb800", bg: "rgba(255,184,0,0.15)", border: "rgba(255,184,0,0.3)" },
  done: { label: "Done", color: "#00d97e", bg: "rgba(0,217,126,0.15)", border: "rgba(0,217,126,0.3)" }
}

const PRIORITY = {
  low: { label: "Low", color: "#00d97e" },
  medium: { label: "Medium", color: "#ffb800" },
  high: { label: "High", color: "#ff6584" },
  urgent: { label: "Urgent", color: "#ff4d6d" }
}

const KANBAN_COLS = [
  { id: "todo", label: "To Do", icon: "📋" },
  { id: "in_progress", label: "In Progress", icon: "⚡" },
  { id: "done", label: "Done", icon: "✅" }
]

function TaskCard({ task, onClick, onDragStart }) {
  const pr = PRIORITY[task.priority] || PRIORITY.medium
  const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null
  
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", cursor: "grab", marginBottom: "8px", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.5)"; e.currentTarget.style.transform = "translateY(-2px)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, flex: 1, lineHeight: "1.4" }}>{task.title}</h4>
        <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "99px", background: pr.color + "20", color: pr.color, fontWeight: 700, flexShrink: 0 }}>{pr.label}</span>
      </div>
      {task.description && (
        <p style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff" }}>{task.project?.title?.[0] || "P"}</div>
        <span style={{ fontSize: "10px", color: "var(--text2)" }}>{task.project?.title || "Project"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {task.estimatedHours > 0 && (
          <span style={{ fontSize: "11px", color: "var(--text2)" }}>{task.actualHours || 0}/{task.estimatedHours}h</span>
        )}
        {daysLeft !== null && (
          <span style={{ fontSize: "10px", color: daysLeft < 0 ? "#ff4d6d" : daysLeft < 3 ? "#ffb800" : "var(--text2)" }}>
            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("kanban")
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [filterProject, setFilterProject] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", projectId: "", priority: "medium", dueDate: "", estimatedHours: "" })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [taskRes, projRes, cliRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/clients")
      ])
      setTasks(taskRes.data.tasks || [])
      setProjects(projRes.data.projects || [])
      setClients(cliRes.data.clients || [])
    } catch { toast.error("Failed to load tasks") }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.title) { toast.error("Task title is required"); return }
    if (!form.projectId) { toast.error("Please select a project"); return }
    setSaving(true)
    try {
      const { data } = await api.post("/tasks", {
        title: form.title,
        description: form.description,
        projectId: form.projectId,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        estimatedHours: Number(form.estimatedHours) || 0
      })
      setTasks(prev => [data.task, ...prev])
      toast.success("Task created! ✅")
      setShowModal(false)
      setForm({ title: "", description: "", projectId: "", priority: "medium", dueDate: "", estimatedHours: "" })
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to create task") }
    finally { setSaving(false) }
  }

  const moveTask = async (id, status) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, { status })
      setTasks(prev => prev.map(t => t._id === id ? data.task : t))
      toast.success(`Moved to ${STATUS[status]?.label}`)
    } catch { toast.error("Failed to update") }
  }

  const updateTask = async (id, updates) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, updates)
      setTasks(prev => prev.map(t => t._id === id ? data.task : t))
      setSelected(null)
      toast.success("Task updated!")
    } catch { toast.error("Failed to update") }
  }

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(prev => prev.filter(t => t._id !== id))
      setSelected(null)
      toast.success("Deleted")
    } catch { toast.error("Failed to delete") }
  }

  const filtered = tasks.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterProject && t.project?._id !== filterProject) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length
  }

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Tasks</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{tasks.length} total · {taskStats.overdue > 0 && <span style={{ color: "#ff4d6d" }}>{taskStats.overdue} overdue</span>}</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Task</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Tasks", value: taskStats.total, icon: "✅", color: "#6c63ff" },
          { label: "To Do", value: taskStats.todo, icon: "📋", color: "#6c63ff" },
          { label: "In Progress", value: taskStats.inProgress, icon: "⚡", color: "#ffb800" },
          { label: "Completed", value: taskStats.done, icon: "🎉", color: "#00d97e" }
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ ...inp, padding: "9px 12px 9px 34px" }} />
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ padding: "9px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px" }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: "9px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px" }}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {[{ id: "kanban", label: "📌 Kanban" }, { id: "list", label: "📋 List" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "8px 14px", border: "none", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>{v.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div>
      ) : view === "kanban" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", alignItems: "start" }}>
          {KANBAN_COLS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id)
            const st = STATUS[col.id]
            return (
              <div key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                onDrop={() => { if (dragId) { moveTask(dragId, col.id); setDragId(null); setDragOver(null) } }}
                style={{ background: dragOver === col.id ? st.bg : "var(--surface2)", border: "1px solid " + (dragOver === col.id ? st.border : "var(--border)"), borderRadius: "16px", padding: "16px", minHeight: "200px", transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: st.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{col.icon} {col.label}</span>
                  </div>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: st.bg, color: st.color, fontWeight: 700 }}>{colTasks.length}</span>
                </div>
                {colTasks.map(t => (
                  <TaskCard key={t._id} task={t} onDragStart={() => setDragId(t._id)} onClick={() => setSelected(t)} />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text2)", fontSize: "12px", border: "2px dashed var(--border)", borderRadius: "10px" }}>Drop task here</div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" }}>
            <span>Task</span><span>Project</span><span>Priority</span><span>Status</span><span>Due Date</span><span>Actions</span>
          </div>
          {filtered.map(t => {
            const st = STATUS[t.status] || STATUS.todo
            const pr = PRIORITY[t.priority] || PRIORITY.medium
            return (
              <div key={t._id} onClick={() => setSelected(t)}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "12px", padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"
                } onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{t.title}</div>
                <div style={{ fontSize: "13px", color: "var(--text2)" }}>{t.project?.title || "—"}</div>
                <div><span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: pr.color + "20", color: pr.color, fontWeight: 700 }}>{pr.label}</span></div>
                <div><span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span></div>
                <div style={{ fontSize: "12px", color: t.dueDate && new Date(t.dueDate) < new Date() ? "#ff4d6d" : "var(--text2)" }}>
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                  {t.status !== "done" && (
                    <button onClick={(e) => { e.stopPropagation(); updateTask(t._id, { status: "done" }) }} style={{ padding: "5px 10px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "6px", color: "#00d97e", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>✓</button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteTask(t._id) }} style={{ padding: "5px 10px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "6px", color: "#ff4d6d", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>New Task</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Create a new task</p></div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Project *</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} style={inp}>
                  <option value="">Select a project...</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details..." rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={inp}>
                    {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Estimated Hours</label>
                  <input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="0" style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "15px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Create Task ✅"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "4px" }}>Project</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{selected.project?.title || "—"}</div>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "4px" }}>Priority</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: PRIORITY[selected.priority]?.color }}>{PRIORITY[selected.priority]?.label}</div>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "4px" }}>Due Date</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{selected.dueDate ? new Date(selected.dueDate).toLocaleDateString("en-IN") : "—"}</div>
                </div>
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "4px" }}>Estimated</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{selected.estimatedHours || 0}h</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "10px" }}>Update Status</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => updateTask(selected._id, { status: k })}
                      style={{ padding: "6px 14px", borderRadius: "99px", border: "1px solid " + v.border, background: selected.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteTask(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
