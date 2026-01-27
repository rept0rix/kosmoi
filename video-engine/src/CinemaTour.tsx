import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Audio, Img, staticFile, Sequence, spring } from 'remotion';
import React from 'react';

// --- Theme Config ---

const THEMES = {
    royal: {
        fontPrimary: 'Didot, serif',
        fontSecondary: 'serif',
        colorHighlight: '#d4af37', // Gold
        colorAccent: 'white',
        assetLifestyle: 'assets/champagne_yacht_gen.png',
        assetDrone: 'assets/drone_yacht_gen.png',
        textShadow: '0 4px 30px rgba(0,0,0,0.8)',
        musicVolume: 0.6,
        musicAsset: 'assets/music.mp3'
    },
    vibe: {
        fontPrimary: 'Inter, sans-serif',
        fontSecondary: 'sans-serif',
        colorHighlight: '#00f2ff',
        colorAccent: '#ff00ff',
        assetLifestyle: 'assets/catamaran_party_gen.png',
        assetDrone: 'assets/catamaran_exterior_gen.png', // Use Catamaran Exterior as drone replacement
        textShadow: '0 0 20px rgba(0,242,255,0.8)',
        musicVolume: 0.5,
        musicAsset: 'assets/music_vibe.mp3'
    }
};

// --- Components ---

const FlashFrame: React.FC<{ duration: number }> = ({ duration }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, duration], [0.8, 0]);
    return <AbsoluteFill style={{ backgroundColor: 'white', opacity, pointerEvents: 'none', mixBlendMode: 'overlay' }} />;
};

const GlitchText: React.FC<{
    text: string, top: number, delay: number,
    color?: string, size?: number, font?: string, shadow?: string
}> = ({ text, top, delay, color = 'white', size = 100, font, shadow }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const enter = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 300 } });
    const scale = interpolate(enter, [0, 1], [1.5, 1]);
    const opacity = interpolate(enter, [0, 0.2], [0, 1]);
    const jitterX = Math.random() * 2 * (frame % 2 === 0 ? 1 : -1) * (1 - enter);

    return (
        <div style={{
            position: 'absolute', top, width: '100%', textAlign: 'center', opacity,
            transform: `scale(${scale}) translateX(${jitterX}px)`, zIndex: 10
        }}>
            <h1 style={{
                fontFamily: font, fontWeight: 900, fontSize: size, color: color, margin: 0,
                letterSpacing: '-2px', textTransform: 'uppercase', textShadow: shadow
            }}>
                {text}
            </h1>
        </div>
    );
};

const CTACard: React.FC<{ theme: any }> = ({ theme }) => {
    const frame = useCurrentFrame();
    const scale = 1 + Math.sin(frame / 5) * 0.05;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
                border: `4px solid ${theme.colorHighlight}`,
                padding: '40px 80px',
                background: 'rgba(255,255,255,0.1)',
                transform: `scale(${scale})`,
                boxShadow: theme.textShadow
            }}>
                <h1 style={{ color: theme.colorHighlight, fontFamily: theme.fontPrimary, fontSize: 80, margin: 0 }}>BOOK NOW</h1>
            </div>
            <h3 style={{ color: 'white', fontFamily: theme.fontSecondary, marginTop: 40, letterSpacing: 5 }}>LINK IN BIO</h3>
        </AbsoluteFill>
    );
};

const PseudoVideoSlide: React.FC<{ asset: string, mode: 'drone' | 'handheld' }> = ({ asset, mode }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.3]);

    let transform = `scale(${scale})`;
    if (mode === 'drone') {
        const translateY = interpolate(frame, [0, durationInFrames], [0, -50]);
        transform += ` translateY(${translateY}px)`;
    } else {
        const x = Math.sin(frame / 10) * 10;
        const y = Math.cos(frame / 15) * 10;
        transform += ` translate(${x}px, ${y}px)`;
    }

    return (
        <AbsoluteFill>
            <Img src={asset} style={{ width: '100%', height: '100%', objectFit: 'cover', transform }} />
        </AbsoluteFill>
    );
};


// --- Cinema Tour Composition ---

export const CinemaTour: React.FC<{
    name: string;
    price: string;
    images: string[];
    voiceover?: string;
    music?: string;
    inc1?: string;
    inc2?: string;
    inc3?: string;
    theme?: 'royal' | 'vibe'; // New Theme Prop
}> = ({
    name, price, images, voiceover, music,
    inc1 = "PRIVATE CAPTAIN", inc2 = "FUEL INCLUDED", inc3 = "CHAMPAGNE SET",
    theme = 'royal'
}) => {
        const slideDuration = 45;
        const currentTheme = THEMES[theme] || THEMES.royal;

        // Load Theme Specific Assets
        const droneGen = staticFile(currentTheme.assetDrone);
        const lifestyleGen = staticFile(currentTheme.assetLifestyle); // Swaps Champagne for Party based on theme

        const slide1 = images[0] || staticFile('assets/slide1.jpg');
        const slide2 = images[1] || staticFile('assets/slide2.jpg');

        const timeline = [
            { type: 'drone', src: droneGen },
            { type: 'handheld', src: slide1 },
            { type: 'drone', src: slide2 },
            { type: 'handheld', src: lifestyleGen }
        ];

        const musicSrc = music || staticFile(currentTheme.musicAsset);
        const voiceoverSrc = voiceover || staticFile('assets/voiceover.mp3');

        return (
            <AbsoluteFill style={{ backgroundColor: '#000' }}>
                {voiceoverSrc && <Audio src={voiceoverSrc} volume={1.0} />}
                <Audio src={musicSrc} volume={currentTheme.musicVolume} loop />

                {timeline.map((item, i) => {
                    const startFrame = i * slideDuration;
                    return (
                        <Sequence key={i} from={startFrame} durationInFrames={slideDuration} layout="none">
                            <PseudoVideoSlide asset={item.src} mode={item.type as 'drone' | 'handheld'} />
                            {i > 0 && <FlashFrame duration={6} />}
                        </Sequence>
                    );
                })}

                <Sequence from={slideDuration * timeline.length} durationInFrames={90}>
                    <CTACard theme={currentTheme} />
                </Sequence>

                <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                    <div style={{ position: 'absolute', top: 0, width: '100%', height: '10%', background: 'black' }} />
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '10%', background: 'black' }} />
                </AbsoluteFill>

                {/* Sync Text - Using Theme Styles */}
                <Sequence from={0} durationInFrames={slideDuration}>
                    <GlitchText
                        text={name.toUpperCase()} top={450} delay={5} size={60}
                        font={currentTheme.fontPrimary} shadow={currentTheme.textShadow}
                    />
                </Sequence>
                <Sequence from={slideDuration} durationInFrames={slideDuration}>
                    <GlitchText
                        text={inc1} top={350} delay={0} size={80}
                        font={currentTheme.fontPrimary} shadow={currentTheme.textShadow}
                    />
                    <GlitchText
                        text={inc2} top={500} delay={10} color={currentTheme.colorHighlight} size={60}
                        font={currentTheme.fontPrimary} shadow={currentTheme.textShadow}
                    />
                </Sequence>
                <Sequence from={slideDuration * 2} durationInFrames={slideDuration}>
                    <div style={{ position: 'absolute', width: '100%', top: 350, textAlign: 'center', zIndex: 20 }}>
                        <GlitchText
                            text={Number(price).toLocaleString() + " THB"} top={0} delay={0} size={100}
                            color={theme === 'vibe' ? currentTheme.colorAccent : '#00f2ff'}
                            font={currentTheme.fontSecondary} shadow={currentTheme.textShadow}
                        />
                    </div>
                </Sequence>
                <Sequence from={slideDuration * 3} durationInFrames={slideDuration}>
                    <GlitchText
                        text={inc3} top={450} delay={5}
                        font={currentTheme.fontPrimary} shadow={currentTheme.textShadow}
                    />
                </Sequence>

            </AbsoluteFill>
        );
    };
