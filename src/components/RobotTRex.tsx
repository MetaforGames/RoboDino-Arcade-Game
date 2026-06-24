import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RobotTRex({ isJumping, speed, isDashing, isGolden }: { isJumping: boolean, speed: number, isDashing?: boolean, isGolden?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  
  const mainColor=isGolden ? "#FBBF24" : "#4CAF50"; // Jungle Green
  const darkColor=isGolden ? "#B45309" : "#1C1917"; // Stealth Black
  const grayColor=isGolden ? "#FEF3C7" : "#57534E"; // Steel Gray
  const glowColor="#FACC15"; // Yellow/Orange Core

  useFrame((state, delta) => {
    if (isJumping) {
      if (leftLeg.current) leftLeg.current.rotation.x = -0.4;
      if (rightLeg.current) rightLeg.current.rotation.x = 0.3;
      if (leftArm.current) leftArm.current.rotation.x = -0.5;
      if (rightArm.current) rightArm.current.rotation.x = -0.5;
    } else {
      if (speed > 0) {
          const walkCycle = Math.sin(state.clock.elapsedTime * speed * 0.4);
          if (leftLeg.current) leftLeg.current.rotation.x = walkCycle * 0.7;
          if (rightLeg.current) rightLeg.current.rotation.x = -walkCycle * 0.7;
          if (leftArm.current) leftArm.current.rotation.x = -walkCycle * 0.3 + 0.2;
          if (rightArm.current) rightArm.current.rotation.x = walkCycle * 0.3 + 0.2;
      } else {
          if (leftLeg.current) leftLeg.current.rotation.x = 0;
          if (rightLeg.current) rightLeg.current.rotation.x = 0;
          if (leftArm.current) leftArm.current.rotation.x = 0;
          if (rightArm.current) rightArm.current.rotation.x = 0;
          if (group.current) {
             group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
          }
      }
    }

    if (jaw.current) {
       if (isDashing) {
          jaw.current.rotation.x = 0.5; // Bite Open
       } else {
          jaw.current.rotation.x = 0.1; // Closed slightly open
       }
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]} scale={[0.8, 0.8, 0.8]} castShadow>
        {/* Core Body (Heavy Humanoid) */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.2, 1.4, 0.8]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
        {/* Chest Armor */}
        <mesh position={[0, 1.5, 0.45]} castShadow>
          <boxGeometry args={[1.0, 0.9, 0.1]} />
          <meshStandardMaterial color={mainColor} />
        </mesh>

        {/* Rex Core Reactor */}
        <mesh position={[0, 1.3, 0.52]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0, 1.3, 0.48]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.05]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>

        {/* Spine Details (Replacing Tail) */}
        <group position={[0, 1.4, -0.45]}>
          <mesh position={[0, 0.4, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.25, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.15, 0.2, 0.15]} />
             <meshStandardMaterial color={grayColor} />
          </mesh>
          <mesh position={[0, 0, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.25, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, 0.1, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.15, 0.2, 0.15]} />
             <meshStandardMaterial color={grayColor} />
          </mesh>
          <mesh position={[0, -0.4, -0.1]} rotation={[0, 0, 0]}>
             <boxGeometry args={[0.25, 0.4, 0.2]} />
             <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh position={[0, -0.3, -0.1]} rotation={[0, 0, 0]}>
             <boxGeometry args={[0.15, 0.2, 0.15]} />
             <meshStandardMaterial color={grayColor} />
          </mesh>
        </group>

        {/* Head */}
        <group position={[0, 2.5, 0.2]} rotation={[0.2, 0, 0]}>
           {/* Neck/Base */}
           <mesh position={[0, -0.2, 0]}>
             <boxGeometry args={[0.6, 0.4, 0.6]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Top Snout / Cranium */}
           <mesh position={[0, 0.2, 0.4]}>
             <boxGeometry args={[0.8, 0.5, 1.1]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Back of Head */}
           <mesh position={[0, 0.1, -0.2]}>
             <boxGeometry args={[0.9, 0.7, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           
           {/* Jaw */}
           <group ref={jaw} position={[0, -0.1, 0.1]}>
              <mesh position={[0, -0.1, 0.3]} castShadow>
                <boxGeometry args={[0.7, 0.3, 1.0]} />
                <meshStandardMaterial color={mainColor} />
              </mesh>
              {/* Teeth Top (attached to snout) */}
              <mesh position={[0, 0.0, 0.5]}>
                <boxGeometry args={[0.75, 0.1, 0.9]} />
                <meshStandardMaterial color="#E5E7EB" />
              </mesh>
              {/* Teeth Bottom */}
              <mesh position={[0, 0.05, 0.3]}>
                <boxGeometry args={[0.65, 0.1, 0.9]} />
                <meshStandardMaterial color="#E5E7EB" />
              </mesh>
           </group>

           {/* Eyes (Glowing Yellow) */}
           <mesh position={[-0.41, 0.3, 0.2]}>
             <boxGeometry args={[0.05, 0.1, 0.2]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3} />
           </mesh>
           <mesh position={[0.41, 0.3, 0.2]}>
             <boxGeometry args={[0.05, 0.1, 0.2]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3} />
           </mesh>
        </group>

        {/* Arms (Small but armored) */}
        <group ref={leftArm} position={[-0.7, 1.7, 0.2]}>
           <mesh position={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.3, 0.3, 0.3]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[-0.1, -0.3, 0.1]} rotation={[-0.3, 0, 0]} castShadow>
             <boxGeometry args={[0.2, 0.4, 0.2]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
        </group>
        <group ref={rightArm} position={[0.7, 1.7, 0.2]}>
           <mesh position={[0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.3, 0.3, 0.3]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -0.3, 0.1]} rotation={[-0.3, 0, 0]} castShadow>
             <boxGeometry args={[0.2, 0.4, 0.2]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
        </group>

        {/* Legs (Very bulky) */}
        <group ref={leftLeg} position={[-0.5, 0.8, 0]}>
           {/* Thigh */}
           <mesh position={[-0.2, -0.1, 0]} castShadow>
             <boxGeometry args={[0.5, 0.8, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Lower Leg */}
           <mesh position={[-0.2, -0.8, 0]} castShadow>
             <boxGeometry args={[0.4, 0.7, 0.4]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Foot */}
           <mesh position={[-0.2, -1.2, 0.2]} castShadow>
             <boxGeometry args={[0.5, 0.3, 0.7]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Toes (Steel Gray) */}
           <mesh position={[-0.2, -1.2, 0.6]} castShadow>
             <boxGeometry args={[0.4, 0.15, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>
        <group ref={rightLeg} position={[0.5, 0.8, 0]}>
           <mesh position={[0.2, -0.1, 0]} castShadow>
             <boxGeometry args={[0.5, 0.8, 0.6]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.2, -0.8, 0]} castShadow>
             <boxGeometry args={[0.4, 0.7, 0.4]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0.2, -1.2, 0.2]} castShadow>
             <boxGeometry args={[0.5, 0.3, 0.7]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.2, -1.2, 0.6]} castShadow>
             <boxGeometry args={[0.4, 0.15, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>

        {/* Dashing/Biting Particles Frame */}
        {isDashing && (
          <group position={[0, 2.5, 1.2]}>
             <mesh scale={[1.2, 1.2, 1.2]}>
               <sphereGeometry args={[0.8, 8, 8]} />
               <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} transparent opacity={0.5} wireframe />
             </mesh>
          </group>
        )}
    </group>
  );
}
