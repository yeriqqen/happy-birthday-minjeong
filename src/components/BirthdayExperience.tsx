import { useEffect, useRef, useState } from 'react';
import BirthdayCountdown from './BirthdayCountdown';
import BirthdayCake from './BirthdayCake';

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

const BIRTHDAY_LINES = [
    'Happy birthday to you',
    'Happy birthday to you',
    "Happy birthday, dear MinJeong",
    'Happy birthday to you.',
];

const LYRIC_STEP_MS = 1600;
const LYRIC_TRANSITION_MS = 620;
const POST_LYRICS_HOLD_MS = 1200;
const CAKE_ENTRY_MS = 2300;

export default function BirthdayExperience({ photos: _photos }: BirthdayExperienceProps) {
    const [phase, setPhase] = useState<
        'countdown' | 'ready' | 'bulbs' | 'music' | 'cakeIntro' | 'cakeWish'
    >('countdown');
    const [visibleLineIndex, setVisibleLineIndex] = useState(-1);
    const [outgoingLineIndex, setOutgoingLineIndex] = useState(-1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricIndexRef = useRef(-1);
    const lineTimeoutsRef = useRef<number[]>([]);

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

    useEffect(() => {
        if (phase !== 'music') {
            setVisibleLineIndex(-1);
            setOutgoingLineIndex(-1);
            lyricIndexRef.current = -1;
            lineTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            lineTimeoutsRef.current = [];
            return;
        }

        lyricIndexRef.current = 0;
        setVisibleLineIndex(0);
        setOutgoingLineIndex(-1);

        const id = window.setInterval(() => {
            if (lyricIndexRef.current >= BIRTHDAY_LINES.length - 1) {
                window.clearInterval(id);
                return;
            }

            setOutgoingLineIndex(lyricIndexRef.current);
            lyricIndexRef.current += 1;
            setVisibleLineIndex(lyricIndexRef.current);

            const timeoutId = window.setTimeout(() => {
                setOutgoingLineIndex(-1);
            }, LYRIC_TRANSITION_MS);
            lineTimeoutsRef.current.push(timeoutId);
        }, LYRIC_STEP_MS);

        return () => {
            window.clearInterval(id);
            lineTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
            lineTimeoutsRef.current = [];
        };
    }, [phase]);

    useEffect(() => {
        if (phase !== 'music') return;
        if (visibleLineIndex !== BIRTHDAY_LINES.length - 1 || outgoingLineIndex !== -1) return;

        const id = window.setTimeout(() => {
            setPhase('cakeIntro');
        }, POST_LYRICS_HOLD_MS);

        return () => window.clearTimeout(id);
    }, [phase, visibleLineIndex, outgoingLineIndex]);

    useEffect(() => {
        if (phase !== 'cakeIntro') return;

        const id = window.setTimeout(() => {
            setPhase('cakeWish');
        }, CAKE_ENTRY_MS);

        return () => window.clearTimeout(id);
    }, [phase]);

    const showBulbs = phase === 'bulbs' || phase === 'music' || phase === 'cakeIntro';
    const isMusicPhase = phase === 'music';

    const handleLightBulbs = () => setPhase('bulbs');
    const handleAddMusic = () => setPhase('music');

    return (
        <>
            <audio ref={audioRef} src="/happy_birthday.mp3" preload="auto" loop playsInline />

            {showBulbs && (
                <div className="animate-scene-fade-in fixed inset-0 z-20 flex items-start justify-center bg-[radial-gradient(circle_at_50%_38%,#fffbe8_0%,#ffeec2_42%,#f4da8e_68%,#e2c56a_100%)]">
                    <div className="animate-bulbs-enter mt-0 w-full flex flex-row justify-around pt-0">
                        {BULB_COLORS.map((src, index) => (
                            <div key={src} className="relative mx-auto aspect-3/4 w-full max-w-30 -translate-y-8">
                                <img src="/bulbs/bulb.png" alt="" className="block size-full object-contain" />
                                <img
                                    src={src}
                                    alt=""
                                    className="absolute inset-0 block size-full object-contain transition-[opacity,filter] duration-300 ease-out"
                                    style={{
                                        opacity: 1,
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
                        🩷 light the bulbs 🩷
                    </button>
                </div>
            )}

            {phase === 'music' && (
                <div className="pointer-events-none fixed inset-0 z-35 grid place-items-center px-6 text-center">
                    <div className="relative flex min-h-30 w-full max-w-6xl items-center justify-center md:min-h-40">
                        {outgoingLineIndex >= 0 && (
                            <p
                                key={`out-${BIRTHDAY_LINES[outgoingLineIndex]}-${outgoingLineIndex}`}
                                className="animate-lyric-out absolute text-[clamp(1.8rem,6.8vw,5.4rem)] font-black leading-[1.02] tracking-tight text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.35)]"
                            >
                                {BIRTHDAY_LINES[outgoingLineIndex]}
                            </p>
                        )}

                        {visibleLineIndex >= 0 && (
                            <p
                                key={`${BIRTHDAY_LINES[visibleLineIndex]}-${visibleLineIndex}`}
                                className="animate-lyric-in absolute text-[clamp(1.8rem,6.8vw,5.4rem)] font-black leading-[1.02] tracking-tight text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.35)]"
                            >
                                {BIRTHDAY_LINES[visibleLineIndex]}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {(phase === 'music' || phase === 'cakeIntro' || phase === 'cakeWish') && (
                <div
                    className={`fixed inset-0 z-45 ${
                        phase === 'music' ? 'pointer-events-none opacity-0' : ''
                    }`}
                >
                    {phase === 'cakeIntro' && <div className="absolute inset-0 animate-lights-out bg-black" />}
                    <div
                        className={`absolute inset-0 ${
                            phase === 'cakeIntro'
                                ? 'animate-cake-arrive'
                                : phase === 'cakeWish'
                                  ? 'opacity-100'
                                  : 'opacity-0'
                        }`}
                    >
                        <BirthdayCake
                            cinematic={true}
                            rotating={phase === 'cakeIntro'}
                            blackBackground={phase === 'cakeWish'}
                        />
                    </div>
                </div>
            )}

            {phase === 'bulbs' && (
                <button
                    type="button"
                    onClick={handleAddMusic}
                    className="fixed bottom-[clamp(20px,5vh,44px)] left-1/2 z-40 -translate-x-1/2 cursor-pointer rounded-full border border-black/20 bg-white/65 px-6 py-4 font-mono text-base leading-none tracking-[0.06em] text-black hover:bg-white/75"
                >
                    🩷 oh MinJeong, my MinJeong 🩷
                </button>
            )}

            {phase === 'cakeWish' && (
                <button
                    type="button"
                    className="fixed bottom-[clamp(20px,5vh,44px)] left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border border-white/45 bg-white/14 px-7 py-4 font-mono text-base leading-none tracking-[0.08em] text-white backdrop-blur-sm hover:bg-white/22"
                >
                    make a wish
                </button>
            )}
        </>
    );
}