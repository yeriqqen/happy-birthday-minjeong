import { useEffect, useRef, useState } from 'react';

export default function VolumeToggle() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState(false);

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
                audio.muted = isMuted;
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
            <audio ref={audioRef} src="/happy_birthday.mp3" autoPlay preload="auto" playsInline loop muted />
            <button
                type="button"
                onClick={handleToggle}
                aria-pressed={!isMuted}
                aria-label={isMuted ? 'Unmute birthday song' : 'Mute birthday song'}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 20,
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: '999px',
                    padding: '0.7rem 1rem',
                    background: 'rgba(8, 12, 28, 0.55)',
                    color: '#fff7d6',
                    backdropFilter: 'blur(14px)',
                    cursor: 'pointer',
                    font: '600 0.9rem/1.1 system-ui, sans-serif',
                    letterSpacing: '0.04em'
                }}
            >
                {isMuted ? 'Sound Off' : 'Sound On'}
            </button>
        </>
    );
}