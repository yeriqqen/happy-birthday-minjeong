import { useEffect, useRef, useState } from 'react';
import BirthdayCountdown from './BirthdayCountdown';
import PhotoRain from './PhotoRain';
import VolumeToggle from './VolumeToggle';

interface BirthdayExperienceProps {
    photos: string[];
}

const REVEAL_DURATION_MS = 7000;

export default function BirthdayExperience({ photos }: BirthdayExperienceProps) {
    const [phase, setPhase] = useState<'countdown' | 'reveal' | 'celebration'>('countdown');
    const [shouldPreloadPhotos, setShouldPreloadPhotos] = useState(false);
    const [preloadReady, setPreloadReady] = useState(false);
    const [revealRequested, setRevealRequested] = useState(false);
    const preloadStarted = useRef(false);

    useEffect(() => {
        if (!shouldPreloadPhotos || preloadStarted.current) return;
        preloadStarted.current = true;

        const imageNodes = photos.map(src => {
            const image = new window.Image();
            image.decoding = 'async';
            image.fetchPriority = 'high';
            image.src = `/photos/${src}`;
            return image;
        });

        const preloadJobs = imageNodes.map(image => {
            if (image.complete) {
                return image.decode().catch(() => undefined);
            }

            return new Promise<void>(resolve => {
                const finalize = () => {
                    image.decode().catch(() => undefined).finally(() => resolve());
                };

                image.addEventListener('load', finalize, { once: true });
                image.addEventListener('error', () => resolve(), { once: true });
            });
        });

        Promise.allSettled(preloadJobs).then(() => setPreloadReady(true));
    }, [photos, shouldPreloadPhotos]);

    useEffect(() => {
        if (revealRequested && preloadReady) {
            setPhase('reveal');
        }
    }, [preloadReady, revealRequested]);

    useEffect(() => {
        if (phase !== 'reveal') return;

        const id = window.setTimeout(() => {
            setPhase('celebration');
        }, REVEAL_DURATION_MS);

        return () => window.clearTimeout(id);
    }, [phase]);

    return (
        <>
            {phase !== 'countdown' && (
                <PhotoRain
                    photos={photos}
                    startFresh={true}
                    background={phase === 'reveal' ? 'transparent' : '#1a1a2e'}
                    zIndex={phase === 'reveal' ? 10010 : 5}
                />
            )}

            {phase !== 'celebration' && (
                <BirthdayCountdown
                    holdOnComplete={true}
                    onWarmupStart={() => setShouldPreloadPhotos(true)}
                    onPreReveal={() => setRevealRequested(true)}
                />
            )}

            {phase === 'celebration' && <VolumeToggle />}
        </>
    );
}