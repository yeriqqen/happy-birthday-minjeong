import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// ========================================
// BENGALA CONFIGURATION - ADJUST THESE VALUES TO MATCH YOUR 8 BENGALAS
// ========================================
const BENGALA_CONFIG = {
    // Radius of the circle where bengalas are positioned
    circleRadius: 2.3,

    // Y position (height) of bengalas
    yPosition: -0.8,

    // Spread radius for particles around each bengala
    particleSpread: 0.3,

    // Number of particles per bengala
    particlesPerBengala: 25,

    // Particle size
    particleSize: 0.08,

    // 8 bengala positions around the circle (in degrees)
    // You can adjust these angles to match your model
    angles: [12, 57, 105, 155, 202, 245, 292, 330]
};
// ========================================

function Cake({ scale }: { scale: number }) {
    const { scene } = useGLTF('/cake_3d.glb');
    return <primitive object={scene} scale={scale * 0.6} position={[0, -1.1, 0]} rotation={[0, -Math.PI / 2, 0]} />; // so this scale is cake size
}

function CakeLayerBengala({ scale }: { scale: number }) {
    const { scene } = useGLTF('/cake_layer_1_bengala_v1.glb');
    return <primitive object={scene} scale={scale * 1.2} position={[0, -3.3, 0]} rotation={[0, -Math.PI / 2, 0]} />;
}

function Candle2({ scale }: { scale: number }) {
    const { scene } = useGLTF('/candle_2.glb');
    return <primitive object={scene} scale={scale * 1.2} position={[-0.3 * scale, -0.5 * scale, -1.1 * scale]} />;
}

function Candle3({ scale }: { scale: number }) {
    const { scene } = useGLTF('/candle_3.glb');
    return <primitive object={scene} scale={scale * 1.2} position={[0.3 * scale, -0.5 * scale, -1.1 * scale]} />;
}

interface SparklerParticlesProps {
    centerX: number;
    centerY: number;
    centerZ: number;
    spread: number;
    particleCount: number;
    particleSize: number;
}

function SparklerParticles({ centerX, centerY, centerZ, spread, particleCount, particleSize }: SparklerParticlesProps) {
    const particlesRef = useRef<THREE.Points>(null);

    const { geometry, velocities, initialPositions } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const initialPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Start position around the bengala center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spread;
            const baseX = centerX + Math.cos(angle) * radius;
            const baseY = centerY + Math.random() * 0.1;
            const baseZ = centerZ + Math.sin(angle) * radius;

            positions[i * 3] = baseX;
            positions[i * 3 + 1] = baseY;
            positions[i * 3 + 2] = baseZ;

            // Store initial position for reset
            initialPositions[i * 3] = baseX;
            initialPositions[i * 3 + 1] = baseY;
            initialPositions[i * 3 + 2] = baseZ;

            // Upward velocity with slight random spread
            velocities[i * 3] = (Math.random() - 0.5) * 0.008;
            velocities[i * 3 + 1] = 0.015 + Math.random() * 0.015;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

            // Orange and yellow colors
            const isOrange = Math.random() > 0.5;
            colors[i * 3] = 1.0; // R
            colors[i * 3 + 1] = isOrange ? 0.5 : 1.0; // G
            colors[i * 3 + 2] = 0.0; // B

            lifetimes[i] = Math.random();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

        return { geometry, velocities, initialPositions };
    }, [centerX, centerY, centerZ, spread, particleCount]);

    useFrame((state, delta) => {
        if (!particlesRef.current) return;

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const lifetimes = particlesRef.current.geometry.attributes.lifetime.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
            // Update lifetime
            lifetimes[i] += delta * 0.6;

            if (lifetimes[i] > 1.0) {
                // Reset particle to initial position
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * spread;
                positions[i * 3] = centerX + Math.cos(angle) * radius;
                positions[i * 3 + 1] = centerY + Math.random() * 0.1;
                positions[i * 3 + 2] = centerZ + Math.sin(angle) * radius;
                lifetimes[i] = 0;
            } else {
                // Move particle upward
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
            }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.lifetime.needsUpdate = true;
    });

    return (
        <points ref={particlesRef} geometry={geometry}>
            <pointsMaterial
                size={particleSize}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function useResponsiveScale() {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            // Mobile: 0.4-0.6, Tablet: 0.6-0.8, Desktop: 0.8-1.0
            if (width < 640) {
                setScale(0.5);
            } else if (width < 1024) {
                setScale(0.7);
            } else {
                setScale(0.9);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return scale;
}

interface CakeAssemblyProps {
    scale: number;
    position?: [number, number, number];
    spinSpeed?: number;
}

function CakeAssembly({ scale, position = [0, 0, 0], spinSpeed = 0 }: CakeAssemblyProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (!groupRef.current || spinSpeed <= 0) return;
        groupRef.current.rotation.y += delta * spinSpeed;
    });

    return (
        <group ref={groupRef} position={position}>
            <Cake scale={scale} />
            <CakeLayerBengala scale={scale} />

            {BENGALA_CONFIG.angles.map((angleDeg, index) => {
                const angleRad = (angleDeg * Math.PI) / 180;
                const x = Math.cos(angleRad) * BENGALA_CONFIG.circleRadius;
                const z = Math.sin(angleRad) * BENGALA_CONFIG.circleRadius;

                return (
                    <SparklerParticles
                        key={index}
                        centerX={x}
                        centerY={BENGALA_CONFIG.yPosition}
                        centerZ={z}
                        spread={BENGALA_CONFIG.particleSpread}
                        particleCount={BENGALA_CONFIG.particlesPerBengala}
                        particleSize={BENGALA_CONFIG.particleSize}
                    />
                );
            })}

            <Candle2 scale={scale} />
            <Candle3 scale={scale} />
        </group>
    );
}

interface BirthdayCakeProps {
    cinematic?: boolean;
    rotating?: boolean;
    blackBackground?: boolean;
}

export default function BirthdayCake({
    cinematic = false,
    rotating = false,
    blackBackground = true,
}: BirthdayCakeProps) {
    const scale = useResponsiveScale();
    const cameraPosition: [number, number, number] = cinematic ? [0, 2.2, 6.2] : [0, 2, 5];

    return (
        <div className="m-0 h-screen w-screen p-0">
            <Canvas
                camera={{ position: cameraPosition, fov: 50 }}
                dpr={cinematic ? [1, 1.25] : [1, 2]}
                className={cinematic ? (blackBackground ? 'bg-black' : 'bg-transparent') : 'bg-[#1a1a2e]'}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />
                    <pointLight position={[-5, 5, 5]} intensity={0.5} />

                    <CakeAssembly
                        scale={scale}
                        position={[0, 1, 0]}
                        spinSpeed={rotating ? 0.95 : 0}
                    />

                    <Environment preset={cinematic ? 'night' : 'sunset'} />
                    <OrbitControls
                        autoRotate={rotating}
                        autoRotateSpeed={rotating ? 1.8 : 0.8}
                        enablePan={false}
                        minDistance={3}
                        maxDistance={10}
                    />
                    <EffectComposer>
                        <Bloom
                            intensity={1.5}          // High enough to be noticed
                            luminanceThreshold={0.5}  // Only the flames glow
                            luminanceSmoothing={0.1}  // Smooth transition
                            mipmapBlur={true}         // High-quality blur
                            radius={0.5}              // Medium spread
                        />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}

// Preload models
useGLTF.preload('/cake_3d.glb');
useGLTF.preload('/cake_layer_1_bengala_v1.glb');
useGLTF.preload('/candle_2.glb');
useGLTF.preload('/candle_3.glb');
