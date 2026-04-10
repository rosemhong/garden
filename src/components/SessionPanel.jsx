import { useState, useEffect, useCallback } from 'react'
import { Trash2, X, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// --- helpers -----------------------------------------------------------

function calcGrowthLevel(s) {
  if (s > 5400) return 3
  if (s > 3600) return 2
  if (s > 900)  return 1
  return 0
}

function fmtDuration(s) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

// Local date string "YYYY-MM-DD" from any Date object
function toLocalDate(dt) {
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-')
}

// UTC range covering an entire local day
function localDayRange(localDateStr) {
  const [y, m, d] = localDateStr.split('-').map(Number)
  return {
    start: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
    end:   new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
  }
}

const BADGE_COLORS = {
  'Coding':        { background: '#dbeafe', color: '#1d4ed8' },
  'System Design': { background: '#ede9fe', color: '#6d28d9' },
  'Behavioral':    { background: '#d1fae5', color: '#065f46' },
}

// --- component ---------------------------------------------------------

export default function SessionPanel({ session, sessionsVersion, onUpdate }) {
  const [open,     setOpen]     = useState(false)
  const [sessions, setSessions] = useState([])
  const [deleting, setDeleting] = useState(null)

  const fetchSessions = useCallback(async () => {
    const now   = new Date()
    // Local-time month boundaries so sessions near midnight aren't missed
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString()
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0).toISOString()

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })

    setSessions(data || [])
  }, [session.user.id])

  useEffect(() => {
    if (open) fetchSessions()
  }, [open, sessionsVersion, fetchSessions])

  async function handleDelete(s) {
    setDeleting(s.id)

    await supabase.from('sessions').delete().eq('id', s.id)

    // Derive LOCAL date from the session's timestamp so it matches the tile
    const tileDate    = toLocalDate(new Date(s.created_at))
    const { start, end } = localDayRange(tileDate)

    // Sum whatever sessions remain on that local day
    const { data: remaining } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .eq('user_id', session.user.id)
      .gte('created_at', start)
      .lte('created_at', end)

    const newTotal = (remaining || []).reduce((sum, r) => sum + r.duration_seconds, 0)

    await supabase.from('tiles').upsert(
      {
        user_id:       session.user.id,
        date:          tileDate,
        total_seconds: newTotal,
        growth_level:  calcGrowthLevel(newTotal),
      },
      { onConflict: 'user_id,date' }
    )

    setSessions(prev => prev.filter(x => x.id !== s.id))
    setDeleting(null)
    onUpdate()
  }

  // Group sessions by local date for the day-divider UI
  const grouped = sessions.reduce((acc, s) => {
    const dt    = new Date(s.created_at)
    const label = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!acc[label]) acc[label] = []
    acc[label].push(s)
    return acc
  }, {})

  return (
    <>
      {/* Toggle button — inline styles ensure it renders even before Tailwind loads */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Session History"
        style={s.toggleBtn}
      >
        <Clock size={15} color="#8fa8be" />
      </button>

      {/* Click-away backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={s.backdrop}
        />
      )}

      {/* Slide-out drawer — transform controlled by open state */}
      <div style={{ ...s.drawer, transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.headerTitle}>This Month</span>
          <button onClick={() => setOpen(false)} style={s.closeBtn}>
            <X size={16} color="#94a3b8" />
          </button>
        </div>

        {/* Session list */}
        <div style={s.list}>
          {sessions.length === 0 ? (
            <p style={s.empty}>No sessions yet this month.</p>
          ) : (
            Object.entries(grouped).map(([dayLabel, daySessions]) => (
              <div key={dayLabel}>
                {/* Day divider */}
                <p style={s.dayLabel}>{dayLabel}</p>

                {daySessions.map(sess => {
                  const time  = new Date(sess.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  const badge = BADGE_COLORS[sess.category] || { background: '#f1f5f9', color: '#475569' }
                  const isDeleting = deleting === sess.id

                  return (
                    <div
                      key={sess.id}
                      style={s.row}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Category badge */}
                      <span style={{ ...s.badge, ...badge }}>{sess.category}</span>

                      {/* Duration + time */}
                      <div style={s.rowMeta}>
                        <span style={s.duration}>{fmtDuration(sess.duration_seconds)}</span>
                        <span style={s.time}>{time}</span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(sess)}
                        disabled={isDeleting}
                        style={{ ...s.trashBtn, opacity: isDeleting ? 0.3 : undefined }}
                        className="session-trash"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reveal trash icons on row hover via CSS — avoids JS state per row */}
      <style>{`
        .session-trash { opacity: 0; transition: opacity 0.15s; color: #cbd5e1; }
        .session-trash:hover { color: #f87171; }
        div:hover > .session-trash { opacity: 1; }
      `}</style>
    </>
  )
}

// --- styles (all layout-critical via inline, so they work before Tailwind) ---

const s = {
  toggleBtn: {
    position:       'fixed',
    top:            52,
    right:          16,
    zIndex:         50,
    width:          36,
    height:         36,
    borderRadius:   '50%',
    background:     'rgba(255,255,255,0.88)',
    border:         'none',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    boxShadow:      '0 2px 12px rgba(0,0,0,0.09)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  backdrop: {
    position: 'fixed',
    inset:    0,
    zIndex:   49,
  },
  drawer: {
    position:   'fixed',
    top:        0,
    right:      0,
    height:     '100%',
    width:      300,
    zIndex:     50,
    display:    'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderLeft: '1px solid #e9ecf0',
    boxShadow:  '-8px 0 40px rgba(0,0,0,0.08)',
    transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '16px 20px',
    borderBottom:   '1px solid #f1f5f9',
    flexShrink:     0,
  },
  headerTitle: {
    fontSize:   13,
    fontWeight: 600,
    color:      '#475569',
  },
  closeBtn: {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    display:    'flex',
    padding:    4,
    borderRadius: 6,
  },
  list: {
    flex:     1,
    overflowY: 'auto',
    paddingBottom: 16,
  },
  empty: {
    textAlign:  'center',
    color:      '#94a3b8',
    fontSize:   13,
    marginTop:  40,
  },
  dayLabel: {
    padding:       '14px 20px 6px',
    fontSize:      10,
    fontWeight:    700,
    color:         '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin:        0,
  },
  row: {
    display:     'flex',
    alignItems:  'center',
    gap:         10,
    padding:     '8px 20px',
    transition:  'background 0.12s',
    cursor:      'default',
  },
  badge: {
    flexShrink:   0,
    fontSize:     10,
    fontWeight:   600,
    padding:      '2px 8px',
    borderRadius: 999,
    whiteSpace:   'nowrap',
  },
  rowMeta: {
    flex:      1,
    minWidth:  0,
    display:   'flex',
    alignItems: 'center',
    gap:       6,
  },
  duration: {
    fontSize:   13,
    fontWeight: 600,
    color:      '#334155',
  },
  time: {
    fontSize: 11,
    color:    '#94a3b8',
  },
  trashBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    padding:      4,
    borderRadius: 4,
    display:      'flex',
    flexShrink:   0,
  },
}
