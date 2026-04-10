import { useMemo } from 'react'

// ─── Season ────────────────────────────────────────────────────────────────
export function getSeason(month) {
  if (month >= 2 && month <= 4) return 'spring'   // Mar–May
  if (month >= 5 && month <= 7) return 'summer'   // Jun–Aug
  if (month >= 8 && month <= 10) return 'autumn'  // Sep–Nov
  return 'winter'                                   // Dec–Feb
}

const SEASON = getSeason(new Date().getMonth())

// ─── AC-style stylized flora ───────────────────────────────────────────────

// L1 spring/summer: plump carrot with leafy tufts
function PlumpCarrot() {
  return (
    <group>
      <mesh position={[0, 0.27, 0]} scale={[1, 1.5, 1]}>
        <sphereGeometry args={[0.058, 8, 6]} />
        <meshLambertMaterial color="#e07a42" />
      </mesh>
      <mesh position={[0, 0.185, 0]}>
        <cylinderGeometry args={[0.016, 0.004, 0.09, 5]} />
        <meshLambertMaterial color="#c86030" />
      </mesh>
      <mesh position={[  0.000, 0.370,  0.000]} rotation={[-0.4,  0,     0   ]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.044, 6, 5]} />
        <meshLambertMaterial color="#7aaa5a" />
      </mesh>
      <mesh position={[-0.032, 0.355,  0.020]} rotation={[-0.2,  0.30,  0.40]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.038, 6, 5]} />
        <meshLambertMaterial color="#8ab86a" />
      </mesh>
      <mesh position={[ 0.032, 0.358, -0.018]} rotation={[-0.2, -0.30, -0.40]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.036, 6, 5]} />
        <meshLambertMaterial color="#72a052" />
      </mesh>
    </group>
  )
}

// L2 spring/summer: five-petal blob flower
function BlobFlower() {
  const PETAL_ANGLES = [0, 1, 2, 3, 4].map(i => (i / 5) * Math.PI * 2)
  const PETAL_COLS   = ['#e8b8b0', '#f0c8b8', '#e8b0a8', '#f0bcac', '#e0b0a0']
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.010, 0.014, 0.24, 5]} />
        <meshLambertMaterial color="#6a9450" />
      </mesh>
      {PETAL_ANGLES.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.096, 0.40, Math.cos(a) * 0.096]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.074, 6, 5]} />
          <meshLambertMaterial color={PETAL_COLS[i]} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.052, 7, 6]} />
        <meshLambertMaterial color="#f0d870" />
      </mesh>
    </group>
  )
}

// ─── Shared shapes ─────────────────────────────────────────────────────────

function Bush({ trunk, leaves, bud = null }) {
  return (
    <group>
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.024, 0.036, 0.46, 6]} />
        <meshLambertMaterial color={trunk} />
      </mesh>
      <mesh position={[-0.14, 0.48, 0.02]} rotation={[0, 0.3, 0.55]}>
        <cylinderGeometry args={[0.014, 0.020, 0.22, 5]} />
        <meshLambertMaterial color={trunk} />
      </mesh>
      <mesh position={[0.14, 0.50, -0.03]} rotation={[0, -0.3, -0.55]}>
        <cylinderGeometry args={[0.014, 0.020, 0.22, 5]} />
        <meshLambertMaterial color={trunk} />
      </mesh>
      <mesh position={[-0.17, 0.45, 0.06]} rotation={[0.25, 0.3, 0.5]} scale={[1, 0.44, 1.3]}>
        <sphereGeometry args={[0.13, 6, 5]} />
        <meshLambertMaterial color={leaves[0]} />
      </mesh>
      <mesh position={[0.17, 0.47, -0.06]} rotation={[-0.25, -0.3, -0.5]} scale={[1, 0.44, 1.3]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshLambertMaterial color={leaves[1] ?? leaves[0]} />
      </mesh>
      <mesh position={[0, 0.74, 0]} scale={[1.15, 0.70, 1.15]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color={leaves[0]} />
      </mesh>
      <mesh position={[-0.19, 0.65, 0.09]} scale={[0.92, 0.70, 0.92]}>
        <sphereGeometry args={[0.15, 7, 5]} />
        <meshLambertMaterial color={leaves[1] ?? leaves[0]} />
      </mesh>
      <mesh position={[0.18, 0.67, -0.09]} scale={[0.92, 0.70, 0.92]}>
        <sphereGeometry args={[0.14, 7, 5]} />
        <meshLambertMaterial color={leaves[2] ?? leaves[0]} />
      </mesh>
      {bud && <>
        <mesh position={[0.08, 0.89, 0.05]}>
          <sphereGeometry args={[0.046, 6, 5]} />
          <meshLambertMaterial color={bud} />
        </mesh>
        <mesh position={[-0.07, 0.87, -0.06]}>
          <sphereGeometry args={[0.038, 6, 5]} />
          <meshLambertMaterial color={bud} />
        </mesh>
      </>}
    </group>
  )
}

const BLOSSOM = [[-0.08,0.98,0.04],[0.10,1.00,-0.06],[0.02,1.03,0.11],[-0.13,0.95,0.13]]

function Tree({ trunk, canopy, accent = null }) {
  return (
    <group>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.028, 0.044, 0.48, 6]} />
        <meshLambertMaterial color={trunk} />
      </mesh>
      <mesh position={[0, 0.84, 0]} scale={[1.18, 0.90, 1.18]}>
        <sphereGeometry args={[0.26, 8, 6]} />
        <meshLambertMaterial color={canopy[0]} />
      </mesh>
      <mesh position={[-0.21, 0.74, 0.10]} scale={[0.92, 0.86, 0.92]}>
        <sphereGeometry args={[0.18, 7, 5]} />
        <meshLambertMaterial color={canopy[1] ?? canopy[0]} />
      </mesh>
      <mesh position={[0.21, 0.76, -0.10]} scale={[0.92, 0.86, 0.92]}>
        <sphereGeometry args={[0.17, 7, 5]} />
        <meshLambertMaterial color={canopy[2] ?? canopy[0]} />
      </mesh>
      <mesh position={[0.02, 0.69, 0.17]} scale={[0.85, 0.82, 0.85]}>
        <sphereGeometry args={[0.15, 7, 5]} />
        <meshLambertMaterial color={canopy[1] ?? canopy[0]} />
      </mesh>
      {accent && BLOSSOM.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.034, 5, 4]} />
          <meshLambertMaterial color={accent} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Autumn-specific ───────────────────────────────────────────────────────
const MUSHROOM_CAPS = ['#b86840', '#c87848', '#a85830']

function AutumnMushrooms() {
  const cluster = [
    { x: 0.00, z: 0.00, s: 1.00 },
    { x:-0.13, z: 0.09, s: 0.70 },
    { x: 0.11, z:-0.11, s: 0.80 },
  ]
  return (
    <group>
      {cluster.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]}>
          <mesh position={[0, 0.17 * m.s, 0]}>
            <cylinderGeometry args={[0.018 * m.s, 0.022 * m.s, 0.15 * m.s, 5]} />
            <meshLambertMaterial color="#e8dcc8" />
          </mesh>
          <mesh position={[0, 0.28 * m.s, 0]} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[0.08 * m.s, 6, 5]} />
            <meshLambertMaterial color={MUSHROOM_CAPS[i]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Winter-specific ───────────────────────────────────────────────────────
function WinterSprout() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.010, 0.016, 0.20, 4]} />
        <meshLambertMaterial color="#7a6050" />
      </mesh>
      <mesh position={[-0.05, 0.28, 0]} rotation={[0, 0, 0.50]}>
        <cylinderGeometry args={[0.008, 0.008, 0.10, 4]} />
        <meshLambertMaterial color="#7a6050" />
      </mesh>
      <mesh position={[0.05, 0.28, 0]} rotation={[0, 0, -0.50]}>
        <cylinderGeometry args={[0.008, 0.008, 0.10, 4]} />
        <meshLambertMaterial color="#7a6050" />
      </mesh>
      <mesh position={[0, 0.345, 0]}>
        <sphereGeometry args={[0.026, 5, 4]} />
        <meshLambertMaterial color="#e8f4f8" />
      </mesh>
    </group>
  )
}

function WinterBush() {
  return (
    <group>
      <mesh position={[0, 0.37, 0]} scale={[1.10, 0.68, 1.10]}>
        <sphereGeometry args={[0.20, 7, 5]} />
        <meshLambertMaterial color="#c0d0d8" />
      </mesh>
      <mesh position={[-0.16, 0.29, 0.08]} scale={[0.90, 0.64, 0.90]}>
        <sphereGeometry args={[0.14, 6, 4]} />
        <meshLambertMaterial color="#ccd8e0" />
      </mesh>
      <mesh position={[0.16, 0.31, -0.08]} scale={[0.90, 0.64, 0.90]}>
        <sphereGeometry args={[0.13, 6, 4]} />
        <meshLambertMaterial color="#b8ccd4" />
      </mesh>
      <mesh position={[0, 0.50, 0]} scale={[0.90, 0.34, 0.90]}>
        <sphereGeometry args={[0.18, 6, 4]} />
        <meshLambertMaterial color="#eaf2f6" />
      </mesh>
    </group>
  )
}

const SNOW_LAYERS = [
  { y: 0.50, r: 0.28, c: '#dce8ec' },
  { y: 0.68, r: 0.22, c: '#e4eef2' },
  { y: 0.84, r: 0.16, c: '#dce8ec' },
  { y: 0.97, r: 0.11, c: '#eaf4f8' },
  { y: 1.07, r: 0.06, c: '#f0f8fc' },
]

function WinterTree() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.024, 0.038, 0.36, 5]} />
        <meshLambertMaterial color="#5a3820" />
      </mesh>
      {SNOW_LAYERS.map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]} scale={[1, 0.36, 1]}>
          <sphereGeometry args={[l.r, 7, 5]} />
          <meshLambertMaterial color={l.c} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Colour palettes ───────────────────────────────────────────────────────
const PAL = {
  spring: {
    bush:   { trunk: '#7a6048', leaves: ['#78a860', '#88b870', '#6a9850'], bud: '#e8c0b0' },
    tree:   { trunk: '#7a6048', canopy: ['#78aa68', '#6a9a58', '#88b878'], accent: '#e8c0c8' },
  },
  summer: {
    bush:   { trunk: '#7a6048', leaves: ['#70a058', '#80ae68', '#689848'], bud: '#e0c870' },
    tree:   { trunk: '#6a5838', canopy: ['#6a9e58', '#5c9048', '#78a860'], accent: null },
  },
  autumn: {
    bush:   { trunk: '#8a6040', leaves: ['#c87840', '#b06030', '#c08040'], bud: null },
    tree:   { trunk: '#8a6040', canopy: ['#c07838', '#a86028', '#c89040'], accent: null },
  },
}

// ─── Per-level plants ──────────────────────────────────────────────────────
function PlantL1() {
  if (SEASON === 'winter') return <WinterSprout />
  if (SEASON === 'autumn') return <AutumnMushrooms />
  return <PlumpCarrot />
}

function PlantL2() {
  if (SEASON === 'winter') return <WinterBush />
  if (SEASON === 'autumn') return <Bush {...PAL.autumn.bush} />
  return <BlobFlower />
}

const L3_SPOTS = [
  { dx:  0.00, dz:  0.00, rot: 0,    sc: 1.00 },
  { dx: -0.22, dz:  0.13, rot: 2.10, sc: 0.72 },
  { dx:  0.19, dz: -0.18, rot: 3.80, sc: 0.78 },
]

function PlantL3() {
  if (SEASON === 'winter') {
    return (
      <group>
        {L3_SPOTS.map((o, i) => (
          <group key={i} position={[o.dx, 0, o.dz]} rotation={[0, o.rot, 0]} scale={o.sc}>
            <WinterTree />
          </group>
        ))}
      </group>
    )
  }
  const p = PAL[SEASON]
  return (
    <group>
      {L3_SPOTS.map((o, i) => (
        <group key={i} position={[o.dx, 0, o.dz]} rotation={[0, o.rot, 0]} scale={o.sc}>
          <Tree trunk={p.tree.trunk} canopy={p.tree.canopy} accent={p.tree.accent} />
        </group>
      ))}
    </group>
  )
}

// ─── Public API ────────────────────────────────────────────────────────────
export default function PlantModel({ level }) {
  if (level === 1) return <PlantL1 />
  if (level === 2) return <PlantL2 />
  if (level === 3) return <PlantL3 />
  return null
}
