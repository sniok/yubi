import React, { Suspense, useCallback, useState } from 'react'
import { useFrame, useLoader } from 'react-three-fiber'
import { Box, OrbitControls, Text, RoundedBox, Plane, Sphere } from 'drei'
import { Physics, useBox } from 'use-cannon'
import { DefaultXRControllers, Hover, Select, useController, useXREvent, VRCanvas } from '@react-three/xr'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore
import { useSpring, animated } from 'react-spring/three'
// @ts-ignore
import colors from 'nice-color-palettes'

const randomColor = () => {
  const palette = colors[26]
  return palette[(Math.random() * palette.length) | 0]
}
const stickArgs = [0.75, 0.15, 0.25].map((it) => it * 0.7)

function Stick({ position, rotation }: { position: any; rotation: any }) {
  const [ref] = useBox(() => ({
    position,
    rotation,
    args: stickArgs,
    mass: 100
  }))

  return (
    <RoundedBox radius={0.01} smoothness={4} args={stickArgs} position={position} rotation={rotation} ref={ref as any}>
      <meshPhongMaterial color={randomColor()} attach="material" />
    </RoundedBox>
  )
}

function Tower() {
  const offset = [0, 0.5, -0.9]
  return (
    <>
      {[...Array(10)].map((_, row) => {
        const o = row % 2 === 0
        const rot = o ? [0, 0, 0] : [0, Math.PI / 2, 0]
        const [, y, z] = stickArgs
        const pos = (i: number) => [o ? 0 : z * i, offset[1] + y * row, offset[2] + (o ? z * i : 0)]
        return (
          <>
            <Stick position={pos(-1)} rotation={rot} />
            <Stick position={pos(0)} rotation={rot} />
            <Stick position={pos(1)} rotation={rot} />
          </>
        )
      })}
    </>
  )
}

function Env() {
  const args = [5, 1, 5]
  const [ref] = useBox(() => ({
    args,
    mass: 0
  }))

  return (
    <Box ref={ref} args={args as any}>
      <meshStandardMaterial color="#666" attach="material" />
    </Box>
  )
}

function HandStick({ handedness }: { handedness: string }) {
  const scene = useLoader(GLTFLoader, './yubi3.glb')
  const controller = useController(handedness as any)
  const args = [0.06, 0.07, 0.28]
  const [ref, api] = useBox(() => ({
    args,
    type: 'Kinematic'
  }))
  useFrame(() => {
    if (!controller) return

    const c = controller.controller
    api.position.set(c.position.x, c.position.y, c.position.z)
    api.rotation.set(c.rotation.x, c.rotation.y, c.rotation.z)
  })
  return <primitive object={scene.scene} dispose={null} ref={ref} scale={[0.1, 0.1, 0.1]} />
}

export function GameScene({ handedness, toMenu }: { handedness: string; toMenu: any }) {
  const [id, setId] = useState(0)

  const restart = useCallback(() => {
    setId((it) => it + 1)
  }, [])

  useXREvent('select', restart)
  useXREvent('squeeze', toMenu)

  return (
    <>
      <Env />
      <Tower key={id} />
      <Suspense fallback={null}>
        <HandStick handedness={handedness} />
      </Suspense>
    </>
  )
}

function Button({ children, onClick, args, ...rest }: any) {
  const [hovered, setHovered] = useState(false)
  // @ts-ignore
  const style = useSpring({ scale: hovered ? [1.05, 1.05, 1.05] : [1, 1, 1], color: hovered ? '#66f' : '#f3f3f3' })
  return (
    <Hover onChange={setHovered}>
      <Select onSelect={onClick}>
        <animated.group scale={style.scale} {...rest}>
          <RoundedBox args={args} radius={0.01} smoothness={4}>
            <animated.meshPhongMaterial attach="material" color={style.color} />
            <Text position={[0, 0, args[2] / 2 + 0.01]} color="black">
              {children}
            </Text>
          </RoundedBox>
        </animated.group>
      </Select>
    </Hover>
  )
}

export function IntroScene({ onStart, handedness, setHandedness }: any) {
  const style = useSpring({
    position: handedness === 'right' ? [-0.9, 0.75, -1] : [-0.9, 0.5, -1]
  })
  return (
    <>
      <DefaultXRControllers />
      <group position={[0, 0.5, 0]}>
        <animated.group position={style.position}>
          <Sphere args={[0.03]} />
        </animated.group>
        <Text color="#448" fontSize={0.4} position={[0, 1.5, -1]}>
          YUBI
        </Text>
        <Text color="#448" position={[0, 1.2, -1]} fontSize={0.05}>
          Trigger - restart, Squeeze - menu
        </Text>
        <Text color="#448" position={[-0.7, 0.95, -1]}>
          Hand
        </Text>
        <Button position={[-0.57, 0.75, -1]} args={[0.5, 0.2, 0.1]} onClick={() => setHandedness('right')}>
          Right
        </Button>
        <Button position={[-0.57, 0.5, -1]} args={[0.5, 0.2, 0.1]} onClick={() => setHandedness('left')}>
          Left
        </Button>
        <Button position={[0.47, 0.69, -1]} onClick={onStart} args={[1, 0.6, 0.1]}>
          Start
        </Button>
      </group>
    </>
  )
}

function App() {
  const [scene, setScene] = useState('intro')
  const [handedness, setHandedness] = useState('right')

  const onStart = useCallback(() => {
    setScene('game')
  }, [])
  const toMenu = useCallback(() => {
    setScene('intro')
  }, [])

  return (
    <>
      <OrbitControls />
      {scene === 'game' && <GameScene handedness={handedness} toMenu={toMenu} />}
      {scene === 'intro' && <IntroScene onStart={onStart} handedness={handedness} setHandedness={setHandedness} />}
      <ambientLight intensity={0.5} />
      <pointLight position={[1, 3, 1]} intensity={1.0} />

      <Plane args={[25, 25, 15, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhongMaterial color="#666" attach="material" wireframe />
      </Plane>
    </>
  )
}

export function Main() {
  return (
    <VRCanvas colorManagement>
      <fog args={['#000', 2, 20]} attach="fog" />
      <Physics
        gravity={[0, -6, 0]}
        iterations={20}
        tolerance={0.0001}
        defaultContactMaterial={{
          friction: 0.003
        }}>
        <App />
      </Physics>
    </VRCanvas>
  )
}
