import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import PlantModel from './PlantModel'

const CATEGORIES = ['Coding', 'System Design', 'Behavioral']

// Y anchor (world units) at the top of each plant level — card bottom aligns here
const CARD_ANCHOR_Y = [0.32, 0.52, 1.02, 1.12]

function fmtSecs(s) {
  if (!s || s === 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim()
  return `${m}m`
}

// Ground colour progression: warm earth → fresh grass
const GROUND = [
  { side: '#9a7248', top: '#b08860' },  // 0 — bare warm earth
  { side: '#6aaa48', top: '#7ebe58' },  // 1 — fresh spring green
  { side: '#4e9840', top: '#60ac50' },  // 2 — vibrant garden green
  { side: '#3a8c38', top: '#4ca048' },  // 3 — lush rich green
]
const GROUND_TODAY = [
  { side: '#8e6640', top: '#a47850' },
  { side: '#5e9e42', top: '#72b452' },
  { side: '#469040', top: '#58a44e' },
  { side: '#368438', top: '#489848' },
]
const GHOST_COLOR = '#ccc8c0'

export default function Tile({
  position, dayNumber, date, growthLevel,
  isGhost, isToday, index, dayData, onTileClick,
}) {
  const [hovered, setHovered] = useState(false)
  const plantRef = useRef()

  const swayOffset = (dayNumber || 1) * 0.71
  const gLevel     = Math.min(growthLevel, 3)
  const colors     = isToday ? GROUND_TODAY[gLevel] : GROUND[gLevel]

  // Deterministic per-tile variation — organic, hand-placed look
  const { tileRot, tileH } = useMemo(() => ({
    tileRot: (((index * 7919) % 100) / 100 - 0.5) * 0.05,
    tileH:   0.20 + ((index * 6271) % 100 / 100) * 0.03,
  }), [index])

  const { plantScale } = useSpring({
    plantScale: growthLevel > 0 ? 1 : 0,
    config: { tension: 280, friction: 14 },
    delay: index * 18,
  })

  const { yLift } = useSpring({
    yLift: hovered ? 0.18 : 0,
    config: { tension: 320, friction: 22 },
  })

  useFrame(({ clock }) => {
    if (!plantRef.current || growthLevel === 0) return
    const t = clock.elapsedTime
    plantRef.current.rotation.z = Math.sin(t * 0.55 + swayOffset) * 0.030
    plantRef.current.rotation.x = Math.cos(t * 0.40 + swayOffset) * 0.018
  })

  if (isGhost) {
    return (
      <mesh position={[position[0], 0.075, position[2]]}>
        <boxGeometry args={[0.88, 0.15, 0.88]} />
        <meshLambertMaterial color={GHOST_COLOR} transparent opacity={0.10} />
      </mesh>
    )
  }

  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : ''

  const handlers = {
    onPointerEnter: (e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' },
    onPointerLeave: ()  => {                      setHovered(false); document.body.style.cursor = 'default' },
    onClick:        (e) => {
      e.stopPropagation()
      setHovered(false)
      document.body.style.cursor = 'default'
      if (date && onTileClick) onTileClick(date)
    },
  }

  return (
    <group position={position}>
      <animated.group position={yLift.to(y => [0, y, 0])}>

        {/* Organic rounded dirt patch */}
        <RoundedBox
          args={[0.90, tileH, 0.90]}
          radius={0.07}
          smoothness={3}
          position={[0, tileH / 2, 0]}
          rotation={[0, tileRot, 0]}
          receiveShadow
          castShadow
          {...handlers}
        >
          <meshLambertMaterial color={colors.side} />
        </RoundedBox>

        {/* Top-face accent: lighter shade of same growth colour */}
        <mesh position={[0, tileH + 0.001, 0]} rotation={[0, tileRot, 0]}>
          <boxGeometry args={[0.84, 0.001, 0.84]} />
          <meshLambertMaterial color={colors.top} />
        </mesh>

        {growthLevel > 0 && (
          <animated.group scale={plantScale}>
            <group ref={plantRef}>
              <PlantModel level={growthLevel} seed={dayNumber} />
            </group>
          </animated.group>
        )}

        {/* Hover card — bottom anchored just above the plant top */}
        {hovered && (
          <Html
            position={[0, CARD_ANCHOR_Y[gLevel], 0]}
            zIndexRange={[10, 50]}
            style={{ pointerEvents: 'none', transform: 'translate(-50%, -110%)' }}
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
    minWidth:     220,
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
    gap:            10,
    marginBottom:   5,
  },
  catLabel: { fontSize: 12, color: '#64748b' },
  catValue: { fontSize: 12, fontWeight: 700, color: '#1e293b' },
}
