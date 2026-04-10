import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, ContactShadows } from '@react-three/drei'
import { supabase } from '../lib/supabaseClient'
import Tile from './Tile'

const SPACING = 1.15

// Orients the orthographic camera toward origin on the first animation frame.
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

function GardenScene({ tiles, breakdownMap, year, month, daysInMonth, startDay, onTileClick }) {
  // Pad the end so the grid always fills complete 7-column rows
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
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={55}
        near={0.1}
        far={1000}
      />
      <CameraInit />

      <ambientLight intensity={1.0} color="#fff6ee" />
      <directionalLight
        position={[8, 14, 4]}
        intensity={0.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ContactShadows
        position={[0, -0.05, 0]}
        opacity={0.22}
        scale={24}
        blur={2}
        far={2}
      />

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
    const startDay    = new Date(year, month, 1).getDay() // 0 = Sun

    const mm        = String(month + 1).padStart(2, '0')
    const startDate = `${year}-${mm}-01`
    const endDate   = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`

    // Use local-time boundaries so sessions near midnight are assigned to the correct local day
    const sessionRangeStart = new Date(year, month, 1, 0, 0, 0).toISOString()
    const sessionRangeEnd   = new Date(year, month + 1, 1, 0, 0, 0).toISOString()  // JS handles Dec→Jan

    // Fetch tiles and sessions for the month concurrently
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

    // Build per-day category breakdown for hover cards using LOCAL date (not UTC)
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
    <Canvas
      shadows
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', background: '#f0f4f8' }}
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
  )
}
