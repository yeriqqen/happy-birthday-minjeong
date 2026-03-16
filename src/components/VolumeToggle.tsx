// VolumeToggle component has been removed because it was unused and
// BirthdayExperience already implements its own sound toggle.
// This file is intentionally left without any exported component.
import { useEffect, useRef, useState } from 'react';

export default function VolumeToggle() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const latestMutedRef = useRef(isMuted);
    const birthdaySongSrc = `${import.meta.env.BASE_URL}happy_birthday.mp3`;

    useEffect(() => {
        latestMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        audio.volume = 0.35;
        audio.loop = true;

        audio.muted = false;

        const tryPlay = () => {
            void audio.play().then(() => {
                audio.muted = latestMutedRef.current;
            }).catch(() => {
                // Browser autoplay can fail until the first user interaction.
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryPlay, { once: true });
        } else {
            tryPlay();
        }

        window.addEventListener('load', tryPlay, { once: true });
        window.addEventListener('pageshow', tryPlay, { once: true });

        const startOnInteraction = () => {
            tryPlay();
        };

        document.addEventListener('pointerdown', startOnInteraction, { once: true });
        document.addEventListener('keydown', startOnInteraction, { once: true });
        document.addEventListener('touchstart', startOnInteraction, { once: true });

        return () => {
            document.removeEventListener('pointerdown', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
            document.removeEventListener('touchstart', startOnInteraction);
            window.removeEventListener('load', tryPlay);
            window.removeEventListener('pageshow', tryPlay);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const handleToggle = () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        const nextMuted = !isMuted;
        audio.muted = nextMuted;
        setIsMuted(nextMuted);

        if (!nextMuted) {
            void audio.play().catch(() => {
                // If playback is still blocked, the next interaction will retry.
            });
        }
    };

    return (
        <>
            <audio ref={audioRef} src={birthdaySongSrc} autoPlay preload="auto" playsInline loop muted />
            <button
                type="button"
                onClick={handleToggle}
                aria-pressed={!isMuted}
                aria-label={isMuted ? 'Unmute birthday song' : 'Mute birthday song'}
                className="fixed right-5 top-5 z-20 cursor-pointer rounded-full border border-white/35 bg-[rgba(8,12,28,0.55)] px-4 py-3 text-[0.9rem] leading-[1.1] font-semibold tracking-[0.04em] text-[#fff7d6] backdrop-blur-[14px]"
            >
                {isMuted ? 'Sound Off' : 'Sound On'}
            </button>
        </>
    );
}