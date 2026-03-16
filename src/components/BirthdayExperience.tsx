import { useEffect, useRef, useState } from 'react';
import BirthdayCountdown from './BirthdayCountdown';

interface BirthdayExperienceProps {
    photos: string[];
}

const BULB_COLORS = [
    '/bulbs/bulb_red.png',
    '/bulbs/bulb_orange.png',
    '/bulbs/bulb_yellow.png',
    '/bulbs/bulb_green.png',
    '/bulbs/bulb_blue.png',
    '/bulbs/bulb_pink.png',
];

export default function BirthdayExperience({ photos: _photos }: BirthdayExperienceProps) {
    const [phase, setPhase] = useState<'countdown' | 'ready' | 'bulbs' | 'music'>('countdown');
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (phase !== 'music') return;

        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.42;
        audio.loop = true;
        audio.currentTime = 0;

        void audio.play().catch(() => {
            // Playback can still fail on strict browser autoplay policies.
        });
    }, [phase]);

    const showBulbs = phase === 'bulbs' || phase === 'music';
    const isMusicPhase = phase === 'music';

    const handleLightBulbs = () => setPhase('bulbs');
    const handleAddMusic = () => setPhase('music');

    return (
        <>
            <audio ref={audioRef} src="/happy_birthday.mp3" preload="auto" loop playsInline />

            {showBulbs && (
                <div className="animate-scene-fade-in fixed inset-0 z-20 flex items-start justify-center bg-[radial-gradient(circle_at_50%_38%,#fffbe8_0%,#ffeec2_42%,#f4da8e_68%,#e2c56a_100%)]">
                    <div className="animate-bulbs-enter mt-0 grid w-[min(96vw,1180px)] grid-cols-6 items-start gap-[clamp(8px,2vw,22px)] pt-0">
                        {BULB_COLORS.map((src, index) => (
                            <div key={src} className="relative aspect-3/4 w-full">
                                <img src="/bulbs/bulb.png" alt="" className="block size-full object-contain" />
                                <img
                                    src={src}
                                    alt=""
                                    className="absolute inset-0 block size-full object-contain transition-[opacity,filter] duration-300 ease-out"
                                    style={{
                                        opacity: isMusicPhase ? 1 : 0,
                                        animation: isMusicPhase
                                            ? `bulb-blink ${1.4 + index * 0.1}s ease-in-out infinite ${index * 0.12}s`
                                            : 'none',
                                        filter: isMusicPhase
                                            ? 'drop-shadow(0 0 15px rgba(255, 235, 145, 0.95)) drop-shadow(0 0 34px rgba(255, 210, 95, 0.78))'
                                            : 'none',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'countdown' && <BirthdayCountdown onComplete={() => setPhase('ready')} />}

            {phase === 'ready' && (
                <div className="fixed inset-0 z-30 grid place-items-center bg-black p-6">
                    <button
                        type="button"
                        onClick={handleLightBulbs}
                        className="cursor-pointer rounded-full border border-white/40 bg-white/10 px-6 py-4 font-mono text-base leading-none tracking-[0.06em] text-white"
                    >
                        light the bulbs
                    </button>
                </div>
            )}

            {(phase === 'bulbs' || phase === 'music') && (
                <button
                    type="button"
                    onClick={handleAddMusic}
                    disabled={phase === 'music'}
                    className={`fixed bottom-[clamp(20px,5vh,44px)] left-1/2 z-40 -translate-x-1/2 rounded-full border border-black/20 px-6 py-4 font-mono text-base leading-none tracking-[0.06em] text-black ${
                        phase === 'music'
                            ? 'cursor-default bg-neutral-700/15'
                            : 'cursor-pointer bg-white/65 hover:bg-white/75'
                    }`}
                >
                    add the music
                </button>
            )}
        </>
    );
}