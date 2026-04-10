import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import PlantModel from './PlantModel'

const CATEGORIES = ['Coding', 'System Design', 'Behavioral']

function fmtSecs(s) {
  if (!s || s === 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim()
  return `${m}m`
}

// Ground colour progression: bare dirt → mossy → lush grass
// Index matches growthLevel (0-3)
const GROUND = [
  { side: '#c4a882', top: '#d4bc96' },  // 0 — bare dirt
  { side: '#a8a86a', top: '#bebe7a' },  // 1 — earthy green
  { side: '#8aaa54', top: '#9ec064' },  // 2 — mossy
  { side: '#6ea044', top: '#82b454' },  // 3 — lush grass
]
// Same progression for today's highlighted tile (warmer tones)
const GROUND_TODAY = [
  { side: '#b8956a', top: '#cda878' },  // 0
  { side: '#a8a058', top: '#bcb468' },  // 1
  { side: '#88a048', top: '#9cb458' },  // 2
  { side: '#729638', top: '#84aa48' },  // 3
]
const GHOST_COLOR = '#ccc8c0'

export default function Tile({ position, dayNumber, date, growthLevel, isGhost, isToday, index, dayData, onTileClick }) {
  const [hovered, setHovered] = useState(false)
  const plantRef = useRef()

  const swayOffset = (dayNumber || 1) * 0.71
  const gLevel     = Math.min(growthLevel, 3)
  const colors     = isToday ? GROUND_TODAY[gLevel] : GROUND[gLevel]

  const { plantScale } = useSpring({
    plantScale: growthLevel > 0 ? 1 : 0,
    config: { tension: 280, friction: 14 },
    delay: index * 18,
  })

  const { yLift } = useSpring({
    yLift: hovered ? 0.15 : 0,
    config: { tension: 320, friction: 22 },
  })

  useFrame(({ clock }) => {
    if (!plantRef.current || growthLevel === 0) return
    const t = clock.elapsedTime
    plantRef.current.rotation.z = Math.sin(t * 0.55 + swayOffset) * 0.025
    plantRef.current.rotation.x = Math.cos(t * 0.40 + swayOffset) * 0.015
  })

  if (isGhost) {
    return (
      <mesh position={[position[0], 0.075, position[2]]}>
        <boxGeometry args={[0.88, 0.15, 0.88]} />
        <meshLambertMaterial color={GHOST_COLOR} transparent opacity={0.18} />
      </mesh>
    )
  }

  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month:   'short',
        day:     'numeric',
      })
    : ''

  return (
    <group position={position}>
      <animated.group position={yLift.to(y => [0, y, 0])}>

        <mesh
          position={[0, 0.1, 0]}
          receiveShadow
          castShadow
          onPointerEnter={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            setHovered(false)
            document.body.style.cursor = 'default'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setHovered(false)
            document.body.style.cursor = 'default'
            if (date && onTileClick) onTileClick(date)
          }}
        >
          <boxGeometry args={[0.92, 0.2, 0.92]} />
          <meshLambertMaterial color={colors.side} />
        </mesh>

        {/* Top-face accent: lighter shade of same growth colour */}
        <mesh position={[0, 0.2005, 0]}>
          <boxGeometry args={[0.92, 0.001, 0.92]} />
          <meshLambertMaterial color={colors.top} />
        </mesh>

        {growthLevel > 0 && (
          <animated.group scale={plantScale}>
            <group ref={plantRef}>
              <PlantModel level={growthLevel} seed={dayNumber} />
            </group>
          </animated.group>
        )}

        {/* Hover card — positioned upper-right in isometric space.
            [0, 2.5, -2.0] projects to ≈155 px above + 78 px right of tile centre at zoom 55,
            comfortably above the tallest Level-3 plant (~38 px). */}
        {hovered && (
          <Html
            position={[0, 2.5, -2.0]}
            center
            zIndexRange={[10, 50]}
            style={{ pointerEvents: 'none' }}
          >
            <div style={card.wrap}>
              <p style={card.date}>{dateLabel}</p>
              {CATEGORIES.map(cat => (
                <div key={cat} style={card.row}>
                  <span style={card.catLabel}>{cat}</span>
                  <span style={card.catValue}>{fmtSecs(dayData?.[cat] ?? 0)}</span>
                </div>
              ))}
            </div>
          </Html>
        )}

      </animated.group>
    </group>
  )
}

const card = {
  wrap: {
    background:   '#ffffff',
    borderRadius: 12,
    padding:      '10px 14px',
    boxShadow:    '0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)',
    border:       '1px solid #e8ecf0',
    minWidth:     170,
    fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    userSelect:   'none',
  },
  date: {
    margin:        '0 0 9px',
    fontSize:      10,
    fontWeight:    700,
    color:         '#94a3b8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  row: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            18,
    marginBottom:   5,
  },
  catLabel: { fontSize: 12, color: '#64748b' },
  catValue: { fontSize: 12, fontWeight: 700, color: '#1e293b' },
}
