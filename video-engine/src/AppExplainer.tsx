import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Audio, Img, staticFile, Sequence, spring } from 'remotion';
import React from 'react';

// --- Components ---

const KineticText: React.FC<{ text: string, color?: string, yOffset?: number, delay?: number, fontSize?: number }> =
    ({ text, color = 'white', yOffset = 0, delay = 0, fontSize = 80 }) => {
        const frame = useCurrentFrame();
        const { fps } = useVideoConfig();

        const enter = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 200 } });
        const scale = interpolate(enter, [0, 1], [0.5, 1]);
        const opacity = interpolate(enter, [0, 1], [0, 1]);

        return (
            <h1 style={{
                position: 'absolute', width: '100%', textAlign: 'center', top: 500 + yOffset,
                fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize, color,
                transform: `scale(${scale})`, opacity, textShadow: '0 10px 30px rgba(0,0,0,0.8)',
                margin: 0, zIndex: 20
            }}>
                {text}
            </h1>
        );
    };

const BWFadeIn: React.FC<{ src: string }> = ({ src }) => {
    const frame = useCurrentFrame();
    const scale = interpolate(frame, [0, 150], [1.1, 1.0]); // Slow zoom out
    return (
        <AbsoluteFill>
            <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`, filter: 'grayscale(100%) contrast(1.2)' }} />
            <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </AbsoluteFill>
    );
};

const PhoneMockup: React.FC<{ src: string, label: string }> = ({ src, label }) => {
    const frame = useCurrentFrame();
    const rotate = Math.sin(frame / 20) * 2; // Subtle float
    return (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${rotate}deg)` }} />
            <div style={{ position: 'absolute', top: 200, background: 'black', padding: '20px 40px', transform: 'rotate(-2deg)' }}>
                <h2 style={{ color: '#00f2ff', fontFamily: 'Inter', margin: 0, fontSize: 60 }}>{label}</h2>
            </div>
        </AbsoluteFill>
    );
};

export const AppExplainer: React.FC = () => {
    // 45 Seconds = 1350 Frames (at 30fps)
    // Structure:
    // 0-5s: Problem (Frustrated Broker)
    // 5-10s: Reveal (Logo)
    // 10-25s: Demo 1 (Browse)
    // 25-35s: Demo 2 (Book)
    // 35-45s: CTA

    const music = staticFile('assets/music_vibe.mp3'); // Reuse upbeat music

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            <Audio src={music} volume={0.6} loop />

            {/* SCENE 1: THE PROBLEM (0-5s) */}
            <Sequence from={0} durationInFrames={150}>
                <BWFadeIn src={staticFile('assets/frustrated_broker.png')} />
                <KineticText text="TIRED OF" yOffset={-100} delay={0} color="#ff4444" />
                <KineticText text="SLOW BROKERS?" yOffset={50} delay={15} color="#ff4444" />
            </Sequence>

            {/* SCENE 2: THE SOLUTION (5-10s) */}
            <Sequence from={150} durationInFrames={150}>
                <AbsoluteFill style={{ backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }}>
                    <Img src={staticFile('assets/kosmoi_logo.png')} style={{ width: '80%' }} />
                    <KineticText text="MEET KOSMOI" yOffset={300} delay={10} color="#d4af37" />
                </AbsoluteFill>
            </Sequence>

            {/* SCENE 3: BROWSE (10-25s) */}
            <Sequence from={300} durationInFrames={450}>
                <PhoneMockup src={staticFile('assets/app_browse.png')} label="BROWSE 50+ YACHTS" />
                <KineticText text="NO MIDDLEMAN" yOffset={400} delay={30} fontSize={60} />
            </Sequence>

            {/* SCENE 4: BOOK (25-35s) */}
            <Sequence from={750} durationInFrames={300}>
                <PhoneMockup src={staticFile('assets/app_book.png')} label="INSTANT BOOKING" />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, borderRadius: '50%', border: '10px solid #00f2ff', opacity: 0.5 }} />
            </Sequence>

            {/* SCENE 5: CTA (35-45s) */}
            <Sequence from={1050} durationInFrames={300}>
                <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 style={{ color: 'white', fontFamily: 'Inter', fontSize: 80, marginBottom: 50 }}>DOWNLOAD NOW</h1>
                    <div style={{ display: 'flex', gap: 40 }}>
                        <div style={{ width: 300, height: 100, background: '#333', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 40, fontFamily: 'sans-serif' }}>App Store</span>
                        </div>
                    </div>
                </AbsoluteFill>
            </Sequence>

        </AbsoluteFill>
    );
};
