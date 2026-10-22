import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Line, Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DRACOLoader } from 'three-stdlib'

export const RED = '#e10f1f'

// Volvo + semi-trailer exported from Blender (Draco): nose towards -z, wheels on y 0. Its bounding box
// centre is measured at load and placed on the road centre line (z 0) at x -2, where Rig aims.
// Each wheel_* node sits on its axle, so spinning it on x rolls the wheel
const TRUCK_SCALE = 0.85
const TRUCK_LEN = 16.8 * TRUCK_SCALE // bounding-box length of the GLB, used to frame side shot Z
const WHEEL_SPEED = 12 // rad/s; faster strobes against the spokes
// self-hosted decoder, copied from three/examples/jsm/libs/draco/gltf. Our own instance so it can start
// downloading now, alongside the GLB, instead of only once the GLB has arrived and asks for it
const draco = new DRACOLoader().setDecoderPath('/draco/')
draco.preload()
const withDraco = (loader) => loader.setDRACOLoader(draco)

function TruckModel() {
  const { scene } = useGLTF('/models/truck.glb', false, true, withDraco)
  const wheels = useMemo(() => {
    const out = []
    scene.traverse((o) => {
      if (o.name.startsWith('wheel_')) out.push(o)
      // the glossy black box (roughness 0.35) mirrored the red environment on its roof at the grazing angle the
      // phone camera sees it from. A matte box loses nothing on black
      if (o.material?.name === 'bodycolour') o.material.roughness = 0.75
      if (o.material && !o.material.transparent) o.material.side = THREE.FrontSide
    })
    return out
  }, [scene])
  // rotated -90° on y: model z → world -x, model x → world z
  const c = useMemo(() => {
    // measured in the model's own space, so a remount (HMR) after it's been placed still reads the raw box
    scene.updateWorldMatrix(true, true)
    return new THREE.Box3().setFromObject(scene).applyMatrix4(scene.matrixWorld.clone().invert()).getCenter(new THREE.Vector3())
  }, [scene])
  useFrame((_, dt) => wheels.forEach((w) => (w.rotation.x -= dt * WHEEL_SPEED)))
  return <primitive object={scene} scale={TRUCK_SCALE} rotation-y={-Math.PI / 2} position={[-2 + c.z * TRUCK_SCALE, 0, -c.x * TRUCK_SCALE]} />
}
useGLTF.preload('/models/truck.glb', false, true, withDraco)

// screen-space lines: constant pixel width, so they don't fatten near the camera
const ROAD_X = Array.from({ length: 55 }, (_, i) => -64 + i * 2)
const roadFade = (x) => THREE.MathUtils.smoothstep(x, -64, -22) * (1 - THREE.MathUtils.smoothstep(x, 14, 44))
const roadLine = (z) => ROAD_X.map((x) => [x, 0.01, z])
const roadColors = (hex) => { const c = new THREE.Color(hex); return ROAD_X.map((x) => c.clone().multiplyScalar(roadFade(x)).toArray()) }

function Road() {
  const dash = useRef()
  const red = useMemo(() => roadColors(RED), [])
  const white = useMemo(() => roadColors('#ffffff'), [])
  useFrame((_, dt) => (dash.current.material.dashOffset += dt * 16))
  return (
    <group>
      <Line points={roadLine(3.4)} vertexColors={red} lineWidth={1.5} />
      <Line points={roadLine(-3.4)} vertexColors={red} lineWidth={1.5} />
      <Line ref={dash} points={roadLine(0)} vertexColors={white} lineWidth={1.5} dashed dashSize={4.7} gapSize={5.3} />
    </group>
  )
}

function Streaks({ progress, count = 140 }) {
  const ref = useRef()
  const o = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => Array.from({ length: count }, () => {
    const y = THREE.MathUtils.randFloat(-10, 18)
    // z capped well short of the camera (z ≥ ~9.7): a streak brushing the lens renders as a huge grey band.
    // Streaks low near the truck are pushed behind it, never towards the camera
    let z = THREE.MathUtils.randFloat(-45, 6)
    if (Math.abs(z) < 5 && y < 6) z -= 10
    return { x: THREE.MathUtils.randFloat(-70, 40), y, z, len: THREE.MathUtils.randFloat(1.5, 8), speed: THREE.MathUtils.randFloat(25, 60) }
  }), [count])

  useEffect(() => {
    const white = new THREE.Color('#ffffff'), red = new THREE.Color(RED)
    data.forEach((_, i) => ref.current.setColorAt(i, Math.random() < 0.12 ? red : white))
    ref.current.instanceColor.needsUpdate = true
  }, [data])

  useFrame((_, dt) => {
    const boost = 1 + progress.get() * 2.5
    data.forEach((d, i) => {
      d.x -= d.speed * dt * boost
      if (d.x < -80) d.x = 40
      o.position.set(d.x, d.y, d.z)
      o.scale.set(d.len * boost, 1, 1)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <boxGeometry args={[1, 0.018, 0.018]} />
      <meshBasicMaterial transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
  )
}

const starVert = /* glsl */ `
  attribute float aSize; attribute vec3 aColor; attribute float aPhase;
  uniform float uTime, uScale, uMax;
  varying vec3 vColor; varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vTw = 0.7 + 0.3 * sin(uTime * (0.8 + aPhase * 1.6) + aPhase * 6.283);
    vColor = aColor;
    // cap so stars drifting close to the camera don't balloon
    gl_PointSize = min(aSize * uScale / -mv.z, uMax) * (0.9 + 0.1 * vTw);
    gl_Position = projectionMatrix * mv;
  }`

const starFrag = /* glsl */ `
  varying vec3 vColor; varying float vTw;
  float spike(vec2 p, float thin, float len) { return exp(-abs(p.x) * thin) * exp(-abs(p.y) * len); }
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float core = exp(-r2 * 45.0);
    float halo = (exp(-r2 * 8.0) * 0.45 + exp(-r2 * 2.5) * 0.08) * 0.45; // circular glow kept low so the spikes read
    vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
    float spikes = (spike(p, 45.0, 3.0) + spike(p.yx, 45.0, 3.0)) * 0.8
                 + (spike(q, 70.0, 5.5) + spike(q.yx, 70.0, 5.5)) * 0.22;
    float a = (core + halo + spikes * vTw) * (1.0 - smoothstep(0.6, 1.0, sqrt(r2)));
    vec3 col = mix(vColor, vec3(1.0), clamp(core * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(col * (0.8 + 0.6 * vTw), clamp(a, 0.0, 1.0));
  }`

// real star temperatures: blue-white, white, yellow, orange
const STAR_COLORS = [[0.7, 0.82, 1], [1, 0.97, 0.94], [1, 0.9, 0.7], [1, 0.74, 0.52]].map((c) => new THREE.Color(...c))
const pickStarColor = () => { const r = Math.random(); return STAR_COLORS[r < 0.18 ? 0 : r < 0.72 ? 1 : r < 0.92 ? 2 : 3] }

// slowly drifting glowing stars, spread in depth for parallax
function DriftingStars({ count = 180, W = 210, H = 120, D = 130 }) {
  const g = useRef()
  const { pos, vel, geo } = useMemo(() => {
    const r = THREE.MathUtils.randFloatSpread
    const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos.set([r(W), r(H), r(D)], i * 3)
      vel.set([r(0.9), r(0.9), r(1.2)], i * 3)
    }
    const size = new Float32Array(count), color = new Float32Array(count * 3), phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      size[i] = 4 + Math.pow(Math.random(), 4) * 16 // mostly small, a few big flaring ones
      pickStarColor().toArray(color, i * 3)
      phase[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return { pos, vel, geo }
  }, [count, W, H, D])
  useLayoutEffect(() => g.current.lookAt(A.cam), [])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 450 }, uMax: { value: 48 } }), [])
  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uScale.value = (state.size.height * state.viewport.dpr) / 2
    uniforms.uMax.value = 48 * state.viewport.dpr
    const dt = Math.min(delta, 0.05), half = [W / 2, H / 2, D / 2]
    for (let i = 0; i < count * 3; i++) {
      pos[i] += vel[i] * dt
      if (Math.abs(pos[i]) > half[i % 3]) vel[i] *= -1
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={g} position={[-80, 10, -52]} geometry={geo} frustumCulled={false}>
      <shaderMaterial key={starFrag} vertexShader={starVert} fragmentShader={starFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function ShootingStars({ count = 3 }) {
  const refs = useRef([])
  const stars = useMemo(() => Array.from({ length: count }, (_, i) => ({ t: -1 - i * 2.5, life: 0, dir: new THREE.Vector3() })), [count])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const X = useMemo(() => new THREE.Vector3(1, 0, 0), [])
  useFrame((_, dt) => stars.forEach((s, i) => {
    const m = refs.current[i]
    s.t += dt
    if (s.t < 0) return void (m.visible = false)
    if (s.life === 0) {
      // spawn somewhere in the upper sky, heading down at an angle
      m.position.set(THREE.MathUtils.randFloat(-90, 40), THREE.MathUtils.randFloat(20, 55), THREE.MathUtils.randFloat(-120, -60))
      s.dir.set(THREE.MathUtils.randFloat(-1, 1), THREE.MathUtils.randFloat(-0.6, -0.25), 0).normalize()
      m.quaternion.copy(q.setFromUnitVectors(X, s.dir))
      s.life = THREE.MathUtils.randFloat(0.6, 1.1)
    }
    const k = s.t / s.life
    m.visible = true
    m.position.addScaledVector(s.dir, dt * 90)
    m.scale.set(4 + k * 14, 1, 1)
    m.material.opacity = Math.sin(Math.min(k, 1) * Math.PI) * 0.9
    if (k >= 1) { s.t = -THREE.MathUtils.randFloat(2, 7); s.life = 0 }
  }))
  return stars.map((_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      <boxGeometry args={[1, 0.06, 0.06]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  ))
}

const SUN = new THREE.Vector3(0.95, 0.2, -0.2).normalize()

const earthVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main() {
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`

const earthFrag = /* glsl */ `
  uniform sampler2D uDay, uNight, uData; uniform vec3 uSun;
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main() {
    vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
    float sun = dot(N, uSun);
    float dayMix = smoothstep(-0.15, 0.35, sun);
    // r roughness, g clouds: clouds sit in green because webp keeps it at full resolution (blue lands in the
    // half-resolution chroma), so they stay sharp at a smaller file
    vec2 data = texture2D(uData, vUv).rg;
    float clouds = smoothstep(0.15, 1.0, data.g);
    vec3 day = texture2D(uDay, vUv).rgb * (0.08 + max(sun, 0.0));
    vec3 night = texture2D(uNight, vUv).rgb * 1.8 * (1.0 - clouds * 0.8);
    vec3 col = mix(night, day, dayMix);
    col = mix(col, vec3(max(sun, 0.0) * 1.05 + 0.02), clouds * smoothstep(-0.3, 0.3, sun));
    vec3 H = normalize(uSun + V);
    col += vec3(1.0, 0.92, 0.85) * pow(max(dot(N, H), 0.0), 60.0) * (1.0 - data.r) * dayMix * (1.0 - clouds) * 0.9;
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    vec3 atm = vec3(0.35, 0.62, 1.0);
    col = mix(col, atm, fres * smoothstep(-0.35, 0.6, sun) * 0.85);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

// rim against the real view ray (not a fixed +z): the Earth sits off-centre and the fov changes on scroll,
// so a fixed axis made the halo lopsided and smear sideways
const glowVert = /* glsl */ `
  varying vec3 vN; varying vec3 vWN; varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vWN = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`

const glowFrag = /* glsl */ `
  uniform vec3 uSun; varying vec3 vN; varying vec3 vWN; varying vec3 vV;
  void main() {
    float i = pow(max(0.6 - dot(normalize(vN), normalize(vV)), 0.0), 6.0);
    float d = dot(normalize(vWN), uSun);
    vec3 c = vec3(0.35, 0.6, 1.0);
    gl_FragColor = vec4(c * i * smoothstep(-0.35, 0.4, d) * 1.4, 1.0);
  }`

// 3K where the Earth spans many pixels (desktop), 2K on phones where it's small: measured on a 1080p screen, 3K keeps
// 85% of 4K's detail and 2K 68%, for 64% / 38% of the download and 56% / 25% of the GPU memory.
// The 4K originals are in source/earth-4096/, outside public/ so they don't ship
const EARTH_RES = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio, 1.5) > 1400 ? 3072 : 2048
const EARTH = ['day', 'night', 'rough_clouds'].map((n) => `/textures/earth/earth_${n}_${EARTH_RES}.webp`)
// ImageBitmapLoader decodes the webp off the main thread. drei's useTexture decodes on the main thread and uploads all
// three in its mount effect, one ~120 ms task. Uploading is left to Warmup, one texture per task
const flipY = (loader) => loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })
useLoader.preload(THREE.ImageBitmapLoader, EARTH, flipY)
function Earth() {
  const ref = useRef()
  const bitmaps = useLoader(THREE.ImageBitmapLoader, EARTH, flipY)
  const [day, night, data] = useMemo(() => bitmaps.map((b, i) => {
    const t = new THREE.Texture(b)
    t.flipY = false // already flipped while decoding
    t.anisotropy = 8
    if (i < 2) t.colorSpace = THREE.SRGBColorSpace // day, night; the data map stays linear
    t.needsUpdate = true
    return t
  }), [bitmaps])
  const uniforms = useMemo(() => ({ uDay: { value: day }, uNight: { value: night }, uData: { value: data }, uSun: { value: SUN } }), [day, night, data])
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.012))
  return (
    <group position={[-60, 20, -95]} rotation-z={0.41}>
      <mesh ref={ref} rotation-y={-0.17}>
        <sphereGeometry args={[26, 128, 128]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[26, 64, 64]} />
        <shaderMaterial vertexShader={glowVert} fragmentShader={glowFrag} uniforms={{ uSun: { value: SUN } }} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// faint purple nebula haze on a far sky sphere, drawn first behind everything. It depends only on direction and never
// changes, so it's a pre-rendered equirect image, public/textures/nebula.webp: computing the noise live cost ~2 ms of
// GPU per frame, and baking it at load blocked the page ~100 ms while its shader compiled. The image stores
// colour / NEBULA_MAX to use all 8 bits. To change the look, edit nebulaFrag, open the dev site with ?bakenebula and
// save the downloaded file over the old one
const NEBULA_MAX = 0.13 // brightest the haze gets: 0.36 (colour) × 0.35 (intensity)
const BAKE_NEBULA = import.meta.env.DEV && location.search.includes('bakenebula')

const nebulaFrag = /* glsl */ `
  varying vec2 vUv;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
  void main() {
    float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415927;
    vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
    float n = fbm(d * 2.2 + fbm(d * 1.4) * 1.5);
    float band = smoothstep(0.4, 0.85, n);
    vec3 col = mix(vec3(0.16, 0.04, 0.26), vec3(0.32, 0.08, 0.36), fbm(d * 4.0));
    gl_FragColor = vec4(col * band * 0.35 / ${NEBULA_MAX}, 1.0); // 0.35 is the intensity knob
  }`

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`

const skyFrag = /* glsl */ `
  uniform sampler2D uSky; varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
    gl_FragColor = vec4(texture2D(uSky, uv).rgb * ${NEBULA_MAX}, 1.0);
  }`

const nebulaFile = '/textures/nebula.webp'
if (!BAKE_NEBULA) useLoader.preload(THREE.ImageBitmapLoader, nebulaFile, flipY)

function Nebula() {
  const bitmap = useLoader(THREE.ImageBitmapLoader, nebulaFile, flipY)
  const uniforms = useMemo(() => {
    const t = new THREE.Texture(bitmap)
    t.flipY = false // flipped while decoding
    t.minFilter = THREE.LinearFilter // no mipmaps: they'd smear a line along the atan seam
    t.generateMipmaps = false
    t.needsUpdate = true
    return { uSky: { value: t } }
  }, [bitmap])
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[300, 48, 48]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </mesh>
  )
}

// dev only (?bakenebula): renders nebulaFrag into a 2048×1024 equirect and downloads it as nebula.webp
function BakeNebula() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const W = 2048, H = 1024, rt = new THREE.WebGLRenderTarget(W, H)
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: nebulaFrag }))
    gl.setRenderTarget(rt)
    gl.render(quad, new THREE.Camera())
    gl.setRenderTarget(null)
    const px = new Uint8Array(W * H * 4)
    gl.readRenderTargetPixels(rt, 0, 0, W, H, px)
    const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H })
    const img = canvas.getContext('2d').createImageData(W, H)
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4) // GL rows are bottom-up
    canvas.getContext('2d').putImageData(img, 0, 0)
    canvas.toBlob((b) => Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'nebula.webp' }).click(), 'image/webp', 0.92)
  }, [gl])
  return null
}

const A = { cam: new THREE.Vector3(11, 2.3, 12.5), look: new THREE.Vector3(-5.5, 1.9, 0) }
const Z = { cam: new THREE.Vector3(-2, 2.8, 16), look: new THREE.Vector3(-2, 2, 0) }

function Rig({ progress, children }) {
  const g = useRef()
  const cam = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => A.look.clone(), [])
  const lookTo = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const p = progress.get()
    const e = p * p * (3 - 2 * p)
    const k = 1 - Math.exp(-dt * 3.5)
    cam.lerpVectors(A.cam, Z.cam, e)
    lookTo.lerpVectors(A.look, Z.look, e)
    // narrow/portrait screens: centre on the truck (x -2) and widen the fov to fit it. Pulling back
    // instead flattens the perspective like a telephoto lens and shows the road's far end
    const aspect = state.viewport.aspect
    const narrow = THREE.MathUtils.clamp((1.3 - aspect) / 0.7, 0, 1)
    // aim ahead of the truck's centre (x -2), at the cab: on phones the trailer's tail may crop off the left edge
    lookTo.x += (-2 + 2.6 * (1 - e) - lookTo.x) * narrow
    lookTo.y -= 1.6 * narrow // aim below the truck so it sits in the upper half, clear of the headline
    // wide screens, shot A: close in and aim towards the cab, so the truck grows leftwards and the cab keeps its right margin
    lookTo.x += 4.5 * (1 - narrow) * (1 - e)
    const fov = 32 + 30 * narrow
    // shot A: phones close in (tail may crop).
    // shot Z: back off until the whole truck plus 10% fits the screen width
    // wide screens: distance scales with 1/aspect so the horizontal framing (the cab's right margin) holds; tuned at 1885×909
    const pullA = 1 - 0.08 * narrow + (1 - narrow) * (1.86 / Math.min(aspect, 2.4) - 1) // capped: ultrawides would bring the camera into the streaks
    const fitZ = Math.max(1, (TRUCK_LEN * 0.55) / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect) / Z.cam.distanceTo(Z.look))
    cam.sub(lookTo).multiplyScalar(THREE.MathUtils.lerp(pullA, fitZ, e)).add(lookTo)
    cam.y += 2.5 * narrow // look down on the road a little so it recedes
    if (state.camera.fov !== fov) { state.camera.fov = fov; state.camera.updateProjectionMatrix() }
    cam.x += state.pointer.x * 0.9
    cam.y += state.pointer.y * 0.5
    state.camera.position.lerp(cam, k)
    look.lerp(lookTo, k)
    state.camera.lookAt(look)
    const t = state.clock.elapsedTime
    g.current.position.y = Math.sin(t * 9) * 0.008
    g.current.rotation.x = Math.sin(t * 7) * 0.002
  })
  return <group ref={g}>{children}</group>
}

// Studio lighting for the truck's reflections. three prefilters an environment with a 256-sample GGX shader that took
// 1-1.8 s to compile on a first visit with D3D11, blocking the page, and only does so on first use, so it can't be
// warmed up ahead. The result never changes, so it's baked: public/env/studio-cubeuv.bin is gzipped RGBA half floats
// in three's CubeUV layout (ENV_RES 256 → 768×1024), ~90 KB. To change the lights, edit StudioLights, open the dev
// site with ?bakeenv and save the file it downloads over the old one
const ENV_RES = 256
const BAKE_ENV = import.meta.env.DEV && location.search.includes('bakeenv')

function StudioLights() {
  return (
    <Environment resolution={ENV_RES} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 9, 0]} scale={[24, 4, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[12, 3, 9]} scale={[8, 3, 1]} />
      <Lightformer form="rect" color={RED} intensity={5} position={[-10, 2, -8]} scale={[14, 3, 1]} />
      <Lightformer form="ring" intensity={2} position={[0, 3, 14]} scale={4} />
    </Environment>
  )
}

function BakeEnv() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const t = setTimeout(async () => {
      const rt = new THREE.PMREMGenerator(gl).fromCubemap(scene.environment)
      const px = new Uint16Array(rt.width * rt.height * 4)
      gl.readRenderTargetPixels(rt, 0, 0, rt.width, rt.height, px)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(await new Response(new Blob([px]).stream().pipeThrough(new CompressionStream('gzip'))).blob())
      a.download = 'studio-cubeuv.bin'
      a.click()
    }, 500) // StudioLights renders its cube in a layout effect
    return () => clearTimeout(t)
  }, [gl, scene])
  return null
}

const studioEnv = BAKE_ENV ? null : fetch('/env/studio-cubeuv.bin')
  .then((r) => new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
  .then((buf) => {
    const t = new THREE.DataTexture(new Uint16Array(buf), 3 * ENV_RES, 4 * ENV_RES, THREE.RGBAFormat, THREE.HalfFloatType)
    t.mapping = THREE.CubeUVReflectionMapping // already prefiltered: three uses it as is
    t.minFilter = t.magFilter = THREE.LinearFilter
    t.needsUpdate = true
    return t
  })

function StudioEnv() {
  const env = use(studioEnv)
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.environment = env
    return () => { scene.environment = null }
  }, [scene, env])
  return null
}

// mounts only once every sibling in its Suspense boundary has loaded. Before the first frame is drawn it uploads every
// texture in the scene, compiles every shader in the background, then makes each program finish linking, all in
// small separate tasks. Left to the first render, that work froze the page for ~500 ms (measured: shader compiles,
// big texture uploads queued behind them, and ANGLE finishing links lazily on first use).
// Not drawing until then matters: a render would do synchronously whatever isn't ready yet
function Warmup({ onDone }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let live = true
    const tick = () => new Promise((r) => setTimeout(r))
    ;(async () => {
      const textures = new Set()
      const add = (v) => v?.isTexture && textures.add(v)
      add(scene.environment)
      scene.traverse((o) => [o.material].flat().forEach((m) => {
        if (!m) return
        Object.values(m).forEach(add)
        Object.values(m.uniforms ?? {}).forEach((u) => add(u.value))
      }))
      for (const t of textures) { gl.initTexture(t); await tick() } // one texture per task
      await gl.compileAsync(scene, camera)
      for (const p of gl.info.programs) { p.getUniforms(); await tick() } // blocks until that program has linked
      // ANGLE (D3D11) still builds each shader's final GPU code on its first real draw, which stalled the GPU for
      // ~350 ms when the whole scene drew at once (page frozen, scroll included). Draw it one object per frame instead,
      // into the still invisible canvas, with everything else hidden; lights stay on so the programs match
      const drawn = []
      scene.traverse((o) => (o.isMesh || o.isPoints || o.isLine) && o.visible && drawn.push(o))
      for (const o of drawn) {
        drawn.forEach((d) => (d.visible = d === o))
        gl.render(scene, camera)
        await new Promise((r) => requestAnimationFrame(r))
      }
      drawn.forEach((d) => (d.visible = true))
      if (live) onDone()
    })()
    return () => { live = false }
  }, []) // once: onDone is a fresh closure on every render
  return null
}

export default function Scene({ progress, active, onLoaded }) {
  // nothing is drawn until Warmup is done; the canvas is hidden until then anyway (Hero fades it in)
  const [warm, setWarm] = useState(false)
  return (
    <Canvas
      camera={{ position: A.cam.toArray(), fov: 32, near: 0.1, far: 400 }}
      dpr={[1, 1.5]}
      resize={{ offsetSize: true }} // measure layout size, ignoring the hero's exit scale transform
      frameloop={active && warm ? 'always' : 'never'}
      eventSource={document.getElementById('root')}
      eventPrefix="client"
      // three's error check reads each program's info log on first use, which blocks until the driver has really
      // finished compiling (ANGLE reports compileAsync done early): measured 50-130 ms stalls per program. Dev keeps it
      onCreated={({ gl }) => (gl.debug.checkShaderErrors = import.meta.env.DEV)}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 9, 7]} intensity={2.4} />
      <pointLight position={[-6, 5, -7]} color={RED} intensity={45} distance={30} />
      <pointLight position={[2, 0.4, 0]} color={RED} intensity={8} distance={6} />
      <Stars radius={160} depth={80} count={14000} factor={2.6} saturation={0} fade speed={1.2} />
      <Stars radius={110} depth={30} count={900} factor={5} saturation={0} fade speed={2} />
      <ShootingStars />
      <DriftingStars />
      <Streaks progress={progress} />
      <Road />
      <Suspense fallback={null}>
        <Earth />
        <Rig progress={progress}><TruckModel /></Rig>
        {BAKE_NEBULA ? <BakeNebula /> : <Nebula />}
        {BAKE_ENV ? <><StudioLights /><BakeEnv /></> : <StudioEnv />}
        <Warmup onDone={() => { setWarm(true); onLoaded() }} />
      </Suspense>
    </Canvas>
  )
}
