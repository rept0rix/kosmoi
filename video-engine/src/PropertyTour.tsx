import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Audio, Img, staticFile, Sequence, spring } from 'remotion';
import React from 'react';

export const PropertyTour: React.FC<{
    name: string;
    price: string;
    images: string[];
}> = ({ name, price, images }) => {
    const { fps, durationInFrames } = useVideoConfig();
    const slideDuration = 120; // 4 seconds per slide for a slower, premium feel

    // Force usage of our new Premium Assets if empty
    // In a real app, 'images' would be passed dynamically.
    const premiumImages = [
        staticFile('assets/slide1.jpg'), // Aerial
        staticFile('assets/slide2.jpg'), // Interior
        staticFile('assets/slide3.jpg'), // Lifestyle
    ];

    const safeImages = images && images.length > 0 ? images : premiumImages;

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505' }}>
            {/* Background Music - Disabled due to missing asset */}
            {/* <Audio src={staticFile('assets/music.mp3')} volume={0.3} loop /> */}

            {/* Slideshow */}
            {safeImages.map((img, i) => {
                const startFrame = i * (slideDuration - 15); // Slight overlap for crossfade
                return (
                    <Sequence key={i} from={startFrame} durationInFrames={slideDuration} layout="none">
                        <Slide image={img} index={i} />
                    </Sequence>
                );
            })}

            {/* Letterbox / Cinematic Bars */}
            <AbsoluteFill style={{ justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ height: '80px', background: 'linear-gradient(to bottom, black, transparent)', opacity: 0.8 }} />
                <div style={{ height: '150px', background: 'linear-gradient(to top, black, transparent)', opacity: 0.9 }} />
            </AbsoluteFill>

            {/* Top Badge - Minimalist Gold */}
            <AbsoluteFill>
                <div style={{
                    position: 'absolute',
                    top: 60,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 24px',
                        borderRadius: '2px',
                        border: '1px solid rgba(212, 175, 55, 0.3)', // Gold border
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: '#d4af37' }} /> {/* Gold Diamond */}
                        <span style={{ color: '#f8f8f8', fontFamily: 'Didot, serif', letterSpacing: '2px', fontSize: 14, textTransform: 'uppercase' }}>
                            Kosmoi Signature
                        </span>
                        <div style={{ width: 8, height: 8, transform: 'rotate(45deg)', background: '#d4af37' }} />
                    </div>
                </div>
            </AbsoluteFill>

            {/* Bottom Info - Luxury Editorial Style */}
            <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 100 }}>
                <Sequence from={20}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        width: '100%',
                        gap: 15
                    }}>
                        <h1 style={{
                            fontFamily: 'Didot, serif',
                            fontSize: 80,
                            color: 'white',
                            margin: 0,
                            lineHeight: 0.9,
                            textShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            letterSpacing: '-2px'
                        }}>
                            {name?.toUpperCase()}
                        </h1>

                        <div style={{ width: 60, height: 2, background: '#d4af37' }} />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <span style={{
                                fontFamily: 'sans-serif',
                                fontWeight: 300,
                                fontSize: 24,
                                color: '#aaa',
                                letterSpacing: '1px'
                            }}>
                                STARTING AT
                            </span>
                            <span style={{
                                fontFamily: 'sans-serif',
                                fontWeight: 700,
                                fontSize: 32,
                                color: '#d4af37', // Gold
                            }}>
                                {Number(price).toLocaleString()} THB
                            </span>
                        </div>
                    </div>
                </Sequence>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

const Slide: React.FC<{ image: string, index: number }> = ({ image, index }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Cinematic Move: Pan direction changes per slide
    const direction = index % 2 === 0 ? 1 : -1;

    // Slower, smoother zoom (1.0 -> 1.15)
    const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.15]);

    // Gentle Pan
    const translateX = interpolate(frame, [0, durationInFrames], [0, 30 * direction]);

    // Crossfade Opacity
    const opacity = interpolate(
        frame,
        [0, 20, durationInFrames - 20, durationInFrames],
        [0, 1, 1, 0]
    );

    return (
        <AbsoluteFill style={{ opacity }}>
            <Img
                src={image}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translateX(${translateX}px)`
                }}
            />
        </AbsoluteFill>
    );
};
