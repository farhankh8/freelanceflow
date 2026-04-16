import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import api from "../lib/api"
import toast from "react-hot-toast"

const TAGS = ["Client", "Vendor", "Partner", "Freelancer", "Friend", "Investor", "Mentor", "Other"]
const SOURCES = ["Website", "Referral", "LinkedIn", "Instagram", "Cold Email", "WhatsApp", "Upwork", "Event", "Other"]

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

const COLORS = ["#6c63ff", "#ff6584", "#00d97e", "#ffb800", "#2CA5E0", "#ff4d6d", "#a78bfa", "#00c9a7"]

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", tag: "Client", source: "Website", city: "", notes: "" }

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--surface2, #1a1a24)",
  border: "1px solid var(--border, rgba(255,255,255,0.1))",
  borderRadius: "8px", color: "var(--text, #fafafa)", fontSize: "13px",
}

function Modal({ children, onClose }) {
  return createPortal(
    <div 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}
    >
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}

function ContactFormModal({ mode, contact, onSubmit, onCancel }) {
  const [form, setForm] = useState(mode === "edit" && contact ? {
    name: contact.name, company: contact.company || "", email: contact.email || "",
    phone: contact.phone || "", tag: contact.tag, source: contact.source || "Website",
    city: contact.city || "", notes: contact.notes || ""
  } : EMPTY_FORM)

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email")
      return
    }
    onSubmit(form)
  }

  const setField = useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }, [])

  return (
    <div>
      <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{mode === "edit" ? "Edit Contact" : "Add Contact"}</h2>
          <p style={{ fontSize: "13px", color: "var(--text2, #a1a1aa)", marginTop: "2px" }}>
            {mode === "edit" ? `Editing — ${contact?.name}` : "Build your network"}
          </p>
        </div>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "22px" }}>×</button>
      </div>
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Full Name *</label>
            <input type="text" value={form.name} onChange={e => setField("name", e.target.value)} placeholder="John Doe" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Company</label>
            <input type="text" value={form.company} onChange={e => setField("company", e.target.value)} placeholder="Company name" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Email</label>
            <input type="email" value={form.email} onChange={e => setField("email", e.target.value)} placeholder="email@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Phone</label>
            <input type="text" value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="9876543210" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>City</label>
            <input type="text" value={form.city} onChange={e => setField("city", e.target.value)} placeholder="Bangalore" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Tag</label>
            <select value={form.tag} onChange={e => setField("tag", e.target.value)} style={inputStyle}>
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Source</label>
            <select value={form.source} onChange={e => setField("source", e.target.value)} style={inputStyle}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Notes</label>
          <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3} placeholder="Any notes..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>
            {mode === "edit" ? "Save Changes ✏️" : "Add Contact 📇"}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ contact, onEdit, onClose, onDelete, onToggleStar }) {
  const tc = TAG_COLORS[contact.tag] || TAG_COLORS.Other
  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg," + contact.color + "22," + contact.color + "11)", padding: "28px", borderRadius: "20px 20px 0 0", borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))", textAlign: "center", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "22px" }}>×</button>
          <button onClick={() => onToggleStar(contact._id)} style={{ position: "absolute", top: "16px", left: "16px", background: "transparent", border: "none", cursor: "pointer", fontSize: "20px", opacity: contact.starred ? 1 : 0.3 }}>⭐</button>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg," + contact.color + "," + contact.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 auto 12px" }}>{contact.avatar}</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>{contact.name}</h2>
          {contact.company && <p style={{ fontSize: "13px", color: "var(--text2, #a1a1aa)", marginBottom: "10px" }}>{contact.company}</p>}
          <span style={{ fontSize: "11px", padding: "3px 12px", borderRadius: "99px", background: tc.bg, color: tc.color, border: "1px solid " + tc.border, fontWeight: 700 }}>{contact.tag}</span>
        </div>
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
            <a href={"mailto:" + contact.email} style={{ padding: "12px 8px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "10px", color: "#6c63ff", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📧 Email</a>
            <a href={"tel:" + contact.phone} style={{ padding: "12px 8px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "10px", color: "#00d97e", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>📱 Call</a>
            <a href={"https://wa.me/91" + contact.phone} target="_blank" rel="noreferrer" style={{ padding: "12px 8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", color: "#25D366", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "12px" }}>💬 WhatsApp</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[{ label: "Email", value: contact.email || "—", icon: "📧" }, { label: "Phone", value: contact.phone || "—", icon: "📱" }, { label: "City", value: contact.city || "—", icon: "📍" }, { label: "Source", value: contact.source || "—", icon: "🔗" }].map(item => (
              <div key={item.label} style={{ background: "var(--surface2, #1a1a24)", borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text2, #a1a1aa)", marginBottom: "4px" }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {contact.notes && <div style={{ background: "var(--surface2, #1a1a24)", borderRadius: "10px", padding: "14px" }}><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>📝 Notes</div><p style={{ fontSize: "13px" }}>{contact.notes}</p></div>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Close</button>
            <button onClick={onEdit} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700 }}>✏️ Edit</button>
            <button onClick={() => onDelete(contact._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [view, setView] = useState("grid")
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [filterTag, setFilterTag] = useState("all")
  const [showStarred, setShowStarred] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState(null)

  useEffect(() => {
    api.get("/contacts").then(({ data }) => setContacts(data.data || [])).catch(() => {})
  }, [])

  const handleCreate = async (formData) => {
    try {
      const { data } = await api.post("/contacts", formData)
      setContacts(prev => [data.data, ...prev])
      toast.success("Contact added! 📇")
      setShowForm(false)
    } catch (e) {
      toast.error("Failed to add contact")
    }
  }

  const handleEdit = async (formData) => {
    if (!selected) return
    try {
      const { data } = await api.put(`/contacts/${selected._id}`, formData)
      setContacts(prev => prev.map(c => c._id === selected._id ? data.data : c))
      setSelected(data.data)
      toast.success("Contact updated! ✏️")
      setShowForm(false)
      setEditContact(null)
    } catch (e) {
      toast.error("Failed to update contact")
    }
  }

  const toggleStar = async (id) => {
    const contact = contacts.find(c => c._id === id)
    if (!contact) return
    try {
      const { data } = await api.put(`/contacts/${id}`, { starred: !contact.starred })
      setContacts(prev => prev.map(c => c._id === id ? data.data : c))
      setSelected(s => s?._id === id ? data.data : s)
    } catch (e) {
      toast.error("Failed to update")
    }
  }

  const deleteContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return
    try {
      await api.delete(`/contacts/${id}`)
      setContacts(prev => prev.filter(c => c._id !== id))
      setSelected(null)
      toast.success("Contact deleted")
    } catch (e) {
      toast.error("Failed to delete")
    }
  }

  const filtered = useMemo(() => contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    const matchTag = filterTag === "all" || c.tag === filterTag
    const matchStar = !showStarred || c.starred
    return matchSearch && matchTag && matchStar
  }), [contacts, search, filterTag, showStarred])

  const starredCount = useMemo(() => contacts.filter(c => c.starred).length, [contacts])
  const tagCounts = useMemo(() => TAGS.reduce((acc, t) => ({ ...acc, [t]: contacts.filter(c => c.tag === t).length }), {}), [contacts])

  return (
    <div style={{ maxWidth: "1300px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>Contacts</h1>
          <p style={{ color: "var(--text2, #a1a1aa)", fontSize: "14px" }}>{contacts.length} total · {starredCount} starred</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={() => setView("grid")} style={{ padding: "8px 14px", border: "none", background: view === "grid" ? "#6c63ff" : "transparent", color: view === "grid" ? "#fff" : "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Grid</button>
            <button onClick={() => setView("list")} style={{ padding: "8px 14px", border: "none", background: view === "list" ? "#6c63ff" : "transparent", color: view === "list" ? "#fff" : "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>List</button>
          </div>
          <button onClick={() => { setEditContact(null); setShowForm(true) }} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add Contact</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[{ label: "Total Contacts", value: contacts.length, icon: "📇", color: "#6c63ff" }, { label: "Clients", value: tagCounts["Client"] || 0, icon: "👥", color: "#00d97e" }, { label: "Partners", value: tagCounts["Partner"] || 0, icon: "🤝", color: "#ffb800" }, { label: "Starred", value: starredCount, icon: "⭐", color: "#ff6584" }].map(s => (
          <div key={s.label} style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div><div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, maxWidth: "300px" }} />
        <button onClick={() => setFilterTag("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border, rgba(255,255,255,0.1))", background: filterTag === "all" ? "#6c63ff" : "transparent", color: filterTag === "all" ? "#fff" : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
        {TAGS.filter(t => tagCounts[t] > 0).map(t => (
          <button key={t} onClick={() => setFilterTag(filterTag === t ? "all" : t)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterTag === t ? TAG_COLORS[t]?.color : "var(--border, rgba(255,255,255,0.1))"), background: filterTag === t ? TAG_COLORS[t]?.bg : "transparent", color: filterTag === t ? TAG_COLORS[t]?.color : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{t} ({tagCounts[t]})</button>
        ))}
        <button onClick={() => setShowStarred(s => !s)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (showStarred ? "#ffb800" : "var(--border, rgba(255,255,255,0.1))"), background: showStarred ? "rgba(255,184,0,0.15)" : "transparent", color: showStarred ? "#ffb800" : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>⭐ Starred</button>
      </div>

      {contacts.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface, #111118)", border: "2px dashed var(--border, rgba(255,255,255,0.1))", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📇</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No contacts yet</p>
          <button onClick={() => setShowForm(true)} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add First Contact</button>
        </div>
      )}

      {view === "grid" && contacts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {filtered.map(c => {
            const tc = TAG_COLORS[c.tag] || TAG_COLORS.Other
            return (
              <div key={c._id} onClick={() => setSelected(c)} style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "16px", padding: "20px", cursor: "pointer" }}>
                <button onClick={(e) => { e.stopPropagation(); toggleStar(c._id) }} style={{ position: "absolute", top: "12px", right: "44px", background: "transparent", border: "none", cursor: "pointer", fontSize: "15px", opacity: c.starred ? 1 : 0.25 }}>⭐</button>
                <button onClick={(e) => { e.stopPropagation(); setEditContact(c); setShowForm(true) }} style={{ position: "absolute", top: "12px", right: "12px", background: "var(--surface2, #1a1a24)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "3px 7px", color: "var(--text2, #a1a1aa)" }}>✏️</button>
                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "linear-gradient(135deg," + c.color + "," + c.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "14px" }}>{c.avatar}</div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "3px", paddingRight: "50px" }}>{c.name}</h3>
                {c.company && <p style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)", marginBottom: "10px" }}>🏢 {c.company}</p>}
                <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "99px", background: tc.bg, color: tc.color, border: "1px solid " + tc.border, fontWeight: 700 }}>{c.tag}</span>
              </div>
            )
          })}
        </div>
      )}

      {view === "list" && contacts.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "750px" }}>
            {filtered.map(c => {
              const tc = TAG_COLORS[c.tag] || TAG_COLORS.Other
              return (
                <div key={c._id} onClick={() => setSelected(c)} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 0.8fr 0.8fr 120px", gap: "12px", padding: "14px 16px", background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "12px", alignItems: "center", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg," + c.color + "," + c.color + "88)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>{c.avatar}</div>
                  <div><div style={{ fontWeight: 700, fontSize: "14px" }}>{c.name}</div><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{c.company || "—"}</div></div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)" }}>{c.email || "—"}</div>
                <div style={{ fontSize: "13px" }}>{c.phone || "—"}</div>
                <div><span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "99px", background: tc.bg, color: tc.color, border: "1px solid " + tc.border, fontWeight: 700 }}>{c.tag}</span></div>
                <div style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)" }}>{c.city || "—"}</div>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleStar(c._id) }} style={{ padding: "5px 7px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "6px", cursor: "pointer", fontSize: "12px", opacity: c.starred ? 1 : 0.35 }}>⭐</button>
                  <button onClick={(e) => { e.stopPropagation(); setEditContact(c); setShowForm(true) }} style={{ padding: "5px 7px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteContact(c._id) }} style={{ padding: "5px 7px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {showForm && <ContactFormModal mode={editContact ? "edit" : "create"} contact={editContact} onSubmit={editContact ? handleEdit : handleCreate} onCancel={() => { setShowForm(false); setEditContact(null) }} />}
      {selected && !showForm && <DetailModal contact={selected} onEdit={() => { setEditContact(selected); setShowForm(true) }} onClose={() => setSelected(null)} onDelete={deleteContact} onToggleStar={toggleStar} />}
    </div>
  )
}
