import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "₹50Cr+", label: "Invoices Generated" },
  { value: "500+", label: "Daily Active Users" },
  { value: "50+", label: "Countries Served" },
]

const features = [
  {
    icon: "🎯",
    title: "Capture Leads",
    desc: "Never miss a lead again. Capture every inquiry, stay organized, and turn leads into loyal clients automatically.",
    color: "#6c63ff",
    items: ["Lead Forms", "Auto-Responses", "Questionnaires", "Scheduler"]
  },
  {
    icon: "💳",
    title: "Get Paid Faster",
    desc: "Send proposals, contracts, and invoices in one seamless flow. Get paid online with zero hassle.",
    color: "#00d97e",
    items: ["Online Payments", "Invoices", "Contracts", "Proposals"]
  },
  {
    icon: "📋",
    title: "Manage Projects",
    desc: "Stay on top of every client and project milestone from first hello to final delivery.",
    color: "#ff6584",
    items: ["Pipeline View", "Client Portal", "Task Manager", "CRM"]
  },
  {
    icon: "🤖",
    title: "AI Powered",
    desc: "Let AI handle the busywork — email drafts, meeting notes, project recaps, and business insights.",
    color: "#ffb800",
    items: ["Email Drafts", "Meeting Notes", "Project Recaps", "Insights"]
  },
]

const plans = [
  {
    name: "Pro",
    price: "₹1499",
    period: "/month",
    desc: "Everything you need to run a serious business.",
    color: "#ff6584",
    popular: true,
    features: ["Unlimited clients", "Unlimited invoices", "Unlimited projects", "GST-compliant invoices", "Custom branding", "AI-powered insights", "Priority support", "Advanced reports"]
  },
]

const testimonials = [
  { name: "Sarah K.", role: "Wedding Photographer", text: "FreelanceFlow saved me 20+ hours a week. I can focus on shooting instead of admin work!", avatar: "S" },
  { name: "Marcus T.", role: "Web Designer", text: "My invoices get paid 3x faster now. The client portal is a game changer.", avatar: "M" },
  { name: "Priya R.", role: "Marketing Consultant", text: "I replaced 5 different tools with FreelanceFlow. Worth every penny.", avatar: "P" },
]

const integrations = ["Gmail", "Google Calendar", "Zoom", "Stripe", "QuickBooks", "Zapier", "Slack", "Dropbox", "PayPal", "Calendly", "WhatsApp", "Notion"]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % features.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background: "#0a0a0f", color: "#f0f0f8", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(10,10,15,0.95)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none", transition: "all 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>💼</div>
          <span style={{ fontSize: "18px", fontWeight: 800, background: "linear-gradient(135deg,#fff,#6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FreelanceFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Features", "Pricing", "Integrations", "About"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}>
              {item}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/login" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "14px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)" }}>
            Log in
          </Link>
          <Link to="/register" style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 700, padding: "8px 20px", borderRadius: "8px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", boxShadow: "0 4px 20px rgba(108,99,255,0.4)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "100px 40px 60px", position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.12),transparent 60%)", top: "-200px", left: "50%", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,101,132,0.08),transparent 60%)", bottom: "0", left: "10%" }} />
          <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,217,126,0.06),transparent 60%)", bottom: "100px", right: "10%" }} />
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(108,99,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>

        <div style={{ position: "relative", maxWidth: "800px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "99px", padding: "6px 16px", marginBottom: "28px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d97e" }} />
            🎉 Now with AI-powered automation — Pro Plan at ₹1499/month
          </div>

          <h1 style={{ fontSize: "clamp(42px,6vw,72px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: "24px" }}>
            Manage every client,{" "}
            <span style={{ background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>project & payment</span>
            {" "}in one place
          </h1>

          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
            The all-in-one CRM platform for freelancers and small businesses. Create proposals, invoices, and contracts — and get paid faster.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "24px" }}>
<Link to="/register" style={{ textDecoration: "none", padding: "14px 32px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "16px", boxShadow: "0 8px 32px rgba(108,99,255,0.4)", transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(108,99,255,0.5)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(108,99,255,0.4)" }}>
              Get Started — ₹1499/month →
            </Link>
            <Link to="/login" style={{ textDecoration: "none", padding: "14px 32px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "16px", border: "1px solid rgba(255,255,255,0.12)", transition: "all 0.3s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
              Sign in
            </Link>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>No credit card required · 14-day free trial</p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "60px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, background: "linear-gradient(135deg,#fff,#6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#6c63ff", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Everything you need</div>
          <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>From lead to payment — all in one place</h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", maxWidth: "500px", margin: "0 auto" }}>Stop juggling 10 different tools. FreelanceFlow replaces them all.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px" }}>
          {features.map((f, i) => (
            <div key={f.title}
              onMouseEnter={() => setActiveFeature(i)}
              style={{ background: activeFeature === i ? `linear-gradient(135deg,${f.color}10,rgba(10,10,15,0.8))` : "rgba(17,17,24,0.8)", border: `1px solid ${activeFeature === i ? f.color + "40" : "rgba(255,255,255,0.08)"}`, borderRadius: "20px", padding: "32px", cursor: "default", transition: "all 0.3s" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: f.color + "20", border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "20px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: "20px" }}>{f.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {f.items.map(item => (
                  <span key={item} style={{ fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "99px", background: f.color + "15", border: `1px solid ${f.color}25`, color: f.color }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" style={{ padding: "80px 40px", background: "rgba(17,17,24,0.5)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#6c63ff", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Integrations</div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "12px" }}>Connect your favorite tools</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", marginBottom: "48px" }}>Works with the apps you already use every day</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {integrations.map(app => (
              <div key={app} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)", transition: "all 0.2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,99,255,0.1)"; e.currentTarget.style.borderColor = "rgba(108,99,255,0.3)"; e.currentTarget.style.color = "#fff" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}>
                {app}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "100px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#ff6584", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Loved by freelancers</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-1px" }}>Trusted by 100K+ small businesses</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: "rgba(17,17,24,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.3)"; e.currentTarget.style.transform = "translateY(-4px)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#ffb800", fontSize: "14px" }}>{s}</span>)}
              </div>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: "20px", fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: "15px" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "100px 40px", background: "rgba(17,17,24,0.4)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#00d97e", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>Pick the right plan for you</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", marginBottom: "28px" }}>All plans come with a 14-day free trial. Cancel anytime.</p>
          </div>

<div style={{ display: "grid", gridTemplateColumns: "repeat(1,1fr)", gap: "20px", maxWidth: "500px", margin: "0 auto" }}>
            {plans.map(p => (
              <div key={p.name} style={{ background: p.popular ? `linear-gradient(135deg,${p.color}15,rgba(17,17,24,0.9))` : "rgba(17,17,24,0.8)", border: `1px solid ${p.popular ? p.color + "50" : "rgba(255,255,255,0.08)"}`, borderRadius: "24px", padding: "32px", position: "relative", transition: "transform 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                {p.popular && <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6c63ff,#ff6584)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 16px", borderRadius: "99px", whiteSpace: "nowrap" }}>Most Popular</div>}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{p.name}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>{p.desc}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "-2px" }}>{p.price}</span>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>{p.period}</span>
                  </div>
                </div>
                <Link to="/register" style={{ display: "block", textDecoration: "none", textAlign: "center", padding: "12px", borderRadius: "10px", background: p.popular ? "linear-gradient(135deg,#6c63ff,#ff6584)" : "rgba(255,255,255,0.06)", border: p.popular ? "none" : "1px solid rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "24px", transition: "all 0.2s" }}>
                  Get Started
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: p.color, fontWeight: 700, fontSize: "14px" }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(108,99,255,0.12),transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-1px", marginBottom: "16px" }}>
            Start your journey today
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginBottom: "36px" }}>Join 100K+ freelancers who use FreelanceFlow to grow their business.</p>
          <Link to="/register" style={{ display: "inline-block", textDecoration: "none", padding: "16px 40px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "16px", boxShadow: "0 8px 40px rgba(108,99,255,0.4)", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 50px rgba(108,99,255,0.5)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(108,99,255,0.4)" }}>
            Get Started — ₹1499/month →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.95)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>💼</div>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>FreelanceFlow</span>
          </div>
          <div style={{ display: "flex", gap: "28px" }}>
            {["Features", "Pricing", "About", "Blog", "Help", "Privacy"].map(l => (
              <a key={l} href="#" style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.4)"}>
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>© 2026 FreelanceFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}