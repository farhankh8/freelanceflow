import { useState, useEffect } from "react"
import toast from "react-hot-toast"

const TAGS = ["Client", "Vendor", "Partner", "Freelancer", "Friend", "Investor", "Mentor", "Other"]
const SOURCES = ["Website", "Referral", "LinkedIn", "Instagram", "Cold Email", "WhatsApp", "Upwork", "Event", "Other"]
const COLORS = ["#6c63ff", "#ff6584", "#00d97e", "#ffb800", "#2CA5E0", "#ff4d6d", "#a78bfa", "#00c9a7"]

const TAG_COLORS = {
  Client:     { bg: "rgba(108,99,255,0.15)", color: "#6c63ff", border: "rgba(108,99,255,0.3)" },
  Vendor:     { bg: "rgba(255,184,0,0.15)",  color: "#ffb800", border: "rgba(255,184,0,0.3)"  },
  Partner:    { bg: "rgba(0,217,126,0.15)",  color: "#00d97e", border: "rgba(0,217,126,0.3)"  },
  Freelancer: { bg: "rgba(44,165,224,0.15)", color: "#2CA5E0", border: "rgba(44,165,224,0.3)" },
  Friend:     { bg: "rgba(255,101,132,0.15)",color: "#ff6584", border: "rgba(255,101,132,0.3)"},
  Investor:   { bg: "rgba(255,77,109,0.15)", color: "#ff4d6d", border: "rgba(255,77,109,0.3)" },
  Mentor:     { bg: "rgba(255,184,0,0.15)",  color: "#ffb800", border: "rgba(255,184,0,0.3)"  },
  Other:      { bg: "rgba(108,99,255,0.15)", color: "#6c63ff", border: "rgba(108,99,255,0.3)" },
}

const LS_KEY = "freelanceflow_contacts"
const EMPTY_FORM = { name: "", company: "", email: "", phone: "", tag: "Client", source: "Website", city: "", notes: "" }

const OLD_SAMPLE_IDS = new Set(["c1","c2","c3","c4","c5","c6","c7","c8"])

function loadContacts() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(c => !OLD_SAMPLE_IDS.has(c._id))
    }
  } catch (_) {}
  return null
}

function saveContacts(contacts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(contacts)) } catch (_) {}
}

export default function Contacts() {
  const [contacts, setContacts] = useState(() => loadContacts() ?? [])
  const [view, setView] = useState("grid")
  const [modal, setModal] = useState(null) // null | "create" | "edit" | "detail"
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [filterTag, setFilterTag] = useState("all")
  const [showStarred, setShowStarred] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})

  // Persist every time contacts change
  useEffect(() => { saveContacts(contacts) }, [contacts])

  const updateContacts = (fn) => {
    setContacts(prev => {
      const next = fn(prev)
      saveContacts(next)
      return next
    })
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email"
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModal("create")
  }

  const openEdit = (c, e) => {
    e?.stopPropagation()
    setForm({ name: c.name, company: c.company || "", email: c.email || "", phone: c.phone || "", tag: c.tag, source: c.source || "Website", city: c.city || "", notes: c.notes || "" })
    setFormErrors({})
    setSelected(c)
    setModal("edit")
  }

  const handleCreate = () => {
    if (!validateForm()) return
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const newContact = {
      _id: "local_" + Date.now(),
      ...form,
      name: form.name.trim(),
      avatar: form.name.trim()[0].toUpperCase(),
      color,
      starred: false,
      createdAt: new Date().toISOString().split("T")[0],
    }
    updateContacts(prev => [newContact, ...prev])
    toast.success("Contact added! 📇")
    setModal(null)
  }

  const handleEdit = () => {
    if (!validateForm()) return
    updateContacts(prev => prev.map(c =>
      c._id === selected._id
        ? { ...c, ...form, name: form.name.trim(), avatar: form.name.trim()[0].toUpperCase() }
        : c
    ))
    // Also update selected so detail modal reflects changes
    setSelected(s => ({ ...s, ...form, name: form.name.trim(), avatar: form.name.trim()[0].toUpperCase() }))
    toast.success("Contact updated! ✏️")
    setModal("detail")
  }

  const toggleStar = (id, e) => {
    e?.stopPropagation()
    updateContacts(prev => prev.map(c => c._id === id ? { ...c, starred: !c.starred } : c))
    setSelected(s => s?._id === id ? { ...s, starred: !s.starred } : s)
  }

  const deleteContact = (id, e) => {
    e?.stopPropagation()
    if (!window.confirm("Delete this contact? This cannot be undone.")) return
    updateContacts(prev => prev.filter(c => c._id !== id))
    setModal(null)
    setSelected(null)
    toast.success("Contact deleted")
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    const matchTag = filterTag === "all" || c.tag === filterTag
    const matchStar = !showStarred || c.starred
    return matchSearch && matchTag && matchStar
  })

  const starredCount = contacts.filter(c => c.starred).length
  const tagCounts = TAGS.reduce((acc, t) => ({ ...acc, [t]: contacts.filter(c => c.tag === t).length }), {})

  const inp = (key) => ({
    width: "100%", padding: "10px 14px",
    background: formErrors[key] ? "rgba(255,77,109,0.05)" : "var(--surface2)",
    border: "1px solid " + (formErrors[key] ? "#ff4d6d" : "var(--border)"),
    borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box",
  })

  const FormField = ({ label, fkey, type = "text", placeholder, required }) => (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}{required && <span style={{ color: "#ff4d6d", marginLeft: "3px" }}>*</span>}
      </label>
      <input type={type} value={form[fkey]} onChange={e => { setForm(p => ({ ...p, [fkey]: e.target.value })); setFormErrors(p => ({ ...p, [fkey]: "" })) }} placeholder={placeholder} style={inp(fkey)} />
      {formErrors[fkey] && <div style={{ fontSize: "11px", color: "#ff4d6d", marginTop: "4px" }}>{formErrors[fkey]}</div>}
    </div>
  )

  const ContactForm = ({ onSubmit, submitLabel }) => (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <FormField label="Full Name" fkey="name" placeholder="John Doe" required />
        <FormField label="Company" fkey="company" placeholder="Company name" />
        <FormField label="Email" fkey="email" type="email" placeholder="email@example.com" />
        <FormField label="Phone" fkey="phone" placeholder="9876543210" />
        <FormField label="City" fkey="city" placeholder="Bangalore" />
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tag</label>
          <select value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} style={inp("tag")}>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Source</label>
          <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={inp("source")}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Any notes about this contact..." style={{ ...inp("notes"), resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button onClick={() => setModal(selected ? "detail" : null)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
        <button onClick={onSubmit} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>{submitLabel}</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: "1300px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Contacts</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{contacts.length} total · {starredCount} starred</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            {[{ id: "grid", label: "⊞ Grid" }, { id: "list", label: "📋 List" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "8px 14px", border: "none", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>{v.label}</button>
            ))}
          </div>
          <button onClick={openCreate} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add Contact</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Contacts", value: contacts.length, icon: "📇", color: "#6c63ff" },
          { label: "Clients",        value: tagCounts["Client"] || 0, icon: "👥", color: "#00d97e" },
          { label: "Partners",       value: tagCounts["Partner"] || 0, icon: "🤝", color: "#ffb800" },
          { label: "Starred",        value: starredCount, icon: "⭐", color: "#ff6584" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, email..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterTag("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterTag === "all" ? "var(--accent)" : "var(--surface)", color: filterTag === "all" ? "#fff" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
          {TAGS.filter(t => tagCounts[t] > 0).map(t => (
            <button key={t} onClick={() => setFilterTag(t === filterTag ? "all" : t)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterTag === t ? TAG_COLORS[t]?.bg : "var(--surface)", color: filterTag === t ? TAG_COLORS[t]?.color : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
              {t} ({tagCounts[t]})
            </button>
          ))}
        </div>
        <button onClick={() => setShowStarred(s => !s)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (showStarred ? "rgba(255,184,0,0.4)" : "var(--border)"), background: showStarred ? "rgba(255,184,0,0.15)" : "var(--surface)", color: showStarred ? "#ffb800" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>⭐ Starred</button>
      </div>

      {/* Empty state */}
      {contacts.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📇</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No contacts yet</p>
          <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}>Add your first contact to get started</p>
          <button onClick={openCreate} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add First Contact</button>
        </div>
      )}

      {/* GRID VIEW */}
      {view === "grid" && contacts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {filtered.map(c => {
            const tc = TAG_COLORS[c.tag] || TAG_COLORS.Other
            return (
              <div key={c._id}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.color + "80"; e.currentTarget.style.transform = "translateY(-3px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}
                onClick={() => { setSelected(c); setModal("detail") }}>

                {/* Star */}
                <button onClick={e => toggleStar(c._id, e)}
                  style={{ position: "absolute", top: "12px", right: "44px", background: "transparent", border: "none", cursor: "pointer", fontSize: "15px", opacity: c.starred ? 1 : 0.25, transition: "opacity 0.15s" }}>⭐</button>

                {/* Edit */}
                <button onClick={e => openEdit(c, e)}
                  style={{ position: "absolute", top: "12px", right: "12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "3px 7px", color: "var(--text2)", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#6c63ff"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>✏️</button>

                {/* Avatar */}
                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "linear-gradient(135deg," + c.color + "," + c.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "14px" }}>
                  {c.avatar}
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "3px", paddingRight: "50px" }}>{c.name}</h3>
                {c.company && <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "10px" }}>🏢 {c.company}</p>}
                <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "99px", background: tc.bg, color: tc.color, border: "1px solid " + tc.border, fontWeight: 700 }}>{c.tag}</span>

                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {c.email && <div style={{ fontSize: "11px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📧 {c.email}</div>}
                  {c.phone && <div style={{ fontSize: "11px", color: "var(--text2)" }}>📱 {c.phone}</div>}
                  {c.city && <div style={{ fontSize: "11px", color: "var(--text2)" }}>📍 {c.city}</div>}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && contacts.length > 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔍</div>
              <p style={{ fontWeight: 600 }}>No contacts match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && contacts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 0.8fr 0.8fr 120px", gap: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Name</span><span>Email</span><span>Phone</span><span>Tag</span><span>City</span><span>Actions</span>
          </div>
          {filtered.map(c => {
            const tc = TAG_COLORS[c.tag] || TAG_COLORS.Other
            return (
              <div key={c._id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 0.8fr 0.8fr 120px", gap: "12px", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", alignItems: "center", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => { setSelected(c); setModal("detail") }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg," + c.color + "," + c.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text2)" }}>{c.company || "—"}</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email || "—"}</div>
                <div style={{ fontSize: "13px" }}>{c.phone || "—"}</div>
                <div><span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "99px", background: tc.bg, color: tc.color, border: "1px solid " + tc.border, fontWeight: 700 }}>{c.tag}</span></div>
                <div style={{ fontSize: "12px", color: "var(--text2)" }}>{c.city || "—"}</div>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button onClick={e => toggleStar(c._id, e)} title="Star" style={{ padding: "5px 7px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", opacity: c.starred ? 1 : 0.35 }}>⭐</button>
                  <button onClick={e => openEdit(c, e)} title="Edit" style={{ padding: "5px 7px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>✏️</button>
                  <button onClick={e => deleteContact(c._id, e)} title="Delete" style={{ padding: "5px 7px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && contacts.length > 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>No contacts match your filters</div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {modal === "create" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>Add Contact</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Build your network</p></div>
              <button onClick={() => setModal(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <ContactForm onSubmit={handleCreate} submitLabel="Add Contact 📇" />
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modal === "edit" && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Edit Contact</h2>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Editing — {selected.name}</p>
              </div>
              <button onClick={() => setModal("detail")} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <ContactForm onSubmit={handleEdit} submitLabel="Save Changes ✏️" />
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modal === "detail" && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Gradient header */}
            <div style={{ background: "linear-gradient(135deg," + selected.color + "22," + selected.color + "11)", padding: "28px", borderRadius: "20px 20px 0 0", borderBottom: "1px solid var(--border)", textAlign: "center", position: "relative" }}>
              <button onClick={() => setModal(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
              <button onClick={e => toggleStar(selected._id, e)}
                style={{ position: "absolute", top: "16px", left: "16px", background: "transparent", border: "none", cursor: "pointer", fontSize: "20px", opacity: selected.starred ? 1 : 0.3 }}>⭐</button>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg," + selected.color + "," + selected.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 auto 12px" }}>{selected.avatar}</div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>{selected.name}</h2>
              {selected.company && <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "10px" }}>{selected.company}</p>}
              <span style={{ fontSize: "11px", padding: "3px 12px", borderRadius: "99px", background: TAG_COLORS[selected.tag]?.bg, color: TAG_COLORS[selected.tag]?.color, border: "1px solid " + TAG_COLORS[selected.tag]?.border, fontWeight: 700 }}>{selected.tag}</span>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                <a href={"mailto:" + selected.email} style={{ padding: "12px 8px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "10px", color: "#6c63ff", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📧 Email</a>
                <a href={"tel:" + selected.phone} style={{ padding: "12px 8px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "10px", color: "#00d97e", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📱 Call</a>
                <a href={"https://wa.me/91" + selected.phone} target="_blank" rel="noreferrer" style={{ padding: "12px 8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", color: "#25D366", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>💬 WhatsApp</a>
              </div>

              {/* Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Email",   value: selected.email || "—",   icon: "📧" },
                  { label: "Phone",   value: selected.phone || "—",   icon: "📱" },
                  { label: "City",    value: selected.city || "—",    icon: "📍" },
                  { label: "Source",  value: selected.source || "—",  icon: "🔗" },
                  { label: "Added",   value: selected.createdAt,       icon: "📅" },
                  { label: "Tag",     value: selected.tag,             icon: "🏷️" },
                ].map(item => (
                  <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.icon} {item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>📝 Notes</div>
                  <p style={{ fontSize: "13px", lineHeight: "1.6" }}>{selected.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => openEdit(selected)} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700 }}>✏️ Edit</button>
                <button onClick={() => deleteContact(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}