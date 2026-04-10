import { useSpring, animated } from '@react-spring/three'
import PlantModel from './PlantModel'

// Slab geometry: 0.92 wide, 0.2 tall → top face at y = 0.2 (relative to group)
const SLAB_SIDE   = '#c4a882'
const SLAB_TOP    = '#d4bc96'
const TODAY_SIDE  = '#b8956a'
const TODAY_TOP   = '#cda878'
const GHOST_COLOR = '#ccc8c0'

export default function Tile({ position, dayNumber, growthLevel, isGhost, isToday, index }) {
  // Plant pops in with a staggered spring bounce on mount / when growthLevel changes
  const { plantScale } = useSpring({
    plantScale: growthLevel > 0 ? 1 : 0,
    config: { tension: 280, friction: 14 },
    delay: index * 18,
  })

  if (isGhost) {
    return (
      <mesh position={[position[0], 0.075, position[2]]} receiveShadow>
        <boxGeometry args={[0.88, 0.15, 0.88]} />
        <meshLambertMaterial color={GHOST_COLOR} transparent opacity={0.18} />
      </mesh>
    )
  }

  return (
    <group position={position}>
      {/* Slab body */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.92, 0.2, 0.92]} />
        <meshLambertMaterial color={isToday ? TODAY_SIDE : SLAB_SIDE} />
      </mesh>
      {/* Lighter top face */}
      <mesh position={[0, 0.2005, 0]}>
        <boxGeometry args={[0.92, 0.001, 0.92]} />
        <meshLambertMaterial color={isToday ? TODAY_TOP : SLAB_TOP} />
      </mesh>
      {/* Animated plant (scale-in spring) */}
      {growthLevel > 0 && (
        <animated.group scale={plantScale}>
          <PlantModel level={growthLevel} seed={dayNumber} />
        </animated.group>
      )}
    </group>
  )
}
