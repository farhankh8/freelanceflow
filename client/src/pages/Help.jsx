import { useState } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import emailjs from "@emailjs/browser"

const FAQ_CATEGORIES = [
  {
    category: "Getting Started",
    icon: "🚀",
    color: "#6c63ff",
    questions: [
      { q: "How do I create my first invoice?", a: "Go to Invoices → Click '+ New Invoice' → Select a client → Add line items → Set due date → Create! You can then preview, download PDF, or share it directly." },
      { q: "How do I add clients?", a: "Navigate to Clients → Click '+ Add Client' → Fill in their details (name, email, phone, company) → Save. You can also edit or delete clients anytime." },
      { q: "How do I track time?", a: "Go to Time Logs → Click '+ Log Time' → Select project/client → Enter hours and description → Save. Your logged time appears in reports." },
      { q: "Can I use this on mobile?", a: "Yes! FreelanceFlow is fully responsive. Access all features from your phone or tablet browser. No app download needed." },
    ]
  },
  {
    category: "Billing & Payments",
    icon: "💳",
    color: "#00d97e",
    questions: [
      { q: "How do I get paid?", a: "Create an invoice → Share with your client (WhatsApp, Email, SMS) → Client pays you directly → Mark invoice as 'Paid' in the app. You can also record payments manually in the Payments section." },
      { q: "Does FreelanceFlow handle payments?", a: "FreelanceFlow creates professional invoices but doesn't process payments directly. Clients pay you via your preferred method (UPI, Bank Transfer, etc.) listed on the invoice." },
      { q: "How do I add my bank details?", a: "Go to Settings → Scroll to 'Payment Details' → Add your UPI ID, Bank Name, Account Number, and IFSC. These appear automatically on your invoices." },
      { q: "Can I customize invoice numbers?", a: "Yes! Invoice numbers are auto-generated (INV-001, INV-002, etc.). You can customize them by editing the invoice." },
    ]
  },
  {
    category: "Projects & Tasks",
    icon: "📋",
    color: "#ffb800",
    questions: [
      { q: "How do I manage projects?", a: "Go to Projects → Click '+ New Project' → Assign a client → Set budget and deadline → Track progress. Use the Kanban board to move tasks between Planning, In Progress, and Completed." },
      { q: "How does the Kanban board work?", a: "Drag and drop project cards between columns to update their status. Columns: Planning, In Progress, Completed, and Cancelled." },
      { q: "How do I create tasks?", a: "Go to Tasks → Click '+ New Task' → Add title, description, due date, and priority → Assign to a project or client. Tasks appear on your calendar too." },
      { q: "Can I set project deadlines?", a: "Yes! When creating a project, set a deadline date. The dashboard shows how many days are left or if the project is overdue." },
    ]
  },
  {
    category: "Account & Security",
    icon: "🔐",
    color: "#ff6584",
    questions: [
      { q: "Is my data secure?", a: "Absolutely! Your data is encrypted and stored securely. We use industry-standard security practices. Your information is never shared with third parties." },
      { q: "Can I change my password?", a: "Currently, password reset via email isn't implemented. Contact support if you need to reset your password." },
      { q: "What happens if I forget my password?", a: "Contact our support team at support@freelanceflow.app and we'll help you recover access to your account." },
      { q: "How do I delete my account?", a: "Go to Settings → Scroll to bottom → Click 'Delete Account'. Note: This permanently deletes all your data and cannot be undone." },
    ]
  },
  {
    category: "Reports & Analytics",
    icon: "📊",
    color: "#a78bfa",
    questions: [
      { q: "How do I see my revenue?", a: "The Dashboard shows your total revenue from completed payments. Navigate to Payments to see all payment records and filter by status." },
      { q: "Can I track expenses?", a: "Yes! Go to Expenses → Click '+ Add Expense' → Enter amount, category, description, and date. Track your business spending easily." },
      { q: "How do I generate reports?", a: "Go to Reports to see analytics on your revenue, expenses, client breakdown, and project status. All data is visualized in easy-to-read charts." },
      { q: "Can I see my profit/loss?", a: "Yes! The Dashboard P&L section shows your Total Revenue, Total Expenses, and Net Profit in real-time." },
    ]
  },
]

const QUICK_LINKS = [
  { icon: "📧", label: "Email Support", desc: "support@freelanceflow.app", color: "#6c63ff", href: "mailto:support@freelanceflow.app" },
  { icon: "💬", label: "WhatsApp", desc: "Chat with us", color: "#25D366", href: "https://wa.me/919876543210" },
  { icon: "📚", label: "Documentation", desc: "Full guides & tutorials", color: "#00d97e", href: "#" },
  { icon: "🎥", label: "Video Tutorials", desc: "Step-by-step videos", color: "#ff6584", href: "#" },
]

const STATUS_CHECKLIST = [
  { icon: "✅", label: "Account created", done: true },
  { icon: "✅", label: "Profile completed", done: true },
  { icon: "✅", label: "First client added", done: false },
  { icon: "✅", label: "First invoice sent", done: false },
  { icon: "✅", label: "Payment recorded", done: false },
]

export default function Help() {
  const { user } = useAuthStore()
  const [expanded, setExpanded] = useState({})
  const [activeCategory, setActiveCategory] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({ 
    name: user?.name || "", 
    email: user?.email || "", 
    subject: "", 
    message: "" 
  })
  const [sending, setSending] = useState(false)
  const [showContact, setShowContact] = useState(false)

  // Update form when user data loads
  useEffect(() => {
    if (user && !contactForm.name && !contactForm.email) {
      setContactForm({
        name: user.name || "",
        email: user.email || "",
        subject: "",
        message: ""
      })
    }
  }, [user])

  const toggleQuestion = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))

  const filteredFAQs = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0)

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all required fields")
      return
    }
    setSending(true)
    try {
      // Send email via EmailJS
      await emailjs.send(
        'service_ks4ao1o',  // Your EmailJS Service ID
        'template_s6gzrii',  // Your template ID from EmailJS
        {
          name: contactForm.name,
          email: contactForm.email,
          title: contactForm.subject || 'Support Request',
          message: contactForm.message
        },
        '7BuqXseESSYiJ0N80'  // Your EmailJS Public Key
      )
      
      // Also save to database
      await api.post('/support', contactForm)
      
      toast.success("Message sent! We'll get back to you within 24 hours 📧")
      setContactForm({ 
        name: user?.name || "", 
        email: user?.email || "", 
        subject: "", 
        message: "" 
      })
      setShowContact(false)
    } catch (err) {
      console.error("EmailJS error:", err)
      // Try without EmailJS if it fails
      try {
        await api.post('/support', contactForm)
        toast.success("Message saved! We'll get back to you within 24 hours 📧")
        setShowContact(false)
      } catch (err2) {
        toast.error("Failed to send message. Please try again.")
      }
    }
    setSending(false)
  }

  const inputStyle = { width: "100%", padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>Help & Support 💜</h1>
        <p style={{ color: "var(--text2)", fontSize: "15px" }}>We're here to help you succeed. Find answers or reach out to our team.</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "32px" }}>
        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for answers..." style={{ ...inputStyle, padding: "14px 16px 14px 48px", fontSize: "15px" }} />
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "40px" }}>
        {QUICK_LINKS.map(link => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = link.color; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: link.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{link.icon}</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{link.label}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)" }}>{link.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Getting Started Checklist */}
      <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.1),rgba(255,101,132,0.05))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "20px", padding: "28px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>🚀 Your FreelanceFlow Checklist</h3>
        <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "20px" }}>Complete these steps to get the most out of your account</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px" }}>
          {STATUS_CHECKLIST.map((item, idx) => (
            <div key={idx} style={{ textAlign: "center", padding: "16px 12px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px", opacity: item.done ? 1 : 0.3 }}>{item.icon}</div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: item.done ? "#00d97e" : "var(--text2)" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "32px" }}>
        {/* Category Sidebar */}
        <div>
          <div style={{ position: "sticky", top: "80px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Categories</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {FAQ_CATEGORIES.map((cat, idx) => (
                <button key={cat.category} onClick={() => { setActiveCategory(idx); setSearchQuery("") }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", border: "1px solid", cursor: "pointer", fontSize: "13px", fontWeight: 600, textAlign: "left", transition: "all 0.15s",
                    background: activeCategory === idx ? cat.color + "20" : "var(--surface)",
                    borderColor: activeCategory === idx ? cat.color + "60" : "var(--border)",
                    color: activeCategory === idx ? cat.color : "var(--text2)"
                  }}>
                  <span style={{ fontSize: "16px" }}>{cat.icon}</span>{cat.category}
                </button>
              ))}
            </div>

            {/* Contact Box */}
            <div style={{ marginTop: "24px", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>💬</div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Still need help?</h4>
              <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.5, marginBottom: "14px" }}>Can't find what you're looking for? Our team is ready to assist you.</p>
              <button onClick={() => setShowContact(true)} style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div>
          {searchQuery ? (
            filteredFAQs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No results found</h3>
                <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}>Try different keywords or browse categories</p>
                <button onClick={() => setSearchQuery("")} style={{ padding: "10px 20px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Clear Search</button>
              </div>
            ) : (
              filteredFAQs.map(cat => (
                <div key={cat.category} style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{cat.icon}</span>{cat.category}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {cat.questions.map((item, idx) => (
                      <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                        <button onClick={() => toggleQuestion(`${cat.category}-${idx}`)} style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{item.q}</span>
                          <span style={{ fontSize: "16px", color: "var(--text2)", transition: "transform 0.2s", transform: expanded[`${cat.category}-${idx}`] ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                        </button>
                        {expanded[`${cat.category}-${idx}`] && (
                          <div style={{ padding: "0 20px 16px", fontSize: "13px", color: "var(--text2)", lineHeight: 1.7, borderTop: "1px solid var(--border)" }}>
                            <p style={{ paddingTop: "14px" }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          ) : (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>{FAQ_CATEGORIES[activeCategory].icon}</span>
                {FAQ_CATEGORIES[activeCategory].category}
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text2)", background: "var(--surface2)", padding: "4px 10px", borderRadius: "99px" }}>
                  {FAQ_CATEGORIES[activeCategory].questions.length} questions
                </span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {FAQ_CATEGORIES[activeCategory].questions.map((item, idx) => (
                  <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = FAQ_CATEGORIES[activeCategory].color + "50"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <button onClick={() => toggleQuestion(`${activeCategory}-${idx}`)} style={{ width: "100%", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", flex: 1, paddingRight: "16px" }}>{item.q}</span>
                      <span style={{ fontSize: "14px", color: FAQ_CATEGORIES[activeCategory].color, transition: "transform 0.2s", transform: expanded[`${activeCategory}-${idx}`] ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>▼</span>
                    </button>
                    {expanded[`${activeCategory}-${idx}`] && (
                      <div style={{ padding: "0 20px 20px", fontSize: "13px", color: "var(--text2)", lineHeight: 1.8, borderTop: "1px solid var(--border)" }}>
                        <p style={{ paddingTop: "16px" }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "520px" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>💬 Contact Support</h2>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>We'll respond within 24 hours</p>
              </div>
              <button onClick={() => setShowContact(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <form onSubmit={handleContactSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Name *</label>
                  <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email *</label>
                  <input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject</label>
                <input value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Message *</label>
                <textarea value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} rows={4} placeholder="Describe your issue or question..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button type="button" onClick={() => setShowContact(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={sending} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: sending ? "not-allowed" : "pointer", fontWeight: 700, opacity: sending ? 0.7 : 1 }}>
                  {sending ? "Sending..." : "Send Message 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
