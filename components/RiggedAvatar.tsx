/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial, Vector3, Group, Mesh } from 'three';
import { HandLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

interface RiggedAvatarProps {
  handResultsRef: React.MutableRefObject<HandLandmarkerResult | null>;
  poseResultsRef: React.MutableRefObject<PoseLandmarkerResult | null>;
  showSkeleton?: boolean;
}

// --- HIGH FIDELITY MATERIALS ---

// Outer Armor: Glossy white ceramic/enamel
const armorMaterial = new MeshStandardMaterial({
    color: "#f0f0f0",
    roughness: 0.15,
    metalness: 0.6,
});

// Inner Frame: Dark matte carbon/metal
const frameMaterial = new MeshStandardMaterial({
    color: "#111111",
    roughness: 0.8,
    metalness: 0.4,
});

// Joints: Dark machined metal
const jointMaterial = new MeshStandardMaterial({
    color: "#222222",
    roughness: 0.5,
    metalness: 0.8,
});

// Emissive Lights: Cyan energy
const glowMaterial = new MeshBasicMaterial({ 
    color: "#00ffaa",
    toneMapped: false,
});

// Visor: Dark glass
const visorMaterial = new MeshPhysicalMaterial({
    color: "#000000",
    roughness: 0.0,
    metalness: 0.9,
    clearcoat: 1.0,
});

// --- HELPER: Map Pose Landmarks to World Space ---
const mapPoseToWorld = (lm: { x: number, y: number, z: number }): Vector3 => {
    // Human Scale: ~1.8m
    const WORLD_HEIGHT = 2.0; 
    const WORLD_WIDTH = 1.6;
    
    // MediaPipe Coords: y=0 (top) -> y=1 (bottom)
    // We map y=1 to 0 (floor) and y=0 to height
    const y = (1 - lm.y) * WORLD_HEIGHT;
    // Center X
    const x = (lm.x - 0.5) * -WORLD_WIDTH;
    // Z Depth (Sensitivity adjusted)
    const z = (lm.z || 0) * -0.8; 

    return new Vector3(x, y, z);
};

// --- COMPONENTS ---

// Cyber Limb: Inner Frame (Connects joints) + Outer Armor (Floating plate)
const CyberLimb: React.FC<{ 
    startPos: React.MutableRefObject<Vector3>, 
    endPos: React.MutableRefObject<Vector3>,
    type: 'Thigh' | 'Shin' | 'Arm' | 'Forearm',
}> = ({ startPos, endPos, type }) => {
    const groupRef = useRef<Group>(null);
    const frameRef = useRef<Mesh>(null);
    const armorRef = useRef<Mesh>(null);

    // Geometry Config based on limb type
    const config = useMemo(() => {
        switch(type) {
            case 'Thigh': return { width: 0.12, height: 0.35, depth: 0.12, offset: 0 };
            case 'Shin': return { width: 0.10, height: 0.35, depth: 0.10, offset: 0 };
            case 'Arm': return { width: 0.09, height: 0.25, depth: 0.09, offset: 0 };
            case 'Forearm': return { width: 0.07, height: 0.22, depth: 0.07, offset: 0 };
        }
    }, [type]);

    useFrame(() => {
        if (!groupRef.current || !frameRef.current || !armorRef.current) return;
        
        const start = startPos.current;
        const end = endPos.current;
        const dist = start.distanceTo(end);

        if (dist < 0.01) return;

        // 1. Position Group at Midpoint
        const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
        groupRef.current.position.copy(mid);
        groupRef.current.lookAt(end);
        
        // 2. Scale Inner Frame to connect perfectly (Elastic connection)
        // Cylinder default height is 1, so scale Y to dist
        frameRef.current.scale.set(1, dist, 1);
        // Rotate frame to align with lookAt (Cylinder is Y-up, LookAt is Z-forward)
        frameRef.current.rotation.x = Math.PI / 2;

        // 3. Armor stays rigid size, just centered
        armorRef.current.rotation.x = 0; // Reset
    });

    return (
        <group ref={groupRef}>
            {/* Inner Frame (Stretches) */}
            <mesh ref={frameRef} material={frameMaterial} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
            </mesh>

            {/* Outer Armor (Floating Shell) */}
            <group rotation={[Math.PI/2, 0, 0]}>
                <mesh ref={armorRef} material={armorMaterial} castShadow receiveShadow>
                     <RoundedBox args={[config.width, config.height * 0.8, config.depth]} radius={0.02} smoothness={4} />
                </mesh>
                {/* Tech Detail Line */}
                <mesh position={[0, 0, config.depth/2 + 0.001]}>
                    <planeGeometry args={[0.01, config.height * 0.6]} />
                    <meshBasicMaterial color="#333" />
                </mesh>
            </group>
        </group>
    );
}

// Tech Joint: Mechanical hinge
const CyberJoint: React.FC<{ pos: React.MutableRefObject<Vector3>, size?: number }> = ({ pos, size = 0.06 }) => {
    const ref = useRef<Group>(null);
    useFrame(() => {
        if (ref.current) ref.current.position.copy(pos.current);
    });
    return (
        <group ref={ref}>
            {/* Main Joint Housing */}
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[size, size, size * 1.5, 16]} />
                <primitive object={jointMaterial} />
            </mesh>
            {/* Glowing Ring */}
            <mesh rotation={[0, 0, Math.PI/2]}>
                <torusGeometry args={[size * 0.8, size * 0.1, 8, 32]} />
                <primitive object={glowMaterial} />
            </mesh>
            {/* Axle Caps */}
            <mesh position={[size*0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[size*0.4, size*0.4, 0.02, 16]} />
                <primitive object={armorMaterial} />
            </mesh>
             <mesh position={[-size*0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[size*0.4, size*0.4, 0.02, 16]} />
                <primitive object={armorMaterial} />
            </mesh>
        </group>
    );
};

// Skeleton Line: Debug visualization
const SkeletonLine: React.FC<{ 
    start: React.MutableRefObject<Vector3>; 
    end: React.MutableRefObject<Vector3>;
    color?: string;
}> = ({ start, end, color = "#ffff00" }) => {
    const ref = useRef<Mesh>(null);
    
    useFrame(() => {
        if (ref.current) {
            const s = start.current;
            const e = end.current;
            const dist = s.distanceTo(e);
            if (dist > 0.001) {
                const mid = new Vector3().addVectors(s, e).multiplyScalar(0.5);
                ref.current.position.copy(mid);
                ref.current.lookAt(e);
                ref.current.rotateX(Math.PI / 2);
                ref.current.scale.set(1, dist, 1);
            }
        }
    });

    return (
        <mesh ref={ref}>
            <cylinderGeometry args={[0.005, 0.005, 1, 4]} />
            <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.6} />
        </mesh>
    );
};


// Cyber Hand: Mechanical Fingers
const CyberHand: React.FC<{ 
    handResults: React.MutableRefObject<HandLandmarkerResult | null>,
    poseWrist: React.MutableRefObject<Vector3>,
    side: 'Left' | 'Right',
}> = ({ handResults, poseWrist, side }) => {
    const groupRef = useRef<Group>(null);
    const fingerSegmentsRef = useRef<Mesh[]>([]);
    
    // Setup Bone Indices
    const segments = useMemo(() => Array.from({length: 25}, (_, i) => i), []);

    useFrame(() => {
        if (!groupRef.current) return;
        const results = handResults.current;
        let handLandmarks = null;

        // Find correct hand
        if (results && results.landmarks) {
            for (let i = 0; i < results.landmarks.length; i++) {
                if (results.handedness[i][0].categoryName === side) {
                    handLandmarks = results.landmarks[i];
                    break;
                }
            }
        }

        // If no hand detected, tuck it away or just leave it at last pose
        if (!handLandmarks) {
            // Optional: Smoothly transition to closed fist or idle if desired
            // For now, we just hide the fine detail overlay or keep it static
             groupRef.current.visible = false;
            return;
        }
        groupRef.current.visible = true;

        const HAND_SCALE = 1.0; 
        const rawWrist = handLandmarks[0];
        
        // Map Local Hand Points relative to the Pose Wrist
        // This ensures the hand attaches to the arm properly
        const worldPoints = handLandmarks.map((lm) => {
            const dx = (lm.x - rawWrist.x) * -2.5 * HAND_SCALE; 
            const dy = (rawWrist.y - lm.y) * 2.5 * HAND_SCALE; 
            const dz = (lm.z || 0) * -2.5 * HAND_SCALE;
            return new Vector3(poseWrist.current.x + dx, poseWrist.current.y + dy, poseWrist.current.z + dz);
        });

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17], [0, 5], [0, 17] // Palm
        ];

        // Update Finger Mechanics
        connections.forEach(([s, e], i) => {
            const b = fingerSegmentsRef.current[i];
            if (b) {
                const start = worldPoints[s];
                const end = worldPoints[e];
                const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
                const dist = start.distanceTo(end);
                
                b.position.copy(mid);
                b.lookAt(end);
                b.rotateX(Math.PI / 2);
                b.scale.set(1, dist, 1);
            }
        });
    });

    return (
        <group ref={groupRef}>
             {segments.map(i => (
                 <mesh key={`b-${i}`} ref={(el) => { if(el) fingerSegmentsRef.current[i] = el }} material={frameMaterial} castShadow>
                     {/* Using Box for fingers looks more robotic than Cylinder */}
                     <boxGeometry args={[0.015, 1, 0.015]} /> 
                 </mesh>
             ))}
             {/* Add knuckles/palm plate for detail if needed */}
        </group>
    );
};

const RiggedAvatar: React.FC<RiggedAvatarProps> = ({ handResultsRef, poseResultsRef, showSkeleton = false }) => {
    // Refs for tracked landmarks (Initialized to T-Pose)
    const nose = useRef(new Vector3(0, 1.7, 0));
    const leftShoulder = useRef(new Vector3(-0.2, 1.5, 0));
    const rightShoulder = useRef(new Vector3(0.2, 1.5, 0));
    const leftElbow = useRef(new Vector3(-0.45, 1.5, 0));
    const rightElbow = useRef(new Vector3(0.45, 1.5, 0));
    const leftWrist = useRef(new Vector3(-0.7, 1.5, 0));
    const rightWrist = useRef(new Vector3(0.7, 1.5, 0));
    const leftHip = useRef(new Vector3(-0.1, 0.9, 0));
    const rightHip = useRef(new Vector3(0.1, 0.9, 0));
    const leftKnee = useRef(new Vector3(-0.1, 0.5, 0));
    const rightKnee = useRef(new Vector3(0.1, 0.5, 0));
    const leftAnkle = useRef(new Vector3(-0.1, 0.1, 0));
    const rightAnkle = useRef(new Vector3(0.1, 0.1, 0));

    // Derived Points
    const shoulderMid = useRef(new Vector3());
    const hipMid = useRef(new Vector3());

    // Body Parts Refs
    const headRef = useRef<Group>(null);
    const chestRef = useRef<Group>(null);
    const pelvisRef = useRef<Group>(null);
    const spineRef = useRef<Mesh>(null);

    // PRIORITY -1: Ensure landmark calculations happen BEFORE child components read them
    useFrame(() => {
        const pose = poseResultsRef.current;
        if (pose && pose.landmarks && pose.landmarks[0]) {
            const lm = pose.landmarks[0];
            const LERP_SPEED = 0.8; // High responsiveness

            // 1. Update Landmarks
            const update = (ref: React.MutableRefObject<Vector3>, index: number) => {
                if (lm[index]) {
                    const target = mapPoseToWorld(lm[index]);
                    ref.current.lerp(target, LERP_SPEED);
                }
            };

            update(nose, 0);
            update(leftShoulder, 11);
            update(rightShoulder, 12);
            update(leftElbow, 13);
            update(rightElbow, 14);
            update(leftWrist, 15);
            update(rightWrist, 16);
            update(leftHip, 23);
            update(rightHip, 24);
            update(leftKnee, 25);
            update(rightKnee, 26);
            update(leftAnkle, 27);
            update(rightAnkle, 28);

            // 2. Calculate Midpoints
            shoulderMid.current.addVectors(leftShoulder.current, rightShoulder.current).multiplyScalar(0.5);
            hipMid.current.addVectors(leftHip.current, rightHip.current).multiplyScalar(0.5);

            // 3. Update Head
            if (headRef.current) {
                // Neck pivot is slightly below nose
                headRef.current.position.copy(nose.current).add(new Vector3(0, -0.05, 0));
                // Look forward (approximate by looking at Z+5 relative to shoulders)
                headRef.current.lookAt(shoulderMid.current.x, shoulderMid.current.y, 5); 
            }

            // 4. Update Chest
            if (chestRef.current) {
                chestRef.current.position.copy(shoulderMid.current);
                chestRef.current.lookAt(hipMid.current); // Orient towards hips
                chestRef.current.rotateX(-Math.PI / 2); // Correct orientation
            }

            // 5. Update Pelvis
            if (pelvisRef.current) {
                pelvisRef.current.position.copy(hipMid.current);
                // Look at right hip to align horizontally
                pelvisRef.current.lookAt(rightHip.current); 
            }

            // 6. Update Spine (Flexible connection)
            if (spineRef.current) {
                const mid = new Vector3().addVectors(shoulderMid.current, hipMid.current).multiplyScalar(0.5);
                const dist = shoulderMid.current.distanceTo(hipMid.current);
                spineRef.current.position.copy(mid);
                spineRef.current.lookAt(shoulderMid.current);
                spineRef.current.rotateX(Math.PI / 2);
                spineRef.current.scale.set(1, dist * 0.9, 1);
            }
        }
    }, -1); // Negative priority runs first

    return (
        <group>
            {/* --- HEAD UNIT --- */}
            <group ref={headRef}>
                {/* Helmet Dome */}
                <mesh position={[0, 0.08, -0.02]} castShadow>
                     <sphereGeometry args={[0.12, 32, 32]} />
                     <primitive object={armorMaterial} />
                </mesh>
                {/* Visor */}
                <mesh position={[0, 0.08, 0.06]} rotation={[0.2, 0, 0]}>
                    <capsuleGeometry args={[0.08, 0.06, 4, 16]} />
                    <primitive object={visorMaterial} />
                </mesh>
                {/* Side Ears/Antenna */}
                <mesh position={[0.12, 0.08, 0]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
                    <primitive object={jointMaterial} />
                </mesh>
                <mesh position={[-0.12, 0.08, 0]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
                    <primitive object={jointMaterial} />
                </mesh>
            </group>

            {/* --- TORSO --- */}
            {/* Chest Plate (Rigid) */}
            <group ref={chestRef}>
                 <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
                     {/* Trapezoid shape via Cylinder or custom Box */}
                     <RoundedBox args={[0.35, 0.25, 0.2]} radius={0.02} smoothness={4} />
                     <primitive object={armorMaterial} />
                 </mesh>
                 {/* Arc Reactor */}
                 <mesh position={[0, -0.1, 0.11]} rotation={[Math.PI/2, 0, 0]}>
                     <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
                     <primitive object={glowMaterial} />
                 </mesh>
            </group>
            
            {/* Spine (Flexible) */}
            <mesh ref={spineRef} castShadow>
                <cylinderGeometry args={[0.06, 0.05, 1, 12]} />
                <primitive object={frameMaterial} />
            </mesh>

            {/* Pelvis Plate */}
            <group ref={pelvisRef}>
                 <mesh rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
                    <RoundedBox args={[0.1, 0.32, 0.18]} radius={0.05} smoothness={4} />
                    <primitive object={armorMaterial} />
                </mesh>
            </group>

            {/* --- ARMS --- */}
            <CyberJoint pos={leftShoulder} />
            <CyberLimb startPos={leftShoulder} endPos={leftElbow} type="Arm" />
            
            <CyberJoint pos={leftElbow} size={0.05} />
            <CyberLimb startPos={leftElbow} endPos={leftWrist} type="Forearm" />
            
            <CyberJoint pos={rightShoulder} />
            <CyberLimb startPos={rightShoulder} endPos={rightElbow} type="Arm" />
            
            <CyberJoint pos={rightElbow} size={0.05} />
            <CyberLimb startPos={rightElbow} endPos={rightWrist} type="Forearm" />

            {/* --- LEGS --- */}
            <CyberJoint pos={leftHip} size={0.07} />
            <CyberLimb startPos={leftHip} endPos={leftKnee} type="Thigh" />
            
            <CyberJoint pos={leftKnee} size={0.06} />
            <CyberLimb startPos={leftKnee} endPos={leftAnkle} type="Shin" />

            <CyberJoint pos={rightHip} size={0.07} />
            <CyberLimb startPos={rightHip} endPos={rightKnee} type="Thigh" />
            
            <CyberJoint pos={rightKnee} size={0.06} />
            <CyberLimb startPos={rightKnee} endPos={rightAnkle} type="Shin" />

            {/* --- FEET --- */}
            {/* Simple Tech Boots */}
            <CyberJoint pos={leftAnkle} size={0.05} />
            <CyberJoint pos={rightAnkle} size={0.05} />

            {/* --- HANDS --- */}
            <CyberHand handResults={handResultsRef} poseWrist={leftWrist} side="Left" />
            <CyberHand handResults={handResultsRef} poseWrist={rightWrist} side="Right" />

            {/* --- DEBUG SKELETON --- */}
            {showSkeleton && (
                <group>
                    <SkeletonLine start={shoulderMid} end={leftShoulder} />
                    <SkeletonLine start={shoulderMid} end={rightShoulder} />
                    <SkeletonLine start={leftShoulder} end={leftElbow} />
                    <SkeletonLine start={rightShoulder} end={rightElbow} />
                    <SkeletonLine start={leftElbow} end={leftWrist} />
                    <SkeletonLine start={rightElbow} end={rightWrist} />
                    
                    <SkeletonLine start={shoulderMid} end={hipMid} color="#00ff00" />
                    
                    <SkeletonLine start={hipMid} end={leftHip} />
                    <SkeletonLine start={hipMid} end={rightHip} />
                    <SkeletonLine start={leftHip} end={leftKnee} />
                    <SkeletonLine start={rightHip} end={rightKnee} />
                    <SkeletonLine start={leftKnee} end={leftAnkle} />
                    <SkeletonLine start={rightKnee} end={rightAnkle} />
                </group>
            )}
        </group>
    );
}

export default RiggedAvatar;