import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const CATEGORIES = ['Coding', 'System Design', 'Behavioral']

function calcGrowthLevel(totalSeconds) {
  if (totalSeconds > 5400) return 3  // 1.5h → Bloom
  if (totalSeconds > 3600) return 2  // 1h   → Plant
  if (totalSeconds > 900)  return 1  // 15m  → Sprout
  return 0
}

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function Timer({ session, onSessionComplete }) {
  const [status,   setStatus]   = useState('idle')   // idle | running | paused
  const [seconds,  setSeconds]  = useState(0)
  const [category, setCategory] = useState('Coding')
  const [saving,   setSaving]   = useState(false)
  const intervalRef = useRef(null)

  function start() {
    setStatus('running')
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  function pause() {
    clearInterval(intervalRef.current)
    setStatus('paused')
  }

  function resume() {
    setStatus('running')
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  // Dev shortcut: inject 15 min instantly
  function addDevTime() {
    setSeconds(s => s + 900)
  }

  async function stop() {
    clearInterval(intervalRef.current)
    const elapsed = seconds
    setSeconds(0)
    setStatus('idle')
    if (elapsed < 10) return

    setSaving(true)
    try {
      // Use local calendar date so sessions always land on today's tile regardless of timezone
      const d     = new Date()
      const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      await supabase.from('sessions').insert({
        user_id:          session.user.id,
        duration_seconds: elapsed,
        category,
      })

      const { data: existing } = await supabase
        .from('tiles')
        .select('total_seconds')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .maybeSingle()

      const newTotal = (existing?.total_seconds ?? 0) + elapsed

      await supabase.from('tiles').upsert(
        {
          user_id:       session.user.id,
          date:          today,
          total_seconds: newTotal,
          growth_level:  calcGrowthLevel(newTotal),
        },
        { onConflict: 'user_id,date' }
      )

      onSessionComplete()
    } finally {
      setSaving(false)
    }
  }

  const isRunning = status === 'running'
  const isIdle    = status === 'idle'
  const isActive  = status === 'running' || status === 'paused'

  return (
    <div style={s.panel}>
      {isIdle ? (
        <>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={s.select}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={start} disabled={saving} style={s.startBtn}>
            {saving ? 'Saving…' : '▶  Start Focus'}
          </button>
        </>
      ) : (
        <>
          <div style={s.display}>{fmt(seconds)}</div>
          <div style={s.label}>{category}</div>
          <div style={s.row}>
            <button
              onClick={isRunning ? pause : resume}
              style={s.secondaryBtn}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button onClick={stop} style={s.doneBtn}>Done</button>
          </div>
          {/* Dev helper — visible only during active session */}
          {isActive && (
            <button onClick={addDevTime} style={s.devBtn} title="Add 15 minutes (dev only)">
              +15m (Dev)
            </button>
          )}
        </>
      )}
    </div>
  )
}

const s = {
  panel: {
    position:             'fixed',
    bottom:               32,
    left:                 '50%',
    transform:            'translateX(-50%)',
    background:           'rgba(255,255,255,0.88)',
    backdropFilter:       'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius:         18,
    padding:              '20px 28px',
    boxShadow:            '0 4px 32px rgba(0,0,0,0.09)',
    display:              'flex',
    flexDirection:        'column',
    alignItems:           'center',
    gap:                  12,
    minWidth:             190,
    zIndex:               100,
  },
  display: {
    fontSize:           44,
    fontWeight:         700,
    letterSpacing:      '-1.5px',
    color:              '#2d3748',
    fontVariantNumeric: 'tabular-nums',
    lineHeight:         1,
  },
  label: {
    fontSize:      11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color:         '#a0aec0',
  },
  row: {
    display: 'flex',
    gap:     8,
  },
  startBtn: {
    background:    '#6aab8e',
    color:         '#fff',
    border:        'none',
    borderRadius:  11,
    padding:       '10px 24px',
    fontSize:      14,
    fontWeight:    600,
    cursor:        'pointer',
    letterSpacing: '0.02em',
  },
  secondaryBtn: {
    background:   '#edf2f7',
    color:        '#4a5568',
    border:       'none',
    borderRadius: 9,
    padding:      '8px 16px',
    fontSize:     13,
    fontWeight:   500,
    cursor:       'pointer',
  },
  doneBtn: {
    background:   '#6aab8e',
    color:        '#fff',
    border:       'none',
    borderRadius: 9,
    padding:      '8px 18px',
    fontSize:     13,
    fontWeight:   600,
    cursor:       'pointer',
  },
  select: {
    background:   '#f7fafc',
    border:       '1.5px solid #e2e8f0',
    borderRadius: 9,
    padding:      '7px 12px',
    fontSize:     13,
    color:        '#4a5568',
    outline:      'none',
    cursor:       'pointer',
    width:        '100%',
  },
  devBtn: {
    background:    'none',
    border:        '1px dashed #cbd5e0',
    borderRadius:  6,
    padding:       '3px 10px',
    fontSize:      11,
    color:         '#a0aec0',
    cursor:        'pointer',
    letterSpacing: '0.04em',
  },
}
