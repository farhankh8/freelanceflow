import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const EVENT_COLORS = {
  meeting: { bg: "rgba(108,99,255,0.15)", color: "#6c63ff", border: "rgba(108,99,255,0.4)", label: "Meeting" },
  deadline: { bg: "rgba(255,77,109,0.15)", color: "#ff4d6d", border: "rgba(255,77,109,0.4)", label: "Deadline" },
  reminder: { bg: "rgba(255,184,0,0.15)", color: "#ffb800", border: "rgba(255,184,0,0.4)", label: "Reminder" },
  milestone: { bg: "rgba(0,217,126,0.15)", color: "#00d97e", border: "rgba(0,217,126,0.4)", label: "Milestone" },
  other: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.4)", label: "Other" },
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("month")
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", date: "", startTime: "09:00", endTime: "10:00",
    type: "meeting", clientId: "", projectId: "", location: "", link: ""
  })
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [projRes, cliRes] = await Promise.allSettled([
        api.get("/projects"),
        api.get("/clients"),
      ])
      setProjects(Array.isArray(projRes.value?.data?.data) ? projRes.value.data.data : [])
      setClients(Array.isArray(cliRes.value?.data?.data) ? cliRes.value.data.data : [])
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const tasksRes = await api.get(`/tasks`)
      const tasks = tasksRes.data?.data || tasksRes.data || []
      const mappedEvents = tasks.map(t => ({
        _id: t._id,
        title: t.title,
        description: t.description || "",
        date: t.dueDate || t.createdAt,
        startTime: t.startTime || "09:00",
        endTime: t.endTime || "10:00",
        type: t.priority === "high" ? "deadline" : t.priority === "medium" ? "milestone" : "other",
        clientId: t.client?._id || "",
        projectId: t.project?._id || "",
        status: t.status,
      }))
      setEvents(mappedEvents)
    } catch { /* silent fail */ }
    finally { setLoading(false) }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }

  const getEventsForDate = (day) => {
    if (!day) return []
    return events.filter(e => {
      const eDate = new Date(e.date)
      return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year
    })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const openModal = (date = null, event = null) => {
    if (event) {
      setSelectedEvent(event)
      const d = new Date(event.date)
      setForm({
        title: event.title || "",
        description: event.description || "",
        date: d.toISOString().split("T")[0],
        startTime: event.startTime || "09:00",
        endTime: event.endTime || "10:00",
        type: event.type || "meeting",
        clientId: event.clientId || "",
        projectId: event.projectId || "",
        location: event.location || "",
        link: event.link || "",
      })
    } else {
      setSelectedEvent(null)
      const targetDate = date ? new Date(year, month, date) : new Date()
      setForm({
        title: "", description: "", date: targetDate.toISOString().split("T")[0],
        startTime: "09:00", endTime: "10:00", type: "meeting", clientId: "", projectId: "", location: "", link: ""
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error("Title and date are required"); return }
    setSaving(true)
    try {
      if (selectedEvent) {
        const { data } = await api.put(`/tasks/${selectedEvent._id}`, {
          title: form.title, description: form.description, dueDate: form.date,
          priority: form.type === "deadline" ? "high" : form.type === "milestone" ? "medium" : "low",
          status: selectedEvent.status
        })
        setEvents(prev => (prev || []).map(e => e._id === selectedEvent._id ? { ...e, ...form } : e))
        toast.success("Event updated! ✅")
      } else {
        const { data } = await api.post("/tasks", {
          title: form.title, description: form.description, dueDate: form.date,
          startTime: form.startTime, endTime: form.endTime,
          priority: form.type === "deadline" ? "high" : form.type === "milestone" ? "medium" : "low",
          clientId: form.clientId || null, projectId: form.projectId || null, status: "todo"
        })
        const newEvent = { ...data.data, type: form.type }
        setEvents(prev => [...prev, newEvent])
        toast.success("Event created! 🎉")
      }
      setShowModal(false)
    } catch (e) { toast.error("Failed to save event") }
    finally { setSaving(false) }
  }

  const deleteEvent = async () => {
    if (!selectedEvent || !window.confirm("Delete this event?")) return
    try {
      await api.delete(`/tasks/${selectedEvent._id}`)
      setEvents(prev => prev.filter(e => e._id !== selectedEvent._id))
      toast.success("Event deleted")
      setShowModal(false)
    } catch { toast.error("Failed to delete") }
  }

  const today = new Date()
  const isToday = (day) => day && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const days = getDaysInMonth()

  const weekDays = [
    { key: "Sun", color: "#ff4d6d" }, { key: "Mon", color: "#6c63ff" }, { key: "Tue", color: "#00d97e" },
    { key: "Wed", color: "#ffb800" }, { key: "Thu", color: "#a78bfa" }, { key: "Fri", color: "#2CA5E0" }, { key: "Sat", color: "#ff6584" }
  ]

  const inputStyle = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>📅 Calendar</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{events.length} events this month</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {["month", "week"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "8px 16px", border: "none", background: view === v ? "var(--accent)" : "transparent", color: view === v ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}>{v}</button>
            ))}
          </div>
          <button onClick={() => openModal()} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Event</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {Object.entries(EVENT_COLORS).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: v.bg, border: "1px solid " + v.border, borderRadius: "99px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.color }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: v.color }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Header */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={prevMonth} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
            <h2 style={{ fontSize: "20px", fontWeight: 800, minWidth: "200px", textAlign: "center" }}>{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
          </div>
          <button onClick={goToday} style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Today</button>
        </div>

        {/* Day Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
          {weekDays.map(d => (
            <div key={d.key} style={{ padding: "10px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: d.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.key}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day)
            const weekend = idx % 7 === 0 || idx % 7 === 6
            return (
              <div key={idx} onClick={() => day && openModal(day)} style={{
                minHeight: "100px", padding: "8px", borderRight: (idx % 7 !== 6) ? "1px solid var(--border)" : "none",
                borderBottom: "1px solid var(--border)", background: weekend ? "rgba(255,255,255,0.01)" : "transparent",
                cursor: day ? "pointer" : "default", transition: "background 0.15s"
              }}
                onMouseEnter={e => { if (day) e.currentTarget.style.background = "var(--surface2)" }}
                onMouseLeave={e => { e.currentTarget.style.background = weekend ? "rgba(255,255,255,0.01)" : "transparent" }}>
                {day && (
                  <>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, marginBottom: "4px",
                      background: isToday(day) ? "var(--accent)" : "transparent",
                      color: isToday(day) ? "#fff" : weekend ? "var(--text2)" : "var(--text)"
                    }}>{day}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {dayEvents.slice(0, 3).map(ev => {
                        const evColor = EVENT_COLORS[ev.type] || EVENT_COLORS.other
                        return (
                          <div key={ev._id} onClick={e => { e.stopPropagation(); openModal(null, ev) }}
                            style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 600, background: evColor.bg, color: evColor.color, border: "1px solid " + evColor.border, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: "9px", color: "var(--text2)", padding: "2px 6px" }}>+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>📋 Upcoming Events</h3>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📅</div>
            <p style={{ fontSize: "14px" }}>No upcoming events</p>
            <button onClick={() => openModal()} style={{ marginTop: "12px", padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>+ Schedule Event</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {events.slice(0, 10).map(ev => {
              const evColor = EVENT_COLORS[ev.type] || EVENT_COLORS.other
              return (
                <div key={ev._id} onClick={() => openModal(null, ev)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = evColor.border }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: evColor.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: evColor.color, lineHeight: 1 }}>{new Date(ev.date).getDate()}</div>
                    <div style={{ fontSize: "8px", fontWeight: 600, color: evColor.color, textTransform: "uppercase" }}>{MONTHS[new Date(ev.date).getMonth()].substring(0, 3)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>{ev.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>{ev.startTime} - {ev.endTime}</div>
                  </div>
                  <span style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "99px", background: evColor.bg, color: evColor.color, border: "1px solid " + evColor.border, fontWeight: 700 }}>{evColor.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "520px" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{selectedEvent ? "Edit Event" : "New Event"}</h2>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Schedule a meeting, deadline, or reminder</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Team standup meeting..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Meeting agenda..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                    {Object.entries(EVENT_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Client</label>
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} style={inputStyle}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Project</label>
                  <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} style={inputStyle}>
                    <option value="">No project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                {selectedEvent && (
                  <button onClick={deleteEvent} style={{ flex: 1, padding: "12px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 600 }}>🗑️ Delete</button>
                )}
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "15px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : selectedEvent ? "Update Event ✅" : "Create Event 🎉"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
