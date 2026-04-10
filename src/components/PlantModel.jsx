import { Component, Suspense, useMemo } from 'react'
import { useFBX } from '@react-three/drei'

// ─── Season ────────────────────────────────────────────────────────────────
export function getSeason(month) {
  if (month >= 2 && month <= 4) return 'spring'   // Mar–May
  if (month >= 5 && month <= 7) return 'summer'   // Jun–Aug
  if (month >= 8 && month <= 10) return 'autumn'  // Sep–Nov
  return 'winter'                                   // Dec–Feb
}

const SEASON = getSeason(new Date().getMonth())

// ─── FBX model map ─────────────────────────────────────────────────────────
//
// HOW TO USE:
//   1. Download "Ultimate Nature Pack" from https://quaternius.com/packs/ultimatenature.html
//   2. Inside the zip, find the FBX folder.
//   3. Copy files listed below into  /public/models/nature/
//   4. Copy the Textures folder to   /public/models/nature/Textures/
//
// SCALE NOTE: Quaternius FBX files export from Blender with cm units,
//   so a 2 m tree arrives as 200 Three.js units. Start with 0.005 and
//   adjust until plants look right relative to the 0.9-unit-wide tile.
//
// EXACT FILENAMES: open your downloaded zip and match the real names —
//   update the strings below. Unrecognised paths fall back to the
//   procedural models silently (ErrorBoundary catches 404s).

const B = '/models/nature'

const MODELS = {
  spring: {
    1: [
      { path: `${B}/Grass.fbx`,             scale: 0.005 },
      { path: `${B}/Flower.fbx`,            scale: 0.005 },
      { path: `${B}/Mushroom.fbx`,          scale: 0.004 },
    ],
    2: [
      { path: `${B}/Bush.fbx`,              scale: 0.005 },
      { path: `${B}/BushBerries.fbx`,       scale: 0.005 },
    ],
    3: [
      { path: `${B}/BirchTree.fbx`,         scale: 0.005 },
      { path: `${B}/OakTree.fbx`,           scale: 0.005 },
      { path: `${B}/WillowTree.fbx`,        scale: 0.005 },
    ],
  },
  summer: {
    1: [
      { path: `${B}/Grass.fbx`,             scale: 0.005 },
      { path: `${B}/GrassLong.fbx`,         scale: 0.005 },
      { path: `${B}/Flower.fbx`,            scale: 0.005 },
    ],
    2: [
      { path: `${B}/Bush.fbx`,              scale: 0.005 },
      { path: `${B}/BushLarge.fbx`,         scale: 0.005 },
    ],
    3: [
      { path: `${B}/OakTree.fbx`,           scale: 0.005 },
      { path: `${B}/BirchTree.fbx`,         scale: 0.005 },
      { path: `${B}/MapleTree.fbx`,         scale: 0.005 },
    ],
  },
  autumn: {
    1: [
      { path: `${B}/Mushroom.fbx`,          scale: 0.004 },
      { path: `${B}/MushroomRed.fbx`,       scale: 0.004 },
      { path: `${B}/Stump.fbx`,             scale: 0.005 },
    ],
    2: [
      { path: `${B}/Bush.fbx`,              scale: 0.005 },
      { path: `${B}/BushBerries.fbx`,       scale: 0.005 },
    ],
    3: [
      { path: `${B}/OakTree.fbx`,           scale: 0.005 },
      { path: `${B}/BirchTree.fbx`,         scale: 0.005 },
      { path: `${B}/MapleTree.fbx`,         scale: 0.005 },
    ],
  },
  winter: {
    1: [
      { path: `${B}/Rock.fbx`,              scale: 0.005 },
      { path: `${B}/RockSmall.fbx`,         scale: 0.004 },
      { path: `${B}/Stump.fbx`,             scale: 0.005 },
    ],
    2: [
      { path: `${B}/BushSnow.fbx`,          scale: 0.005 },
      { path: `${B}/PineTreeSmall.fbx`,     scale: 0.005 },
    ],
    3: [
      { path: `${B}/PineTreeSnow.fbx`,      scale: 0.005 },
      { path: `${B}/BirchTreeSnow.fbx`,     scale: 0.005 },
      { path: `${B}/OakTreeSnow.fbx`,       scale: 0.005 },
    ],
  },
}

// ─── FBX loader ────────────────────────────────────────────────────────────
// useFBX returns a THREE.Group; we clone it so each tile is independent.
function FBXModel({ path, scale }) {
  const fbx  = useFBX(path)
  const clone = useMemo(() => {
    const c = fbx.clone(true)
    c.traverse(child => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true }
    })
    return c
  }, [fbx])
  return <primitive object={clone} scale={scale} />
}

class ModelBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function WithModel({ path, scale, fallback }) {
  return (
    <ModelBoundary key={path} fallback={fallback}>
      <Suspense fallback={fallback}>
        <FBXModel path={path} scale={scale} />
      </Suspense>
    </ModelBoundary>
  )
}

// ─── Procedural fallbacks (season-aware) ───────────────────────────────────
// Shown until real FBX files are present. Each season looks distinct.

// Generic reusable shapes
function Sprout({ stem, leaves, bud = null }) {
  return (
    <group>
      <mesh position={[0, 0.265, 0]}>
        <cylinderGeometry args={[0.013, 0.019, 0.13, 5]} />
        <meshLambertMaterial color={stem} />
      </mesh>
      <mesh position={[-0.072, 0.342, 0.014]} rotation={[0.22, 0, 0.58]} scale={[1, 0.38, 1.28]}>
        <sphereGeometry args={[0.082, 7, 5]} />
        <meshLambertMaterial color={leaves[0]} />
      </mesh>
      <mesh position={[0.072, 0.342, -0.014]} rotation={[-0.22, 0, -0.58]} scale={[1, 0.38, 1.28]}>
        <sphereGeometry args={[0.082, 7, 5]} />
        <meshLambertMaterial color={leaves[1]} />
      </mesh>
      {bud && (
        <mesh position={[0.06, 0.385, 0.02]}>
          <sphereGeometry args={[0.022, 5, 4]} />
          <meshLambertMaterial color={bud} />
        </mesh>
      )}
    </group>
  )
}

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

// ── Autumn-specific ────────────────────────────────────────────────────────
const MUSHROOM_CAPS = ['#c84820', '#e05828', '#b83818']

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

// ── Winter-specific ────────────────────────────────────────────────────────
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
      {/* Snow dot */}
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
      {/* Snow cap */}
      <mesh position={[0, 0.50, 0]} scale={[0.90, 0.34, 0.90]}>
        <sphereGeometry args={[0.18, 6, 4]} />
        <meshLambertMaterial color="#eaf2f6" />
      </mesh>
    </group>
  )
}

// Layered-sphere snow tree — wide at base, tapering to a point
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

// ─── Seasonal colour palettes ──────────────────────────────────────────────
const PAL = {
  spring: {
    sprout: { stem: '#4e8c40', leaves: ['#6ec452', '#78d05c'], bud: '#ffb8c8' },
    bush:   { trunk: '#4a7e38', leaves: ['#3a9e3a', '#44aa44', '#4cb84c'], bud: '#ffcc40' },
    tree:   { trunk: '#5a7a3a', canopy: ['#88d864', '#78cc58', '#8ad86c'], accent: '#ffb8c8' },
  },
  summer: {
    sprout: { stem: '#4e8c40', leaves: ['#6ec452', '#78d05c'], bud: null },
    bush:   { trunk: '#4a7e38', leaves: ['#3a9e3a', '#44aa44', '#4cb84c'], bud: '#f0cc30' },
    tree:   { trunk: '#4a6830', canopy: ['#3a9a30', '#42a838', '#4aaa40'], accent: null },
  },
  autumn: {
    // L1 → AutumnMushrooms, L2/L3 use Bush/Tree with warm palette
    bush:   { trunk: '#6b4428', leaves: ['#e07828', '#cc6018', '#d87030'], bud: null },
    tree:   { trunk: '#6b4428', canopy: ['#e8742a', '#cc5a18', '#e8a030'], accent: null },
  },
}

// ─── Per-level procedural fallback ─────────────────────────────────────────
function ProceduralL1() {
  if (SEASON === 'winter') return <WinterSprout />
  if (SEASON === 'autumn') return <AutumnMushrooms />
  return <Sprout {...PAL[SEASON].sprout} />
}
function ProceduralL2() {
  if (SEASON === 'winter') return <WinterBush />
  const p = PAL[SEASON]
  return <Bush {...p.bush} />
}
const L3_SPOTS = [
  { dx:  0.00, dz:  0.00, rot: 0,    sc: 1.00 },
  { dx: -0.22, dz:  0.13, rot: 2.10, sc: 0.72 },
  { dx:  0.19, dz: -0.18, rot: 3.80, sc: 0.78 },
]

function ProceduralL3() {
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
export default function PlantModel({ level, seed = 0 }) {
  const variants = MODELS[SEASON]

  if (level === 1) {
    const m = variants[1][seed % variants[1].length]
    return <WithModel path={m.path} scale={m.scale} fallback={<ProceduralL1 />} />
  }
  if (level === 2) {
    const m = variants[2][seed % variants[2].length]
    return <WithModel path={m.path} scale={m.scale} fallback={<ProceduralL2 />} />
  }
  if (level === 3) {
    const m = variants[3][seed % variants[3].length]
    return <WithModel path={m.path} scale={m.scale} fallback={<ProceduralL3 seed={seed} />} />
  }
  return null
}

// Kick off FBX fetches as soon as the module loads
Object.values(MODELS[SEASON]).flat().forEach(({ path }) => {
  try { useFBX.preload(path) } catch (_) {}
})
