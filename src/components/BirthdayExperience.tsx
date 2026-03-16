import { useEffect, useRef, useState } from 'react';
import BirthdayCountdown from './BirthdayCountdown';
import BirthdayCake from './BirthdayCake';
import PhotoRain from './PhotoRain';

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
    'HAPPY BIRTHDAY TO YOU',
    'HAPPY BIRTHDAY TO YOU',
    "HAPPY BIRTHDAY, DEAR MINJEONG",
    'HAPPY BIRTHDAY TO YOU.',
];

const LYRIC_STEP_MS = 3000;
const LYRIC_TRANSITION_MS = 620;
const POST_LYRICS_HOLD_MS = 1200;
const CAKE_ENTRY_MS = 5500;
const WISH_PROMPT_DELAY_MS = 600;
const WISH_PROMPT_VISIBLE_MS = 2600;
const WISH_PROMPT_FADE_MS = 500;
const OF_COURSE_DELAY_MS = 800;
const POST_BLOW_RAIN_DELAY_MS = 3000;
const BACK_TO_CAKE_BUTTON_DELAY_MS = 10000;

export default function BirthdayExperience({ photos }: BirthdayExperienceProps) {
    const [phase, setPhase] = useState<
        'countdown' | 'ready' | 'bulbs' | 'music' | 'cakeIntro' | 'cakeWish' | 'rainfall' | 'cakeReturn'
    >('countdown');
    const [visibleLineIndex, setVisibleLineIndex] = useState(-1);
    const [outgoingLineIndex, setOutgoingLineIndex] = useState(-1);
    const [showWishPrompt, setShowWishPrompt] = useState(false);
    const [isWishPromptFading, setIsWishPromptFading] = useState(false);
    const [isWishPromptVisible, setIsWishPromptVisible] = useState(false);
    const [hasShownWishPrompt, setHasShownWishPrompt] = useState(false);
    const [wishButtonStep, setWishButtonStep] = useState(0);
    const [isCakeBlown, setIsCakeBlown] = useState(false);
    const [isWaitingOfCourse, setIsWaitingOfCourse] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isRainStopping, setIsRainStopping] = useState(false);
    const [showBackToCakeButton, setShowBackToCakeButton] = useState(false);
    const [wishPromptPosition, setWishPromptPosition] = useState<{ left: number; top: number }>({
        left: 12,
        top: 20,
    });
    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricIndexRef = useRef(-1);
    const lineTimeoutsRef = useRef<number[]>([]);
    const wishPromptTimeoutsRef = useRef<number[]>([]);
    const buttonStepTimeoutsRef = useRef<number[]>([]);
    const rainStartTimeoutsRef = useRef<number[]>([]);
    const rainUiTimeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        if (phase !== 'music') return;

        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.42;
        audio.loop = true;
        audio.currentTime = 0;
        audio.muted = isMuted;

        void audio.play().catch(() => {
            // Playback can still fail on strict browser autoplay policies.
        });
    }, [phase, isMuted]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.muted = isMuted;
    }, [isMuted]);

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

    useEffect(() => {
        const inCakeScene = phase === 'cakeWish' || phase === 'rainfall' || phase === 'cakeReturn';

        if (!inCakeScene) {
            setShowWishPrompt(false);
            setIsWishPromptFading(false);
            setIsWishPromptVisible(false);
            setHasShownWishPrompt(false);
            setWishButtonStep(0);
            setIsCakeBlown(false);
            setIsWaitingOfCourse(false);
            setIsMuted(false);
            wishPromptTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            wishPromptTimeoutsRef.current = [];
            buttonStepTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            buttonStepTimeoutsRef.current = [];
            rainStartTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            rainStartTimeoutsRef.current = [];
            rainUiTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            rainUiTimeoutsRef.current = [];
            setIsRainStopping(false);
            setShowBackToCakeButton(false);
        }
    }, [phase]);

    useEffect(() => {
        rainUiTimeoutsRef.current.forEach(id => window.clearTimeout(id));
        rainUiTimeoutsRef.current = [];

        if (phase !== 'rainfall') {
            setShowBackToCakeButton(false);
            setIsRainStopping(false);
            return;
        }

        setShowBackToCakeButton(false);
        const showButtonId = window.setTimeout(() => {
            setShowBackToCakeButton(true);
        }, BACK_TO_CAKE_BUTTON_DELAY_MS);
        rainUiTimeoutsRef.current.push(showButtonId);

        return () => {
            rainUiTimeoutsRef.current.forEach(id => window.clearTimeout(id));
            rainUiTimeoutsRef.current = [];
        };
    }, [phase]);

    const showBulbs = phase === 'bulbs' || phase === 'music' || phase === 'cakeIntro';
    const isMusicPhase = phase === 'music';

    const handleLightBulbs = () => setPhase('bulbs');
    const handleAddMusic = () => setPhase('music');
    const handleBackToCake = () => {
        rainStartTimeoutsRef.current.forEach(id => window.clearTimeout(id));
        rainStartTimeoutsRef.current = [];
        setIsRainStopping(true);
        setShowBackToCakeButton(false);
    };

    const handleRainStopped = () => {
        setShowWishPrompt(false);
        setIsWishPromptFading(false);
        setIsWishPromptVisible(false);
        setHasShownWishPrompt(false);
        setWishButtonStep(0);
        setIsWaitingOfCourse(false);
        setIsCakeBlown(false);
        setIsRainStopping(false);
        setPhase('cakeReturn');
    };

    const getWishPromptPosition = () => {
        // Keep text away from borders and avoid the center area where the cake sits.
        const min = 18;
        const max = 82;

        for (let i = 0; i < 16; i++) {
            const left = min + Math.random() * (max - min);
            const top = min + Math.random() * (max - min);
            const inCakeZone = left >= 35 && left <= 65 && top >= 34 && top <= 70;

            if (!inCakeZone) {
                return { left, top };
            }
        }

        return { left: 22, top: 24 };
    };

    const handleMakeWish = () => {
        if (isWaitingOfCourse) {
            return;
        }

        if (wishButtonStep === 2) {
            setIsCakeBlown(true);

            const rainId = window.setTimeout(() => {
                setPhase('rainfall');
            }, POST_BLOW_RAIN_DELAY_MS);
            rainStartTimeoutsRef.current.push(rainId);
            return;
        }

        if (wishButtonStep === 0) {
            setIsWaitingOfCourse(true);
            const stepId = window.setTimeout(() => {
                setWishButtonStep(1);
                setIsWaitingOfCourse(false);
            }, OF_COURSE_DELAY_MS);
            buttonStepTimeoutsRef.current.push(stepId);
        } else if (wishButtonStep === 1) {
            setWishButtonStep(2);
        }

        if (hasShownWishPrompt) {
            return;
        }

        setHasShownWishPrompt(true);
        wishPromptTimeoutsRef.current.forEach(id => window.clearTimeout(id));
        wishPromptTimeoutsRef.current = [];

        setShowWishPrompt(false);
        setIsWishPromptFading(false);
        setIsWishPromptVisible(false);

        const revealId = window.setTimeout(() => {
            setWishPromptPosition(getWishPromptPosition());
            setShowWishPrompt(true);

            const appearId = window.setTimeout(() => {
                setIsWishPromptVisible(true);
            }, 30);
            wishPromptTimeoutsRef.current.push(appearId);

            const fadeId = window.setTimeout(() => {
                setIsWishPromptFading(true);
                setIsWishPromptVisible(false);

                const hideId = window.setTimeout(() => {
                    setShowWishPrompt(false);
                    setIsWishPromptFading(false);
                    setIsWishPromptVisible(false);
                }, WISH_PROMPT_FADE_MS);
                wishPromptTimeoutsRef.current.push(hideId);
            }, WISH_PROMPT_VISIBLE_MS);
            wishPromptTimeoutsRef.current.push(fadeId);
        }, WISH_PROMPT_DELAY_MS);

        wishPromptTimeoutsRef.current.push(revealId);
    };

    const wishButtonText = ['make a wish', 'of course', 'blow'][wishButtonStep];
    const showSoundToggle = phase === 'rainfall' || phase === 'cakeReturn';

    const handleSoundToggle = () => {
        const audio = audioRef.current;
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);

        if (audio) {
            audio.muted = nextMuted;
            if (!nextMuted) {
                void audio.play().catch(() => {
                    // Playback can still be blocked until the next user interaction.
                });
            }
        }
    };

    return (
        <>
            <audio ref={audioRef} src="/happy_birthday.mp3" preload="auto" loop playsInline />

            {phase === 'rainfall' && (
                <PhotoRain
                    photos={photos}
                    background="transparent"
                    zIndex={46}
                    startFresh={true}
                    stopping={isRainStopping}
                    onStopped={handleRainStopped}
                />
            )}

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
                                className="animate-lyric-out absolute text-[clamp(1.8rem,6.8vw,5.4rem)] font-black leading-[1.02] tracking-tight text-pink-400 [text-shadow:0_10px_30px_rgba(0,0,0,0.35)]"
                            >
                                {BIRTHDAY_LINES[outgoingLineIndex]}
                            </p>
                        )}

                        {visibleLineIndex >= 0 && (
                            <p
                                key={`${BIRTHDAY_LINES[visibleLineIndex]}-${visibleLineIndex}`}
                                className="animate-lyric-in absolute text-[clamp(1.8rem,6.8vw,5.4rem)] font-black leading-[1.02] tracking-tight text-pink-400 [text-shadow:0_10px_30px_rgba(0,0,0,0.35)]"
                            >
                                {BIRTHDAY_LINES[visibleLineIndex]}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {(phase === 'music' || phase === 'cakeIntro' || phase === 'cakeWish' || phase === 'rainfall' || phase === 'cakeReturn') && (
                <div
                    className={`fixed inset-0 z-45 ${phase === 'music' ? 'pointer-events-none opacity-0' : ''
                        }`}
                >
                    {phase === 'cakeIntro' && <div className="absolute inset-0 animate-lights-out bg-black" />}
                    <div
                        className={`absolute inset-0 ${phase === 'cakeIntro' || phase === 'cakeReturn'
                            ? 'animate-cake-arrive'
                            : phase === 'cakeWish' || phase === 'rainfall'
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                    >
                        <BirthdayCake
                            cinematic={true}
                            rotating={phase === 'cakeIntro'}
                            blackBackground={phase === 'cakeWish' || phase === 'rainfall' || phase === 'cakeReturn'}
                            sparksEnabled={!isCakeBlown}
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
                    onClick={handleMakeWish}
                    className="fixed bottom-[clamp(20px,5vh,44px)] left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border border-white/45 bg-white/14 px-7 py-4 font-mono text-base leading-none tracking-[0.08em] text-white backdrop-blur-sm hover:bg-white/22"
                >
                    {wishButtonText}
                </button>
            )}

            {phase === 'cakeWish' && showWishPrompt && (
                <p
                    className={`pointer-events-none fixed z-55 -translate-x-1/2 -translate-y-1/2 text-[clamp(1.2rem,3.4vw,2.5rem)] font-black tracking-tight text-pink-300 transition-opacity duration-900 [text-shadow:0_10px_30px_rgba(0,0,0,0.55)] ${isWishPromptVisible && !isWishPromptFading ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ left: `${wishPromptPosition.left}%`, top: `${wishPromptPosition.top}%` }}
                >
                    did you wish about me?
                </p>
            )}

            {phase === 'rainfall' && showBackToCakeButton && !isRainStopping && (
                <button
                    type="button"
                    onClick={handleBackToCake}
                    className="fixed bottom-[clamp(20px,5vh,44px)] left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border border-white/45 bg-white/14 px-7 py-4 font-mono text-base leading-none tracking-[0.08em] text-white backdrop-blur-sm hover:bg-white/22"
                >
                    back to the cake
                </button>
            )}

            {showSoundToggle && (
                <button
                    type="button"
                    onClick={handleSoundToggle}
                    aria-pressed={!isMuted}
                    aria-label={isMuted ? 'Unmute birthday song' : 'Mute birthday song'}
                    className="fixed right-5 top-5 z-60 cursor-pointer rounded-full border border-white/35 bg-[rgba(8,12,28,0.55)] px-4 py-3 text-[0.9rem] leading-[1.1] font-semibold tracking-[0.04em] text-[#fff7d6] backdrop-blur-[14px]"
                >
                    {isMuted ? 'Sound Off' : 'Sound On'}
                </button>
            )}
        </>
    );
}