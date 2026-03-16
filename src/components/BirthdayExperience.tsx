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
            <style>{`
                @keyframes sceneFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes bulbsEnter {
                    from {
                        opacity: 0;
                        transform: translateY(-16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bulbBlink {
                    0% {
                        opacity: 0.14;
                        filter: drop-shadow(0 0 6px rgba(255, 235, 145, 0.45)) drop-shadow(0 0 12px rgba(255, 210, 95, 0.35));
                    }
                    25% {
                        opacity: 0.92;
                        filter: drop-shadow(0 0 18px rgba(255, 235, 145, 0.95)) drop-shadow(0 0 38px rgba(255, 210, 95, 0.82));
                    }
                    52% {
                        opacity: 0.26;
                        filter: drop-shadow(0 0 8px rgba(255, 235, 145, 0.5)) drop-shadow(0 0 16px rgba(255, 210, 95, 0.4));
                    }
                    76% {
                        opacity: 1;
                        filter: drop-shadow(0 0 20px rgba(255, 235, 145, 1)) drop-shadow(0 0 42px rgba(255, 210, 95, 0.86));
                    }
                    100% {
                        opacity: 0.16;
                        filter: drop-shadow(0 0 7px rgba(255, 235, 145, 0.45)) drop-shadow(0 0 14px rgba(255, 210, 95, 0.36));
                    }
                }
            `}</style>

            <audio ref={audioRef} src="/happy_birthday.mp3" preload="auto" loop playsInline />

            {showBulbs && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 20,
                        background:
                            'radial-gradient(circle at 50% 38%, #fffbe8 0%, #ffeec2 42%, #f4da8e 68%, #e2c56a 100%)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        animation: 'sceneFadeIn 360ms ease-out both',
                    }}
                >
                    <div
                        style={{
                            width: 'min(96vw, 1180px)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, minmax(110px, 1fr))',
                            gap: 'clamp(8px, 2vw, 22px)',
                            paddingTop: 0,
                            marginTop: 0,
                            alignItems: 'start',
                            animation: 'bulbsEnter 420ms cubic-bezier(0.2, 0.88, 0.24, 1) both',
                        }}
                    >
                        {BULB_COLORS.map((src, index) => (
                            <div key={src} style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4' }}>
                                <img
                                    src="/bulbs/bulb.png"
                                    alt=""
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                                <img
                                    src={src}
                                    alt=""
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                        opacity: isMusicPhase ? 1 : 0,
                                        animation: isMusicPhase
                                            ? `bulbBlink ${1.4 + index * 0.1}s ease-in-out infinite ${index * 0.12}s`
                                            : 'none',
                                        filter: isMusicPhase
                                            ? 'drop-shadow(0 0 15px rgba(255, 235, 145, 0.95)) drop-shadow(0 0 34px rgba(255, 210, 95, 0.78))'
                                            : 'none',
                                        transition: 'opacity 320ms ease, filter 320ms ease',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {phase === 'countdown' && <BirthdayCountdown onComplete={() => setPhase('ready')} />}

            {phase === 'ready' && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 30,
                        background: '#000',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '24px',
                    }}
                >
                    <button
                        type="button"
                        onClick={handleLightBulbs}
                        style={{
                            border: '1px solid rgba(255, 255, 255, 0.38)',
                            borderRadius: '999px',
                            padding: '0.95rem 1.45rem',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#fff',
                            cursor: 'pointer',
                            font: '700 1rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            letterSpacing: '0.06em',
                        }}
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
                    style={{
                        position: 'fixed',
                        bottom: 'clamp(20px, 5vh, 44px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 40,
                        border: '1px solid rgba(34, 34, 34, 0.2)',
                        borderRadius: '999px',
                        padding: '0.95rem 1.45rem',
                        background: phase === 'music' ? 'rgba(40,40,40,0.15)' : 'rgba(255,255,255,0.62)',
                        color: '#101010',
                        cursor: phase === 'music' ? 'default' : 'pointer',
                        font: '700 1rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        letterSpacing: '0.06em',
                    }}
                >
                    add the music
                </button>
            )}
        </>
    );
}