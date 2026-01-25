import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring, Audio, staticFile } from 'remotion';
import React from 'react';

export const Main: React.FC<{ transcript: any }> = ({ transcript }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (!transcript || !transcript.words) {
        return <AbsoluteFill style={{ backgroundColor: '#000', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>No Transcript Found</AbsoluteFill>;
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Background Audio */}
            <Audio src={staticFile('assets/speech.mp3')} />
            <Audio src={staticFile('assets/music.mp3')} volume={0.2} />

            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                {transcript.words.map((word: any, i: number) => {
                    const startFrame = word.start * fps;
                    const endFrame = word.end * fps;

                    if (frame < startFrame || frame > endFrame + 10) return null;

                    const opacity = interpolate(
                        frame,
                        [startFrame, startFrame + 5, endFrame, endFrame + 5],
                        [0, 1, 1, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    const scale = spring({
                        frame: frame - startFrame,
                        fps,
                        config: { damping: 10 }
                    });

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                fontSize: i % 5 === 0 ? '120px' : '90px',
                                fontWeight: i % 5 === 0 ? '900' : '700',
                                color: i % 5 === 0 ? '#00f2ff' : '#fff',
                                textShadow: '0 0 20px rgba(0,242,255,0.5)',
                                opacity,
                                transform: `scale(${scale})`,
                                textAlign: 'center',
                                padding: '0 50px'
                            }}
                        >
                            {word.word.toUpperCase()}
                        </div>
                    );
                })}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
