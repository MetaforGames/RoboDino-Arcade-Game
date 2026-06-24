import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RobotTriceratops({ isJumping, speed, isDashing, isGolden }: { isJumping: boolean, speed: number, isDashing?: boolean, isGolden?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  
  const mainColor=isGolden ? "#FBBF24" : "#2A4365";  // Dark Blue
  const yellowColor=isGolden ? "#FEF3C7" : "#EAB308"; // Yellow Accent
  const darkColor=isGolden ? "#B45309" : "#1E293B";  // Dark Gray Base
  const glowColor="#F59E0B";  // Orange Core
  const eyeColor="#06B6D4";   // Cyan Eyes

  useFrame((state, delta) => {
    if (isJumping) {
      if (leftLeg.current) leftLeg.current.rotation.x = -0.3;
      if (rightLeg.current) rightLeg.current.rotation.x = 0.3;
      if (leftArm.current) leftArm.current.rotation.x = -0.5;
      if (rightArm.current) rightArm.current.rotation.x = -0.5;
    } else {
      if (speed > 0) {
          const walkCycle = Math.sin(state.clock.elapsedTime * speed * 0.4);
          if (leftLeg.current) leftLeg.current.rotation.x = walkCycle * 0.6;
          if (rightLeg.current) rightLeg.current.rotation.x = -walkCycle * 0.6;
          if (leftArm.current) leftArm.current.rotation.x = -walkCycle * 0.4;
          if (rightArm.current) rightArm.current.rotation.x = walkCycle * 0.4;
      } else {
          if (leftLeg.current) leftLeg.current.rotation.x = 0;
          if (rightLeg.current) rightLeg.current.rotation.x = 0;
          if (leftArm.current) leftArm.current.rotation.x = 0;
          if (rightArm.current) rightArm.current.rotation.x = 0;
          if (group.current) {
             group.current.position.y = -0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
          }
      }
    }
  });

  return (
    <group ref={group} position={[0, -0.1, 0]} scale={[0.8, 0.8, 0.8]} castShadow>
        {/* Core Body (Bulky Humanoid) */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.0, 1.1, 0.7]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
        
        {/* Spine Details (Replacing Tail) */}
        <group position={[0, 1.4, -0.4]}>
          <mesh position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.2, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.1, 0.2, 0.1]} />
             <meshStandardMaterial color={yellowColor} />
          </mesh>
          <mesh position={[0, 0, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.2, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, 0.1, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.1, 0.2, 0.1]} />
             <meshStandardMaterial color={yellowColor} />
          </mesh>
          <mesh position={[0, -0.3, -0.1]} rotation={[0, 0, 0]}>
             <boxGeometry args={[0.2, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, -0.2, -0.1]} rotation={[0, 0, 0]}>
             <boxGeometry args={[0.1, 0.2, 0.1]} />
             <meshStandardMaterial color={yellowColor} />
          </mesh>
        </group>

        {/* Chest Armor with Yellow details */}
        <mesh position={[0, 1.5, 0.36]} castShadow>
          <boxGeometry args={[1.1, 0.7, 0.1]} />
          <meshStandardMaterial color={mainColor} />
        </mesh>
        {/* Chest Side Yellow Accents */}
        <mesh position={[-0.45, 1.6, 0.4]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.05]} />
          <meshStandardMaterial color={yellowColor} />
        </mesh>
        <mesh position={[0.45, 1.6, 0.4]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.05]} />
          <meshStandardMaterial color={yellowColor} />
        </mesh>

        {/* Tricore Reactor */}
        <mesh position={[0, 1.3, 0.42]} castShadow>
          <boxGeometry args={[0.35, 0.35, 0.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0, 1.3, 0.38]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>

        {/* Head */}
        <group position={[0, 2.2, 0.2]}>
           {/* Face Base */}
           <mesh position={[0, 0, 0]}>
             <boxGeometry args={[0.6, 0.5, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Snout Area */}
           <mesh position={[0, -0.15, 0.4]}>
             <boxGeometry args={[0.5, 0.3, 0.4]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0, -0.05, 0.4]}>
             <boxGeometry args={[0.3, 0.1, 0.45]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           
           {/* Nose Horn */}
           <mesh position={[0, 0.2, 0.5]} rotation={[0.3, 0, 0]}>
             <cylinderGeometry args={[0.02, 0.08, 0.4, 8]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>

           {/* Eyes */}
           <mesh position={[-0.31, 0.1, 0.25]}>
             <boxGeometry args={[0.05, 0.08, 0.15]} />
             <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={3} />
           </mesh>
           <mesh position={[0.31, 0.1, 0.25]}>
             <boxGeometry args={[0.05, 0.08, 0.15]} />
             <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={3} />
           </mesh>

           {/* Frill Base */}
           <mesh position={[0, 0.2, -0.3]} rotation={[-0.2, 0, 0]}>
             <boxGeometry args={[1.2, 0.9, 0.2]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>

           {/* Frill Yellow Horns/Spikes */}
           <mesh position={[-0.5, 0.7, -0.3]} rotation={[0, 0, 0.2]}>
             <cylinderGeometry args={[0.02, 0.1, 0.5, 8]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           <mesh position={[0.5, 0.7, -0.3]} rotation={[0, 0, -0.2]}>
             <cylinderGeometry args={[0.02, 0.1, 0.5, 8]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           {/* Top Horns (Eyebrow horns) */}
           <mesh position={[-0.25, 0.5, 0.1]} rotation={[0.4, 0, -0.1]}>
             <cylinderGeometry args={[0.02, 0.12, 0.7, 8]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           <mesh position={[0.25, 0.5, 0.1]} rotation={[0.4, 0, 0.1]}>
             <cylinderGeometry args={[0.02, 0.12, 0.7, 8]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
        </group>

        {/* Arms (Thick and armored) */}
        <group ref={leftArm} position={[-0.6, 1.7, 0]}>
           {/* Bulky Shoulder */}
           <mesh position={[-0.2, 0, 0]} castShadow>
             <boxGeometry args={[0.6, 0.6, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Shoulder Yellow Accent */}
           <mesh position={[-0.2, 0.32, 0]} castShadow>
             <boxGeometry args={[0.4, 0.05, 0.4]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>

           {/* Upper Arm */}
           <mesh position={[-0.2, -0.4, 0]} castShadow>
             <boxGeometry args={[0.3, 0.5, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Lower Arm (Gauntlet) */}
           <mesh position={[-0.2, -0.9, 0.1]} rotation={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.4, 0.6, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Gauntlet Yellow Accent */}
           <mesh position={[-0.2, -0.9, 0.32]} rotation={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.2, 0.4, 0.05]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           {/* Fist */}
           <mesh position={[-0.2, -1.3, 0.15]} castShadow>
             <boxGeometry args={[0.3, 0.3, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
        </group>

        <group ref={rightArm} position={[0.6, 1.7, 0]}>
           <mesh position={[0.2, 0, 0]} castShadow>
             <boxGeometry args={[0.6, 0.6, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.2, 0.32, 0]} castShadow>
             <boxGeometry args={[0.4, 0.05, 0.4]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           
           <mesh position={[0.2, -0.4, 0]} castShadow>
             <boxGeometry args={[0.3, 0.5, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0.2, -0.9, 0.1]} rotation={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.4, 0.6, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.2, -0.9, 0.32]} rotation={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.2, 0.4, 0.05]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           <mesh position={[0.2, -1.3, 0.15]} castShadow>
             <boxGeometry args={[0.3, 0.3, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
        </group>

        {/* Legs (Thick Bipedal) */}
        <group ref={leftLeg} position={[-0.4, 0.8, 0]}>
           {/* Thigh */}
           <mesh position={[-0.1, -0.1, 0]} castShadow>
             <boxGeometry args={[0.45, 0.6, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Knee Yellow Accent */}
           <mesh position={[-0.1, -0.4, 0.26]} castShadow>
             <boxGeometry args={[0.3, 0.2, 0.05]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           {/* Lower Leg */}
           <mesh position={[-0.1, -0.7, 0]} castShadow>
             <boxGeometry args={[0.4, 0.6, 0.4]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Foot */}
           <mesh position={[-0.1, -1.1, 0.1]} castShadow>
             <boxGeometry args={[0.5, 0.3, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Toes (Yellow) */}
           <mesh position={[-0.1, -1.1, 0.45]} castShadow>
             <boxGeometry args={[0.4, 0.15, 0.2]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
        </group>

        <group ref={rightLeg} position={[0.4, 0.8, 0]}>
           <mesh position={[0.1, -0.1, 0]} castShadow>
             <boxGeometry args={[0.45, 0.6, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -0.4, 0.26]} castShadow>
             <boxGeometry args={[0.3, 0.2, 0.05]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
           <mesh position={[0.1, -0.7, 0]} castShadow>
             <boxGeometry args={[0.4, 0.6, 0.4]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0.1, -1.1, 0.1]} castShadow>
             <boxGeometry args={[0.5, 0.3, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -1.1, 0.45]} castShadow>
             <boxGeometry args={[0.4, 0.15, 0.2]} />
             <meshStandardMaterial color={yellowColor} />
           </mesh>
        </group>

        {/* Special Dash / Barge Effect Shield */}
        {isDashing && (
          <mesh position={[0, 1.4, 1.5]} rotation={[0, 0, Math.PI/4]}>
             <boxGeometry args={[2.5, 2.5, 0.1]} />
             <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={3} transparent opacity={0.6} wireframe />
          </mesh>
        )}
    </group>
  );
}
