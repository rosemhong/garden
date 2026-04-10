import { useMemo } from 'react'

const PASTEL_PETALS = [
  '#ffb3c6', '#ffd6a5', '#fdffb6', '#caffbf',
  '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
]

// All plants sit on top of a slab whose top face is at y = 0.2
// So plant geometry starts at y >= 0.2

function Level1() {
  return (
    <group>
      <mesh position={[-0.1, 0.38, 0.04]}>
        <coneGeometry args={[0.065, 0.3, 5]} />
        <meshLambertMaterial color="#7ab87a" />
      </mesh>
      <mesh position={[0.09, 0.44, -0.05]}>
        <coneGeometry args={[0.075, 0.36, 5]} />
        <meshLambertMaterial color="#92cc92" />
      </mesh>
    </group>
  )
}

function Level2() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.44, 6]} />
        <meshLambertMaterial color="#6b9e6b" />
      </mesh>
      <mesh position={[0, 0.73, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#5da05d" />
      </mesh>
      <mesh position={[0.17, 0.63, 0.04]}>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshLambertMaterial color="#74b874" />
      </mesh>
      <mesh position={[-0.15, 0.61, -0.04]}>
        <sphereGeometry args={[0.13, 7, 5]} />
        <meshLambertMaterial color="#69aa69" />
      </mesh>
    </group>
  )
}

function Level3({ seed }) {
  const petalColor = PASTEL_PETALS[seed % PASTEL_PETALS.length]

  const petals = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2
      return (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.19, 0.74, Math.sin(angle) * 0.19]}
          rotation={[Math.PI / 2, 0, angle]}
        >
          <cylinderGeometry args={[0.11, 0.11, 0.05, 8]} />
          <meshLambertMaterial color={petalColor} />
        </mesh>
      )
    }),
  [petalColor])

  return (
    <group>
      {/* Stem */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.44, 6]} />
        <meshLambertMaterial color="#6b9e6b" />
      </mesh>
      {/* Petals */}
      {petals}
      {/* Center disc */}
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshLambertMaterial color="#ffeaa7" />
      </mesh>
    </group>
  )
}

export default function PlantModel({ level, seed = 0 }) {
  if (level === 1) return <Level1 />
  if (level === 2) return <Level2 />
  if (level === 3) return <Level3 seed={seed} />
  return null
}
