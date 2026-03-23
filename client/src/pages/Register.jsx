import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const submittedRef = useRef(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittedRef.current) return
    if (password !== confirm) { toast.error('Passwords do not match!'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    submittedRef.current = true
    setLoading(true)
    try {
      const response = await api.post('/auth/register', { name, email, password })
      console.log('SUCCESS - Response:', response.status, response.data)
      setAuth(response.data.user, response.data.accessToken, response.data.refreshToken)
      toast.success(`Welcome to FreelanceFlow, ${name}!`)
      navigate('/app')
    } catch (err) {
      console.log('ERROR - Status:', err.response?.status)
      console.log('ERROR - Data:', err.response?.data)
      console.log('ERROR - Message:', err.message)
      toast.error(err.response?.data?.error || err.message || 'Registration failed')
      submittedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)' }}>
      
      {/* Left side - Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', display: window.innerWidth < 768 ? 'none' : 'flex' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>
          Start your free<br />
          <span style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>freelance journey</span>
        </h1>
        <p style={{ color: '#8b9cc8', fontSize: '17px', lineHeight: '1.7', marginBottom: '40px' }}>Join thousands of freelancers who manage their business with FreelanceFlow.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '🧾', text: 'Create and share professional invoices' },
            { icon: '👥', text: 'Manage all your clients in one place' },
            { icon: '💰', text: 'Get paid faster with INR support' },
            { icon: '🤖', text: 'AI assistant to help you grow' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ color: '#c4b5fd', fontSize: '14px' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Logo for mobile */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💼</div>
            <div style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FreelanceFlow</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Create account</h2>
            <p style={{ color: '#8b9cc8', marginBottom: '28px', fontSize: '14px' }}>Free forever — no credit card required</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b9cc8', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Farhan Khan" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b9cc8', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b9cc8', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8b9cc8', cursor: 'pointer', fontSize: '16px' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8b9cc8', marginBottom: '6px', fontWeight: 600 }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" style={{ ...inputStyle, borderColor: confirm && confirm !== password ? '#ff4d6d' : 'rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = confirm !== password ? '#ff4d6d' : 'rgba(255,255,255,0.1)'} />
                {confirm && confirm !== password && <p style={{ color: '#ff4d6d', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</p>}
              </div>

              <button type="submit" disabled={loading} onClick={(e) => { if (loading) e.preventDefault() }} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}>
                {loading ? '⏳ Creating account...' : 'Create Free Account →'}
              </button>
            </form>

            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(0,217,126,0.08)', border: '1px solid rgba(0,217,126,0.2)', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ color: '#00d97e', fontSize: '13px', margin: 0 }}>✅ You'll receive a welcome email after signup!</p>
            </div>

            <p style={{ textAlign: 'center', marginTop: '20px', color: '#8b9cc8', fontSize: '14px' }}>
              Already have an account? <Link to="/login" style={{ color: '#6c63ff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}