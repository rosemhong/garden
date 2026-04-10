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

// Hover card — solid white, no transparency, clean shadow
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

const SLAB_SIDE   = '#c4a882'
const SLAB_TOP    = '#d4bc96'
const TODAY_SIDE  = '#b8956a'
const TODAY_TOP   = '#cda878'
const GHOST_COLOR = '#ccc8c0'

export default function Tile({ position, dayNumber, date, growthLevel, isGhost, isToday, index, dayData }) {
  const [hovered, setHovered] = useState(false)
  const plantRef = useRef()

  // Per-tile phase offset so each plant sways at a slightly different rhythm
  const swayOffset = (dayNumber || 1) * 0.71

  // Pop-in spring for plant scale (staggered by tile index on initial load)
  const { plantScale } = useSpring({
    plantScale: growthLevel > 0 ? 1 : 0,
    config: { tension: 280, friction: 14 },
    delay: index * 18,
  })

  // Y-lift spring on hover
  const { yLift } = useSpring({
    yLift: hovered ? 0.15 : 0,
    config: { tension: 320, friction: 22 },
  })

  // Wind sway — only runs computation when a plant exists
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

  // Format date string "YYYY-MM-DD" to "Wed, Apr 9" — use T12:00:00 (local noon) to avoid timezone flips
  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month:   'short',
        day:     'numeric',
      })
    : ''

  return (
    // Outer group handles static X/Z position from grid layout
    <group position={position}>
      {/* Inner animated group handles the hover Y-lift */}
      <animated.group position={yLift.to(y => [0, y, 0])}>

        {/* Slab — primary raycasted surface for pointer events */}
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
        >
          <boxGeometry args={[0.92, 0.2, 0.92]} />
          <meshLambertMaterial color={isToday ? TODAY_SIDE : SLAB_SIDE} />
        </mesh>

        {/* Lighter top-face accent */}
        <mesh position={[0, 0.2005, 0]}>
          <boxGeometry args={[0.92, 0.001, 0.92]} />
          <meshLambertMaterial color={isToday ? TODAY_TOP : SLAB_TOP} />
        </mesh>

        {/* Animated plant with wind sway */}
        {growthLevel > 0 && (
          <animated.group scale={plantScale}>
            <group ref={plantRef}>
              <PlantModel level={growthLevel} seed={dayNumber} />
            </group>
          </animated.group>
        )}

        {/* Hover info card — offset upper-right in isometric space so it clears the plant.
            [0, 1.5, -1.5] projects to ~100 px above + ~58 px right of tile centre at zoom 55. */}
        {hovered && (
          <Html
            position={[0, 1.5, -1.5]}
            center
            zIndexRange={[100, 200]}
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
