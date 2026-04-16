import { useState, useRef, useEffect, useCallback } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const MAX_MESSAGES = 50

const trimMessages = (msgs) => msgs.length > MAX_MESSAGES ? msgs.slice(msgs.length - MAX_MESSAGES) : msgs

const QUICK = [
  { label: "Create invoice for ₹50,000", action: "create_invoice_50000" },
  { label: "Revenue this month?", action: "revenue_query" },
  { label: "Who owes me money?", action: "outstanding" },
  { label: "Pricing recommendation", action: "pricing" }
]

const FEATURE_PROMPTS = {
  create_invoice_50000: "Create an invoice for 50000 rupees for web development services",
  revenue_query: "How much revenue did I earn this month?",
  outstanding: "Show me all outstanding invoices and late payments",
  pricing: "Give me pricing recommendations based on my history"
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "bot", text: "👋 Hi! I'm your AI assistant powered by Claude. I can help you with:\n\n• Creating invoices with natural language\n• Revenue & financial insights\n• Late payment predictions\n• Pricing recommendations\n• Finding clients & projects\n• Any freelancing questions!" }
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [mode, setMode] = useState("chat")
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const handleAction = (action) => {
    const prompt = FEATURE_PROMPTS[action] || action
    setInput(prompt)
  }

  const send = async (text) => {
    const q = text || input.trim()
    if (!q) return
    setInput("")
    setMessages(m => trimMessages([...m, { role: "user", text: q }]))
    setTyping(true)

    try {
      const parsedIntent = parseIntent(q)
      
      if (parsedIntent.action === 'create_invoice') {
        const params = parsedIntent.parameters
        const { data: clients } = await api.get('/clients')
        if (clients.clients?.length > 0) {
          const items = params.items || [{
            description: q.replace(/create|invoice|bill/i, '').trim() || 'Services rendered',
            hours: 1,
            rate: params.amount || 0,
            amount: params.amount || 0
          }]
          
          const responseText = `📋 Invoice Creation Ready!\n\nI'll create an invoice with:\n• Client: ${clients.clients[0].name}\n• Amount: ₹${(params.amount || 0).toLocaleString()}\n• Items: ${items.map(i => i.description).join(', ')}\n\nGo to Invoices page to create it, or ask me for more specific details!`
          
          setTyping(false)
          setMessages(m => trimMessages([...m, { role: "bot", text: responseText }]))
        } else {
          setTyping(false)
          setMessages(m => trimMessages([...m, { role: "bot", text: "To create an invoice, I first need you to add a client. Would you like me to help you add one?" }]))
        }
      } else if (parsedIntent.action === 'revenue_query') {
        try {
          const [invoices, payments] = await Promise.all([
            api.get('/invoices'),
            api.get('/payments')
          ])
          
          const thisMonth = new Date().toISOString().substring(0, 7)
          const monthPayments = (payments.data.payments || payments.data.data || [])
            .filter(p => p.date?.substring(0, 7) === thisMonth && p.status === 'completed')
          const revenue = monthPayments.reduce((s, p) => s + (p.amount || 0), 0)
          
          const responseText = `💰 Revenue Report\n\nThis month (${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}):\n\n• Total collected: ₹${revenue.toLocaleString()}\n• Payments received: ${monthPayments.length}\n• Invoices sent: ${(invoices.data.invoices || []).filter(i => i.status === 'sent').length}\n• Overdue: ${(invoices.data.invoices || []).filter(i => i.status === 'overdue').length}`
          
          setTyping(false)
          setMessages(m => trimMessages([...m, { role: "bot", text: responseText }]))
        } catch {
          throw new Error('Failed to fetch data')
        }
      } else if (parsedIntent.action === 'query_outstanding') {
        try {
          const { data } = await api.get('/invoices')
          const outstanding = (data.invoices || []).filter(i => i.status === 'sent' || i.status === 'overdue')
          const total = outstanding.reduce((s, i) => s + (i.total || 0), 0)
          
          let responseText = `📋 Outstanding Invoices\n\nTotal outstanding: ₹${total.toLocaleString()}\nInvoices: ${outstanding.length}\n\n`
          
          outstanding.slice(0, 5).forEach(inv => {
            responseText += `• ${inv.invoiceNumber} - ₹${(inv.total || 0).toLocaleString()} (${inv.status})\n`
          })
          
          if (outstanding.length > 5) {
            responseText += `\n...and ${outstanding.length - 5} more`
          }
          
          setTyping(false)
          setMessages(m => trimMessages([...m, { role: "bot", text: responseText }]))
        } catch {
          throw new Error('Failed to fetch invoices')
        }
      } else {
        const history = messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }))
        const { data } = await api.post('/ai/chat', {
          messages: [...history, { role: "user", content: q }]
        })
        
        const answer = data.content || "I couldn't process that. Please try again!"
        setTyping(false)
        setMessages(m => trimMessages([...m, { role: "bot", text: answer }]))
      }
    } catch {
      setTyping(false)
      setMessages(m => trimMessages([...m, { role: "bot", text: "I'm having trouble connecting. Please try again or ask something else!" }]))
    }
  }

  const parseIntent = (text) => {
    const lower = text.toLowerCase()
    const result = { action: null, parameters: {} }
    
    if (lower.includes('create') && (lower.includes('invoice') || lower.includes('bill'))) {
      result.action = 'create_invoice'
      const amountMatch = text.match(/₹?\s*([\d,]+(?:\.\d{2})?)/)
      if (amountMatch) {
        result.parameters.amount = parseFloat(amountMatch[1].replace(/,/g, ''))
      }
    } else if (lower.includes('how much') || lower.includes('revenue') || lower.includes('earned')) {
      result.action = 'revenue_query'
    } else if (lower.includes('outstanding') || lower.includes('pending') || lower.includes('due') || lower.includes('late')) {
      result.action = 'query_outstanding'
    }
    
    return result
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label={open ? "Close AI Assistant" : "Open AI Assistant"} style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9000, width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "24px", boxShadow: "0 4px 24px rgba(108,99,255,0.5)", transition: "transform 0.2s", border: "none", color: "#fff" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        {open ? "×" : "🤖"}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="FreelanceFlow AI Assistant" aria-labelledby="chatbot-title" style={{ position: "fixed", bottom: "96px", right: "28px", zIndex: 9000, width: "380px", height: "560px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,rgba(108,99,255,0.2),rgba(255,101,132,0.2))", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }} aria-hidden="true">🤖</div>
              <div>
                <div id="chatbot-title" style={{ fontWeight: 700, fontSize: "14px" }}>FreelanceFlow AI</div>
                <div style={{ fontSize: "11px", color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }} aria-hidden="true" /> Powered by Claude
                </div>
              </div>
            </div>
            <select value={mode} onChange={e => setMode(e.target.value)} aria-label="Chat mode" style={{ padding: "4px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "11px" }}>
              <option value="chat">Chat</option>
              <option value="invoice">Invoice AI</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }} role="log" aria-label="Chat messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg,#6c63ff,#ff6584)" : "var(--surface2)", border: m.role === "bot" ? "1px solid var(--border)" : "none", fontSize: "13px", lineHeight: "1.5", color: "var(--text)", whiteSpace: "pre-wrap" }} role={m.role === "user" ? "listitem" : undefined}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text2)", animation: `bounce 1s ease ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "8px 12px", display: "flex", gap: "6px", overflowX: "auto", borderTop: "1px solid var(--border)" }}>
            {QUICK.map(q => (
              <button key={q.action} onClick={() => handleAction(q.action)} aria-label={q.label} style={{ padding: "5px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "99px", color: "var(--text2)", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>
                {q.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask me anything..." aria-label="Chat message input" style={{ flex: 1, padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)", fontSize: "13px", outline: "none" }} />
            <button onClick={() => send()} disabled={typing} aria-label="Send message" style={{ padding: "10px 14px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", cursor: typing ? "not-allowed" : "pointer", fontSize: "16px", opacity: typing ? 0.7 : 1 }}>
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </>
  )
}
