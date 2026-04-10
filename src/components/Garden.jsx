import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { supabase } from '../lib/supabaseClient'
import Tile from './Tile'
import { getSeason } from './PlantModel'

const SPACING = 1.00

// ─── Season theme ──────────────────────────────────────────────────────────
const THEMES = {
  spring: {
    bg:      'linear-gradient(170deg, #fef8ee 0%, #ddeee0 100%)',
    grass:   '#58a04a',
    ambient: '#fff8e4',
    sun:     '#ffd070',
    fog:     '#f5ead8',
  },
  summer: {
    bg:      'linear-gradient(170deg, #fef5e4 0%, #cce8cc 100%)',
    grass:   '#48a038',
    ambient: '#fff8e0',
    sun:     '#ffe080',
    fog:     '#f0eedd',
  },
  autumn: {
    bg:      'linear-gradient(170deg, #fef0dc 0%, #e8d8b0 100%)',
    grass:   '#7a8040',
    ambient: '#ffe8cc',
    sun:     '#ffa840',
    fog:     '#f0e0c0',
  },
  winter: {
    bg:      'linear-gradient(170deg, #ecf4f8 0%, #d8e8f0 100%)',
    grass:   '#a8c0cc',
    ambient: '#e8f0f8',
    sun:     '#d8e8f4',
    fog:     '#dce8f4',
  },
}

const SEASON = getSeason(new Date().getMonth())
const THEME  = THEMES[SEASON]

// ─── Camera ────────────────────────────────────────────────────────────────
function CameraInit() {
  const done = useRef(false)
  useFrame(({ camera }) => {
    if (!done.current) {
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      done.current = true
    }
  })
  return null
}

// ─── Lively island chunk: thick beveled earth base + displaced grass ────────
const SOIL = {
  spring: '#5a3820', summer: '#5a3820', autumn: '#6a4020', winter: '#607080',
}

function IslandChunk({ width, depth, grassColor }) {
  const grassGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 50, 50)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x  = pos.getX(i)
      const z  = pos.getZ(i)
      const nx = x / (width  / 2)
      const nz = z / (depth  / 2)
      const edgeFactor = Math.pow(Math.min(Math.sqrt(nx * nx + nz * nz), 1.0), 1.8)
      const bump =
        Math.sin(x * 2.20 + 0.60) * Math.cos(z * 1.80 - 0.30) * 0.032 +
        Math.sin(x * 4.10 - 1.50) * Math.cos(z * 3.30 + 0.90) * 0.014 +
        Math.sin(x * 1.10 + 1.20) * Math.cos(z * 0.90 - 0.70) * 0.022
      pos.setY(i, bump * edgeFactor)
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [width, depth])

  return (
    <group>
      {/* Thick beveled soil body — reveals depth when viewed isometrically */}
      <RoundedBox
        args={[width + 0.2, 1.30, depth + 0.2]}
        radius={0.12}
        smoothness={3}
        position={[0, -0.65, 0]}
        receiveShadow
      >
        <meshLambertMaterial color={SOIL[SEASON]} />
      </RoundedBox>
      {/* Displaced grass on top — rolling hills, covers the box top face */}
      <mesh geometry={grassGeo} receiveShadow position={[0, 0.001, 0]}>
        <meshLambertMaterial color={grassColor} />
      </mesh>
    </group>
  )
}

// ─── Scatter decorations ────────────────────────────────────────────────────
// Deterministic LCG so layout never shifts
function lcg(seed) {
  return ((seed * 1664525 + 1013904223) >>> 0)
}

// Small lumpy rocks using dodecahedron (naturally rough-looking)
function ProceduralRock({ position, scale, rotY }) {
  return (
    <mesh
      position={position}
      rotation={[0.2, rotY, 0.1]}
      scale={[scale, scale * 0.75, scale]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshLambertMaterial color={SEASON === 'winter' ? '#b8ccd8' : '#8a7a6a'} />
    </mesh>
  )
}

// Grass tufts that sway in a gentle breeze
function AnimatedGrassTuft({ position, rotY }) {
  const ref   = useRef()
  const phase = position[0] * 1.3 + position[2] * 0.7
  const col   = SEASON === 'winter' ? '#a0b8c4' : SEASON === 'autumn' ? '#8a8840' : '#5aaa48'

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1 + phase) * 0.10
  })

  return (
    <group ref={ref} position={position} rotation={[0, rotY, 0]}>
      {[-0.04, 0, 0.04].map((x, i) => (
        <mesh key={i} position={[x, 0.055, (i - 1) * 0.018]} rotation={[0, 0, (i - 1) * 0.28]}>
          <boxGeometry args={[0.014, 0.11, 0.014]} />
          <meshLambertMaterial color={col} />
        </mesh>
      ))}
    </group>
  )
}

// Scatter props on the border strip of the island (outside tile grid)
function ScatterDecor({ islandW, islandD, gridW, gridD }) {
  const props = useMemo(() => {
    const items = []
    let s = 42317
    const margin = 0.55  // min distance from tile grid edge

    for (let i = 0; i < 40; i++) {
      s = lcg(s); const rawX = (s / 0xFFFFFFFF - 0.5) * (islandW - 0.3)
      s = lcg(s); const rawZ = (s / 0xFFFFFFFF - 0.5) * (islandD - 0.3)
      s = lcg(s); const rotY = (s / 0xFFFFFFFF) * Math.PI * 2
      s = lcg(s); const kind = s % 3  // 0=rock, 1=tuft, 2=tuft

      // Skip if inside the tile grid (plus margin)
      if (
        Math.abs(rawX) < gridW / 2 + margin &&
        Math.abs(rawZ) < gridD / 2 + margin
      ) continue

      s = lcg(s)
      const sc = 0.04 + (s / 0xFFFFFFFF) * 0.05
      items.push({ x: rawX, z: rawZ, rotY, kind, scale: sc })
    }
    return items
  }, [islandW, islandD, gridW, gridD])

  return (
    <group>
      {props.map((p, i) =>
        p.kind === 0
          ? <ProceduralRock key={i} position={[p.x, 0, p.z]} scale={p.scale} rotY={p.rotY} />
          : <AnimatedGrassTuft key={i} position={[p.x, 0, p.z]} rotY={p.rotY} />
      )}
    </group>
  )
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function GardenScene({ tiles, breakdownMap, year, month, daysInMonth, startDay, onTileClick }) {
  const rawSlots   = startDay + daysInMonth
  const totalSlots = Math.ceil(rawSlots / 7) * 7
  const numRows    = totalSlots / 7
  const todayDay   = new Date().getDate()
  const mm         = String(month + 1).padStart(2, '0')

  const tileMap = {}
  tiles.forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10)
    tileMap[day] = t
  })

  const items = []
  for (let i = 0; i < totalSlots; i++) {
    const col       = i % 7
    const row       = Math.floor(i / 7)
    const x         = (col - 3) * SPACING
    const z         = (row - (numRows - 1) / 2) * SPACING
    const isGhost   = i < startDay || i >= startDay + daysInMonth
    const dayNumber = isGhost ? 0 : i - startDay + 1
    const tileData  = dayNumber > 0 ? tileMap[dayNumber] : null
    const dateStr   = dayNumber > 0
      ? `${year}-${mm}-${String(dayNumber).padStart(2, '0')}`
      : null

    items.push(
      <Tile
        key={i}
        index={i}
        position={[x, 0, z]}
        dayNumber={dayNumber}
        date={dateStr}
        growthLevel={tileData?.growth_level ?? 0}
        isGhost={isGhost}
        isToday={!isGhost && dayNumber === todayDay}
        dayData={dateStr ? breakdownMap[dateStr] : null}
        onTileClick={onTileClick}
      />
    )
  }

  const islandW = 8.8
  const islandD = numRows * SPACING + 1.8
  const gridW   = 7 * SPACING
  const gridD   = numRows * SPACING

  return (
    <>
      <OrthographicCamera makeDefault position={[10, 10, 10]} zoom={55} near={0.1} far={1000} />
      <CameraInit />
      <fog attach="fog" args={[THEME.fog, 28, 55]} />

      <ambientLight intensity={0.68} color={THEME.ambient} />

      {/* Golden hour: low-angle sun, warm and strong, crisper shadows */}
      <directionalLight
        position={[12, 6, 4]}
        intensity={1.85}
        color={THEME.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Warm point light — sunset glow */}
      <pointLight
        position={[3, 3, -5]}
        intensity={0.55}
        color={SEASON === 'winter' ? '#b0d0e8' : '#ffb060'}
        distance={20}
        decay={2}
      />

      {/* Soft fill from opposite side */}
      <directionalLight
        position={[-5, 4, -6]}
        intensity={0.28}
        color={SEASON === 'winter' ? '#c8d8f0' : '#d0c8f8'}
      />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={28} blur={2.5} far={3.0} />

      <IslandChunk width={islandW} depth={islandD} grassColor={THEME.grass} />
      <ScatterDecor islandW={islandW} islandD={islandD} gridW={gridW} gridD={gridD} />

      <group>{items}</group>
    </>
  )
}

export default function Garden({ session, tilesVersion, onTileClick }) {
  const [tiles,        setTiles]        = useState([])
  const [breakdownMap, setBreakdownMap] = useState({})
  const [monthInfo,    setMonthInfo]    = useState(null)

  const fetchData = useCallback(async () => {
    const now         = new Date()
    const year        = now.getFullYear()
    const month       = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay    = new Date(year, month, 1).getDay()

    const mm        = String(month + 1).padStart(2, '0')
    const startDate = `${year}-${mm}-01`
    const endDate   = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`

    const sessionRangeStart = new Date(year, month, 1, 0, 0, 0).toISOString()
    const sessionRangeEnd   = new Date(year, month + 1, 1, 0, 0, 0).toISOString()

    const [{ data: tilesData }, { data: sessionsData }] = await Promise.all([
      supabase
        .from('tiles')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', startDate)
        .lte('date', endDate),

      supabase
        .from('sessions')
        .select('created_at, duration_seconds, category')
        .eq('user_id', session.user.id)
        .gte('created_at', sessionRangeStart)
        .lt('created_at', sessionRangeEnd),
    ])

    const map = {}
    sessionsData?.forEach(s => {
      const dt      = new Date(s.created_at)
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
      if (!map[dateStr]) map[dateStr] = {}
      const cat = s.category || 'Coding'
      map[dateStr][cat] = (map[dateStr][cat] || 0) + s.duration_seconds
    })

    setTiles(tilesData || [])
    setBreakdownMap(map)
    setMonthInfo({ year, month, daysInMonth, startDay })
  }, [session.user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData, tilesVersion])

  return (
    <div style={{ width: '100%', height: '100%', background: THEME.bg }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {monthInfo && (
          <GardenScene
            tiles={tiles}
            breakdownMap={breakdownMap}
            onTileClick={onTileClick}
            {...monthInfo}
          />
        )}
      </Canvas>
    </div>
  )
}
