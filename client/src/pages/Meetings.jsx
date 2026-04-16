import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const PLATFORM_ICONS = {
  zoom: "🎥",
  meet: "📹",
  teams: "💻",
  whatsapp: "💬",
  telegram: "✈️",
  discord: "🎮",
  other: "🔗"
}

const PLATFORMS = [
  { id: "zoom", name: "Zoom", color: "#2D8CFF" },
  { id: "meet", name: "Google Meet", color: "#4285F4" },
  { id: "teams", name: "Microsoft Teams", color: "#6264A7" },
  { id: "whatsapp", name: "WhatsApp Video", color: "#25D366" },
  { id: "telegram", name: "Telegram Video", color: "#2CA5E0" },
  { id: "discord", name: "Discord", color: "#5865F2" },
  { id: "other", name: "Other / In Person", color: "#6c63ff" },
]

export default function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterStatus, setFilterStatus] = useState("upcoming")
  const [form, setForm] = useState({
    title: "", description: "", date: "", startTime: "09:00", duration: "30",
    platform: "zoom", meetingLink: "", clientId: "", notes: ""
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [cliRes] = await Promise.allSettled([api.get("/clients")])
      setClients(cliRes.value?.data?.clients || [])
      const sampleMeetings = [
        {
          _id: "1", title: "Project Kickoff Call", description: "Discuss project scope and timeline",
          date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          startTime: "10:00", duration: "60", platform: "zoom",
          meetingLink: "https://zoom.us/j/123456789", clientId: "", status: "scheduled",
        },
        {
          _id: "2", title: "Weekly Status Update", description: "Progress review and next steps",
          date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
          startTime: "14:00", duration: "30", platform: "meet",
          meetingLink: "https://meet.google.com/abc-defg-hij", clientId: "", status: "scheduled",
        },
        {
          _id: "3", title: "Design Review", description: "Review mockups and get feedback",
          date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
          startTime: "11:00", duration: "45", platform: "whatsapp",
          meetingLink: "", clientId: "", status: "completed",
        },
      ]
      setMeetings(sampleMeetings)
    } catch { /* silent fail */ }
    finally { setLoading(false) }
  }

  const openModal = (meeting = null) => {
    if (meeting) {
      setSelectedMeeting(meeting)
      setForm({
        title: meeting.title, description: meeting.description || "",
        date: meeting.date, startTime: meeting.startTime, duration: meeting.duration,
        platform: meeting.platform, meetingLink: meeting.meetingLink || "",
        clientId: meeting.clientId || "", notes: meeting.notes || ""
      })
    } else {
      setSelectedMeeting(null)
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      setForm({
        title: "", description: "", date: tomorrow.toISOString().split("T")[0],
        startTime: "09:00", duration: "30", platform: "zoom", meetingLink: "",
        clientId: "", notes: ""
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error("Title and date are required"); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    if (selectedMeeting) {
      setMeetings(prev => prev.map(m => m._id === selectedMeeting._id ? { ...m, ...form } : m))
      toast.success("Meeting updated! ✅")
    } else {
      const newMeeting = { _id: Date.now().toString(), ...form, status: "scheduled" }
      setMeetings(prev => [...prev, newMeeting])
      toast.success("Meeting scheduled! 🎉")
    }
    setShowModal(false)
    setSaving(false)
  }

  const deleteMeeting = async (id) => {
    if (!window.confirm("Cancel this meeting?")) return
    setMeetings(prev => prev.filter(m => m._id !== id))
    toast.success("Meeting cancelled")
    setShowModal(false)
  }

  const joinMeeting = (meeting) => {
    if (meeting.meetingLink) {
      window.open(meeting.meetingLink, "_blank")
    } else {
      toast.success("No meeting link added. Contact host for details.")
    }
  }

  const filteredMeetings = meetings.filter(m => {
    const platformMatch = filterPlatform === "all" || m.platform === filterPlatform
    const today = new Date().toISOString().split("T")[0]
    let statusMatch = true
    if (filterStatus === "upcoming") statusMatch = m.date >= today && m.status !== "cancelled"
    if (filterStatus === "past") statusMatch = m.date < today || m.status === "completed"
    if (filterStatus === "today") statusMatch = m.date === today
    return platformMatch && statusMatch
  }).sort((a, b) => {
    if (filterStatus === "past") return new Date(b.date) - new Date(a.date)
    return new Date(a.date) - new Date(b.date)
  })

  const todayMeetings = meetings.filter(m => m.date === new Date().toISOString().split("T")[0])
  const upcomingCount = meetings.filter(m => m.date >= new Date().toISOString().split("T")[0] && m.status !== "cancelled").length

  const inputStyle = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>🎥 Meetings</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{upcomingCount} upcoming meetings</p>
        </div>
        <button onClick={() => openModal()} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
          + Schedule Meeting
        </button>
      </div>

      {/* Today's Meetings Banner */}
      {todayMeetings.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,rgba(0,217,126,0.15),rgba(0,217,126,0.05))", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "28px" }}>📅</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#00d97e", marginBottom: "4px" }}>Today - {todayMeetings.length} Meeting{todayMeetings.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: "13px", color: "var(--text2)" }}>
                {todayMeetings.map(m => `${m.title} at ${m.startTime}`).join(" • ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Today's Meetings", value: todayMeetings.length, icon: "📅", color: "#00d97e" },
          { label: "This Week", value: meetings.filter(m => { const d = new Date(m.date); const now = new Date(); const weekLater = new Date(now.getTime() + 7 * 86400000); return d >= now && d <= weekLater }).length, icon: "📆", color: "#6c63ff" },
          { label: "Upcoming", value: upcomingCount, icon: "⏰", color: "#ffb800" },
          { label: "Completed", value: meetings.filter(m => m.status === "completed").length, icon: "✅", color: "#a78bfa" },
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
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--surface)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
          {["upcoming", "today", "past"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "7px 14px", border: "none", borderRadius: "7px", background: filterStatus === s ? "var(--accent)" : "transparent", color: filterStatus === s ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px", background: "var(--surface)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <button onClick={() => setFilterPlatform("all")} style={{ padding: "7px 12px", border: "none", borderRadius: "7px", background: filterPlatform === "all" ? "var(--accent)" : "transparent", color: filterPlatform === "all" ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>All</button>
          {Object.entries(PLATFORM_ICONS).slice(0, 5).map(([k, icon]) => (
            <button key={k} onClick={() => setFilterPlatform(k)} style={{ padding: "7px 10px", border: "none", borderRadius: "7px", background: filterPlatform === k ? PLATFORMS.find(p => p.id === k)?.color + "30" : "transparent", color: filterPlatform === k ? PLATFORMS.find(p => p.id === k)?.color : "var(--text2)", cursor: "pointer", fontSize: "12px" }} title={PLATFORMS.find(p => p.id === k)?.name}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎥</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No meetings found</h3>
          <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}>{filterStatus === "upcoming" ? "Schedule your first meeting!" : "No past meetings to show"}</p>
          <button onClick={() => openModal()} style={{ padding: "10px 24px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>+ Schedule Meeting</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredMeetings.map(meeting => {
            const platform = PLATFORMS.find(p => p.id === meeting.platform) || PLATFORMS[6]
            const isToday = meeting.date === new Date().toISOString().split("T")[0]
            const isPast = meeting.date < new Date().toISOString().split("T")[0]
            const daysUntil = Math.ceil((new Date(meeting.date) - new Date()) / 86400000)

            return (
              <div key={meeting._id} onClick={() => openModal(meeting)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px 24px", cursor: "pointer", transition: "all 0.15s", borderLeft: "4px solid " + platform.color }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = platform.color; e.currentTarget.style.transform = "translateX(4px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor = platform.color; e.currentTarget.style.transform = "translateX(0)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: platform.color + "20", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: platform.color, lineHeight: 1 }}>{new Date(meeting.date).getDate()}</div>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: platform.color, textTransform: "uppercase" }}>{MONTHS[new Date(meeting.date).getMonth()].substring(0, 3)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{meeting.title}</h3>
                        {isToday && <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(0,217,126,0.15)", color: "#00d97e", border: "1px solid rgba(0,217,126,0.3)", fontWeight: 700 }}>TODAY</span>}
                        {daysUntil === 1 && !isToday && <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontWeight: 700 }}>TOMORROW</span>}
                      </div>
                      {meeting.description && <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "10px" }}>{meeting.description}</p>}
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text2)" }}>
                          <span>⏰</span> {meeting.startTime} ({meeting.duration} min)
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: platform.color, fontWeight: 600 }}>
                          <span>{platform.icon}</span> {platform.name}
                        </span>
                        {meeting.meetingLink && <span style={{ fontSize: "12px", color: "var(--text2)" }}>🔗 Link added</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {!isPast && meeting.meetingLink && (
                      <button onClick={e => { e.stopPropagation(); joinMeeting(meeting) }} style={{ padding: "8px 16px", background: platform.color, border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
                        Join Now
                      </button>
                    )}
                    <div style={{ fontSize: "14px", color: "var(--text2)" }}>→</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{selectedMeeting ? "Edit Meeting" : "Schedule Meeting"}</h2>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Set up your next video call</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Meeting Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Weekly team standup..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Agenda, topics to discuss..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Duration</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={inputStyle}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setForm(f => ({ ...f, platform: p.id }))} style={{ padding: "10px 8px", borderRadius: "10px", border: "1px solid", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: form.platform === p.id ? p.color + "20" : "var(--surface2)", borderColor: form.platform === p.id ? p.color : "var(--border)", color: form.platform === p.id ? p.color : "var(--text2)", transition: "all 0.15s" }}>
                      <div style={{ fontSize: "18px", marginBottom: "4px" }}>{p.icon}</div>
                      <div style={{ fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Meeting Link</label>
                <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://zoom.us/j/..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Additional notes..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                {selectedMeeting && (
                  <button onClick={() => deleteMeeting(selectedMeeting._id)} style={{ flex: 1, padding: "12px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 600 }}>🗑️ Cancel</button>
                )}
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : selectedMeeting ? "Update ✅" : "Schedule 🎉"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
