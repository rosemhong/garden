import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import Garden from './components/Garden'
import Timer from './components/Timer'

export default function App() {
  const [session,      setSession]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [tilesVersion, setTilesVersion] = useState(0)

  useEffect(() => {
    // Hydrate session on mount (also catches magic-link redirects via URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={s.loading}>
        <span style={s.loadingDot}>·  ·  ·</span>
      </div>
    )
  }

  if (!session) return <Auth />

  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year:  'numeric',
  })

  return (
    <div style={s.root}>
      <Garden
        session={session}
        tilesVersion={tilesVersion}
      />

      <Timer
        session={session}
        onSessionComplete={() => setTilesVersion(v => v + 1)}
      />

      {/* Month label — centered top */}
      <div style={s.monthLabel}>{monthLabel}</div>

      {/* Sign-out — top right */}
      <button
        onClick={() => supabase.auth.signOut()}
        style={s.signOut}
      >
        Sign out
      </button>
    </div>
  )
}

const s = {
  root: {
    width:    '100vw',
    height:   '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  loading: {
    width:           '100vw',
    height:          '100vh',
    background:      '#f0f4f8',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  loadingDot: {
    fontSize:      22,
    color:         '#b0bec5',
    letterSpacing: '4px',
  },
  monthLabel: {
    position:      'fixed',
    top:           20,
    left:          '50%',
    transform:     'translateX(-50%)',
    fontSize:      12,
    fontWeight:    600,
    color:         '#8fa8be',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    userSelect:    'none',
  },
  signOut: {
    position:     'fixed',
    top:          14,
    right:        18,
    background:   'rgba(255,255,255,0.72)',
    border:       'none',
    borderRadius: 8,
    padding:      '6px 12px',
    fontSize:     12,
    color:        '#8fa8be',
    cursor:       'pointer',
    fontWeight:   500,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
}
