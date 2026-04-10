import { useMemo } from 'react'

// All plants sit on top of a slab whose top face is at y ≈ 0.20

// ─── Level 1: Seedling sprout — two cotyledon leaves ──────────────────────
function Level1() {
  return (
    <group>
      {/* Tiny stem */}
      <mesh position={[0, 0.265, 0]}>
        <cylinderGeometry args={[0.013, 0.019, 0.13, 5]} />
        <meshLambertMaterial color="#4e8c40" />
      </mesh>
      {/* Left cotyledon — flattened oval */}
      <mesh position={[-0.072, 0.342, 0.014]} rotation={[0.22, 0, 0.58]} scale={[1, 0.38, 1.28]}>
        <sphereGeometry args={[0.082, 7, 5]} />
        <meshLambertMaterial color="#6ec452" />
      </mesh>
      {/* Right cotyledon */}
      <mesh position={[0.072, 0.342, -0.014]} rotation={[-0.22, 0, -0.58]} scale={[1, 0.38, 1.28]}>
        <sphereGeometry args={[0.082, 7, 5]} />
        <meshLambertMaterial color="#78d05c" />
      </mesh>
    </group>
  )
}

// ─── Level 2: Bushy herb / tomato plant ───────────────────────────────────
function Level2() {
  return (
    <group>
      {/* Main stem */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.024, 0.036, 0.46, 6]} />
        <meshLambertMaterial color="#4a7e38" />
      </mesh>
      {/* Side branch left */}
      <mesh position={[-0.14, 0.48, 0.02]} rotation={[0, 0.3, 0.55]}>
        <cylinderGeometry args={[0.014, 0.020, 0.22, 5]} />
        <meshLambertMaterial color="#4a7e38" />
      </mesh>
      {/* Side branch right */}
      <mesh position={[0.14, 0.50, -0.03]} rotation={[0, -0.3, -0.55]}>
        <cylinderGeometry args={[0.014, 0.020, 0.22, 5]} />
        <meshLambertMaterial color="#4a7e38" />
      </mesh>
      {/* Lower leaf pair */}
      <mesh position={[-0.17, 0.45, 0.06]} rotation={[0.25, 0.3, 0.5]} scale={[1, 0.44, 1.3]}>
        <sphereGeometry args={[0.13, 6, 5]} />
        <meshLambertMaterial color="#4aaa3e" />
      </mesh>
      <mesh position={[0.17, 0.47, -0.06]} rotation={[-0.25, -0.3, -0.5]} scale={[1, 0.44, 1.3]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color="#52b444" />
      </mesh>
      {/* Main canopy */}
      <mesh position={[0, 0.74, 0]} scale={[1.15, 0.70, 1.15]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#3a9e3a" />
      </mesh>
      <mesh position={[-0.19, 0.65, 0.09]} scale={[0.92, 0.70, 0.92]}>
        <sphereGeometry args={[0.15, 7, 5]} />
        <meshLambertMaterial color="#44aa44" />
      </mesh>
      <mesh position={[0.18, 0.67, -0.09]} scale={[0.92, 0.70, 0.92]}>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshLambertMaterial color="#4cb84c" />
      </mesh>
      {/* Yellow flower buds */}
      <mesh position={[0.08, 0.89, 0.05]}>
        <sphereGeometry args={[0.046, 6, 5]} />
        <meshLambertMaterial color="#f0cc30" />
      </mesh>
      <mesh position={[-0.07, 0.87, -0.06]}>
        <sphereGeometry args={[0.038, 6, 5]} />
        <meshLambertMaterial color="#f8d840" />
      </mesh>
    </group>
  )
}

// ─── Level 3 variant A: Cherry tomatoes ───────────────────────────────────
const TOMATO_DATA = [
  { pos: [ 0.00, 0.82,  0.00], r: 0.090, c: '#e02020' },
  { pos: [-0.19, 0.76,  0.11], r: 0.080, c: '#cc1818' },
  { pos: [ 0.18, 0.80, -0.11], r: 0.086, c: '#d62020' },
  { pos: [ 0.10, 0.92,  0.15], r: 0.074, c: '#e42828' },
  { pos: [-0.11, 0.90, -0.14], r: 0.078, c: '#c81818' },
  { pos: [ 0.04, 0.72, -0.19], r: 0.072, c: '#e03030' },
]

function CherryTomatoes() {
  return (
    <group>
      {/* Stem */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.022, 0.034, 0.48, 6]} />
        <meshLambertMaterial color="#4a7a38" />
      </mesh>
      {/* Leaf foliage */}
      <mesh position={[0, 0.70, 0]} scale={[1.2, 0.65, 1.2]}>
        <sphereGeometry args={[0.22, 7, 5]} />
        <meshLambertMaterial color="#3a9e3a" />
      </mesh>
      <mesh position={[-0.21, 0.63, 0.08]} scale={[0.9, 0.60, 0.9]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshLambertMaterial color="#44b044" />
      </mesh>
      <mesh position={[0.21, 0.65, -0.10]} scale={[0.9, 0.60, 0.9]}>
        <sphereGeometry args={[0.13, 6, 5]} />
        <meshLambertMaterial color="#4cbc4c" />
      </mesh>
      {/* Tomatoes + tiny stem nubs */}
      {TOMATO_DATA.map((t, i) => (
        <group key={i}>
          <mesh position={t.pos}>
            <sphereGeometry args={[t.r, 8, 7]} />
            <meshLambertMaterial color={t.c} />
          </mesh>
          <mesh position={[t.pos[0], t.pos[1] + t.r * 0.85, t.pos[2]]}>
            <cylinderGeometry args={[0.007, 0.007, 0.020, 4]} />
            <meshLambertMaterial color="#2d7040" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Level 3 variant B: Carrots / radishes ────────────────────────────────
const CARROT_DATA = [
  { x:  0.00, z:  0.00, s: 1.00, c: '#e86030', rot:  0.00 },
  { x: -0.23, z:  0.10, s: 0.83, c: '#d05020', rot:  0.12 },
  { x:  0.21, z: -0.12, s: 0.90, c: '#ee6828', rot: -0.10 },
]

function Carrots() {
  return (
    <group>
      {CARROT_DATA.map((v, i) => (
        <group key={i} position={[v.x, 0, v.z]}>
          {/* Carrot body — thick top (radiusTop), tapers to tip at bottom */}
          <mesh position={[0, 0.31 * v.s, 0]} rotation={[0, 0, v.rot]}>
            <cylinderGeometry args={[0.048 * v.s, 0.007 * v.s, 0.28 * v.s, 6]} />
            <meshLambertMaterial color={v.c} />
          </mesh>
          {/* Feathery green tops */}
          <mesh position={[-0.028 * v.s, 0.51 * v.s,  0.018]} rotation={[ 0.32, 0,  0.42]} scale={[0.70, 0.36, 1.35]}>
            <sphereGeometry args={[0.074 * v.s, 5, 4]} />
            <meshLambertMaterial color="#44b450" />
          </mesh>
          <mesh position={[ 0.028 * v.s, 0.54 * v.s, -0.018]} rotation={[-0.22, 0, -0.34]} scale={[0.70, 0.36, 1.35]}>
            <sphereGeometry args={[0.066 * v.s, 5, 4]} />
            <meshLambertMaterial color="#54c45a" />
          </mesh>
          <mesh position={[0, 0.58 * v.s, 0]} rotation={[0.05, 0, 0.08]} scale={[0.68, 0.38, 1.20]}>
            <sphereGeometry args={[0.058 * v.s, 5, 4]} />
            <meshLambertMaterial color="#3aae48" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Level 3 variant C: Marigolds / flowers ───────────────────────────────
const PETAL_COLORS = ['#ff8c00', '#ff6347', '#ffd700', '#ff69b4', '#cc44ff', '#ff4500']

function Marigolds({ seed }) {
  const col = PETAL_COLORS[seed % PETAL_COLORS.length]

  const outerPetals = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    return (
      <mesh
        key={i}
        position={[Math.cos(angle) * 0.145, 0.77, Math.sin(angle) * 0.145]}
        rotation={[Math.PI / 2, 0, angle]}
        scale={[0.54, 1, 1.18]}
      >
        <cylinderGeometry args={[0.10, 0.10, 0.030, 6]} />
        <meshLambertMaterial color={col} />
      </mesh>
    )
  }), [col])

  const innerPetals = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + 0.26
    return (
      <mesh
        key={i}
        position={[Math.cos(angle) * 0.082, 0.79, Math.sin(angle) * 0.082]}
        rotation={[Math.PI / 2, 0, angle]}
        scale={[0.50, 1, 1.0]}
      >
        <cylinderGeometry args={[0.085, 0.085, 0.025, 6]} />
        <meshLambertMaterial color={col} />
      </mesh>
    )
  }), [col])

  return (
    <group>
      {/* Stem */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.020, 0.028, 0.46, 5]} />
        <meshLambertMaterial color="#4a8440" />
      </mesh>
      {/* Leaves */}
      <mesh position={[-0.12, 0.40, 0.02]} rotation={[0.12, 0, 0.54]} scale={[0.88, 0.34, 1.42]}>
        <sphereGeometry args={[0.10, 6, 4]} />
        <meshLambertMaterial color="#3aa040" />
      </mesh>
      <mesh position={[0.12, 0.42, -0.02]} rotation={[-0.12, 0, -0.54]} scale={[0.88, 0.34, 1.42]}>
        <sphereGeometry args={[0.094, 6, 4]} />
        <meshLambertMaterial color="#44aa44" />
      </mesh>
      {outerPetals}
      {innerPetals}
      {/* Centre disc */}
      <mesh position={[0, 0.81, 0]}>
        <cylinderGeometry args={[0.082, 0.082, 0.028, 7]} />
        <meshLambertMaterial color="#2a1800" />
      </mesh>
    </group>
  )
}

function Level3({ seed }) {
  const variant = seed % 3
  if (variant === 0) return <CherryTomatoes />
  if (variant === 1) return <Carrots />
  return <Marigolds seed={seed} />
}

export default function PlantModel({ level, seed = 0 }) {
  if (level === 1) return <Level1 />
  if (level === 2) return <Level2 />
  if (level === 3) return <Level3 seed={seed} />
  return null
}
