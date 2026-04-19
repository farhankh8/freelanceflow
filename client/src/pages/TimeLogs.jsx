import { useState, useEffect, useRef } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const LS_KEY = "freelanceflow_timelogs"
const LS_TIMER = "freelanceflow_timer"
const EMPTY_FORM = { project: "", task: "", duration: "", date: new Date().toISOString().split("T")[0], rate: 1500, notes: "" }

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  return []
}

function saveLogs(logs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(logs)) } catch (_) {}
}

export default function TimeLogs() {
  const [logs, setLogs] = useState(() => loadLogs())
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [timerProject, setTimerProject] = useState("")
  const [timerTask, setTimerTask] = useState("")
  const [timerRate, setTimerRate] = useState(1500)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState("")
  const [filterProject, setFilterProject] = useState("all")
  const [filterBilled, setFilterBilled] = useState("all")
  const intervalRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // ── Fetch projects from API for dropdown ─────────────────────────────────
  useEffect(() => {
    api.get("/projects")
      .then(res => {
        const list = (res.data?.data || res.data || []).map(p => ({ id: p._id, name: p.title }))
        setProjects(Array.isArray(list) ? list : [])
        if (list.length > 0 && !timerProject) setTimerProject(list[0].name)
      })
      .catch(() => {})
  }, [])

  // ── Fetch logs from API, merge with local ─────────────────────────────────
  useEffect(() => {
    api.get("/timelogs")
      .then(res => {
        const apiList = res.data?.data || res.data || []
        if (apiList.length > 0) {
          setLogs(prev => {
            const localOnly = prev.filter(l => String(l._id).startsWith("local_"))
            const apiIds = new Set(apiList.map(l => l._id))
            const stillLocal = localOnly.filter(l => !apiIds.has(l._id))
            const merged = [...stillLocal, ...apiList]
            saveLogs(merged)
            return merged
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Persist logs on every change ─────────────────────────────────────────
  const updateLogs = (fn) => {
    setLogs(prev => {
      const next = typeof fn === "function" ? fn(prev || []) : fn
      saveLogs(next)
      return next
    })
  }

  // ── Timer interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // ── Persist timer state (survives page nav) ───────────────────────────────
  useEffect(() => {
    const data = { running, seconds, timerProject, timerTask, timerRate, startTime: running ? (Date.now() - seconds * 1000) : null }
    localStorage.setItem(LS_TIMER, JSON.stringify(data))
  }, [running, seconds, timerProject, timerTask, timerRate])

  // ── Restore timer on mount ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_TIMER)
      if (saved) {
        const data = JSON.parse(saved)
        let elapsed = data.seconds || 0
        if (data.running && data.startTime) {
          elapsed = Math.floor((Date.now() - data.startTime) / 1000)
        }
        if (elapsed > 0) {
          setSeconds(elapsed)
          if (data.running) setRunning(true)
          setTimerProject(data.timerProject || "")
          setTimerTask(data.timerTask || "")
          setTimerRate(data.timerRate || 1500)
        }
      }
    } catch (_) {}
  }, [])

  const startTimer = () => {
    if (!timerTask.trim()) { toast.error("Enter a task name first"); return }
    setRunning(true)
    toast.success("Timer started! ⏱️")
  }

  const stopTimer = async () => {
    setRunning(false)
    const mins = Math.max(1, Math.round(seconds / 60))
    const amount = parseFloat(((mins / 60) * timerRate).toFixed(2))
    const tempId = "local_" + Date.now()
    const newLog = {
      _id: tempId,
      project: timerProject,
      task: timerTask,
      duration: mins,
      date: new Date().toISOString().split("T")[0],
      rate: timerRate,
      billed: false,
      notes: "",
      amount,
      createdAt: new Date().toISOString(),
    }
    // ✅ Save locally immediately
    updateLogs(prev => [newLog, ...prev])
    toast.success(`Logged ${formatDuration(mins)}! 🎉`)
    setSeconds(0)
    setTimerTask("")

    // Then try API
    try {
      const { data } = await api.post("/timelogs", {
        project: timerProject, task: timerTask, duration: mins,
        date: newLog.date, rate: timerRate, notes: "", billed: false,
      })
      const saved = data?.data
      if (saved?._id) {
        updateLogs(prev => prev.map(l => l._id === tempId ? saved : l))
      }
    } catch (_) {}
  }

  const resetTimer = () => {
    setRunning(false)
    setSeconds(0)
    localStorage.removeItem(LS_TIMER)
    toast("Timer reset")
  }

  const handleAddManual = async () => {
    if (!form.task || !form.duration) { toast.error("Task and duration are required"); return }
    const mins = Number(form.duration)
    const amount = parseFloat(((mins / 60) * Number(form.rate)).toFixed(2))
    const tempId = "local_" + Date.now()
    const newLog = { _id: tempId, ...form, duration: mins, rate: Number(form.rate), billed: false, amount, createdAt: new Date().toISOString() }

    // ✅ Optimistic save
    updateLogs(prev => [newLog, ...prev])
    toast.success("Time log added!")
    setShowModal(false)
    setForm(EMPTY_FORM)

    try {
      const { data } = await api.post("/timelogs", { ...form, duration: mins, rate: Number(form.rate), billed: false })
      const saved = data?.data
      if (saved?._id) {
        updateLogs(prev => prev.map(l => l._id === tempId ? saved : l))
      }
    } catch (_) {}
  }

  const deleteLog = async (id) => {
    updateLogs(prev => prev.filter(l => l._id !== id))
    toast.success("Deleted")
    try { await api.delete(`/timelogs/${id}`) } catch (_) {}
  }

  const toggleBilled = async (id) => {
    let newVal
    updateLogs(prev => prev.map(l => {
      if (l._id === id) { newVal = !l.billed; return { ...l, billed: newVal } }
      return l
    }))
    try { await api.put(`/timelogs/${id}`, { billed: newVal }) } catch (_) {}
  }

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.project?.toLowerCase().includes(search.toLowerCase()) || l.task?.toLowerCase().includes(search.toLowerCase())
    const matchProject = filterProject === "all" || l.project === filterProject
    const matchBilled = filterBilled === "all" || (filterBilled === "billed" ? l.billed : !l.billed)
    return matchSearch && matchProject && matchBilled
  })

  const totalMins = logs.reduce((s, l) => s + (l.duration || 0), 0)
  const unbilledMins = logs.filter(l => !l.billed).reduce((s, l) => s + (l.duration || 0), 0)
  const totalEarnings = logs.reduce((s, l) => s + ((l.duration / 60) * (l.rate || 0)), 0)
  const unbilledEarnings = logs.filter(l => !l.billed).reduce((s, l) => s + ((l.duration / 60) * (l.rate || 0)), 0)

  // Unique projects from logs for filter
  const logProjects = [...new Set(logs.map(l => l.project).filter(Boolean))]

  const progress = Math.min((seconds % 3600) / 3600, 1)
  const circumference = 2 * Math.PI * 80
  const dashoffset = circumference * (1 - progress)

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Time Logs</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{logs.length} entries · {formatDuration(totalMins)} total</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Manual Entry</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Time",      value: formatDuration(totalMins),                          icon: "⏱️", color: "#6c63ff" },
          { label: "Unbilled Time",   value: formatDuration(unbilledMins),                       icon: "🕐", color: "#ffb800" },
          { label: "Total Earnings",  value: "₹" + Math.round(totalEarnings).toLocaleString(),   icon: "💰", color: "#00d97e" },
          { label: "Unbilled Amount", value: "₹" + Math.round(unbilledEarnings).toLocaleString(),icon: "📋", color: "#ff4d6d" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(300px, 340px)", gap: "20px", alignItems: "start" }}>

        {/* ── Left: Log List ──────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project or task..." style={{ ...inp, padding: "9px 12px 9px 36px" }} />
            </div>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
              <option value="all">All Projects</option>
              {logProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterBilled} onChange={e => setFilterBilled(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
              <option value="all">All</option>
              <option value="unbilled">Unbilled</option>
              <option value="billed">Billed</option>
            </select>
          </div>

          {loading && logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(log => {
                const earnings = Math.round((log.duration / 60) * (log.rate || 0))
                const isLocal = String(log._id).startsWith("local_")
                return (
                  <div key={log._id}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "var(--surface)", border: "1px solid " + (log.billed ? "rgba(0,217,126,0.3)" : isLocal ? "rgba(255,184,0,0.25)" : "var(--border)"), borderRadius: "12px", transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = log.billed ? "rgba(0,217,126,0.3)" : isLocal ? "rgba(255,184,0,0.25)" : "var(--border)"}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: log.billed ? "rgba(0,217,126,0.15)" : "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                      {log.billed ? "✅" : "⏱️"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
                        {log.task}
                        {isLocal && <span style={{ fontSize: "9px", marginLeft: "8px", padding: "1px 6px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontWeight: 700 }}>LOCAL</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text2)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {log.project && <span style={{ color: "#6c63ff" }}>{log.project}</span>}
                        {log.project && <span>·</span>}
                        <span>{log.date}</span>
                        {log.notes && <><span>·</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{log.notes}</span></>}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#6c63ff" }}>{formatDuration(log.duration)}</div>
                      <div style={{ fontSize: "10px", color: "var(--text2)" }}>@ ₹{log.rate}/hr</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: "80px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#00d97e" }}>₹{earnings.toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: log.billed ? "#00d97e" : "#ffb800" }}>{log.billed ? "Billed" : "Unbilled"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                      <button onClick={() => toggleBilled(log._id)} title={log.billed ? "Mark Unbilled" : "Mark Billed"}
                        style={{ padding: "6px 8px", background: log.billed ? "rgba(0,217,126,0.1)" : "rgba(255,184,0,0.1)", border: "1px solid " + (log.billed ? "rgba(0,217,126,0.3)" : "rgba(255,184,0,0.3)"), borderRadius: "6px", color: log.billed ? "#00d97e" : "#ffb800", cursor: "pointer", fontSize: "12px" }}>
                        {log.billed ? "✓" : "○"}
                      </button>
                      <button onClick={() => deleteLog(log._id)} aria-label="Delete time log" style={{ padding: "6px 8px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "6px", color: "#ff4d6d", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏱️</div>
                  <p style={{ fontWeight: 600 }}>{logs.length === 0 ? "No time logs yet" : "No logs match your filters"}</p>
                  <p style={{ fontSize: "13px", marginTop: "6px", color: "var(--text2)" }}>Start the timer or add a manual entry</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Stopwatch + Summaries ───────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Stopwatch */}
          <div style={{ background: "var(--surface)", border: "1px solid " + (running ? "rgba(108,99,255,0.5)" : "var(--border)"), borderRadius: "20px", padding: "28px 24px", textAlign: "center", transition: "border-color 0.3s", boxShadow: running ? "0 0 30px rgba(108,99,255,0.1)" : "none" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: running ? "#6c63ff" : "var(--text2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
              {running ? "🔴 RECORDING..." : "⏱️ STOPWATCH"}
            </p>

            {/* Ring */}
            <div style={{ position: "relative", width: "180px", height: "180px", margin: "0 auto 20px" }}>
              <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="80" fill="none" stroke="var(--surface2)" strokeWidth="8" />
                <circle cx="90" cy="90" r="80" fill="none"
                  stroke={running ? "#6c63ff" : "var(--border)"}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "30px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "2px", color: running ? "#6c63ff" : "var(--text)" }}>{formatTime(seconds)}</div>
                <div style={{ fontSize: "12px", color: "#00d97e", marginTop: "4px", fontWeight: 700 }}>
                  {seconds > 0 ? `₹${Math.round((seconds / 3600) * timerRate)}` : "₹0"}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", textAlign: "left" }}>
              <select value={timerProject} onChange={e => setTimerProject(e.target.value)} disabled={running} style={{ ...inp, fontSize: "12px", padding: "8px 12px" }}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <input value={timerTask} onChange={e => setTimerTask(e.target.value)} disabled={running} placeholder="What are you working on?" style={{ ...inp, fontSize: "12px", padding: "8px 12px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "11px", color: "var(--text2)", whiteSpace: "nowrap" }}>Rate ₹/hr:</label>
                <input type="number" value={timerRate} onChange={e => setTimerRate(Number(e.target.value))} disabled={running} style={{ ...inp, fontSize: "12px", padding: "8px 12px" }} />
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              {!running ? (
                <button onClick={startTimer} style={{ flex: 1, padding: "13px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "15px" }}>▶ Start</button>
              ) : (
                <>
                  <button onClick={stopTimer} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg,#00d97e,#00c9a7)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "14px" }}>⏹ Stop & Save</button>
                  <button onClick={resetTimer} aria-label="Reset timer" style={{ flex: 1, padding: "13px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "10px", color: "#ff4d6d", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>✕</button>
                </>
              )}
            </div>
          </div>

          {/* Today's Summary */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>📅 Today's Summary</h3>
            {(() => {
              const today = new Date().toISOString().split("T")[0]
              const todayLogs = logs.filter(l => l.date === today)
              const todayMins = todayLogs.reduce((s, l) => s + l.duration, 0)
              const todayEarnings = todayLogs.reduce((s, l) => s + (l.duration / 60) * (l.rate || 0), 0)
              return todayLogs.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text2)", textAlign: "center", padding: "16px 0" }}>No logs today yet</p>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#6c63ff" }}>{formatDuration(todayMins)}</div>
                      <div style={{ fontSize: "10px", color: "var(--text2)" }}>Time Logged</div>
                    </div>
                    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#00d97e" }}>₹{Math.round(todayEarnings).toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: "var(--text2)" }}>Earned</div>
                    </div>
                  </div>
                  {todayLogs.map(l => (
                    <div key={l._id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
                      <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{l.task}</span>
                      <span style={{ fontWeight: 700, color: "#6c63ff", flexShrink: 0 }}>{formatDuration(l.duration)}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Project Breakdown */}
          {logProjects.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>🚀 By Project</h3>
              {logProjects.map(proj => {
                const projLogs = logs.filter(l => l.project === proj)
                const mins = projLogs.reduce((s, l) => s + l.duration, 0)
                const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0
                return (
                  <div key={proj} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{proj}</span>
                      <span style={{ fontSize: "11px", color: "var(--text2)", flexShrink: 0 }}>{formatDuration(mins)} · {pct}%</span>
                    </div>
                    <div style={{ height: "5px", background: "var(--surface2)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#6c63ff,#ff6584)", borderRadius: "99px" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MANUAL ENTRY MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "500px" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>Manual Time Entry</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Log time worked manually</p></div>
              <button onClick={() => setShowModal(false)} aria-label="Close time log form" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Task *</label>
                <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} placeholder="What did you work on?" style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Project</label>
                  <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} style={inp}>
                    <option value="">No project</option>
                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Duration (mins) *</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 90" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Rate (₹/hr)</label>
                  <input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} style={inp} />
                </div>
              </div>
              {form.duration && form.rate && (
                <div style={{ padding: "12px 16px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text2)" }}>Earnings for this entry:</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#00d97e" }}>₹{Math.round((Number(form.duration) / 60) * Number(form.rate)).toLocaleString()}</span>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="What did you accomplish?" style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleAddManual} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>Add Time Log ⏱️</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}