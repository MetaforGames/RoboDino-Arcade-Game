import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Environment, Cloud, Stars, useTexture, Cone, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DinoType, DINO_STATS } from '../types';
import { audioEngine } from '../lib/audio';

import { Zap } from 'lucide-react';
import { RobotVelociraptor } from './RobotVelociraptor';
import { RobotTriceratops } from './RobotTriceratops';
import { RobotTRex } from './RobotTRex';
const LANE_WIDTH = 2;
const TRACK_RADIUS = 30;

export interface PathChunk {
   id: number;
   type: 'straight' | 'curve_left' | 'curve_right';
   startDist: number;
   endDist: number;
   startPoint: THREE.Vector3;
   startAngle: number;
   length: number;
   radius: number;
}

export function createChunk(prev: PathChunk | null, type: PathChunk['type'], lengthOrRadius: number, id: number): PathChunk {
   const startDist = prev ? prev.endDist : 0;
   const p = prev ? getPathPoint(prev, prev.endDist) : { pos: new THREE.Vector3(0, 0, 0), angle: 0 };
   
   let length = lengthOrRadius;
   let radius = 0;
   if (type !== 'straight') {
       radius = lengthOrRadius;
       length = radius * (Math.PI / 2);
   }

   return {
      id, type, startDist, endDist: startDist + length,
      startPoint: p.pos, startAngle: p.angle, length, radius
   };
}

export function getPathPoint(chunk: PathChunk, dist: number) {
    const localDist = Math.max(0, Math.min(dist - chunk.startDist, chunk.length));
    if (chunk.type === 'straight') {
         return {
             pos: chunk.startPoint.clone().add(
                 new THREE.Vector3(0, 0, -localDist).applyAxisAngle(new THREE.Vector3(0, 1, 0), chunk.startAngle)
             ),
             angle: chunk.startAngle
         };
    } else {
         const isLeft = chunk.type === 'curve_left';
         const angleDiff = (localDist / chunk.radius) * (isLeft ? 1 : -1);
         const centerOffset = new THREE.Vector3((isLeft ? -chunk.radius : chunk.radius), 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), chunk.startAngle);
         const center = chunk.startPoint.clone().add(centerOffset);
         
         const curAngle = chunk.startAngle + angleDiff;
         const backOffset = new THREE.Vector3((isLeft ? chunk.radius : -chunk.radius), 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), curAngle);
         
         return {
             pos: center.add(backOffset),
             angle: curAngle
         };
    }
}

export class PathManager {
    chunks: PathChunk[] = [];
    nextChunkId = 0;
    
    constructor() {
        this.addChunk('straight', 400); 
    }

    addChunk(type: PathChunk['type'], size: number) {
        const prev = this.chunks.length > 0 ? this.chunks[this.chunks.length - 1] : null;
        this.chunks.push(createChunk(prev, type, size, this.nextChunkId++));
    }
    
    update(playerDist: number) {
        const lastChunk = this.chunks[this.chunks.length - 1];
        // Generate ahead
        if (lastChunk.endDist < playerDist + 400) {
           if (lastChunk.type === 'straight' && lastChunk.length > 200) {
                const turn = Math.random() > 0.5 ? 'curve_left' : 'curve_right';
                this.addChunk(turn, TRACK_RADIUS); // 90-degree turn
                this.addChunk('straight', 200 + Math.random() * 200);
           } else {
               this.addChunk('straight', 200);
           }
        }
        
        while (this.chunks.length > 3 && this.chunks[1].endDist < playerDist - 100) {
           this.chunks.shift();
        }
    }
    
    getPoint(dist: number) {
        const chunk = this.chunks.find(c => dist >= c.startDist && dist <= c.endDist) || this.chunks[this.chunks.length - 1] || this.chunks[0];
        return getPathPoint(chunk, dist);
    }
    
    getChunkAt(dist: number) {
        return this.chunks.find(c => dist >= c.startDist && dist <= c.endDist) || this.chunks[this.chunks.length - 1] || this.chunks[0];
    }

    reset() {
        this.chunks = [];
        this.nextChunkId = 0;
        this.addChunk('straight', 400); 
    }
}
export const globalPath = new PathManager();

function HumanoidRobot({ dinoType, isJumping, speed }: { dinoType: DinoType, isJumping: boolean, speed: number }) {
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const color = DINO_STATS[dinoType].color;
  const secondaryColor = '#ffffff';
  const emissiveColor = '#facc15';

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Hover pose
    if (leftLeg.current) leftLeg.current.rotation.x = -0.2;
    if (rightLeg.current) rightLeg.current.rotation.x = 0.2;
    if (leftArm.current) leftArm.current.rotation.x = -0.5;
    if (rightArm.current) rightArm.current.rotation.x = -0.6;
  });

  return (
    <group position={[0, 0.5, 0]}>
        {/* Head */}
        <Box args={[0.5, 0.5, 0.5]} position={[0, 0.8, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8}/>
        </Box>
        {/* Eyes */}
        <Box args={[0.4, 0.1, 0.1]} position={[0, 0.85, 0.26]} castShadow>
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2}/>
        </Box>
        
        {/* Torso */}
        <Box args={[0.7, 0.9, 0.4]} position={[0, 0.1, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8}/>
        </Box>
        <Sphere args={[0.15]} position={[0, 0.1, 0.21]}>
           <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2}/>
        </Sphere>
        
        {/* Jetpack / Thruster */}
        <Box args={[0.4, 0.6, 0.3]} position={[0, 0.2, -0.3]} castShadow>
          <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8}/>
        </Box>
        <Cylinder args={[0.1, 0.15, 0.2]} position={[-0.15, -0.2, -0.3]} rotation={[0, 0, 0]}>
           <meshStandardMaterial color="#333" />
        </Cylinder>
        <Cylinder args={[0.1, 0.15, 0.2]} position={[0.15, -0.2, -0.3]} rotation={[0, 0, 0]}>
           <meshStandardMaterial color="#333" />
        </Cylinder>
        {/* Thruster Flames */}
        <Cone args={[0.1, 0.4, 8]} position={[-0.15, -0.5, -0.3]}>
           <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={3} />
        </Cone>
        <Cone args={[0.1, 0.4, 8]} position={[0.15, -0.5, -0.3]}>
           <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={3} />
        </Cone>

        {/* Arms */}
        <group ref={leftArm} position={[-0.45, 0.4, 0]}>
          <Box args={[0.2, 0.7, 0.2]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.8}/>
          </Box>
        </group>
        <group ref={rightArm} position={[0.45, 0.4, 0]}>
          <Box args={[0.2, 0.7, 0.2]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.8}/>
          </Box>
        </group>

        {/* Legs */}
        <group ref={leftLeg} position={[-0.2, -0.4, 0]}>
          <Box args={[0.25, 0.8, 0.25]} position={[0, -0.4, 0]} castShadow>
            <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8}/>
          </Box>
        </group>
        <group ref={rightLeg} position={[0.2, -0.4, 0]}>
          <Box args={[0.25, 0.8, 0.25]} position={[0, -0.4, 0]} castShadow>
            <meshStandardMaterial color={secondaryColor} roughness={0.2} metalness={0.8}/>
          </Box>
        </group>
    </group>
  );
}

function Triceratops({ speed, isJumping, isStatic }: { speed: number, isJumping: boolean, isStatic?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const flLeg = useRef<THREE.Group>(null);
  const frLeg = useRef<THREE.Group>(null);
  const blLeg = useRef<THREE.Group>(null);
  const brLeg = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const leftPupil = useRef<THREE.Mesh>(null);
  const rightPupil = useRef<THREE.Mesh>(null);
  
  const actionTimer = useRef(0);
  const blinkTimer = useRef(Math.random() * 3 + 2);
  const isBlinking = useRef(false);
  
  const [dustParticles, setDustParticles] = useState<{id: number, time: number}[]>([]);

  useEffect(() => {
     const handleBreak = (e: any) => {
        if (e.detail?.type === 'triceratops') {
           actionTimer.current = 0.5; // half second duration
           setDustParticles(p => [...p, { id: Date.now(), time: 0 }]);
        }
     };
     window.addEventListener('break-obstacle', handleBreak);
     return () => window.removeEventListener('break-obstacle', handleBreak);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (!isJumping) {
      if (speed > 0) {
          if (flLeg.current) flLeg.current.rotation.x = Math.sin(time * speed) * 0.5;
          if (frLeg.current) frLeg.current.rotation.x = Math.sin(time * speed + Math.PI) * 0.5;
          if (blLeg.current) blLeg.current.rotation.x = Math.sin(time * speed + Math.PI) * 0.5;
          if (brLeg.current) brLeg.current.rotation.x = Math.sin(time * speed) * 0.5;
      } else {
          // Idle animation
          if (flLeg.current) flLeg.current.rotation.x = 0;
          if (frLeg.current) frLeg.current.rotation.x = 0;
          if (blLeg.current) blLeg.current.rotation.x = 0;
          if (brLeg.current) brLeg.current.rotation.x = 0;
          if (group.current) {
             group.current.position.y = isStatic ? 0 : Math.sin(time * 2) * 0.05;
          }
      }
    } else {
      if (flLeg.current) flLeg.current.rotation.x = -0.3;
      if (frLeg.current) frLeg.current.rotation.x = -0.3;
      if (blLeg.current) blLeg.current.rotation.x = 0.5;
      if (brLeg.current) brLeg.current.rotation.x = 0.5;
    }

    if (actionTimer.current > 0) {
       actionTimer.current -= delta;
       const animProgress = 1.0 - Math.max(0, actionTimer.current / 0.5);
       let headAngle = 0;
       if (animProgress < 0.3) headAngle = -Math.PI / 6 * (animProgress / 0.3); // back
       else if (animProgress < 0.6) headAngle = Math.PI / 4 * ((animProgress - 0.3) / 0.3); // forward barge
       else headAngle = Math.PI / 4 * (1.0 - (animProgress - 0.6) / 0.4); // return
       
       if (headRef.current) headRef.current.rotation.x = headAngle;
    } else if (headRef.current) {
       headRef.current.rotation.x = 0;
    }

    if (isStatic) {
        blinkTimer.current -= delta;
        if (blinkTimer.current <= 0) {
           if (isBlinking.current) {
               isBlinking.current = false;
               blinkTimer.current = Math.random() * 4 + 2; // Next blink in 2-6s
           } else {
               isBlinking.current = true;
               blinkTimer.current = 0.3; // Blink duration
           }
        }
        
        if (leftEye.current && rightEye.current) {
             const eyeColor = isBlinking.current ? '#000000' : '#fef08a';
             (leftEye.current.material as THREE.MeshStandardMaterial).color.set(eyeColor);
             (rightEye.current.material as THREE.MeshStandardMaterial).color.set(eyeColor);
             const sY = isBlinking.current ? 0.4 : 1.0;
             leftEye.current.scale.set(1, sY, 1);
             rightEye.current.scale.set(1, sY, 1);
        }
        if (leftPupil.current && rightPupil.current) {
             leftPupil.current.visible = !isBlinking.current;
             rightPupil.current.visible = !isBlinking.current;
        }
    }
  });

  const bodyColor = '#4a5a73';
  const detailColor = '#facc15';

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {/* Body */}
      <Box args={[0.7, 0.6, 1.2]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </Box>
      <Box args={[0.6, 0.5, 0.4]} position={[0, -0.05, -0.8]} castShadow>
         <meshStandardMaterial color={bodyColor} />
      </Box>

      {/* Head */}
      <group ref={headRef} position={[0, 0.1, 0.7]}>
        <Box args={[0.5, 0.5, 0.6]} position={[0, 0, 0.2]} castShadow>
          <meshStandardMaterial color={bodyColor} />
        </Box>
        <Box args={[0.3, 0.3, 0.3]} position={[0, -0.1, 0.6]} castShadow>
           <meshStandardMaterial color={detailColor} />
        </Box>
        {/* Frill */}
        <Box args={[1.0, 0.8, 0.1]} position={[0, 0.4, -0.1]} rotation={[-0.3, 0, 0]} castShadow>
          <meshStandardMaterial color={bodyColor} />
        </Box>
        {/* Frill accents */}
        <Box args={[1.1, 0.9, 0.05]} position={[0, 0.4, -0.12]} rotation={[-0.3, 0, 0]} castShadow>
          <meshStandardMaterial color={detailColor} />
        </Box>
        {/* Horns */}
        <Cylinder args={[0, 0.05, 0.4]} position={[-0.15, 0.4, 0.3]} rotation={[Math.PI/2 - 0.2, 0, 0]} castShadow>
           <meshStandardMaterial color={detailColor} />
        </Cylinder>
        <Cylinder args={[0, 0.05, 0.4]} position={[0.15, 0.4, 0.3]} rotation={[Math.PI/2 - 0.2, 0, 0]} castShadow>
           <meshStandardMaterial color={detailColor} />
        </Cylinder>
        {/* Eyes */}
        <Box ref={leftEye} args={[0.08, 0.1, 0.08]} position={[-0.26, 0.1, 0.2]}>
           <meshStandardMaterial color="#fef08a" />
        </Box>
        <Box ref={rightEye} args={[0.08, 0.1, 0.08]} position={[0.26, 0.1, 0.2]}>
           <meshStandardMaterial color="#fef08a" />
        </Box>
        {/* Pupils */}
        <Box ref={leftPupil} args={[0.04, 0.06, 0.04]} position={[-0.28, 0.1, 0.2]}>
           <meshStandardMaterial color="#000000" />
        </Box>
        <Box ref={rightPupil} args={[0.04, 0.06, 0.04]} position={[0.28, 0.1, 0.2]}>
           <meshStandardMaterial color="#000000" />
        </Box>
      </group>

      {/* Tail */}
      <Box args={[0.3, 0.3, 0.6]} position={[0, 0.1, -0.9]} rotation={[-0.2, 0, 0]} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </Box>
      <Box args={[0.15, 0.15, 0.4]} position={[0, 0.0, -1.3]} rotation={[-0.3, 0, 0]} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </Box>

      {/* Legs */}
      <group ref={flLeg} position={[-0.35, -0.1, 0.5]}>
         <Box args={[0.2, 0.4, 0.2]} position={[0, -0.2, 0]} castShadow>
            <meshStandardMaterial color={bodyColor} />
         </Box>
         <Box args={[0.25, 0.1, 0.25]} position={[0, -0.35, 0.05]} castShadow>
            <meshStandardMaterial color={detailColor} />
         </Box>
      </group>
      <group ref={frLeg} position={[0.35, -0.1, 0.5]}>
         <Box args={[0.2, 0.4, 0.2]} position={[0, -0.2, 0]} castShadow>
            <meshStandardMaterial color={bodyColor} />
         </Box>
         <Box args={[0.25, 0.1, 0.25]} position={[0, -0.35, 0.05]} castShadow>
            <meshStandardMaterial color={detailColor} />
         </Box>
      </group>
      <group ref={blLeg} position={[-0.35, -0.1, -0.4]}>
         <Box args={[0.2, 0.4, 0.2]} position={[0, -0.2, 0]} castShadow>
            <meshStandardMaterial color={bodyColor} />
         </Box>
         <Box args={[0.25, 0.1, 0.25]} position={[0, -0.35, 0.05]} castShadow>
            <meshStandardMaterial color={detailColor} />
         </Box>
      </group>
      <group ref={brLeg} position={[0.35, -0.1, -0.4]}>
         <Box args={[0.2, 0.4, 0.2]} position={[0, -0.2, 0]} castShadow>
            <meshStandardMaterial color={bodyColor} />
         </Box>
         <Box args={[0.25, 0.1, 0.25]} position={[0, -0.35, 0.05]} castShadow>
            <meshStandardMaterial color={detailColor} />
         </Box>
      </group>
      {dustParticles.map(d => <StartDustBurst key={d.id} />)}
    </group>
  );
}

function Theropod({ speed, isJumping, dinoType, isStatic }: { speed: number, isJumping: boolean, dinoType: DinoType, isStatic?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const leftPupil = useRef<THREE.Mesh>(null);
  const rightPupil = useRef<THREE.Mesh>(null);
  
  const actionTimer = useRef(0);
  const blinkTimer = useRef(Math.random() * 3 + 2);
  const isBlinking = useRef(false);
  
  const stats = DINO_STATS[dinoType];
  const color = stats.color;
  const isTrex = dinoType === 'trex';

  const [dustParticles, setDustParticles] = useState<{id: number, time: number}[]>([]);

  useEffect(() => {
     const handleBreak = (e: any) => {
        if (e.detail?.type === dinoType) {
           actionTimer.current = 0.5; // half second duration
           setDustParticles(p => [...p, { id: Date.now(), time: 0 }]);
        }
     };
     window.addEventListener('break-obstacle', handleBreak);
     return () => window.removeEventListener('break-obstacle', handleBreak);
  }, [dinoType, isTrex]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (!isJumping) {
      if (speed > 0) {
          if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(time * speed) * 0.6;
          if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(time * speed + Math.PI) * 0.6;
      } else {
          // Idle animation
          if (leftLeg.current) leftLeg.current.rotation.x = 0;
          if (rightLeg.current) rightLeg.current.rotation.x = 0;
          if (group.current) {
             group.current.position.y = isStatic ? 0.8 : 0.8 + Math.sin(time * 2) * 0.05;
          }
      }
    } else {
      if (leftLeg.current) leftLeg.current.rotation.x = -0.3;
      if (rightLeg.current) rightLeg.current.rotation.x = 0.5;
    }

    if (actionTimer.current > 0) {
       actionTimer.current -= delta;
       const animProgress = 1.0 - Math.max(0, actionTimer.current / 0.5);
       let headAngle = 0;
       if (animProgress < 0.3) headAngle = -Math.PI / 4 * (animProgress / 0.3);
       else if (animProgress < 0.6) headAngle = Math.PI / 4 * ((animProgress - 0.3) / 0.3);
       else headAngle = Math.PI / 4 * (1.0 - (animProgress - 0.6) / 0.4);
       
       if (headRef.current) headRef.current.rotation.x = headAngle;
    } else if (headRef.current) {
       headRef.current.rotation.x = 0;
    }

    if (isStatic) {
        blinkTimer.current -= delta;
        if (blinkTimer.current <= 0) {
           if (isBlinking.current) {
               isBlinking.current = false;
               blinkTimer.current = Math.random() * 4 + 2; // Next blink in 2-6s
           } else {
               isBlinking.current = true;
               blinkTimer.current = 0.3; // Blink duration
           }
        }
        
        if (leftEye.current && rightEye.current) {
             const eyeColor = isBlinking.current ? '#000000' : '#fef08a';
             (leftEye.current.material as THREE.MeshStandardMaterial).color.set(eyeColor);
             (rightEye.current.material as THREE.MeshStandardMaterial).color.set(eyeColor);
             const sY = isBlinking.current ? 0.4 : 1.0;
             leftEye.current.scale.set(1, sY, 1);
             rightEye.current.scale.set(1, sY, 1);
        }
        if (leftPupil.current && rightPupil.current) {
             leftPupil.current.visible = !isBlinking.current;
             rightPupil.current.visible = !isBlinking.current;
        }
    }
  });

  return (
    <group ref={group} position={[0, 0.8, 0]}>
      {/* Body horizontal posture */}
      <Box args={[0.5, 0.5, 1.0]} position={[0, 0, 0]} rotation={[0.1, 0, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>

      {/* Head */}
      <group ref={headRef} position={[0, isTrex ? 0.4 : 0.3, 0.6]}>
         {/* Head base */}
         <Box args={[0.4, isTrex ? 0.6 : 0.4, isTrex ? 0.5 : 0.6]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color={color} />
         </Box>
         {/* Jaw */}
         <Box args={[0.3, isTrex ? 0.2 : 0.15, isTrex ? 0.4 : 0.5]} position={[0, -0.2, isTrex ? 0.2 : 0.1]} castShadow>
            <meshStandardMaterial color={color} />
         </Box>
         {isTrex && (
             <Box args={[0.3, 0.1, 0.4]} position={[0, -0.35, 0.2]} castShadow>
                <meshStandardMaterial color="#fef08a" />
             </Box>
         )}
         {!isTrex && (
             <Box args={[0.2, 0.1, 0.4]} position={[0, -0.3, 0.1]} castShadow>
                <meshStandardMaterial color="#000000" />
             </Box>
         )}
         {/* Eyes */}
         <Box ref={leftEye} args={[0.05, 0.1, 0.05]} position={[-0.21, 0.1, 0.1]}>
            <meshStandardMaterial color="#fef08a" />
         </Box>
         <Box ref={rightEye} args={[0.05, 0.1, 0.05]} position={[0.21, 0.1, 0.1]}>
            <meshStandardMaterial color="#fef08a" />
         </Box>
         <Box ref={leftPupil} args={[0.02, 0.05, 0.02]} position={[-0.22, 0.1, 0.1]}>
            <meshStandardMaterial color="#000000" />
         </Box>
         <Box ref={rightPupil} args={[0.02, 0.05, 0.02]} position={[0.22, 0.1, 0.1]}>
            <meshStandardMaterial color="#000000" />
         </Box>
      </group>

      {/* Tiny arms */}
      <group position={[-0.3, -0.1, 0.3]}>
        <Box args={[0.1, isTrex ? 0.15 : 0.25, 0.1]} position={[0, -0.1, 0]} rotation={[-0.5, 0, 0]}>
           <meshStandardMaterial color={color} />
        </Box>
      </group>
      <group position={[0.3, -0.1, 0.3]}>
        <Box args={[0.1, isTrex ? 0.15 : 0.25, 0.1]} position={[0, -0.1, 0]} rotation={[-0.5, 0, 0]}>
           <meshStandardMaterial color={color} />
        </Box>
      </group>

      {/* Tail - extending back */}
      <Box args={[0.3, 0.3, 0.8]} position={[0, 0.1, -0.7]} rotation={[-0.1, 0, 0]} castShadow>
         <meshStandardMaterial color={color} />
      </Box>

      {/* Legs */}
      <group ref={leftLeg} position={[-0.3, -0.2, -0.1]}>
         <Box args={[0.2, 0.6, 0.2]} position={[0, -0.3, 0]} castShadow>
            <meshStandardMaterial color={color} />
         </Box>
         <Box args={[0.2, 0.1, 0.3]} position={[0, -0.6, 0.1]} castShadow>
            <meshStandardMaterial color={isTrex ? "#fef08a" : "#000000"} />
         </Box>
      </group>
      <group ref={rightLeg} position={[0.3, -0.2, -0.1]}>
         <Box args={[0.2, 0.6, 0.2]} position={[0, -0.3, 0]} castShadow>
            <meshStandardMaterial color={color} />
         </Box>
         <Box args={[0.2, 0.1, 0.3]} position={[0, -0.6, 0.1]} castShadow>
            <meshStandardMaterial color={isTrex ? "#fef08a" : "#000000"} />
         </Box>
      </group>
      
      {dustParticles.map(d => <StartDustBurst key={d.id} />)}
    </group>
  );
}

const DINO_SCALES = {
  triceratops: 1.0,
  velociraptor: 0.7,
  trex: 1.4
};

function VfxTrail({ color, isLine, active, speed }: { color: string, isLine: boolean, active: boolean, speed: number }) {
   const group = useRef<THREE.Group>(null);
   const [particles, setParticles] = useState<{id: number, pos: THREE.Vector3, age: number, maxAge: number, offset: number}[]>([]);
   const idRef = useRef(0);

   useFrame((state, delta) => {
      if (active) {
         // Emit
         if (Math.random() < (isLine ? 0.8 : 0.4)) {
            setParticles(prev => [...prev, {
                id: idRef.current++,
                pos: new THREE.Vector3((Math.random() - 0.5) * 0.5, isLine ? 0.5 : 0.2, 0),
                age: 0,
                maxAge: (isLine ? 0.4 : 0.6) * 1.2,
                offset: Math.random() * Math.PI * 2
            }]);
         }
      }

      setParticles(prev => {
         return prev.map(p => {
            const wiggle = isLine ? Math.sin(p.age * 15 + p.offset) * 2.0 * delta : 0;
            return {
               ...p,
               age: p.age + delta,
               pos: p.pos.clone().add(new THREE.Vector3(wiggle, (isLine ? 0 : 0.5) * delta, -speed * delta))
            };
         }).filter(p => p.age < p.maxAge);
      });
   });

   return (
      <group ref={group}>
         {particles.map(p => {
             const progress = p.age / p.maxAge;
             const scale = isLine ? (1 - progress) : (1 - progress) * 1.5;
             return (
               <mesh key={p.id} position={p.pos}>
                  {isLine ? <boxGeometry args={[0.2, 0.2, 1.5]} /> : <sphereGeometry args={[0.3, 4, 4]} />}
                  <meshBasicMaterial 
                     color={color} 
                     transparent 
                     opacity={(1 - progress) * (isLine ? 0.8 : 0.4)} 
                     depthWrite={false}
                  />
               </mesh>
             );
         })}
      </group>
   );
}

function StartDustBurst() {
  const [particles, setParticles] = useState(() => Array.from({ length: 20 }).map(() => ({
     id: Math.random(),
     pos: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 0.5, (Math.random() - 0.5) * 2),
     vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 4 + 2, (Math.random() - 0.5) * 8),
     size: Math.random() * 0.5 + 0.3,
     age: 0,
     maxAge: Math.random() * 0.5 + 0.5
  })));

  useFrame((state, delta) => {
      setParticles(prev => prev.map(p => ({
         ...p,
         age: p.age + delta,
         pos: p.pos.clone().add(p.vel.clone().multiplyScalar(delta))
      })).filter(p => p.age < p.maxAge));
  });

  return (
     <group>
        {particles.map(p => {
           const progress = p.age / p.maxAge;
           const currentSize = p.size * (1 - progress);
           return (
              <mesh key={p.id} position={p.pos}>
                 <sphereGeometry args={[currentSize, 8, 8]} />
                 <meshStandardMaterial color={Math.random() < 0.5 ? '#9ca3af' : '#6b7280'} transparent opacity={1 - progress} />
              </mesh>
           );
        })}
     </group>
  );
}

function Player({ dinoType, isRobot, lane, isJumping, jumpHeight, isSpecial, activeTrail, activeTransform, achievements }: { dinoType: DinoType, isRobot: boolean, lane: number, isJumping: boolean, jumpHeight: number, isSpecial: boolean, activeTrail: string | null, activeTransform: string | null, achievements: any }) {
  const group = useRef<THREE.Group>(null);
  const flipAngle = useRef(0);
  const prevRobot = useRef(isRobot);
  const [vfxScale, setVfxScale] = useState(0);
  const [showStartDust, setShowStartDust] = useState(true);

  useEffect(() => {
     const t = setTimeout(() => setShowStartDust(false), 2000);
     return () => clearTimeout(t);
  }, []);

  useEffect(() => {
     if (prevRobot.current !== isRobot) {
        flipAngle.current = Math.PI * 2; // trigger a flip
        setVfxScale(1);
        prevRobot.current = isRobot;
     }
  }, [isRobot]);

  useFrame((state, delta) => {
    if (group.current) {
      // Smooth lane transition
      const targetX = (lane - 1) * LANE_WIDTH;
      group.current.position.x += (targetX - group.current.position.x) * 10 * delta;
      
      group.current.position.y = jumpHeight;

      if (flipAngle.current > 0) {
         flipAngle.current -= delta * 15;
         if (flipAngle.current < 0) flipAngle.current = 0;
      }
      group.current.rotation.set(flipAngle.current, Math.PI, 0);
    }
    
    if (vfxScale > 0) {
       setVfxScale(v => Math.max(0, v - delta * 2));
    }
  });

  const speed = isRobot ? 15 : 10;
  const scale = DINO_SCALES[dinoType];

  let transformColor = "#06b6d4"; // default cyan
  if (activeTransform === 'transform_burst') transformColor = "#eab308";
  if (activeTransform === 'transform_digital') transformColor = "#ef4444";

  let trailColor = "#00f2ff";
  if (activeTrail === 'trail_red') trailColor = "#ff003c";

  // Is Velociraptor Dashing?
  const isDash = isSpecial && dinoType === 'velociraptor';
  const showDust = !isJumping && !isRobot && !activeTrail;
  const showPurchasedTrail = !isJumping && activeTrail != null && isRobot;

  // Golden Robot Logic
  let isGolden = false;
  if (achievements?.robotTransforms) {
     let l = 0; const ms=[1, 5, 10, 20, 50, 100];
     for(let i=0; i<ms.length; i++) if(achievements.robotTransforms >= ms[i]) l=i+1;
     if (l >= 5) isGolden = true;
  }

  return (
    <group ref={group}>
      <group scale={[scale, scale, scale]}>
        {isRobot ? (
           dinoType === 'velociraptor' ? (
              <RobotVelociraptor speed={speed} isJumping={isJumping} isDashing={isDash} isGolden={isGolden} />
           ) : dinoType === 'triceratops' ? (
              <RobotTriceratops speed={speed} isJumping={isJumping} isDashing={isSpecial} isGolden={isGolden} />
           ) : (
              <RobotTRex speed={speed} isJumping={isJumping} isDashing={isSpecial} isGolden={isGolden} />
           )
        ) : (
           dinoType === 'triceratops' ? (
              <Triceratops speed={speed} isJumping={isJumping} />
           ) : (
              <Theropod dinoType={dinoType} speed={speed} isJumping={isJumping} />
           )
        )}
      </group>
      
      <VfxTrail color="#d1d5db" isLine={false} active={showDust} speed={speed} />
      
      {showPurchasedTrail && (
          <VfxTrail color={trailColor} isLine={true} active={true} speed={speed} />
      )}

      {isDash && (
          <VfxTrail color={activeTrail ? trailColor : "#fde047"} isLine={true} active={true} speed={speed * 1.5} />
      )}

      {vfxScale > 0 && (
          <mesh scale={[1 + vfxScale*4, 1 + vfxScale*4, 1 + vfxScale*4]} position={[0, 1, 0]}>
             <sphereGeometry args={[1, 16, 16]} />
             <meshStandardMaterial color={transformColor} emissive={transformColor} emissiveIntensity={vfxScale * 5} transparent opacity={vfxScale} />
          </mesh>
      )}

      {showStartDust && <StartDustBurst />}
    </group>
  );
}

function BackgroundEnvironment({ isIce }: { isIce: boolean }) {
  const birds = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
      if (birds.current) {
          birds.current.children.forEach((bird, i) => {
              bird.position.y += Math.sin(state.clock.elapsedTime * 3 + i) * 0.005;
              const leftWing = bird.children[0] as THREE.Mesh;
              const rightWing = bird.children[1] as THREE.Mesh;
              leftWing.rotation.z = Math.sin(state.clock.elapsedTime * 15 + i) * 0.5 - 0.2;
              rightWing.rotation.z = -Math.sin(state.clock.elapsedTime * 15 + i) * 0.5 + 0.2;
          });
      }
  });

  const cliffs = useMemo(() => {
     return Array.from({length: 16}).map((_, i) => {
        const isLeft = i % 2 === 0;
        const x = (isLeft ? -1 : 1) * (15 + Math.random() * 25);
        const z = 20 - Math.random() * 100;
        const scale = 1 + Math.random() * 2;
        return (
           <mesh key={`cliff-${i}`} position={[x, 10 * scale, z]} rotation={[0, Math.random()*Math.PI, 0]}>
              <cylinderGeometry args={[2, 12, 30 * scale, 5]} />
              <meshStandardMaterial color={isIce ? '#bae6fd' : '#e2e8f0'} roughness={0.9} flatShading />
           </mesh>
        )
     })
  }, [isIce]);

  const birdMeshes = useMemo(() => {
     return Array.from({length: 8}).map((_, i) => {
        const x = (Math.random() - 0.5) * 40;
        const y = 15 + Math.random() * 15;
        const z = 10 - Math.random() * 60;
        const color = ['#38bdf8', '#fbbf24', '#f43f5e', '#a7f3d0'][i % 4]; 
        return (
           <group key={`bird-${i}`} position={[x, y, z]} rotation={[0, Math.random()*Math.PI, 0]}>
               {/* Wings */}
               <mesh position={[-0.6, 0, 0]} rotation={[0, 0, 0]} castShadow>
                   <coneGeometry args={[0.6, 2, 3]} />
                   <meshStandardMaterial color={color} flatShading roughness={0.5} />
               </mesh>
               <mesh position={[0.6, 0, 0]} rotation={[0, 0, 0]} castShadow>
                   <coneGeometry args={[0.6, 2, 3]} />
                   <meshStandardMaterial color={color} flatShading roughness={0.5} />
               </mesh>
               {/* Body */}
               <mesh position={[0, -0.2, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[0.3, 0.1, 1.5, 4]} />
                   <meshStandardMaterial color="#fff" flatShading />
               </mesh>
               <mesh position={[0, -0.2, -0.5]}>
                   <boxGeometry args={[0.2, 0.2, 1.5]} />
                   <meshStandardMaterial color="#fff" />
               </mesh>
           </group>
        )
     });
  }, []);

  return (
     <group>
        <group>{cliffs}</group>
        <group ref={birds}>{birdMeshes}</group>
     </group>
  )
}

function Terrain({ getSpeed, isIce }: { getSpeed: () => number, isIce: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const [chunkKeys, setChunkKeys] = useState("");
  
  useFrame(() => {
     const keys = globalPath.chunks.map(c => c.id).join(',');
     if (keys !== chunkKeys) {
        setChunkKeys(keys);
     }
  });

  const distRef = useRef(0);
  useFrame((state, delta) => {
     distRef.current += getSpeed() * delta;
     if (ref.current) {
        globalPath.update(distRef.current);
        const playerPoint = globalPath.getPoint(distRef.current);
        
        // Exact math to rotate the group around (0,0,0) relative to playerPos
        // object_world_pos = Rot * (object_local_pos - playerPos)
        // Group rotation = Rot
        // Group position = Rot * (-playerPos)
        
        const invPos = playerPoint.pos.clone().negate();
        invPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -playerPoint.angle);
        
        ref.current.position.copy(invPos);
        ref.current.rotation.y = -playerPoint.angle;
     }
  });

  return (
    <group>
        <group ref={ref}>
          {globalPath.chunks.map((chunk) => {
             if (chunk.type === 'straight') {
                return (
                  <group key={chunk.id} position={[chunk.startPoint.x, 0, chunk.startPoint.z]} rotation={[0, chunk.startAngle, 0]}>
                     <mesh position={[0, -0.1, -chunk.length / 2]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                       <planeGeometry args={[24, chunk.length]} />
                       <meshStandardMaterial color={isIce ? '#bae6fd' : '#f1f5f9'} roughness={isIce ? 0.1 : 0.9} />
                     </mesh>
                     {/* Environment */}
                     {Array.from({ length: Math.floor(chunk.length / 10) }).map((_, i) => {
                         const prand = (seed: number) => {
                             const x = Math.sin(chunk.id * 100 + i * 10 + seed) * 10000;
                             return x - Math.floor(x);
                         };
                         return (
                         <group key={i} position={[0, 0, -i * 10 - 5]}>
                            <Cylinder args={[0, 0.5 + prand(1) * 0.5, 2 + prand(2) * 2]} position={[-6 - prand(3) * 4, 1, 0]} castShadow>
                               <meshStandardMaterial color={isIce ? '#0ea5e9' : '#0f766e'} />
                            </Cylinder>
                            <Cylinder args={[0, 0.5 + prand(4) * 0.5, 2 + prand(5) * 2]} position={[6 + prand(6) * 4, 1, 0]} castShadow>
                               <meshStandardMaterial color={isIce ? '#0ea5e9' : '#0f766e'} />
                            </Cylinder>
                         </group>
                         );
                     })}
                  </group>
                );
             } else {
                 const isLeft = chunk.type === 'curve_left';
                 // The pivot is at TRACK_RADIUS left or right
                 const pivotX = isLeft ? -TRACK_RADIUS : TRACK_RADIUS;
                 return (
                    <group key={chunk.id} position={[chunk.startPoint.x, 0, chunk.startPoint.z]} rotation={[0, chunk.startAngle, 0]}>
                        <group position={[pivotX, -0.1, 0]}>
                            <mesh rotation={[-Math.PI/2, 0, 0]}>
                                <ringGeometry args={[TRACK_RADIUS - 6, TRACK_RADIUS + 6, 32, 1, isLeft ? 0 : Math.PI/2, Math.PI/2]} />
                                <meshStandardMaterial color={isIce ? '#bae6fd' : '#f1f5f9'} roughness={isIce ? 0.1 : 0.9} />
                            </mesh>
                        </group>
                    </group>
                 )
             }
          })}
        </group>
    </group>
  );
}

function FallingSnow({ isIce }: { isIce: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
       group.current.position.y -= 0.1;
       if (group.current.position.y < -10) group.current.position.y = 10;
       group.current.rotation.y += 0.002;
    }
  });

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 200; i++) {
       temp.push(
         <mesh key={i} position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={isIce ? '#bae6fd' : '#ffffff'} />
         </mesh>
       );
    }
    return temp;
  }, [isIce]);

  return <group ref={group}>{particles}</group>;
}

function ObstacleManager({ getSpeed, onCollision, lane, jumpHeight, onCoinCollect, isSpecial, dinoType, obstaclesRef, clearTrigger, onTurn, onFuelCollect, onHealthGain, upgrades, achievements }: any) {
  const [items, setItems] = useState<{ id: number, type: string, lane: number, z: number, destroyed?: boolean }[]>([]);
  const idRef = useRef(0);
  const timeRef = useRef(0);
  const globalDist = useRef(0);
  const lastCornerTime = useRef(0);
  const nextHeartDist = useRef(250);

  useEffect(() => {
     setItems([]);
     if (obstaclesRef) obstaclesRef.current = [];
     nextHeartDist.current = 250;
  }, [clearTrigger, obstaclesRef]);

  useFrame((state, delta) => {
    globalDist.current += getSpeed() * delta;
    timeRef.current += getSpeed() * delta;
    
    const spawnAheadZ = -80;
    
    let currentItems = [...(obstaclesRef.current || [])];

    if (globalDist.current >= nextHeartDist.current) {
        let hLane = Math.floor(Math.random() * 3);
        currentItems.push({ id: idRef.current++, type: 'heart', lane: hLane, z: spawnAheadZ - 10 }); // slightly further back
        
        if (nextHeartDist.current === 250) nextHeartDist.current = 750;
        else if (nextHeartDist.current === 750) nextHeartDist.current = 1500;
        else nextHeartDist.current += 1000;
    }

    // Spawn new items
    if (timeRef.current > 15) {
      timeRef.current = 0;
      
      const isEasy = globalDist.current < 400; // First 400m easy
      const numItems = isEasy ? 1 : Math.floor(Math.random() * 2) + 1;
      const usedLanes = new Set();
      
      for(let i=0; i<numItems; i++) {
        let randLane = Math.floor(Math.random() * 3);
        while(usedLanes.has(randLane)) {
           randLane = Math.floor(Math.random() * 3);
        }
        usedLanes.add(randLane);

        let type = 'rock';
        const typeRand = Math.random();
        if (isEasy) {
           if (typeRand < 0.3) type = 'coin';
           else if (typeRand < 0.5) type = 'fuel_grey';
           else type = 'rock';
        } else {
           if (typeRand < 0.25) type = 'coin';
           else if (typeRand < 0.35) type = 'hole';
           else if (typeRand < 0.45) type = 'tree';
           else if (typeRand < 0.52) type = 'fuel_grey';
           else if (typeRand < 0.55) type = 'fuel_gold';
           else type = 'rock';
        }

        currentItems.push({ id: idRef.current++, type, lane: randLane, z: spawnAheadZ });
      }
    }

    let hitItem: string | null = null;
    let coinHit = false;
    let fuelGreyHit = false;
    let fuelGoldHit = false;
    let heartHit = false;
    let destroyedItems: string[] = [];
    let triggeredTurnParams: any = null;
    let jumpedHole = false;

    const next = currentItems.map(item => {
      const newZ = item.z + getSpeed() * delta;
      let destroyed = item.destroyed;
      let turnTriggered = (item as any).turnTriggered;
      let passed = (item as any).passed;
      let currentLane = item.lane;
      
      // Magnetize
      if (upgrades?.magnetize && item.type === 'coin' && newZ > -10 && newZ < 0) {
          if (currentLane < lane) currentLane += 10 * delta;
          if (currentLane > lane) currentLane -= 10 * delta;
      }
        
      // Check collision
      if (newZ > -0.5 && newZ < 0.5 && !destroyed) {
         if (item.type.startsWith('curve_') && !turnTriggered) {
            triggeredTurnParams = item.type;
            turnTriggered = true;
         } else if (Math.round(currentLane) === lane && !item.type.startsWith('curve_')) {
             if (item.type === 'coin') {
                if (jumpHeight <= 5) coinHit = true;
             } else if (item.type === 'heart') {
                if (jumpHeight <= 5) heartHit = true;
             } else if (item.type === 'fuel_grey') {
                if (jumpHeight <= 5) fuelGreyHit = true;
             } else if (item.type === 'fuel_gold') {
                if (jumpHeight <= 5) fuelGoldHit = true;
             } else if (item.type === 'rock') {
                if (jumpHeight < 1) {
                   if (isSpecial && dinoType !== 'velociraptor') { 
                       destroyed = true; 
                       destroyedItems.push(item.type);
                   } 
                   else hitItem = item.type; 
                }
             } else if (item.type === 'hole') {
                if (jumpHeight < 0.1) hitItem = item.type; 
                else if (!passed) { passed = true; jumpedHole = true; onFuelCollect(20); }
             } else if (item.type === 'tree') {
                if (jumpHeight < 1.5) {
                   if (isSpecial && dinoType !== 'velociraptor') { 
                       destroyed = true; 
                       destroyedItems.push(item.type);
                   } 
                   else hitItem = item.type;
                }
             }
         }
      }
      return { ...item, z: newZ, destroyed, turnTriggered, passed, lane: currentLane };
    }).filter(item => item.z < 35 && !item.destroyed); // Filter out destroyed items immediately? Actually keep them if we want particle fx or let them just disappear

    let finalItems = next;
    if (coinHit) finalItems = finalItems.filter(i => !(i.z > -0.5 && i.z < 0.5 && Math.round(i.lane) === lane && i.type === 'coin'));
    if (heartHit) finalItems = finalItems.filter(i => !(i.z > -0.5 && i.z < 0.5 && Math.round(i.lane) === lane && i.type === 'heart'));
    if (fuelGreyHit) finalItems = finalItems.filter(i => !(i.z > -0.5 && i.z < 0.5 && Math.round(i.lane) === lane && i.type === 'fuel_grey'));
    if (fuelGoldHit) finalItems = finalItems.filter(i => !(i.z > -0.5 && i.z < 0.5 && Math.round(i.lane) === lane && i.type === 'fuel_gold'));
    
    if (obstaclesRef) obstaclesRef.current = finalItems;
    setItems(finalItems);

    if (hitItem) onCollision(hitItem);
    if (coinHit) onCoinCollect();
    if (heartHit) onHealthGain();
    if (fuelGreyHit) onFuelCollect(10);
    if (fuelGoldHit) onFuelCollect(100);
    if (jumpedHole) audioEngine.playJumpPothole();
    if (triggeredTurnParams) onTurn(triggeredTurnParams === 'curve_left' ? 'left' : 'right');
    
    if (destroyedItems.length > 0) {
        if (dinoType === 'triceratops') audioEngine.playBarge();
        else if (dinoType === 'trex') audioEngine.playBite();
        
        const baseBoost = 10;
        const doubleBoostBonus = upgrades?.fuelCan ? upgrades.fuelCan * 2 : 0;
        let bulldozerBonus = 0;
        if (achievements?.obstaclesDestroyed) {
             const obsLevel = 0; // we can't easily calculate getLevel here without adding code, wait! 
             // we can: 
             let l = 0; const ms=[1, 25, 50, 100, 200, 500, 1000, 5000, 10000];
             for(let i=0; i<ms.length; i++) if(achievements.obstaclesDestroyed >= ms[i]) l=i+1;
             bulldozerBonus = l * 2;
        }
        onFuelCollect((baseBoost + doubleBoostBonus + bulldozerBonus) * destroyedItems.length);
        
        if (typeof (window as any).triggerBreakAnimation === 'function') {
            (window as any).triggerBreakAnimation(dinoType);
        }
        if (typeof (window as any).onObstacleDestroyed === 'function') {
            (window as any).onObstacleDestroyed(destroyedItems.length);
        }
    }
  });

  const playerPoint = globalPath.getPoint(globalDist.current);

  return (
    <group>
       {items.map(item => {
         const itemDist = globalDist.current - item.z; // since z starts at -80
         // Calculate the point on the path
         const point = globalPath.getPoint(itemDist);
         
         const xOffset = (item.lane - 1) * LANE_WIDTH;
         
         // Apply lane offset natively in world space
         const rightVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), point.angle);
         let worldPos = point.pos.clone();
         worldPos.add(rightVector.clone().multiplyScalar(xOffset));

         // Localize to player origin
         const localPos = worldPos.clone().sub(playerPoint.pos);
         // Inverse rotate so player 'looks' down -Z
         localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -playerPoint.angle);
         
         // Relative rotation
         let localAngle = point.angle - playerPoint.angle;
         
         if (item.destroyed) {
            if (dinoType !== 'triceratops') return null;
            if (item.z > 0) {
               localPos.y += item.z * 1.5; // fly UP
               localPos.x += Math.sin(item.id) * item.z * 0.5; // wiggle x
               localPos.z += item.z * 1.5; // throw behind further (player runs away)
               localAngle += item.z; // random spin
            } else {
               return null; // hide right at collision frame? Actually it's fine.
            }
         }

         if (item.type === 'rock') {
            return (
              <group key={item.id} position={[localPos.x, localPos.y, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Cone args={[0.6, 1.2, 4]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color="#475569" roughness={0.8} />
                 </Cone>
              </group>
            );
         }
         if (item.type === 'tree') {
            return (
              <group key={item.id} position={[localPos.x, localPos.y, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Cylinder args={[0.2, 0.4, 2]} position={[0, 1, 0]} castShadow>
                    <meshStandardMaterial color="#0f766e" roughness={0.9} />
                 </Cylinder>
              </group>
            );
         }
         if (item.type === 'coin') {
            return (
              <group key={item.id} position={[localPos.x, 0.5, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Cylinder args={[0.3, 0.3, 0.1]} rotation={[Math.PI/2, 0, 0]} castShadow>
                     <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.5} />
                 </Cylinder>
              </group>
            );
         }
         if (item.type === 'heart') {
            return (
              <group key={item.id} position={[localPos.x, 0.6, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Box args={[0.4, 0.4, 0.4]} rotation={[Math.PI/4, Math.PI/4, 0]} castShadow>
                     <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} />
                 </Box>
              </group>
            );
         }
         if (item.type === 'fuel_grey') {
            return (
              <group key={item.id} position={[localPos.x, 0.5, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Cylinder args={[0.15, 0.15, 0.6]} rotation={[0, 0, 0]} castShadow>
                     <meshStandardMaterial color="#94a3b8" emissive="#475569" emissiveIntensity={0.5} />
                 </Cylinder>
              </group>
            );
         }
         if (item.type === 'fuel_gold') {
            return (
              <group key={item.id} position={[localPos.x, 0.5, localPos.z]} rotation={[0, localAngle, 0]}>
                 <Cylinder args={[0.2, 0.2, 0.8]} rotation={[0, 0, 0]} castShadow>
                     <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.8} />
                 </Cylinder>
              </group>
            );
         }
         if (item.type === 'hole') {
            return (
              <mesh key={item.id} position={[localPos.x, 0.01, localPos.z]} rotation={[-Math.PI/2, 0, localAngle]}>
                 <planeGeometry args={[LANE_WIDTH, 2]} />
                 <meshBasicMaterial color="#000000" />
              </mesh>
            );
         }
         return null;
       })}
    </group>
  );
}

function GameLoop({ 
   dinoType, isRobot, isSpecial, onGameOver, onScoreUpdate, onCoinCollected, activeTrail, activeTransform, onFuelUpdate, currentFuel, forceRevertRobot, onDamage, onHealthGain, upgrades, achievements
}: { 
   dinoType: DinoType, isRobot: boolean, isSpecial: boolean, onGameOver: (s:number,c:number,o?:string)=>void, onScoreUpdate: (s:number)=>void, onCoinCollected: ()=>void, activeTrail: string | null, activeTransform: string | null, onFuelUpdate: (f:number)=>void, currentFuel: number, forceRevertRobot: ()=>void, onDamage?: (type?:string, score?:number, coins?:number)=>void, onHealthGain?: ()=>void, upgrades?: any, achievements?: any
}) {
  const upgradesRef = useRef(upgrades || {});
  useEffect(() => { upgradesRef.current = upgrades || {}; }, [upgrades]);

  const achievementsRef = useRef(achievements || {});
  useEffect(() => { achievementsRef.current = achievements || {}; }, [achievements]);

  const [lane, setLane] = useState(1); // 0: left, 1: middle, 2: right
  const [isJumping, setIsJumping] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [jumpHeight, setJumpHeight] = useState(0);
  const [clearObstaclesTrigger, setClearObstaclesTrigger] = useState(0);
  const invincibilityTimer = useRef(0);
  
  const gameGroupRef = useRef<THREE.Group>(null);
  const obstaclesRef = useRef<any[]>([]);
  const cameraAngle = useRef(0);
  const inputActionRef = useRef<string | null>(null);

  const fuelRef = useRef(currentFuel);
  useEffect(() => { fuelRef.current = currentFuel; }, [currentFuel]);

  const state = useRef({
    score: 0,
    coins: 0,
    speed: 10,
    vy: 0,
    gravity: -0.8,
    jumpForce: 15,
    terrainType: 'snow' as 'snow' | 'ice',
    dist: 0,
    gameOver: false,
    slipTimer: 0,
    targetAngle: 0,
    isHovering: false,
    hoverTimer: 0,
    fuelUpdateCounter: 0
  });

  const stats = DINO_STATS[dinoType];

  const prevRobot = useRef(isRobot);
  useEffect(() => {
     if (isRobot && !prevRobot.current) {
        state.current.isHovering = true;
        state.current.hoverTimer = 1.3;
     }
     prevRobot.current = isRobot;
  }, [isRobot]);

  const handleLaneChange = (dir: 1 | -1 | 'jump') => {
     if (state.current.gameOver) return;
     const isSlipping = state.current.terrainType === 'ice' && Math.random() < 0.2;
     
     if (dir === 'jump') {
         const maxJumps = upgradesRef.current?.doubleJump ? 2 : 1;
         if (!isJumping || jumpCount < maxJumps) {
            audioEngine.playJump();
            setIsJumping(true);
            setJumpCount(c => c + 1);
            state.current.vy = Math.abs(stats.jumpForce) * 1.2 * (isRobot ? 1.2 : 1.0);
         }
         return;
     }

     // Corner Check
     // We do NOT use handleLaneChange for corners anymore!
     // Manual corners are replaced with automatic turning over curves.

     if (dir === -1) {
         if (!isSlipping) setLane((l) => Math.max(0, l - 1));
         else setLane((l) => Math.min(2, l + 1));
     } else if (dir === 1) {
         if (!isSlipping) setLane((l) => Math.min(2, l + 1));
         else setLane((l) => Math.max(0, l - 1));
     }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (state.current.gameOver) return;
      if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
         e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
         inputActionRef.current = 'left';
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
         inputActionRef.current = 'right';
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
         inputActionRef.current = 'jump';
      }
    };
    window.addEventListener('keydown', handleKey, { passive: false });
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Touch / Custom Events Support
  useEffect(() => {
    const handleGameAction = (e: any) => {
       const action = e.detail?.action;
       if (state.current.gameOver) return;
       
       if (action === 'left') inputActionRef.current = 'left';
       else if (action === 'right') inputActionRef.current = 'right';
       else if (action === 'jump') inputActionRef.current = 'jump';
    };
    window.addEventListener('game-action', handleGameAction);
    return () => window.removeEventListener('game-action', handleGameAction);
  }, []);


  useFrame((st, delta) => {
     if (state.current.gameOver) return;

     if (invincibilityTimer.current > 0) {
        invincibilityTimer.current -= delta;
        if (gameGroupRef.current) {
            gameGroupRef.current.visible = Math.floor(st.clock.elapsedTime * 15) % 2 === 0;
        }
     } else if (gameGroupRef.current) {
        gameGroupRef.current.visible = true;
     }

     // Process input
     if (inputActionRef.current) {
        if (inputActionRef.current === 'left') handleLaneChange(-1);
        else if (inputActionRef.current === 'right') handleLaneChange(1);
        else if (inputActionRef.current === 'jump') handleLaneChange('jump');
        inputActionRef.current = null;
     }

     // update multiplier
     const speedMult = isRobot ? 2.5 : 1.0;
     const upgradeSpeed = upgradesRef.current?.speed ? upgradesRef.current.speed * 2 : 0;
     let speedDemonBonus = 0;
     if (achievementsRef.current?.veloDistance) {
         let l = 0; const ms=[100, 500, 1000, 3000, 10000, 20000];
         for(let i=0; i<ms.length; i++) if(achievementsRef.current.veloDistance >= ms[i]) l=i+1;
         speedDemonBonus = l * 1.5;
     }
     state.current.speed = (15 + upgradeSpeed + speedDemonBonus + state.current.score / 100) * Math.max(1, speedMult * 0.8);

     // hover / jump physics
     if (state.current.isHovering) {
         state.current.hoverTimer -= delta;
         if (state.current.hoverTimer <= 0) {
             state.current.isHovering = false;
         }
         setJumpHeight(h => THREE.MathUtils.damp(h, 4, 10, delta));
     } else {
         if (isJumping) {
            state.current.vy -= stats.gravity * 60 * delta;
            setJumpHeight(h => {
               let nextH = h + state.current.vy * delta;
               if (nextH <= 0) {
                  nextH = 0;
                  setIsJumping(false);
                  setJumpCount(0);
                  state.current.vy = 0;
               }
               return nextH;
            });
         } else {
            setJumpHeight(h => {
               if (h > 0) return Math.max(0, h - 20 * delta);
               return 0;
            });
         }
     }

     // Fuel Drain
     if (isRobot) {
         fuelRef.current -= delta * (100 / 30); // 30 seconds max duration
         if (fuelRef.current <= 0) {
             fuelRef.current = 0;
             forceRevertRobot();
         }
         state.current.fuelUpdateCounter += delta;
         if (state.current.fuelUpdateCounter > 0.1) {
             onFuelUpdate(fuelRef.current);
             state.current.fuelUpdateCounter = 0;
         }
     }

     // Velociraptor special adds speed
     if (isSpecial && dinoType === 'velociraptor') {
         state.current.speed *= 2.0; // speed up noticeably
         if (typeof (window as any).onVeloSpeedDist === 'function') {
             (window as any).onVeloSpeedDist(state.current.speed * delta);
         }
     }

     // layout / map curves
     state.current.dist += state.current.speed * delta;

     if (gameGroupRef.current) {
        // Only apply a slight wobble, no need for Y rotation as Terrain/Obstacles handle true curved coordinates natively!
        gameGroupRef.current.rotation.x = THREE.MathUtils.damp(gameGroupRef.current.rotation.x, Math.sin(state.current.dist * 0.005) * 0.1, 2, delta);
     }

     // camera delay rig
     const camDist = 8 + (state.current.speed * 0.05); // zoom out slightly on speed
     st.camera.position.set(
         0, 
         4 + jumpHeight * 0.2, // slightly track jump
         camDist
     );
     // Always look at the player's world position
     st.camera.lookAt(
         0, 
         1, 
         0
     );

     // terrain transition
     if (state.current.dist > 1000) {
        state.current.terrainType = state.current.terrainType === 'snow' ? 'ice' : 'snow';
        state.current.dist = 0;
     }

     // update score
     state.current.score += (state.current.speed * delta * 0.1);
     if (Math.floor(state.current.score) % 5 === 0) onScoreUpdate(Math.floor(state.current.score));
  });

  const handleCollision = (obstacleType?: string) => {
     if (state.current.gameOver || invincibilityTimer.current > 0) return;
     audioEngine.playHit();
     
     if (onDamage) {
        onDamage(obstacleType, Math.floor(state.current.score), state.current.coins);
        invincibilityTimer.current = 1.0;
     } else {
        state.current.gameOver = true;
        onGameOver(Math.floor(state.current.score), state.current.coins, obstacleType);
     }
  };

  const handleCoin = () => {
     audioEngine.playCoin();
     state.current.coins++;
     state.current.score += 20;
     onCoinCollected();
  };

  return (
    <>
      <ambientLight intensity={isRobot ? 0.3 : 0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
      {isRobot && <pointLight position={[0, 2, 2]} intensity={2} color="#00f2ff" />}
      
      <group ref={gameGroupRef}>
        <Player dinoType={dinoType} isRobot={isRobot} lane={lane} isJumping={isJumping} jumpHeight={jumpHeight} isSpecial={isSpecial} activeTrail={activeTrail} activeTransform={activeTransform} achievements={achievements} />
        <BackgroundEnvironment isIce={state.current.terrainType === 'ice'} />
        <Terrain getSpeed={() => state.current.speed} isIce={state.current.terrainType === 'ice'} />
        <ObstacleManager 
           getSpeed={() => state.current.speed} 
           onCollision={handleCollision} 
           lane={lane} 
           jumpHeight={jumpHeight}
           onCoinCollect={handleCoin}
           isSpecial={isSpecial}
           dinoType={dinoType}
           obstaclesRef={obstaclesRef}
           clearTrigger={clearObstaclesTrigger}
           onHealthGain={() => {
               if (onHealthGain) onHealthGain();
               audioEngine.playCoin(); 
           }}
           onFuelCollect={(amt: number) => {
               fuelRef.current = Math.min(100, fuelRef.current + amt);
               onFuelUpdate(fuelRef.current);
               audioEngine.playCoin(); 
           }}
           upgrades={upgrades}
           achievements={achievements}
        />
        <FallingSnow isIce={state.current.terrainType === 'ice'} />
      </group>
    </>
  );
}

function DinoPreviewModel({ dinoType, isRobot=false, showStand=false }: { dinoType: DinoType, isRobot?: boolean, showStand?: boolean }) {
  const baseScale = DINO_SCALES[dinoType] || 1;
  const scaleMult = 1.35;
  
  let scaleDivide = 1;
  let yPos = 0, zPos = 0, xPos = 0;
  if (dinoType === 'triceratops') {
      yPos = -0.85;
      zPos = 0;
      xPos = -0.15;
      scaleDivide = 2;
  } else if (dinoType === 'velociraptor') {
      yPos = -0.85;
      zPos = 0;
      xPos = -0.1;
      scaleDivide = 1.5;
  } else if (dinoType === 'trex') {
      yPos = -1.55;
      zPos = 0;
      xPos = -0.25;
      scaleDivide = 2;
  }

  const scale = (baseScale * scaleMult) / scaleDivide;
  
  const groupRef = useRef<THREE.Group>(null);

  // We want the dinosaur facing mostly slightly angled or straight, maybe slightly angled.
  // Standard rotation facing right-ish
  const introRot = Math.PI / 5;

  const gradientTexture = useMemo(() => {
     const canvas = document.createElement('canvas');
     canvas.width = 512;
     canvas.height = 512;
     const ctx = canvas.getContext('2d');
     if (ctx) {
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, 'rgba(30, 58, 138, 1)'); // Dark blue
        grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.8)'); // Slate-900 border transition
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
     }
     return new THREE.CanvasTexture(canvas);
  }, []);

  return (
      <group position={[0, -yPos - 0.2, 0]}>
        <group ref={groupRef} scale={[scale, scale, scale]} position={[xPos, yPos, zPos]} rotation={[0, introRot, 0]}>
           {isRobot ? (
              dinoType === 'velociraptor' ? <RobotVelociraptor speed={0} isJumping={false} isDashing={false} /> :
              dinoType === 'triceratops' ? <RobotTriceratops speed={0} isJumping={false} isDashing={false} /> :
              <RobotTRex speed={0} isJumping={false} isDashing={false} />
           ) : (
               dinoType === 'triceratops' ? (
                   <Triceratops speed={0} isJumping={false} isStatic={showStand} />
               ) : (
                   <Theropod dinoType={dinoType as DinoType} speed={0} isJumping={false} isStatic={showStand} />
               )
           )}
        </group>
        
        {showStand && (
            <group position={[0, yPos - 0.05, 0]}>
               <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} scale={[1.2, 0.5, 1]}>
                  <planeGeometry args={[14, 14]} />
                  <meshBasicMaterial map={gradientTexture} transparent depthWrite={false} opacity={0.9} />
               </mesh>
            </group>
        )}
        <ContactShadows position={[0, yPos - 0.04, 0]} opacity={1.0} scale={6} blur={1.5} far={4} color="#000000" resolution={512} />
      </group>
  );
}

export function DinoPreview({ dinoType, isSelected, isRobot=false, showStand=false, allowPan=false }: { dinoType: DinoType | string, isSelected: boolean, isRobot?: boolean, showStand?: boolean, allowPan?: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 40 }} style={{ height: '100%', width: '100%', pointerEvents: allowPan ? 'auto' : 'none', cursor: allowPan ? 'grab' : 'default' }}>
      <ambientLight intensity={isRobot ? 0.4 : 0.6} />
      {/* Key light for dramatic effect */}
      <directionalLight position={[5, 5, 5]} intensity={isRobot ? 3 : 2} color={isRobot ? "#00f2ff" : "#ffffff"} castShadow />
      {/* Strong Rim light for Marvel/Comic outline effect */}
      <directionalLight position={[-5, 3, -5]} intensity={4} color={isSelected ? (isRobot ? "#00f2ff" : "#22d3ee") : "#facc15"} />
      {/* Soft fill light */}
      <directionalLight position={[0, -5, 5]} intensity={0.5} color="#475569" />
      {isRobot && <pointLight position={[0, 1, 1]} intensity={2} color="#00f2ff" />}
      <DinoPreviewModel dinoType={dinoType as DinoType} isRobot={isRobot} showStand={showStand} />
      {allowPan && <OrbitControls enableZoom={false} enablePan={false} enableDamping autoRotate autoRotateSpeed={2.0} />}
    </Canvas>
  );
}

function isTrex(d: DinoType) { return d === 'trex'; }

export default function ThreeGame({ dinoType, onGameOver, onCoinCollected, onScoreUpdate, activeTrail, activeTransform, onFuelUpdate, currentFuel, onDamage, onRobotTransform, onHealthGain, forceRevertTrigger, upgrades, achievements }: any) {
  useEffect(() => {
     globalPath.reset();
  }, []);

  const [isRobot, setIsRobot] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [whooshPlayed, setWhooshPlayed] = useState(false);
  const specialTimerRef = useRef<any>(null);

  useEffect(() => {
     if (forceRevertTrigger > 0) {
         setIsRobot(false);
         if (onRobotTransform) onRobotTransform(false);
     }
  }, [forceRevertTrigger]);

  const robotRef = useRef(isRobot);
  const fuelRef = useRef(currentFuel);

  useEffect(() => { robotRef.current = isRobot; }, [isRobot]);
  useEffect(() => { fuelRef.current = currentFuel; }, [currentFuel]);

  const isSpecialRef = useRef(isSpecial);
  useEffect(() => { isSpecialRef.current = isSpecial; }, [isSpecial]);

  useEffect(() => {
     (window as any).triggerBreakAnimation = (type: string) => {
         window.dispatchEvent(new CustomEvent('break-obstacle', { detail: { type } }));
     };
     return () => { delete (window as any).triggerBreakAnimation; };
  }, []);

  const toggleRobot = () => {
    if (!robotRef.current) {
       if (fuelRef.current >= 100) {
          audioEngine.playTransform();
          audioEngine.playNitro();
          setIsRobot(true);
          if (onRobotTransform) onRobotTransform(true);
       }
    } else {
       audioEngine.playTransform();
       setIsRobot(false);
       if (onRobotTransform) onRobotTransform(false);
    }
  }

  const fireSpecial = (active: boolean) => {
     if (dinoType === 'velociraptor') {
         if (active && !isSpecialRef.current) {
            setIsSpecial(true);
            audioEngine.playWhoosh();
            if (specialTimerRef.current) clearTimeout(specialTimerRef.current);
            specialTimerRef.current = setTimeout(() => {
                setIsSpecial(false);
            }, 3000);
         }
     } else {
         setIsSpecial(active);
     }
  };

  useEffect(() => {
     const handleKey = (e: KeyboardEvent) => {
        if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') toggleRobot();
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') fireSpecial(true);
     };
     const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') fireSpecial(false);
     };
     window.addEventListener('keydown', handleKey);
     window.addEventListener('keyup', handleKeyUp);
     return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('keyup', handleKeyUp);
     };
  }, [dinoType]); // dinoType is stable per game session

  const fireAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('game-action', { detail: { action } }));
  };

  return (
    <div 
      className="relative flex flex-col w-full h-full bg-black overflow-hidden z-0 touch-none"
      tabIndex={0}
      ref={(el) => { if (el) el.focus(); }}
    >
        <div className="absolute inset-0 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none z-[-1]"></div>
        
        <Canvas shadows camera={{ position: [0, 4, 8], fov: 60 }} onPointerDown={(e) => {
            if (e.clientX < window.innerWidth / 3) fireAction('left');
            else if (e.clientX > (window.innerWidth * 2) / 3) fireAction('right');
            else fireAction('jump');
        }}>
           <GameLoop 
              dinoType={dinoType} 
              isRobot={isRobot} 
              isSpecial={isSpecial}
              onGameOver={onGameOver} 
              onScoreUpdate={onScoreUpdate} 
              onCoinCollected={onCoinCollected}
              onFuelUpdate={onFuelUpdate}
              currentFuel={currentFuel}
              forceRevertRobot={() => {
                  if (robotRef.current) {
                      setIsRobot(false);
                      if (onRobotTransform) onRobotTransform(false);
                  }
              }}
              activeTrail={activeTrail}
              activeTransform={activeTransform} 
              onDamage={onDamage}
              onHealthGain={onHealthGain}
              upgrades={upgrades}
              achievements={achievements}
           />
        </Canvas>

        {/* Desktop UI */}
        <div className="hidden md:flex absolute bottom-4 left-4 pointer-events-none z-20">
           <div className={`
              px-6 py-3 font-black italic transform -skew-x-12 tracking-tighter text-sm transition-all border-r-4 shadow-[4px_4px_0px_#000]
              ${isSpecial ? 'bg-yellow-400 text-black border-yellow-600 scale-105' : 'bg-yellow-600/50 text-white border-yellow-900/50'}
              pointer-events-auto cursor-pointer flex items-center gap-2
           `} onMouseDown={() => fireSpecial(true)} onMouseUp={() => fireSpecial(false)} onMouseLeave={() => fireSpecial(false)}>
              <span className="transform skew-x-12 uppercase">{dinoType === 'trex' ? 'BITE' : dinoType === 'velociraptor' ? 'DASH' : dinoType === 'triceratops' ? 'HORNS' : 'SPECIAL'} [Shift]</span>
           </div>

           {/* Desktop Vertical Fuel Bar */}
           <div className="absolute left-0 bottom-[calc(100%+32px)] flex flex-col items-center gap-2 pointer-events-auto z-20 animate-in fade-in duration-500 origin-bottom scale-90">
                <style>{`
                    @keyframes customPulse {
                       0%, 100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 10px rgba(253,224,71,0.5); }
                       50% { transform: scale(1.05); filter: brightness(1.2); box-shadow: 0 0 20px rgba(253,224,71,0.8); }
                    }
                    .animate-fuel-ready { animation: customPulse 1s infinite; }
                `}</style>
                <div className="text-[10px] md:text-xs font-black italic uppercase tracking-widest text-[#00f2ff] drop-shadow-md pb-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>OVERDRIVE</div>
                <div className={`w-6 h-48 md:w-8 md:h-64 bg-black/80 border-2 ${currentFuel >= 100 ? 'border-yellow-400 animate-fuel-ready' : 'border-gray-800'} p-1 md:p-1.5 flex flex-col-reverse gap-0.5 md:gap-1 rounded shadow-xl backdrop-blur-sm`}>
                    {[...Array(10)].map((_, i) => {
                        const percent = ((i + 1) * 10);
                        const percentPrev = (i * 10);
                        const isFilled = currentFuel >= percent;
                        const isPartial = currentFuel > percentPrev && currentFuel < percent;
                        return (
                            <div key={i} className="flex-1 w-full bg-gray-900 rounded-[1px] relative overflow-hidden">
                                 {isFilled && <div className={`absolute inset-0 ${currentFuel >= 100 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`} />}
                                 {isPartial && <div className={`absolute bottom-0 left-0 right-0 bg-cyan-600`} style={{ height: `${((currentFuel - percentPrev) / 10) * 100}%` }} />}
                            </div>
                        )
                    })}
                </div>
                <div className={`text-[10px] md:text-xs font-black italic tracking-widest uppercase py-2 px-1 rounded border-r-2 flex items-center justify-center gap-1 ${currentFuel >= 100 ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-gray-800 text-gray-500 border-gray-900'}`} style={{ writingMode: 'vertical-rl' }}>
                   {currentFuel >= 100 ? <Zap className="w-3 h-3 rotate-90" /> : null} FUEL
                </div>
           </div>
        </div>

        <div className="hidden md:flex absolute bottom-12 right-4 flex-col gap-2 pointer-events-none z-20">
           <div className={`
              px-6 py-3 font-black italic transform -skew-x-12 tracking-tighter text-sm transition-all border-r-4 shadow-[4px_4px_0px_#000]
              ${isRobot ? 'bg-cyan-500 text-black border-cyan-800' : 'bg-red-600 text-white border-red-900'}
              pointer-events-auto cursor-pointer flex items-center gap-2 self-end
           `} onClick={toggleRobot}>
              <span className="transform skew-x-12">{isRobot ? 'OVERDRIVE' : 'TRANSFORM [T]'}</span>
           </div>
        </div>
        
        {/* Mobile touch controls */}
        <div className="md:hidden absolute bottom-4 left-4 pointer-events-none z-20 flex flex-col justify-end gap-2">
           <div className={`
              w-20 h-20 rounded shadow-[4px_4px_0px_#000] font-black flex items-center justify-center text-sm tracking-tighter transition-all border-b-8
              ${isSpecial ? 'bg-white text-black border-gray-300 translate-y-[4px] border-b-4 brightness-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-yellow-500 text-black border-yellow-700'}
              pointer-events-auto cursor-pointer touch-manipulation select-none uppercase
           `} onPointerDown={(e) => { e.preventDefault(); fireSpecial(true); }} onPointerUp={(e) => { e.preventDefault(); fireSpecial(false); }} onPointerCancel={(e) => { e.preventDefault(); fireSpecial(false); }} onPointerLeave={(e) => { e.preventDefault(); fireSpecial(false); }}>
              {dinoType === 'trex' ? 'BITE' : dinoType === 'velociraptor' ? 'DASH' : dinoType === 'triceratops' ? 'HORNS' : 'SPC'}
           </div>

           {/* Mobile Vertical Fuel Bar */}
           <div className="absolute left-6 bottom-[calc(100%+32px)] flex flex-col items-center gap-2 pointer-events-auto z-20 animate-in fade-in duration-500 origin-bottom scale-90">
                <div className="text-[10px] md:text-xs font-black italic uppercase tracking-widest text-[#00f2ff] drop-shadow-md pb-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>OVERDRIVE</div>
                <div className={`w-6 h-48 md:w-8 md:h-64 bg-black/80 border-2 ${currentFuel >= 100 ? 'border-yellow-400 animate-fuel-ready' : 'border-gray-800'} p-1 md:p-1.5 flex flex-col-reverse gap-0.5 md:gap-1 rounded shadow-xl backdrop-blur-sm`}>
                    {[...Array(10)].map((_, i) => {
                        const percent = ((i + 1) * 10);
                        const percentPrev = (i * 10);
                        const isFilled = currentFuel >= percent;
                        const isPartial = currentFuel > percentPrev && currentFuel < percent;
                        return (
                            <div key={i} className="flex-1 w-full bg-gray-900 rounded-[1px] relative overflow-hidden">
                                 {isFilled && <div className={`absolute inset-0 ${currentFuel >= 100 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`} />}
                                 {isPartial && <div className={`absolute bottom-0 left-0 right-0 bg-cyan-600`} style={{ height: `${((currentFuel - percentPrev) / 10) * 100}%` }} />}
                            </div>
                        )
                    })}
                </div>
                <div className={`text-[10px] md:text-xs font-black italic tracking-widest uppercase py-2 px-1 rounded border-r-2 flex items-center justify-center gap-1 ${currentFuel >= 100 ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-gray-800 text-gray-500 border-gray-900'}`} style={{ writingMode: 'vertical-rl' }}>
                   {currentFuel >= 100 ? <Zap className="w-3 h-3 rotate-90" /> : null} FUEL
                </div>
           </div>
        </div>

        <div className="md:hidden absolute bottom-4 right-4 flex flex-col items-end gap-4 pointer-events-none z-20">
            <div className={`
               px-4 py-2 font-black italic transform -skew-x-12 tracking-tighter text-sm transition-all border-r-4 shadow-[4px_4px_0px_#000]
               ${isRobot ? 'bg-cyan-500 text-black border-cyan-800' : 'bg-red-600 text-white border-red-900'}
               pointer-events-auto cursor-pointer flex items-center gap-2 self-end
            `} onPointerDown={(e) => { e.preventDefault(); toggleRobot(); }}>
               <span className="transform skew-x-12">{isRobot ? 'OVERDRIVE' : 'TRANSFORM'}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
               <div className="flex justify-center w-full">
                 <button 
                   className="w-14 h-14 bg-gray-200 border-gray-400 border-2 border-b-[6px] rounded pointer-events-auto flex items-center justify-center text-gray-700 font-bold active:border-b-2 active:translate-y-[4px] touch-manipulation" 
                   onPointerDown={(e) => { e.preventDefault(); fireAction('jump'); }}
                 >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                 </button>
               </div>
               <div className="flex gap-2">
                 <button 
                   className="w-14 h-14 bg-gray-200 border-gray-400 border-2 border-b-[6px] rounded pointer-events-auto flex items-center justify-center text-gray-700 font-bold active:border-b-2 active:translate-y-[4px] touch-manipulation" 
                   onPointerDown={(e) => { e.preventDefault(); fireAction('left'); }}
                 >
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <button 
                   className="w-14 h-14 bg-gray-200 border-gray-400 border-2 border-b-[6px] rounded pointer-events-auto flex items-center justify-center text-gray-700 font-bold active:border-b-2 active:translate-y-[4px] touch-manipulation" 
                 >
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                 </button>
                 <button 
                   className="w-14 h-14 bg-gray-200 border-gray-400 border-2 border-b-[6px] rounded pointer-events-auto flex items-center justify-center text-gray-700 font-bold active:border-b-2 active:translate-y-[4px] touch-manipulation" 
                   onPointerDown={(e) => { e.preventDefault(); fireAction('right'); }}
                 >
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                 </button>
               </div>
            </div>
        </div>

        {/* Desktop Helper text */}
        <div className="hidden md:block absolute bottom-4 right-4 pointer-events-none text-cyan-400/50 text-xs font-bold uppercase tracking-[0.2em] font-sans z-20 text-right">
           USE ARROWS TO SWIZZLE LANES<br/>SPACE TO JUMP
        </div>
    </div>
  );
}
