import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={s.backdrop}>
      <div style={s.card}>
        <span style={s.icon}>🌿</span>
        <h1 style={s.title}>Focus Garden</h1>
        <p style={s.subtitle}>
          {sent
            ? 'Magic link sent — check your inbox.'
            : 'Grow your focus, one session at a time.'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} style={s.form}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={s.input}
            />
            <button type="submit" disabled={loading} style={s.button}>
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
            {error && <p style={s.error}>{error}</p>}
          </form>
        ) : (
          <button onClick={() => setSent(false)} style={s.back}>
            Use a different email
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  backdrop: {
    width: '100vw',
    height: '100vh',
    background: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 22,
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 8px 48px rgba(0,0,0,0.07)',
    maxWidth: 360,
    width: '90%',
  },
  icon: {
    fontSize: 44,
    display: 'block',
    marginBottom: 14,
  },
  title: {
    margin: '0 0 8px',
    fontSize: 28,
    fontWeight: 700,
    color: '#2d3748',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '0 0 28px',
    fontSize: 15,
    color: '#718096',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 11,
    border: '1.5px solid #e2e8f0',
    fontSize: 15,
    color: '#2d3748',
    outline: 'none',
    background: '#fafbfc',
  },
  button: {
    padding: '12px 16px',
    borderRadius: 11,
    border: 'none',
    background: '#6aab8e',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  back: {
    background: 'none',
    border: 'none',
    color: '#6aab8e',
    cursor: 'pointer',
    fontSize: 14,
    textDecoration: 'underline',
  },
  error: {
    margin: 0,
    color: '#e53e3e',
    fontSize: 13,
  },
}
