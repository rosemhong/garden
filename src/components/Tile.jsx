import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import PlantModel from './PlantModel'

const CATEGORIES = ['Coding', 'System Design', 'Behavioral']

// Y anchor (world units) at the top of each plant level — card bottom aligns here
// Level 3 is now a full tree (~1.1 units tall), so card anchors higher
const CARD_ANCHOR_Y = [0.32, 0.52, 1.05, 1.60]

function fmtSecs(s) {
  if (!s || s === 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim()
  return `${m}m`
}

// L0 = warm dirt. L1–L3 = progressively lush green.
const GROUND = [
  { side: '#887c72' },  // 0 — bare dirt, muted grey-brown
  { side: '#8aaa6e' },  // 1 — fresh sage
  { side: '#7a9e5e' },  // 2 — garden green
  { side: '#6a9050' },  // 3 — lush deep green
]
const GROUND_TODAY = [
  { side: '#948880' },  // 0 — dirt, today highlight
  { side: '#98b87c' },  // 1
  { side: '#88ac6c' },  // 2
  { side: '#789e5c' },  // 3
]

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
  const { tileRot, tileH, plantRot } = useMemo(() => ({
    tileRot:  (((index * 7919) % 100) / 100 - 0.5) * 0.05,
    tileH:    0.22 + ((index * 6271) % 100 / 100) * 0.10,
    // Each plant faces a slightly different direction — no two look grid-aligned
    plantRot: ((dayNumber || 1) * 2.618) % (Math.PI * 2),
  }), [index, dayNumber])

  const { plantScale } = useSpring({
    plantScale: growthLevel > 0 ? 1 : 0,
    config: { tension: 280, friction: 14 },
    delay: index * 18,
  })

  // "boing" — overshoots and settles when hovering a grown tile
  const { boingScale } = useSpring({
    boingScale: hovered && growthLevel > 0 ? 1.22 : 1.0,
    config: { tension: 650, friction: 11, mass: 0.8 },
  })

  const { yLift } = useSpring({
    yLift: hovered ? 0.06 : 0,
    config: { tension: 320, friction: 22 },
  })

  useFrame(({ clock }) => {
    if (!plantRef.current || growthLevel === 0) return
    const t = clock.elapsedTime
    plantRef.current.rotation.z = Math.sin(t * 0.55 + swayOffset) * 0.030
    plantRef.current.rotation.x = Math.cos(t * 0.40 + swayOffset) * 0.018
  })

  if (isGhost) return null

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
          args={[0.96, tileH, 0.96]}
          radius={0.08}
          smoothness={3}
          position={[0, tileH / 2, 0]}
          rotation={[0, tileRot, 0]}
          receiveShadow
          castShadow
          {...handlers}
        >
          <meshLambertMaterial color={colors.side} />
        </RoundedBox>

        {growthLevel > 0 && (
          <animated.group scale={plantScale}>
            <animated.group scale={boingScale}>
              <group ref={plantRef} rotation={[0, plantRot, 0]}>
                <PlantModel level={growthLevel} seed={dayNumber} />
              </group>
            </animated.group>
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
    background:           'rgba(255, 248, 236, 0.96)',
    backdropFilter:       'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius:          24,
    padding:              '14px 18px',
    boxShadow:            '0 10px 36px rgba(100,72,48,0.16), 0 2px 8px rgba(100,72,48,0.08)',
    border:               '1px solid rgba(180, 152, 120, 0.22)',
    minWidth:              200,
    fontFamily:           '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    userSelect:           'none',
  },
  date: {
    margin:        '0 0 10px',
    fontSize:      10,
    fontWeight:    700,
    color:         '#a09070',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  row: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            12,
    marginBottom:   6,
  },
  catLabel: { fontSize: 12, color: '#8a7060' },
  catValue: { fontSize: 13, fontWeight: 700, color: '#4a3828' },
}
