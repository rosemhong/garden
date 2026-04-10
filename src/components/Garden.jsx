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

  // Island base covers the full grid with comfortable margin
  const islandW = 8.6
  const islandD = numRows * SPACING + 1.8

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

      {/* Golden-hour ambient — warm cream */}
      <ambientLight intensity={0.88} color="#fff8e4" />

      {/* Primary directional — warm golden sunlight from upper-right */}
      <directionalLight
        position={[7, 12, 4]}
        intensity={1.30}
        color="#ffd070"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Soft fill — cool lavender bounce from opposite side */}
      <directionalLight
        position={[-5, 4, -6]}
        intensity={0.30}
        color="#d0c8f8"
      />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.28}
        scale={28}
        blur={2.2}
        far={2}
      />

      {/* Floating garden island — grassy base platform */}
      <mesh position={[0, -0.10, 0]} receiveShadow>
        <boxGeometry args={[islandW, 0.20, islandD]} />
        <meshLambertMaterial color="#56904a" />
      </mesh>
      {/* Grass top accent */}
      <mesh position={[0, 0.001, 0]}>
        <boxGeometry args={[islandW, 0.001, islandD]} />
        <meshLambertMaterial color="#68a85a" />
      </mesh>

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
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(170deg, #fef8ee 0%, #ddeee0 100%)' }}>
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
