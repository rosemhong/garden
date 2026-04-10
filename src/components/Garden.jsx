import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, ContactShadows } from '@react-three/drei'
import { supabase } from '../lib/supabaseClient'
import Tile from './Tile'
import { getSeason } from './PlantModel'

const SPACING = 1.04

// ─── Season theme ──────────────────────────────────────────────────────────
const THEMES = {
  spring: {
    bg:      'linear-gradient(170deg, #fef7ee 0%, #ebe0d0 100%)',
    grass:   '#92a870',
    ambient: '#fff4d0',
    sun:     '#ffc84a',
    fog:     '#f4e8d8',
  },
  summer: {
    bg:      'linear-gradient(170deg, #fef8ec 0%, #e8e8cc 100%)',
    grass:   '#8aaa78',
    ambient: '#fff6d8',
    sun:     '#ffc840',
    fog:     '#f0ead4',
  },
  autumn: {
    bg:      'linear-gradient(170deg, #fef4e8 0%, #e8e0cc 100%)',
    grass:   '#8e9e62',
    ambient: '#fff0d0',
    sun:     '#ffc04a',
    fog:     '#f0e8d8',
  },
  winter: {
    bg:      'linear-gradient(170deg, #f0f4f8 0%, #dce8f0 100%)',
    grass:   '#a0b8c8',
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
