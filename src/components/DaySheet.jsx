import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// --- shared helpers ---

function calcGrowthLevel(s) {
  if (s > 5400) return 3; if (s > 3600) return 2; if (s > 900) return 1; return 0
}

function fmtDuration(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

// UTC range for an entire local calendar day
function localDayRange(localDate) {
  const [y, mo, d] = localDate.split('-').map(Number)
  return {
    start: new Date(y, mo - 1, d, 0, 0, 0, 0).toISOString(),
    end:   new Date(y, mo - 1, d, 23, 59, 59, 999).toISOString(),
  }
}

const BADGE = {
  'Coding':        { background: '#dbeafe', color: '#1d4ed8' },
  'System Design': { background: '#ede9fe', color: '#6d28d9' },
  'Behavioral':    { background: '#d1fae5', color: '#065f46' },
}

// --- component ---

export default function DaySheet({ date, session, onClose, onUpdate }) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const { start, end } = localDayRange(date)
    setLoading(true)
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSessions(data || []); setLoading(false) })
  }, [date, session.user.id])

  async function handleDelete(s) {
    setDeleting(s.id)
    await supabase.from('sessions').delete().eq('id', s.id)

    const { start, end } = localDayRange(date)
    const { data: remaining } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .eq('user_id', session.user.id)
      .gte('created_at', start)
      .lte('created_at', end)

    const newTotal = (remaining || []).reduce((sum, r) => sum + r.duration_seconds, 0)

    await supabase.from('tiles').upsert(
      { user_id: session.user.id, date, total_seconds: newTotal, growth_level: calcGrowthLevel(newTotal) },
      { onConflict: 'user_id,date' }
    )

    setSessions(prev => prev.filter(x => x.id !== s.id))
    setDeleting(null)
    onUpdate()
  }

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const totalSecs = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         199,
          background:     'rgba(0,0,0,0.06)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Card */}
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.dateLabel}>{dateLabel}</p>
            {totalSecs > 0 && (
              <p style={s.totalTime}>{fmtDuration(totalSecs)} total</p>
            )}
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <X size={15} color="#94a3b8" />
          </button>
        </div>

        {/* Session rows */}
        <div style={s.list}>
          {loading ? (
            <p style={s.empty}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p style={s.empty}>No sessions logged on this day.</p>
          ) : (
            sessions.map(sess => {
              const time  = new Date(sess.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              const badge = BADGE[sess.category] || { background: '#f1f5f9', color: '#475569' }
              return (
                <div
                  key={sess.id}
                  style={s.row}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ ...s.badge, ...badge }}>{sess.category}</span>
                  <div style={s.rowMeta}>
                    <span style={s.duration}>{fmtDuration(sess.duration_seconds)}</span>
                    <span style={s.time}>{time}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(sess)}
                    disabled={deleting === sess.id}
                    style={{ ...s.trashBtn, opacity: deleting === sess.id ? 0.3 : undefined }}
                    className="day-trash"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        .day-trash { opacity: 0; color: #cbd5e1; transition: opacity 0.15s; }
        .day-trash:hover { color: #f87171; }
        [data-row]:hover .day-trash { opacity: 1; }
        div:hover > .day-trash { opacity: 1; }
      `}</style>
    </>
  )
}

const s = {
  panel: {
    position:      'fixed',
    top:           '50%',
    left:          '50%',
    transform:     'translate(-50%, -50%)',
    width:         320,
    maxHeight:     '65vh',
    background:    '#ffffff',
    borderRadius:  16,
    boxShadow:     '0 20px 60px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.07)',
    border:        '1px solid #e9ecf0',
    display:       'flex',
    flexDirection: 'column',
    zIndex:        200,
    overflow:      'hidden',
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    padding:        '18px 20px 14px',
    borderBottom:   '1px solid #f1f5f9',
    flexShrink:     0,
  },
  dateLabel: {
    margin:     0,
    fontSize:   14,
    fontWeight: 700,
    color:      '#334155',
    lineHeight: 1.3,
  },
  totalTime: {
    margin:     '4px 0 0',
    fontSize:   12,
    color:      '#94a3b8',
    fontWeight: 500,
  },
  closeBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    display:      'flex',
    padding:      4,
    borderRadius: 6,
    flexShrink:   0,
    marginTop:    -2,
  },
  list: {
    flex:          1,
    overflowY:     'auto',
    paddingBottom: 12,
  },
  empty: {
    textAlign:  'center',
    color:      '#94a3b8',
    fontSize:   13,
    marginTop:  28,
  },
  row: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    padding:    '9px 20px',
    transition: 'background 0.12s',
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
    flex:       1,
    minWidth:   0,
    display:    'flex',
    alignItems: 'center',
    gap:        6,
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
