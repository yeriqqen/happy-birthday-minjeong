import { useEffect, useState, useMemo, useRef } from 'react';

interface PhotoRainProps {
    photos: string[];
    background?: string;
    zIndex?: number;
    startFresh?: boolean;
    stopping?: boolean;
    onStopped?: () => void;
}

const PHOTO_W = 420; // px
const PHOTO_H = 500; // px — aspect ratio kept generic, objectFit covers the rest
const EDGE_MARGIN = 14; // px: keep 10-20px breathing room near viewport borders
const TARGET_COLUMN_STEP_RATIO = 0.8; // <1 keeps partial horizontal overlap
const MIN_VERTICAL_SPACING_RATIO = 0.75; // <1 allows partial vertical overlap
const FALL_DURATION = 12; // seconds
const DURATION_JITTER = 2.6; // seconds
const HORIZONTAL_JITTER = 36; // px
const LOOP_MULTIPLIER = 4; // 4x longer loop, with same fall speed during active window

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

interface PhotoItem {
    key: string;
    src: string;
    left: number;
    rotation: number;
    delay: number;
    duration: number;
    driftX: number;
}

export default function PhotoRain({
    photos,
    background = '#1a1a2e',
    zIndex = 5,
    startFresh = false,
    stopping = false,
    onStopped,
}: PhotoRainProps) {
    const [vpWidth, setVpWidth] = useState(0);
    const [vpHeight, setVpHeight] = useState(0);
    const [focusedSrc, setFocusedSrc] = useState<string | null>(null);
    const [stoppedKeys, setStoppedKeys] = useState<Set<string>>(new Set());
    const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const rainStartAtRef = useRef<number | null>(null);
    const stopTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        rainStartAtRef.current = performance.now();

        const update = () => {
            setVpWidth(window.innerWidth);
            setVpHeight(window.innerHeight);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    useEffect(() => {
        setStoppedKeys(new Set());
    }, [photos, startFresh]);

    useEffect(() => {
        return () => {
            if (stopTimeoutRef.current !== null) {
                window.clearTimeout(stopTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!focusedSrc) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setFocusedSrc(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [focusedSrc]);

    // Shuffled once on mount so the order is random but stable across re-renders.
    const shuffledPhotos = useMemo(() => shuffle(photos), [photos]);

    const items = useMemo<PhotoItem[]>(() => {
        if (!vpWidth || !vpHeight) return [];

        const availableWidth = Math.max(PHOTO_W, vpWidth - EDGE_MARGIN * 2);

        // Fill almost the whole viewport width while keeping only small side margins.
        const desiredStep = PHOTO_W * TARGET_COLUMN_STEP_RATIO;
        const columns = Math.max(1, Math.floor((availableWidth - PHOTO_W) / desiredStep) + 1);
        const laneStart = EDGE_MARGIN;
        const laneSpan = Math.max(0, availableWidth - PHOTO_W);
        const columnStep = columns > 1 ? laneSpan / (columns - 1) : 0;

        // Allow only limited overlap by keeping a minimum spacing between photos.
        const minVerticalSpacing = PHOTO_H * MIN_VERTICAL_SPACING_RATIO;
        const maxPerCol = Math.max(1, Math.floor((vpHeight + 2 * PHOTO_H) / minVerticalSpacing));

        // Include all photos in the rain cycle.
        const pool = shuffledPhotos;

        const colBuckets: { src: string; rotation: number }[][] =
            Array.from({ length: columns }, () => []);

        pool.forEach((src, i) => {
            colBuckets[i % columns].push({
                src,
                rotation: (Math.random() - 0.5) * 14, // -7° to +7°
            });
        });

        return colBuckets.flatMap((photos, ci) => {
            const cx = laneStart + ci * columnStep;

            return photos.map(({ src, rotation }, j) => {
                const baseDuration = FALL_DURATION + (Math.random() - 0.5) * DURATION_JITTER;
                const duration = baseDuration * LOOP_MULTIPLIER;
                const delay = startFresh
                    ? j * 1.25 + Math.random() * 0.45
                    : -Math.random() * duration;

                return {
                    key: `${ci}-${j}-${src}`,
                    src,
                    left: Math.min(
                        vpWidth - EDGE_MARGIN - PHOTO_W,
                        Math.max(EDGE_MARGIN, cx + (Math.random() - 0.5) * HORIZONTAL_JITTER)
                    ),
                    rotation,
                    // Fresh-start mode reveals from the top; otherwise, randomize phase.
                    delay,
                    duration,
                    driftX: (Math.random() - 0.5) * 34,
                };
            });
        });
    }, [vpWidth, vpHeight, shuffledPhotos, startFresh]);

    useEffect(() => {
        if (!stopping) {
            return;
        }

        if (stopTimeoutRef.current !== null) {
            window.clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }

        const startedAt = rainStartAtRef.current ?? performance.now();
        const elapsedSeconds = Math.max(0, (performance.now() - startedAt) / 1000);
        const newlyStopped = new Set<string>();
        let longestRemainingMs = 0;

        items.forEach(({ key, delay, duration, driftX, rotation }) => {
            const node = itemRefs.current[key];
            if (!node) {
                newlyStopped.add(key);
                return;
            }

            const localElapsed = elapsedSeconds - delay;

            if (localElapsed <= 0) {
                newlyStopped.add(key);
                node.style.opacity = '0';
                node.style.animation = 'none';
                return;
            }

            const progressSeconds = localElapsed % duration;
            const progress = progressSeconds / duration;

            if (progress >= 0.25) {
                newlyStopped.add(key);
                node.style.opacity = '0';
                node.style.animation = 'none';
                return;
            }

            const remainingSeconds = (0.25 - progress) * duration;
            const computed = window.getComputedStyle(node);
            const currentOpacity = computed.opacity;
            const currentTransform = computed.transform === 'none' ? '' : computed.transform;

            node.style.animation = 'none';
            node.style.opacity = currentOpacity;
            node.style.transform = currentTransform;

            const finishAnimation = node.animate(
                [
                    { transform: currentTransform, opacity: Number(currentOpacity) || 1 },
                    {
                        transform: `translate3d(${driftX}px, calc(100vh + ${PHOTO_H * 2}px), 0) rotate(${rotation}deg)`,
                        opacity: 0,
                    },
                ],
                {
                    duration: Math.max(80, remainingSeconds * 1000),
                    easing: 'linear',
                    fill: 'forwards',
                }
            );

            finishAnimation.onfinish = () => {
                newlyStopped.add(key);
                setStoppedKeys(new Set(newlyStopped));
            };

            longestRemainingMs = Math.max(longestRemainingMs, remainingSeconds * 1000);
        });

        setStoppedKeys(new Set(newlyStopped));

        stopTimeoutRef.current = window.setTimeout(() => {
            setStoppedKeys(new Set(items.map(item => item.key)));
            onStopped?.();
        }, Math.max(120, longestRemainingMs + 80));
    }, [items, onStopped, stopping]);

    if (!vpWidth || !vpHeight) return null;

    return (
        <div
            className="fixed inset-0 overflow-hidden"
            style={{
                background,
                zIndex,
            }}
        >
            <style>{`
                @keyframes photoFall {
                    0% {
                        transform: translate3d(0, -${PHOTO_H * 2}px, 0) rotate(var(--photo-rot));
                        opacity: 0;
                    }
                    2%  { opacity: 1; }
                    23% { opacity: 1; }
                    25% {
                        transform: translate3d(var(--drift-x), calc(100vh + ${PHOTO_H * 2}px), 0) rotate(var(--photo-rot));
                        opacity: 0;
                    }
                    100% {
                        transform: translate3d(var(--drift-x), calc(100vh + ${PHOTO_H * 2}px), 0) rotate(var(--photo-rot));
                        opacity: 0;
                    }
                }

                @keyframes focusBackdropIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes photoFocusIn {
                    0% {
                        opacity: 0;
                        transform: perspective(1200px) translateZ(-260px) scale(0.72) rotateX(8deg);
                        filter: saturate(0.9) blur(1px);
                    }
                    70% {
                        opacity: 1;
                        transform: perspective(1200px) translateZ(0) scale(1.03) rotateX(0deg);
                        filter: saturate(1.03) blur(0);
                    }
                    100% {
                        opacity: 1;
                        transform: perspective(1200px) translateZ(0) scale(1) rotateX(0deg);
                        filter: saturate(1) blur(0);
                    }
                }
            `}</style>

            {items.map(({ key, src, left, rotation, delay, duration, driftX }) => (
                <button
                    key={key}
                    type="button"
                    aria-label="Open photo"
                    ref={node => {
                        itemRefs.current[key] = node;
                    }}
                    onClick={() => setFocusedSrc(src)}
                    className="absolute top-0 cursor-pointer border-0 bg-transparent p-0"
                    style={{
                        display: stoppedKeys.has(key) ? 'none' : 'block',
                        left: `${left}px`,
                        width: `${PHOTO_W}px`,
                        height: `${PHOTO_H}px`,
                        animation: `photoFall ${duration}s linear ${delay}s infinite`,
                        animationFillMode: startFresh ? 'backwards' : 'none',
                        // CSS custom property lets the keyframe share the rotation value.
                        ['--photo-rot' as string]: `${rotation}deg`,
                        ['--drift-x' as string]: `${driftX}px`,
                    } as React.CSSProperties}
                >
                    <img
                        src={src}
                        alt=""
                        width={PHOTO_W}
                        height={PHOTO_H}
                        loading="eager"
                        decoding="sync"
                        fetchPriority="high"
                        className="block h-full w-full rounded-[10px] object-cover shadow-[0_6px_24px_rgba(0,0,0,0.65)]"
                    />
                </button>
            ))}

            {focusedSrc && (
                <div
                    onClick={() => setFocusedSrc(null)}
                    className="fixed inset-0 z-30 flex items-center justify-center p-6"
                    style={{
                        background: 'rgba(6, 8, 18, 0.78)',
                        backdropFilter: 'blur(5px)',
                        animation: 'focusBackdropIn 220ms ease-out',
                    }}
                >
                    <img
                        onClick={event => event.stopPropagation()}
                        src={focusedSrc}
                        alt="Focused photo"
                        width={PHOTO_W}
                        height={PHOTO_H}
                        className="block h-auto max-h-[90vh] w-[min(92vw,860px)] origin-center object-contain will-change-[transform,opacity,filter]"
                        style={{
                            animation: 'photoFocusIn 340ms cubic-bezier(0.18, 0.82, 0.2, 1) both',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
