import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, ContactShadows } from '@react-three/drei'
import { supabase } from '../lib/supabaseClient'
import Tile from './Tile'

const SPACING = 1.15

// Runs once on the first animation frame to orient the camera at origin.
// Must live inside <Canvas> to access the R3F context.
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

function GardenScene({ tiles, year, month, daysInMonth, startDay }) {
  const totalSlots = startDay + daysInMonth
  const numRows    = Math.ceil(totalSlots / 7)
  const todayDay   = new Date().getDate()

  // Build a map of dayNumber → tile row
  const tileMap = {}
  tiles.forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10)
    tileMap[day] = t
  })

  const items = []
  for (let i = 0; i < totalSlots; i++) {
    const col      = i % 7
    const row      = Math.floor(i / 7)
    const x        = (col - 3) * SPACING
    const z        = (row - (numRows - 1) / 2) * SPACING
    const isGhost  = i < startDay
    const dayNumber = isGhost ? 0 : i - startDay + 1
    const tileData = dayNumber > 0 ? tileMap[dayNumber] : null

    items.push(
      <Tile
        key={i}
        index={i}
        position={[x, 0, z]}
        dayNumber={dayNumber}
        growthLevel={tileData?.growth_level ?? 0}
        isGhost={isGhost}
        isToday={!isGhost && dayNumber === todayDay}
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

export default function Garden({ session, tilesVersion }) {
  const [tiles, setTiles]         = useState([])
  const [monthInfo, setMonthInfo] = useState(null)

  const fetchTiles = useCallback(async () => {
    const now         = new Date()
    const year        = now.getFullYear()
    const month       = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay    = new Date(year, month, 1).getDay() // 0 = Sunday

    const mm        = String(month + 1).padStart(2, '0')
    const dd        = String(daysInMonth).padStart(2, '0')
    const startDate = `${year}-${mm}-01`
    const endDate   = `${year}-${mm}-${dd}`

    const { data } = await supabase
      .from('tiles')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('date', startDate)
      .lte('date', endDate)

    setTiles(data || [])
    setMonthInfo({ year, month, daysInMonth, startDay })
  }, [session.user.id])

  useEffect(() => {
    fetchTiles()
  }, [fetchTiles, tilesVersion])

  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', background: '#f0f4f8' }}
    >
      {monthInfo && <GardenScene tiles={tiles} {...monthInfo} />}
    </Canvas>
  )
}
