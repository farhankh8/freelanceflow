import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const CATEGORIES = {
  software: { label: "Software & Tools", icon: "💻", color: "#6c63ff" },
  hardware: { label: "Hardware", icon: "🖥️", color: "#2CA5E0" },
  travel: { label: "Travel", icon: "✈️", color: "#ffb800" },
  food: { label: "Food & Dining", icon: "🍽️", color: "#ff6584" },
  marketing: { label: "Marketing", icon: "📣", color: "#00d97e" },
  education: { label: "Education", icon: "📚", color: "#a78bfa" },
  office: { label: "Office & Supplies", icon: "🗂️", color: "#ff4d6d" },
  subscription: { label: "Subscriptions", icon: "🔄", color: "#ffb800" },
  other: { label: "Other", icon: "📦", color: "#a8aec0" },
}

const PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Cash", "Cheque"]

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [form, setForm] = useState({ title: "", category: "software", amount: "", date: new Date().toISOString().split("T")[0], paymentMethod: "UPI", notes: "" })

  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get("/expenses")
      setExpenses(data.data || [])
    } catch { toast.error("Failed to load") }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.title || !form.amount) { toast.error("Title and amount required"); return }
    try {
      const { data } = await api.post("/expenses", { ...form, amount: Number(form.amount) })
      setExpenses(prev => [data.data, ...prev])
      toast.success("Expense added! 💸")
      setShowModal(false)
      setForm({ title: "", category: "software", amount: "", date: new Date().toISOString().split("T")[0], paymentMethod: "UPI", notes: "" })
    } catch { toast.error("Failed to add expense") }
  }

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses(prev => prev.filter(e => e._id !== id))
      setSelected(null)
      toast.success("Deleted")
    } catch { toast.error("Failed to delete") }
  }

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === "all" || e.category === filterCat
    return matchSearch && matchCat
  })

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const thisMonth = new Date().toISOString().substring(0, 7)
  const thisMonthExpenses = expenses.filter(e => e.date?.substring(0, 7) === thisMonth || new Date(e.date).toISOString().substring(0, 7) === thisMonth).reduce((s, e) => s + (e.amount || 0), 0)

  const catTotals = Object.entries(CATEGORIES).map(([k, v]) => ({
    ...v, key: k,
    total: expenses.filter(e => e.category === k).reduce((s, e) => s + (e.amount || 0), 0),
    count: expenses.filter(e => e.category === k).length
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total)

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Expenses</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{expenses.length} total expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Add Expense</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Expenses", value: "₹" + totalExpenses.toLocaleString(), icon: "💸", color: "#ff4d6d" },
          { label: "This Month", value: "₹" + thisMonthExpenses.toLocaleString(), icon: "📅", color: "#ffb800" },
          { label: "Categories", value: Object.keys(CATEGORIES).length, icon: "📊", color: "#6c63ff" },
          { label: "Total Entries", value: expenses.length, icon: "🧾", color: "#00d97e" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
            <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 300px)", gap: "20px", alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." style={{ ...inp, padding: "9px 12px 9px 36px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button onClick={() => setFilterCat("all")} style={{ padding: "5px 12px", borderRadius: "99px", border: "1px solid var(--border)", background: filterCat === "all" ? "var(--accent)" : "transparent", color: filterCat === "all" ? "#fff" : "var(--text2)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>All</button>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <button key={k} onClick={() => setFilterCat(k)} style={{ padding: "5px 12px", borderRadius: "99px", border: "1px solid " + (filterCat === k ? v.color : "var(--border)"), background: filterCat === k ? v.color + "20" : "transparent", color: filterCat === k ? v.color : "var(--text2)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          {loading ? <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)" }}>Loading...</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(e => {
                const cat = CATEGORIES[e.category] || CATEGORIES.other
                return (
                  <div key={e._id} onClick={() => setSelected(e)}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e2 => { e2.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; e2.currentTarget.style.transform = "translateX(3px)" }}
                    onMouseLeave={e2 => { e2.currentTarget.style.borderColor = "var(--border)"; e2.currentTarget.style.transform = "translateX(0)" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cat.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>{e.title}</div>
                      <div style={{ fontSize: "11px", color: "var(--text2)", display: "flex", gap: "8px" }}>
                        <span style={{ color: cat.color }}>{cat.label}</span>
                        <span>·</span><span>{e.paymentMethod}</span>
                        <span>·</span><span>{new Date(e.date).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#ff4d6d", flexShrink: 0 }}>- ₹{(e.amount || 0).toLocaleString()}</div>
                  </div>
                )
              })}
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}><div style={{ fontSize: "40px", marginBottom: "12px" }}>💸</div><p>No expenses yet</p></div>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>📊 By Category</h3>
            {catTotals.length === 0 ? <p style={{ fontSize: "13px", color: "var(--text2)", textAlign: "center" }}>No data yet</p> : catTotals.map(cat => {
              const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0
              return (
                <div key={cat.key} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 800 }}>₹{cat.total.toLocaleString()}</span>
                  </div>
                  <div style={{ height: "5px", background: "var(--surface2)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: cat.color, borderRadius: "99px" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Add Expense</h2>
              <button onClick={() => setShowModal(false)} aria-label="Close expense form" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Figma Pro" style={inp} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Payment Method</label><select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} style={inp}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              </div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreate} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "15px" }}>Add Expense 💸</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "440px" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: CATEGORIES[selected.category]?.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{CATEGORIES[selected.category]?.icon}</div>
                <div><h2 style={{ fontSize: "18px", fontWeight: 800 }}>{selected.title}</h2><p style={{ fontSize: "12px", color: "var(--text2)" }}>{CATEGORIES[selected.category]?.label}</p></div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close expense details" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ textAlign: "center", padding: "20px", background: "rgba(255,77,109,0.08)", borderRadius: "12px" }}>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#ff4d6d" }}>- ₹{(selected.amount || 0).toLocaleString()}</div>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginTop: "4px" }}>{new Date(selected.date).toLocaleDateString("en-IN")}</div>
              </div>
              {selected.notes && <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "14px" }}><p style={{ fontSize: "13px" }}>{selected.notes}</p></div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteExpense(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }} aria-label="Delete expense">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}