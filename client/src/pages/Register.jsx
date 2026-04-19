import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const { setAuth } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const navigate = useNavigate()
  const submittedRef = useRef(false)

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Full name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Must be at least 8 characters'
    if (!confirm) errs.confirm = 'Please confirm your password'
    else if (password !== confirm) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittedRef.current) return
    if (!validate()) return
    submittedRef.current = true
    setLoading(true)
    try {
      const response = await api.post('/auth/register', { name, email, password })
      if (response.data.accessToken) localStorage.setItem("ff_token", response.data.accessToken)
      setAuth(response.data.user)
      localStorage.setItem("ff_user", JSON.stringify(response.data.user))
      addNotification({
        type: "success",
        title: "Welcome to FreelanceFlow!",
        message: `Thanks for signing up, ${name}!`
      })
      toast.success(`Welcome to FreelanceFlow, ${name}!`)
      navigate('/app')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(errorMsg)
      addNotification({
        type: "error",
        title: "Registration failed",
        message: errorMsg
      })
      submittedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', background: '#fff', border: '1px solid #e0e0e0',
    borderRadius: '4px', color: '#333', fontSize: '16px', outline: 'none', boxSizing: 'border-box',
    transition: 'box-shadow 0.2s'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Firebase-style header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: '#fff', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔥</span>
          <span style={{ fontSize: '22px', fontWeight: 500, color: '#5f6368' }}>FreelanceFlow</span>
        </div>
        <div style={{ fontSize: '14px', color: '#5f6368' }}>
          <Link to="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '440px', marginTop: '40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.8 127.4'%3E%3Cpath fill='%23FFCA28' d='M87.8 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M43.9 63.7L87.8 0z'/%3E%3Cpath fill='%23EA4335' d='M0 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M0 63.7L43.9 0z'/%3E%3Cpath fill='%2334A853' d='M43.9 25.5L0 63.7h25.9z'/%3E%3Cpath fill='%234285F4' d='M87.8 63.7L43.9 25.5H87.8z'/%3E%3Cpath fill='%23EA4335' d='M17.9 38.2l-12.8 14.9c-3.2 3.7-1 8.9 3.2 9.9l30.7 7.1c1.7 0.4 3.5 0.5 5.3 0.5c7.1 0 13-4.9 14.3-11.6L87.8 63.7 43.9 25.5 17.9 38.2z'/%3E%3Cpath fill='%234285F4' d='M69.9 101.9L43.9 63.7 69.9 101.9z'/%3E%3C/svg%3E" alt="Firebase" style={{ width: '52px', height: '52px' }} />
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#202124', marginTop: '16px' }}>Get started with FreelanceFlow</div>
          <p style={{ color: '#5f6368', fontSize: '14px', marginTop: '8px' }}>Create your free account to manage clients and invoices</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 -1px 0 rgba(0,0,0,0.05) inset', padding: '40px', border: '1px solid #e0e0e0' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reg-name" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#5f6368', marginBottom: '8px' }}>Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                placeholder="Your name"
                style={{ ...inputStyle, borderColor: errors.name ? '#d93025' : undefined }}
              />
              {errors.name && <p style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#5f6368', marginBottom: '8px' }}>Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                placeholder="you@example.com"
                style={{ ...inputStyle, borderColor: errors.email ? '#d93025' : undefined }}
              />
              {errors.email && <p style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reg-password" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#5f6368', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                  placeholder="Min 8 characters"
                  style={{ ...inputStyle, paddingRight: '48px', borderColor: errors.password ? '#d93025' : undefined }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#5f6368' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="reg-confirm" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#5f6368', marginBottom: '8px' }}>Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
                placeholder="Repeat password"
                style={{ ...inputStyle, borderColor: errors.confirm ? '#d93025' : undefined }}
              />
              {errors.confirm && <p style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 24px', background: '#1a73e8', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '16px', padding: '12px', background: '#e8f0fe', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ color: '#1a73e8', fontSize: '12px', margin: 0 }}>Free forever — no credit card required</p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            <span style={{ color: '#5f6368' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: '16px', left: '24px', fontSize: '12px', color: '#5f6368' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Terms</span>
          <span>Privacy Policy</span>
          <span>Help</span>
        </div>
      </div>
    </div>
  )
}