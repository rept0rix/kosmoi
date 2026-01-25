import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Audio, Img, staticFile, Sequence } from 'remotion';
import React from 'react';

export const PropertyTour: React.FC<{
    name: string;
    price: string;
    images: string[];
}> = ({ name, price, images }) => {
    const { fps, durationInFrames } = useVideoConfig();
    const slideDuration = 90; // 3 seconds at 30fps

    // Fallback if no images
    const safeImages = images && images.length > 0 ? images : [staticFile('assets/placeholder.jpg')];

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Background Music */}
            <Audio src={staticFile('assets/music.mp3')} volume={0.3} loop />

            {/* Slideshow */}
            {safeImages.map((img, i) => {
                const startFrame = i * slideDuration;

                // Don't render if out of bounds (optimization)
                // if (frame < startFrame || frame > startFrame + slideDuration + 30) return null;

                return (
                    <Sequence key={i} from={startFrame} durationInFrames={slideDuration + 15} layout="none">
                        <Slide image={img} />
                    </Sequence>
                );
            })}

            {/* Global Overlay (Verified Badge) */}
            <AbsoluteFill>
                <div style={{
                    position: 'absolute',
                    top: 50,
                    left: 40,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f2ff', boxShadow: '0 0 10px #00f2ff' }} />
                    <span style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: 24, textTransform: 'uppercase' }}>
                        Kosmoi Verified
                    </span>
                </div>
            </AbsoluteFill>

            {/* Bottom Info Card */}
            <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
                <div style={{
                    height: 500,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                    display: 'flex',
                    flexDirection: 'columm',
                    justifyContent: 'flex-end',
                    padding: '60px 40px',
                    fontFamily: 'sans-serif'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h1 style={{
                            fontSize: 72,
                            fontWeight: 900,
                            color: 'white',
                            margin: 0,
                            lineHeight: 1,
                            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                        }}>
                            {name?.toUpperCase()}
                        </h1>
                        <div style={{
                            display: 'inline-block',
                            background: '#eab308',
                            color: 'black',
                            padding: '10px 30px',
                            borderRadius: 15,
                            fontSize: 32,
                            fontWeight: 'bold',
                            alignSelf: 'flex-start' // Flex item alignment
                        }}>
                            From {Number(price).toLocaleString()} THB
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

const Slide: React.FC<{ image: string }> = ({ image }) => {
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();

    // Ken Burns Effect: Zoom In + Pan
    const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.3]);
    const translateX = interpolate(frame, [0, durationInFrames], [0, -50]);

    // Crossfade Logic (handled by Sequence overlap or simpler opacity fade in/out)
    const opacity = interpolate(
        frame,
        [0, 15, durationInFrames - 15, durationInFrames],
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
