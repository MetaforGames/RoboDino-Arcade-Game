import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RobotVelociraptor({ isJumping, speed, isDashing, isGolden }: { isJumping: boolean, speed: number, isDashing?: boolean, isGolden?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  
  const mainColor=isGolden ? "#FBBF24" : "#D62828";  // Dino Red
  const darkColor=isGolden ? "#B45309" : "#1A1A1A";  // Stealth Black
  const grayColor=isGolden ? "#FEF3C7" : "#404040";  // Dark Gray
  const glowColor="#F97316";  // Orange/Yellow Core
  const eyeColor="#FACC15";   // Yellow eyes

  useFrame((state, delta) => {
    if (isJumping) {
      if (leftLeg.current) leftLeg.current.rotation.x = -0.5;
      if (rightLeg.current) rightLeg.current.rotation.x = 0.2;
      if (leftArm.current) leftArm.current.rotation.x = -0.8;
      if (rightArm.current) rightArm.current.rotation.x = -0.8;
    } else {
      if (speed > 0) {
          const walkCycle = Math.sin(state.clock.elapsedTime * speed * 0.5);
          if (leftLeg.current) leftLeg.current.rotation.x = walkCycle * 0.8;
          if (rightLeg.current) rightLeg.current.rotation.x = -walkCycle * 0.8;
          if (leftArm.current) leftArm.current.rotation.x = -walkCycle * 0.5;
          if (rightArm.current) rightArm.current.rotation.x = walkCycle * 0.5;
      } else {
          // Idle animation
          if (leftLeg.current) leftLeg.current.rotation.x = 0;
          if (rightLeg.current) rightLeg.current.rotation.x = 0;
          if (leftArm.current) leftArm.current.rotation.x = 0;
          if (rightArm.current) rightArm.current.rotation.x = 0;
          if (group.current) {
             group.current.position.y = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
          }
      }
    }
  });

  return (
    <group ref={group} position={[0, 0.4, 0]} castShadow>
        {/* Core Body (Upright Humanoid) */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.9, 0.5]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
        
        {/* Chest Armor */}
        <mesh position={[0, 1.3, 0.26]} castShadow>
          <boxGeometry args={[0.8, 0.6, 0.1]} />
          <meshStandardMaterial color={mainColor} />
        </mesh>

        {/* Reactor Core */}
        <mesh position={[0, 1.2, 0.35]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 1.2, 0.32]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.05]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
        
        {/* Head */}
        <group position={[0, 1.8, 0.2]}>
           {/* Neck */}
           <mesh position={[0, -0.2, -0.1]}>
             <boxGeometry args={[0.3, 0.4, 0.3]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
           {/* Cranium */}
           <mesh position={[0, 0.1, 0]}>
             <boxGeometry args={[0.45, 0.4, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Snout */}
           <mesh position={[0, 0, 0.4]}>
             <boxGeometry args={[0.35, 0.25, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0, -0.15, 0.4]}>
             <boxGeometry args={[0.25, 0.15, 0.45]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           
           {/* Ears / Side panels */}
           <mesh position={[-0.25, 0.1, -0.1]}>
             <boxGeometry args={[0.1, 0.3, 0.3]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.25, 0.1, -0.1]}>
             <boxGeometry args={[0.1, 0.3, 0.3]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>

           {/* Eyes */}
           <mesh position={[-0.23, 0.15, 0.15]} rotation={[0, -0.2, 0]}>
             <boxGeometry args={[0.05, 0.08, 0.2]} />
             <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2.5} />
           </mesh>
           <mesh position={[0.23, 0.15, 0.15]} rotation={[0, 0.2, 0]}>
             <boxGeometry args={[0.05, 0.08, 0.2]} />
             <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2.5} />
           </mesh>
        </group>

        {/* Spine Details (Replacing Tail) */}
        <group position={[0, 1.4, -0.3]}>
           <mesh position={[0, 0.2, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.15, 0.3, 0.15]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.1, 0.1, 0.1]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0, -0.1, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.15, 0.3, 0.15]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0, 0.0, -0.05]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.1, 0.1, 0.1]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
        </group>

        {/* Arms */}
        <group ref={leftArm} position={[-0.45, 1.5, 0]}>
           {/* Shoulder */}
           <mesh position={[-0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.3, 0.4, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Upper Arm */}
           <mesh position={[-0.1, -0.35, 0]} castShadow>
             <boxGeometry args={[0.15, 0.4, 0.15]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Lower Arm */}
           <mesh position={[-0.1, -0.7, 0.1]} rotation={[-0.2, 0, 0]} castShadow>
             <boxGeometry args={[0.15, 0.5, 0.2]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Claws */}
           <mesh position={[-0.1, -0.95, 0.2]} castShadow>
             <boxGeometry args={[0.05, 0.2, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>

        <group ref={rightArm} position={[0.45, 1.5, 0]}>
           {/* Shoulder */}
           <mesh position={[0.1, 0, 0]} castShadow>
             <boxGeometry args={[0.3, 0.4, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -0.35, 0]} castShadow>
             <boxGeometry args={[0.15, 0.4, 0.15]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0.1, -0.7, 0.1]} rotation={[-0.2, 0, 0]} castShadow>
             <boxGeometry args={[0.15, 0.5, 0.2]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -0.95, 0.2]} castShadow>
             <boxGeometry args={[0.05, 0.2, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>

        {/* Legs */}
        <group ref={leftLeg} position={[-0.3, 0.8, 0]}>
           {/* Thigh */}
           <mesh position={[-0.1, -0.2, 0]} castShadow>
             <boxGeometry args={[0.3, 0.5, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Knee */}
           <mesh position={[-0.1, -0.5, 0.1]} castShadow>
             <boxGeometry args={[0.2, 0.2, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
           {/* Shin */}
           <mesh position={[-0.1, -0.8, 0]} castShadow>
             <boxGeometry args={[0.25, 0.5, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           {/* Foot */}
           <mesh position={[-0.1, -1.1, 0.1]} castShadow>
             <boxGeometry args={[0.3, 0.2, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           {/* Raptor Claw */}
           <mesh position={[-0.1, -1.0, 0.35]} rotation={[-0.5, 0, 0]} castShadow>
             <boxGeometry args={[0.05, 0.3, 0.1]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>
        <group ref={rightLeg} position={[0.3, 0.8, 0]}>
           <mesh position={[0.1, -0.2, 0]} castShadow>
             <boxGeometry args={[0.3, 0.5, 0.4]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -0.5, 0.1]} castShadow>
             <boxGeometry args={[0.2, 0.2, 0.2]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
           <mesh position={[0.1, -0.8, 0]} castShadow>
             <boxGeometry args={[0.25, 0.5, 0.3]} />
             <meshStandardMaterial color={darkColor} />
           </mesh>
           <mesh position={[0.1, -1.1, 0.1]} castShadow>
             <boxGeometry args={[0.3, 0.2, 0.5]} />
             <meshStandardMaterial color={mainColor} />
           </mesh>
           <mesh position={[0.1, -1.0, 0.35]} rotation={[-0.5, 0, 0]} castShadow>
             <boxGeometry args={[0.05, 0.3, 0.1]} />
             <meshStandardMaterial color={grayColor} />
           </mesh>
        </group>
        
        {/* Dash Effect */}
        {isDashing && (
          <mesh position={[0, 1, -1]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[1, 0, 3, 8]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} transparent opacity={0.3} wireframe />
          </mesh>
        )}
    </group>
  );
}

