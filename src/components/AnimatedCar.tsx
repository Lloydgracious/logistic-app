"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface CarProps {
  color?: string;
  isMoving?: boolean;
  waitingDays?: number;
}

function TruckModel({ color = '#00d1ff', isMoving = true, waitingDays = 0 }: CarProps) {
  const group = useRef<THREE.Group>(null);
  
  const isOld = waitingDays > 3;
  const animationSpeed = isOld ? 5 : 15;
  const bounceHeight = isOld ? 0.005 : 0.012;
  const lightIntensity = isOld ? 0.6 : 3.0;

  const materials = useMemo(() => ({
    cabin: new THREE.MeshStandardMaterial({ 
      color: isOld ? new THREE.Color(color).lerp(new THREE.Color('#334155'), 0.3) : color, 
      roughness: isOld ? 0.8 : 0.05, 
      metalness: isOld ? 0.2 : 0.9 
    }),
    box: new THREE.MeshStandardMaterial({ color: isOld ? '#475569' : '#ffffff', roughness: isOld ? 0.9 : 0.1, metalness: 0.1 }),
    chassis: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 }),
    window: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.01, metalness: 1.0 }),
    wheel: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.9 }),
    hubcap: new THREE.MeshStandardMaterial({ color: isOld ? '#64748b' : '#f8fafc', metalness: isOld ? 0.3 : 1.0, roughness: 0.1 }),
    headlight: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: lightIntensity }),
    taillight: new THREE.MeshStandardMaterial({ color: '#f43f5e', emissive: '#f43f5e', emissiveIntensity: lightIntensity }),
    mirror: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.01, metalness: 1.0 }),
    grille: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.8 })
  }), [color, isOld, lightIntensity]);

  useFrame((state) => {
    if (isMoving && group.current) {
      // Gentle bouncing effect - slower if old
      group.current.position.y = Math.sin(state.clock.elapsedTime * animationSpeed) * bounceHeight + 0.45;
      
      // Rotate wheels if moving
      const wheelsGroup = group.current.getObjectByName('wheels');
      if (wheelsGroup) {
        wheelsGroup.children.forEach((wheelSet) => {
          wheelSet.children.forEach((mesh) => {
            if (mesh instanceof THREE.Mesh) {
               mesh.rotation.y += isOld ? 0.05 : 0.15;
            }
          });
        });
      }
    }
  });

  return (
    <group ref={group} position={[0, 0.45, 0]}>
      {/* Chassis */}
      <mesh material={materials.chassis} position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[3.6, 0.15, 1.05]} />
      </mesh>
      
      {/* Cargo Box */}
      <mesh material={materials.box} position={[-0.4, 0.45, 0]} castShadow>
        <boxGeometry args={[2.7, 1.35, 1.25]} />
      </mesh>

      {/* Box details (back door shadow lines) */}
      <mesh material={materials.chassis} position={[-1.76, 0.45, 0]}>
        <boxGeometry args={[0.02, 1.2, 1.1]} />
      </mesh>

      {/* Cabin */}
      <mesh material={materials.cabin} position={[1.35, 0.15, 0]} castShadow>
        <boxGeometry args={[1.0, 0.75, 1.1]} />
      </mesh>

      {/* Windshield */}
      <mesh material={materials.window} position={[1.86, 0.25, 0]} castShadow>
        <boxGeometry args={[0.05, 0.4, 0.95]} />
      </mesh>
      
      {/* Side Windows */}
      <mesh material={materials.window} position={[1.35, 0.25, 0.56]} castShadow>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
      </mesh>
      <mesh material={materials.window} position={[1.35, 0.25, -0.56]} castShadow>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
      </mesh>

      {/* Side Mirrors */}
      <mesh material={materials.cabin} position={[1.6, 0.2, 0.65]}>
        <boxGeometry args={[0.1, 0.2, 0.05]} />
      </mesh>
      <mesh material={materials.mirror} position={[1.61, 0.2, 0.67]}>
        <boxGeometry args={[0.01, 0.18, 0.03]} />
      </mesh>
      
      <mesh material={materials.cabin} position={[1.6, 0.2, -0.65]}>
        <boxGeometry args={[0.1, 0.2, 0.05]} />
      </mesh>
      <mesh material={materials.mirror} position={[1.61, 0.2, -0.67]}>
        <boxGeometry args={[0.01, 0.18, 0.03]} />
      </mesh>

      {/* Front Grille */}
      <mesh material={materials.grille} position={[1.86, -0.05, 0]} castShadow>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
      </mesh>

      {/* Headlights */}
      <mesh material={materials.headlight} position={[1.86, -0.05, 0.42]} castShadow>
        <boxGeometry args={[0.05, 0.18, 0.22]} />
      </mesh>
      <mesh material={materials.headlight} position={[1.86, -0.05, -0.42]} castShadow>
        <boxGeometry args={[0.05, 0.18, 0.22]} />
      </mesh>

      {/* Front Bumper */}
      <mesh material={materials.chassis} position={[1.85, -0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 1.2]} />
      </mesh>

      {/* Taillights */}
      <mesh material={materials.taillight} position={[-1.76, -0.15, 0.45]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.2]} />
      </mesh>
      <mesh material={materials.taillight} position={[-1.76, -0.15, -0.45]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.2]} />
      </mesh>

      {/* Back Bumper */}
      <mesh material={materials.chassis} position={[-1.85, -0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 1.2]} />
      </mesh>

      {/* Exhaust Pipe */}
      <mesh material={materials.chassis} position={[-1.85, -0.4, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 12]} />
      </mesh>

      {/* Wheels */}
      <group name="wheels">
        {/* Front Wheels */}
        <group position={[1.2, -0.4, 0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
        <group position={[1.2, -0.4, -0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
        
        {/* Back Wheels */}
        <group position={[-1.0, -0.4, 0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
        <group position={[-1.0, -0.4, -0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
      </group>
    </group>
  );
}

interface AnimatedSceneProps {
  type: 'loop' | 'arrive' | 'depart';
  progress?: number; // 0 to 1
  waitingDays?: number;
}

function Scene({ type, progress = 0, waitingDays = 0 }: AnimatedSceneProps) {
  const containerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!containerRef.current) return;
    
    if (type === 'loop') {
      containerRef.current.position.x += delta * 2;
      if (containerRef.current.position.x > 5) {
        containerRef.current.position.x = -5;
      }
    } else if (type === 'arrive') {
      // progress 0 is far left, 0.5 is center, 1 is inside
      const targetX = -4 + (progress * 4); 
      containerRef.current.position.x = THREE.MathUtils.lerp(containerRef.current.position.x, targetX, 0.1);
      
      const targetZ = progress > 0.8 ? -2 : 0;
      containerRef.current.position.z = THREE.MathUtils.lerp(containerRef.current.position.z, targetZ, 0.05);
    } else if (type === 'depart') {
      const targetX = 0 + (progress * 5);
      containerRef.current.position.x = THREE.MathUtils.lerp(containerRef.current.position.x, targetX, 0.1);
    }
  });

  return (
    <group ref={containerRef} position={[-4, -0.5, 0]}>
      <TruckModel 
        isMoving={type === 'loop' || (type === 'arrive' && progress < 1) || (type === 'depart' && progress > 0)} 
        waitingDays={waitingDays}
      />
    </group>
  );
}

export function AnimatedCar({ type = 'loop', progress = 0, waitingDays = 0 }: { type?: 'loop' | 'arrive' | 'depart', progress?: number, waitingDays?: number }) {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 2, 5.5], fov: 40 }} shadows>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <spotLight position={[-5, 7, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Scene type={type} progress={progress} waitingDays={waitingDays} />
        
        {/* Ground / Road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} receiveShadow>
          <planeGeometry args={[100, 10]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        
        {/* Road Markings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]}>
          <planeGeometry args={[100, 0.1]} />
          <meshStandardMaterial color="#ffffff" opacity={0.2} transparent />
        </mesh>

        <ContactShadows position={[0, -0.65, 0]} opacity={0.6} scale={15} blur={1.5} far={4} />
      </Canvas>
    </div>
  );
}
