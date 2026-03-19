import { useState } from "react"

const SHARE_OPTIONS = [
  { icon: "📧", label: "Email", color: "#6c63ff", action: (inv) => window.open(`mailto:${inv.client?.email || ""}?subject=Invoice ${inv.invoiceNumber} from FreelanceFlow&body=Hi ${inv.client?.name || ""},\n\nPlease find your invoice ${inv.invoiceNumber} for Rs.${inv.total}.\n\nDue Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "N/A"}\n\nThank you!`) },
  { icon: "💬", label: "WhatsApp", color: "#25D366", action: (inv) => window.open(`https://wa.me/?text=Hi ${inv.client?.name || ""}! Your invoice ${inv.invoiceNumber} is ready. Amount: Rs.${inv.total}. Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "N/A"}. Thank you! - FreelanceFlow`) },
  { icon: "📱", label: "SMS", color: "#ff6584", action: (inv) => window.open(`sms:?body=Hi ${inv.client?.name || ""}! Invoice ${inv.invoiceNumber} - Rs.${inv.total} due ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "N/A"}. FreelanceFlow`) },
  { icon: "🔗", label: "Copy Link", color: "#ffb800", action: (inv, setCopied) => { navigator.clipboard.writeText(`Invoice: ${inv.invoiceNumber} | Client: ${inv.client?.name} | Amount: Rs.${inv.total} | Status: ${inv.status}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } },
  { icon: "📋", label: "Copy Details", color: "#00d97e", action: (inv, setCopied) => { const text = `INVOICE: ${inv.invoiceNumber}\nClient: ${inv.client?.name}\nCompany: ${inv.client?.company || "N/A"}\nAmount: Rs.${inv.total}\nDue Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "N/A"}\nStatus: ${inv.status?.toUpperCase()}\n\nItems:\n${inv.items?.map(i => `- ${i.description}: ${i.hours}hrs x Rs.${i.rate} = Rs.${i.amount}`).join("\n")}\n\nSubtotal: Rs.${inv.subtotal}\nGST: Rs.${inv.taxAmount}\nTotal: Rs.${inv.total}`; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } },
  { icon: "🐦", label: "Twitter/X", color: "#1DA1F2", action: (inv) => window.open(`https://twitter.com/intent/tweet?text=Just sent invoice ${inv.invoiceNumber} for Rs.${inv.total} via FreelanceFlow! 💼`) },
  { icon: "💼", label: "LinkedIn", color: "#0077B5", action: (inv) => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://freelanceflow.app`) },
  { icon: "📲", label: "Telegram", color: "#2CA5E0", action: (inv) => window.open(`https://t.me/share/url?url=https://freelanceflow.app&text=Invoice ${inv.invoiceNumber} - Rs.${inv.total} for ${inv.client?.name}`) },
]

export default function ShareInvoice({ invoice, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!invoice) return null

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "480px", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,rgba(108,99,255,0.15),rgba(255,101,132,0.15))" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>Share Invoice</h2>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>{invoice.invoiceNumber} · Rs.{invoice.total?.toLocaleString()}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>

        {/* Invoice Summary */}
        <div style={{ margin: "16px 24px", padding: "14px 16px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{invoice.client?.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "2px" }}>{invoice.client?.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--success)" }}>Rs.{invoice.total?.toLocaleString()}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)" }}>{invoice.invoiceNumber}</div>
            </div>
          </div>
        </div>

        {/* Share Options Grid */}
        <div style={{ padding: "0 24px 24px" }}>
          <p style={{ fontSize: "12px", color: "var(--text2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Share via</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
            {SHARE_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => opt.action(invoice, setCopied)}
                style={{ padding: "14px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.background = opt.color + "15" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)" }}
              >
                <span style={{ fontSize: "24px" }}>{opt.icon}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text2)" }}>{opt.label}</span>
              </button>
            ))}
          </div>

          {copied && (
            <div style={{ marginTop: "12px", padding: "10px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "8px", textAlign: "center", fontSize: "13px", color: "var(--success)", fontWeight: 600 }}>
              ✅ Copied to clipboard!
            </div>
          )}

          {/* Quick Message Preview */}
          <div style={{ marginTop: "16px", padding: "14px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Message Preview</p>
            <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: "1.6" }}>
              Hi {invoice.client?.name}! Your invoice <strong>{invoice.invoiceNumber}</strong> is ready. Amount: <strong>Rs.{invoice.total?.toLocaleString()}</strong>. Due: <strong>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "N/A"}</strong>. Thank you! — FreelanceFlow
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}