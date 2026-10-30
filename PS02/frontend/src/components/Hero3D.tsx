import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars, Text3D, Center } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Coin({ position, color }: { position: [number, number, number]; color: string }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.4
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.2}>
      <mesh ref={mesh} position={position} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.12, 48]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
      </mesh>
    </Float>
  )
}

function FloatingInvoice({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.15
    }
  })
  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={[1.6, 2.2, 0.05]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.4} />
    </mesh>
  )
}

function ConnectingLines() {
  const lines = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 40; i++) {
      pts.push(new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
      ))
    }
    return pts
  }, [])

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(lines)
    const mat = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.25 })
    return new THREE.LineSegments(geo, mat)
  }, [lines])

  useFrame((state) => {
    lineObj.rotation.y = state.clock.elapsedTime * 0.05
  })

  return <primitive object={lineObj} />
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
      <pointLight position={[-10, -5, -10]} intensity={0.8} color="#22d3ee" />
      <Stars radius={50} depth={40} count={800} factor={3} fade speed={1} />

      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1}>
        <Center position={[0, 1.2, 0]}>
          <Text3D
            font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
            size={0.55}
            height={0.15}
            curveSegments={8}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.015}
            bevelSegments={4}
          >
            RECON
            <meshStandardMaterial color="#c7d2fe" metalness={0.85} roughness={0.2} />
          </Text3D>
        </Center>
      </Float>

      <FloatingInvoice position={[-3, 0, -1]} />
      <FloatingInvoice position={[3, -0.5, -1]} />
      <Coin position={[-1.5, -1.5, 1]} color="#fbbf24" />
      <Coin position={[1.8, 1.2, 1.5]} color="#f59e0b" />
      <Coin position={[2.4, -1.8, 0.5]} color="#fcd34d" />
      <Coin position={[-2.2, 1.8, 0.8]} color="#fbbf24" />

      <ConnectingLines />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
    </>
  )
}

export default function Hero3D() {
  return (
    <div className="hero3d" aria-hidden>
      <Canvas camera={{ position: [0, 0.5, 7], fov: 45 }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
      <div className="hero-gradient" />
    </div>
  )
}
