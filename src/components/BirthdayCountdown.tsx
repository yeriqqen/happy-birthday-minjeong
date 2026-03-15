import { useEffect, useMemo, useState } from 'react';

const TARGET_TIME_ZONE = 'America/Los_Angeles';
const BIRTHDAY_MONTH_INDEX = 2; // March (0-based)
const BIRTHDAY_DAY = 18;
const USE_QUICK_TEST_COUNTDOWN = true;
const QUICK_TEST_SECONDS = 5;
const PRELOAD_LEAD_MS = 60_000;
const PRE_REVEAL_LEAD_MS = 3_000;

interface BirthdayCountdownProps {
    holdOnComplete?: boolean;
    onComplete?: () => void;
    onWarmupStart?: () => void;
    onPreReveal?: () => void;
}

interface TimeLeft {
    totalMs: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function getTzOffsetMinutes(timeZone: string, atUtcMs: number): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'shortOffset',
    });

    const tzName =
        formatter.formatToParts(new Date(atUtcMs)).find(part => part.type === 'timeZoneName')?.value ??
        'GMT+0';

    const match = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? 0);
    return sign * (hours * 60 + minutes);
}

function getBirthdayUtcMs(year: number): number {
    // Start from a noon UTC probe to reliably read that day's timezone offset.
    const probeUtc = Date.UTC(year, BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY, 12, 0, 0);
    const offsetMinutes = getTzOffsetMinutes(TARGET_TIME_ZONE, probeUtc);

    // Convert 00:00 in the target timezone into UTC milliseconds.
    return Date.UTC(year, BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY, 0, 0, 0) - offsetMinutes * 60_000;
}

function getNextBirthdayUtcMs(nowMs: number): number {
    const now = new Date(nowMs);
    let year = now.getUTCFullYear();

    let birthdayUtc = getBirthdayUtcMs(year);
    if (birthdayUtc <= nowMs) {
        year += 1;
        birthdayUtc = getBirthdayUtcMs(year);
    }

    return birthdayUtc;
}

function getTimeLeft(targetUtcMs: number, nowMs: number): TimeLeft {
    const totalMs = Math.max(0, targetUtcMs - nowMs);
    const totalSeconds = Math.floor(totalMs / 1000);

    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { totalMs, days, hours, minutes, seconds };
}

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

export default function BirthdayCountdown({
    holdOnComplete = false,
    onComplete,
    onWarmupStart,
    onPreReveal,
}: BirthdayCountdownProps) {
    const targetUtcMs = useMemo(() => {
        const nowMs = Date.now();
        if (USE_QUICK_TEST_COUNTDOWN) {
            return nowMs + QUICK_TEST_SECONDS * 1000;
        }
        return getNextBirthdayUtcMs(nowMs);
    }, []);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetUtcMs, Date.now()));
    const [isComplete, setIsComplete] = useState(false);
    const [hasStartedWarmup, setHasStartedWarmup] = useState(false);
    const [hasPreReveal, setHasPreReveal] = useState(false);

    useEffect(() => {
        const tick = () => {
            const nextTimeLeft = getTimeLeft(targetUtcMs, Date.now());
            setTimeLeft(nextTimeLeft);

            if (nextTimeLeft.totalMs <= PRELOAD_LEAD_MS) {
                setHasStartedWarmup(prev => {
                    if (!prev) onWarmupStart?.();
                    return true;
                });
            }

            if (nextTimeLeft.totalMs <= PRE_REVEAL_LEAD_MS) {
                setHasPreReveal(prev => {
                    if (!prev) onPreReveal?.();
                    return true;
                });
            }

            if (nextTimeLeft.totalMs <= 0) {
                setIsComplete(prev => {
                    if (!prev) onComplete?.();
                    return true;
                });
            }
        };

        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [targetUtcMs, onComplete, onWarmupStart, onPreReveal]);

    if (isComplete && !holdOnComplete) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: '#000',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
        >
            <p style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.2rem)', letterSpacing: '0.08em', opacity: 0.75 }}>
                {USE_QUICK_TEST_COUNTDOWN
                    ? `Quick test mode: ${QUICK_TEST_SECONDS}s countdown`
                    : 'Countdown to March 18 (California)'}
            </p>
            <h1
                style={{
                    marginTop: '16px',
                    fontSize: 'clamp(2.3rem, 9.5vw, 7.8rem)',
                    lineHeight: 1.02,
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                }}
            >
                {timeLeft.days}d {pad2(timeLeft.hours)}h {pad2(timeLeft.minutes)}m {pad2(timeLeft.seconds)}s
            </h1>
        </div>
    );
}