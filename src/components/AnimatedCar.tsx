import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface CarProps {
  color?: string;
  isMoving?: boolean;
  waitingDays?: number;
  isDark?: boolean;
}

function TruckModel({ isMoving = true, waitingDays = 0, isDark = false }: CarProps) {
  const group = useRef<THREE.Group>(null);
  
  const isOld = waitingDays > 3;
  const animationSpeed = isMoving ? (isOld ? 8 : 12) : 0;
  const bounceHeight = isMoving ? (isOld ? 0.005 : 0.01) : 0;
  // Headlights/Taillights glow much brighter at night
  const lightIntensity = isDark ? 8.0 : 0.5;

  const materials = useMemo(() => ({
    cabin: new THREE.MeshStandardMaterial({ 
      color: '#ef4444', 
      roughness: 0.2, 
      metalness: 0.5 
    }),
    box: new THREE.MeshStandardMaterial({ 
      color: isOld ? (isDark ? '#1e293b' : '#e2e8f0') : (isDark ? '#334155' : '#94a3b8'), 
      roughness: isOld ? 0.9 : 0.3, 
      metalness: 0.1 
    }),
    boxTrim: new THREE.MeshStandardMaterial({ 
      color: isOld ? (isDark ? '#0f172a' : '#cbd5e1') : (isDark ? '#1e293b' : '#64748b'), 
      roughness: 0.8, 
      metalness: 0.3 
    }),
    chassis: new THREE.MeshStandardMaterial({ color: isDark ? '#020617' : '#334155', roughness: 0.7 }),
    window: new THREE.MeshStandardMaterial({ color: isDark ? '#1e293b' : '#0ea5e9', roughness: 0.1, metalness: 0.9 }),
    wheel: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.9 }),
    hubcap: new THREE.MeshStandardMaterial({ color: isDark ? '#475569' : '#94a3b8', metalness: 0.8, roughness: 0.2 }),
    headlight: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: lightIntensity }),
    taillight: new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: lightIntensity }),
    mirror: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.01, metalness: 1.0 }),
    grille: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.3, metalness: 0.7 })
  }), [isOld, lightIntensity, isDark]);

  useFrame((state) => {
    if (isMoving && group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * animationSpeed) * bounceHeight + 0.45;
      const wheelsGroup = group.current.getObjectByName('wheels');
      if (wheelsGroup) {
        wheelsGroup.children.forEach((wheelSet) => {
          wheelSet.children.forEach((mesh) => {
            if (mesh instanceof THREE.Mesh) mesh.rotation.y += 0.15;
          });
        });
      }
    }
  });

  const corrugations = Array.from({ length: 16 }).map((_, i) => -1.68 + (i * 0.17));

  return (
    <group ref={group} position={[0, 0.45, 0]}>
      {/* Chassis */}
      <mesh material={materials.chassis} position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[3.6, 0.15, 1.05]} />
      </mesh>
      
      {/* Cargo Box Main Body */}
      <mesh material={materials.box} position={[-0.4, 0.45, 0]} castShadow>
        <boxGeometry args={[2.7, 1.35, 1.25]} />
      </mesh>

      {/* Cargo Box Details */}
      {corrugations.map((posX, i) => (
         <group key={i}>
           <mesh material={materials.boxTrim} position={[posX, 0.45, 0.63]} castShadow>
             <boxGeometry args={[0.08, 1.35, 0.02]} />
           </mesh>
           <mesh material={materials.boxTrim} position={[posX, 0.45, -0.63]} castShadow>
             <boxGeometry args={[0.08, 1.35, 0.02]} />
           </mesh>
         </group>
      ))}

      {corrugations.map((posX, i) => (
         <mesh key={`roof-${i}`} material={materials.boxTrim} position={[posX, 1.13, 0]} castShadow>
            <boxGeometry args={[0.08, 0.02, 1.25]} />
         </mesh>
      ))}

      <mesh material={materials.boxTrim} position={[-0.4, 1.13, 0]} castShadow>
         <boxGeometry args={[2.72, 0.04, 1.27]} />
      </mesh>
      <mesh material={materials.boxTrim} position={[-0.4, -0.22, 0]} castShadow>
         <boxGeometry args={[2.72, 0.04, 1.27]} />
      </mesh>

      <mesh material={materials.boxTrim} position={[-1.76, 0.45, 0]} castShadow>
        <boxGeometry args={[0.04, 1.35, 1.27]} />
      </mesh>

      <mesh material={materials.chassis} position={[-1.78, 0.45, 0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.2]} />
      </mesh>
      <mesh material={materials.chassis} position={[-1.78, 0.45, -0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.2]} />
      </mesh>

      {/* Cabin */}
      <mesh material={materials.cabin} position={[1.35, 0.15, 0]} castShadow>
        <boxGeometry args={[1.0, 0.75, 1.1]} />
      </mesh>

      <mesh material={materials.window} position={[1.86, 0.25, 0]} castShadow>
        <boxGeometry args={[0.05, 0.4, 0.95]} />
      </mesh>
      
      <mesh material={materials.window} position={[1.35, 0.25, 0.56]} castShadow>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
      </mesh>
      <mesh material={materials.window} position={[1.35, 0.25, -0.56]} castShadow>
        <boxGeometry args={[0.45, 0.4, 0.05]} />
      </mesh>

      <mesh material={materials.cabin} position={[1.6, 0.2, 0.65]}>
        <boxGeometry args={[0.1, 0.2, 0.05]} />
      </mesh>
      <mesh material={materials.window} position={[1.61, 0.2, 0.67]}>
        <boxGeometry args={[0.01, 0.18, 0.03]} />
      </mesh>
      
      <mesh material={materials.cabin} position={[1.6, 0.2, -0.65]}>
        <boxGeometry args={[0.1, 0.2, 0.05]} />
      </mesh>
      <mesh material={materials.window} position={[1.61, 0.2, -0.67]}>
        <boxGeometry args={[0.01, 0.18, 0.03]} />
      </mesh>

      <mesh material={materials.grille} position={[1.86, -0.05, 0]} castShadow>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
      </mesh>

      <mesh material={materials.headlight} position={[1.86, -0.05, 0.42]} castShadow>
        <boxGeometry args={[0.05, 0.18, 0.22]} />
      </mesh>
      <mesh material={materials.headlight} position={[1.86, -0.05, -0.42]} castShadow>
        <boxGeometry args={[0.05, 0.18, 0.22]} />
      </mesh>

      {/* Realistic Headlight Beams */}
      {isDark && (() => {
        // Create internal targets that stay with the truck
        const leftTarget = new THREE.Object3D();
        leftTarget.position.set(15, -0.5, 0.42);
        
        const rightTarget = new THREE.Object3D();
        rightTarget.position.set(15, -0.5, -0.42);

        return (
          <group position={[1.9, -0.05, 0]}>
            <primitive object={leftTarget} />
            <primitive object={rightTarget} />
            
            <spotLight
              position={[0, 0, 0.42]}
              target={leftTarget}
              angle={0.3}
              penumbra={0.2}
              intensity={80}
              distance={50}
              decay={0}
              color="#ffffff"
            />
            <spotLight
              position={[0, 0, -0.42]}
              target={rightTarget}
              angle={0.3}
              penumbra={0.2}
              intensity={80}
              distance={50}
              decay={0}
              color="#ffffff"
            />
          </group>
        );
      })()}

      <mesh material={materials.chassis} position={[1.85, -0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 1.2]} />
      </mesh>

      <mesh material={materials.taillight} position={[-1.76, -0.15, 0.45]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.2]} />
      </mesh>
      <mesh material={materials.taillight} position={[-1.76, -0.15, -0.45]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.2]} />
      </mesh>

      <mesh material={materials.chassis} position={[-1.85, -0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 1.2]} />
      </mesh>

      {/* Wheels */}
      <group name="wheels">
        <group position={[1.2, -0.4, 0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
        <group position={[1.2, -0.4, -0.58]}>
          <mesh material={materials.wheel} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.2, 32]} /></mesh>
          <mesh material={materials.hubcap} position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.05, 16]} /></mesh>
        </group>
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
  progress?: number;
  waitingDays?: number;
  isDark?: boolean;
}

function Scene({ type, progress = 0, waitingDays = 0, isDark = false }: AnimatedSceneProps) {
  const containerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!containerRef.current) return;
    
    if (type === 'loop') {
      containerRef.current.position.x += delta * 2;
      if (containerRef.current.position.x > 5) {
        containerRef.current.position.x = -5;
      }
    } else if (type === 'arrive') {
      const targetX = -4 + (progress * 4); 
      containerRef.current.position.x = THREE.MathUtils.lerp(containerRef.current.position.x, targetX, 0.1);
      containerRef.current.position.z = 0; 
    } else if (type === 'depart') {
      const targetX = 0 + (progress * 5);
      containerRef.current.position.x = THREE.MathUtils.lerp(containerRef.current.position.x, targetX, 0.1);
      containerRef.current.position.z = 0;
    }
  });

  return (
    <group ref={containerRef} position={[-4, -0.42, 0]}>
      <TruckModel 
        isMoving={type === 'loop' || (type === 'arrive' && progress < 1) || (type === 'depart' && progress > 0)} 
        waitingDays={waitingDays}
        isDark={isDark}
      />
    </group>
  );
}

function Tree({ position, isDark }: { position: [number, number, number], isDark: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.8]} />
        <meshStandardMaterial color={isDark ? "#2d1b10" : "#78350f"} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.7, 1.4, 8]} />
        <meshStandardMaterial color={isDark ? "#06200f" : "#166534"} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.5, 1.0, 8]} />
        <meshStandardMaterial color={isDark ? "#052e16" : "#15803d"} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Building({ position, color, height, isDark }: { position: [number, number, number], color: string, height: number, isDark: boolean }) {
  const windows = useMemo(() => {
    const wins = [];
    const rows = Math.floor(height * 2.2);
    const cols = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.2) {
          wins.push([
            (c - 0.5) * 0.7,
            0.6 + r * 0.45,
            0.51
          ]);
        }
      }
    }
    return wins;
  }, [height]);

  return (
    <group position={position}>
      {/* Main Structure */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, height, 1]} />
        <meshStandardMaterial color={isDark ? "#1e293b" : color} roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Roof Detail */}
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[1.4, 0.1, 1.1]} />
        <meshStandardMaterial color={isDark ? "#0f172a" : "#475569"} />
      </mesh>
      
      {/* Tiny Antenna/Utility on roof */}
      {height > 6 && (
        <mesh position={[0.3, height + 0.3, 0.2]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      )}

      {/* Building Base / Entrance */}
      <mesh position={[0, 0.2, 0.05]}>
        <boxGeometry args={[1.31, 0.4, 1.02]} />
        <meshStandardMaterial color={isDark ? "#0f172a" : "#94a3b8"} />
      </mesh>

      {/* Story Separators (Visual detail) */}
      {Array.from({ length: Math.floor(height) }).map((_, i) => (
         <mesh key={i} position={[0, i + 0.5, 0]}>
            <boxGeometry args={[1.32, 0.02, 1.02]} />
            <meshStandardMaterial color={isDark ? "#334155" : "#cbd5e1"} opacity={0.5} transparent />
         </mesh>
      ))}

      {/* Glowing Windows */}
      {isDark && windows.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.25, 0.2, 0.02]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

function StreetLamp({ position, isDark }: { position: [number, number, number], isDark: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 2, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.2, 2, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.5, 0.08, 0.15]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <group position={[0.45, 1.95, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial 
            color={isDark ? "#fff9c4" : "#ffffff"} 
            emissive={isDark ? "#fff9c4" : "#ffffff"} 
            emissiveIntensity={isDark ? 8 : 0} 
          />
        </mesh>
        {isDark && (
          <spotLight position={[0, 0, 0]} intensity={10} distance={6} angle={0.8} penumbra={0.5} color="#fff9c4" target-position={[0, -5, 0]} />
        )}
      </group>
    </group>
  );
}

function HybridEnvironment({ isMoving, isDark }: { isMoving: boolean, isDark: boolean }) {
  const elementsRef = useRef<THREE.Group>(null);
  const roadLinesRef = useRef<THREE.Group>(null);
  const totalLength = 80;

  const envElements = useMemo(() => {
    const elements = [];
    const colors = ["#94a3b8", "#64748b", "#475569", "#cbd5e1", "#334155"];
    
    const count = 30;
    for (let i = 0; i < count; i++) {
        // Add random X scatter so they aren't perfectly rhythmic
        const xOffset = (Math.random() - 0.5) * 2;
        const x = -totalLength / 2 + (i * (totalLength / count)) + xOffset;
        const side = i % 2 === 0 ? 1 : -1;
        
        if (i < 15) {
            // Woods Section: Varied depths for a natural forest look
            const z = side * (3.5 + Math.random() * 5);
            elements.push({ type: 'tree', x, z });
        } else {
            // City Section: Varied setbacks for a realistic urban skyline
            const z = side * (7 + Math.random() * 8);
            elements.push({ type: 'building', x, z, height: 4 + Math.random() * 10, color: colors[i % colors.length] });
            
            if (i % 2 === 0) {
              // Place lamps relative to buildings but with slight variation
              elements.push({ type: 'lamp', x: x + 1, z: side * (2.4 + Math.random() * 0.5) });
            }
        }
    }
    return elements;
  }, []);

  useFrame((state, delta) => {
    if (isMoving && elementsRef.current && roadLinesRef.current) {
        const speed = delta * 6;
        elementsRef.current.children.forEach((el) => {
            el.position.x -= speed;
            if (el.position.x < -40) el.position.x = 40;
        });
        roadLinesRef.current.children.forEach((line) => {
            line.position.x -= speed;
            if (line.position.x < -10) line.position.x = 10;
        });
    }
  });

  return (
    <group>
      {/* Lush Grass Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={isDark ? "#062e16" : "#4ade80"} roughness={1} />
      </mesh>
      
      {/* Shoulder / Gravel edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.655, 0]} receiveShadow>
        <planeGeometry args={[100, 6.5]} />
        <meshStandardMaterial color={isDark ? "#1e293b" : "#94a3b8"} roughness={0.9} />
      </mesh>

      {/* Main Asphalt Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
        <planeGeometry args={[100, 4.8]} />
        <meshStandardMaterial color={isDark ? "#0f172a" : "#1e293b"} roughness={0.7} metalness={0.05} />
      </mesh>

      <group ref={roadLinesRef}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-15 + i * 4, -0.64, 0]}>
            <planeGeometry args={[1.5, 0.12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      <group ref={elementsRef}>
        {envElements.map((el, i) => {
            if (el.type === 'tree') return <Tree key={i} position={[el.x, -0.65, el.z] as [number, number, number]} isDark={isDark} />;
            if (el.type === 'building') return <Building key={i} position={[el.x, -0.65, el.z!] as [number, number, number]} isDark={isDark} height={el.height!} color={el.color!} />;
            if (el.type === 'lamp') return <StreetLamp key={i} position={[el.x, -0.65, el.z] as [number, number, number]} isDark={isDark} />;
            return null;
        })}
      </group>
    </group>
  );
}

export function AnimatedCar({ type = 'loop', progress = 0, waitingDays = 0 }: { type?: 'loop' | 'arrive' | 'depart', progress?: number, waitingDays?: number }) {
  const isMoving = type === 'loop' || (type === 'arrive' && progress < 1) || (type === 'depart' && progress > 0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ mixBlendMode: 'normal' }}>
      <Canvas camera={{ position: [0, 1.4, 6.5], fov: 32 }} shadows>
        <color attach="background" args={[isDark ? '#111827' : '#87CEEB']} />
        <fog attach="fog" args={[isDark ? '#111827' : '#87CEEB', 12, 40]} />

        <ambientLight intensity={isDark ? 0.8 : 1.2} color={isDark ? "#bfdbfe" : "#ffffff"} />
        <directionalLight 
          position={[15, 25, 10]} 
          intensity={isDark ? 1.6 : 3} 
          color={isDark ? "#bfdbfe" : "#fef9c3"} 
          castShadow 
          shadow-camera-left={-15} 
          shadow-camera-right={15} 
          shadow-camera-top={15} 
          shadow-camera-bottom={-15} 
        />
        
        <HybridEnvironment isMoving={isMoving} isDark={isDark} />
        <Scene type={type} progress={progress} waitingDays={waitingDays} isDark={isDark} />
        
        <ContactShadows 
          position={[0, -0.65, 0]} 
          opacity={isDark ? 0.3 : 0.6} 
          scale={25} 
          blur={2.8} 
          far={5} 
          color="#000000" 
        />
      </Canvas>
    </div>
  );
}
