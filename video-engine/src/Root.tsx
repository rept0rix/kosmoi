import { Composition } from 'remotion';
import { Main } from './Main';
import { PropertyTour } from './PropertyTour';
import transcript from '../assets/transcript.json';

export const RemotionRoot: React.FC = () => {
    // Calculate duration from transcript if possible
    const durationInFrames = transcript?.words ?
        Math.ceil((transcript.words[transcript.words.length - 1].end * 30)) + 60 :
        1800; // Default 1 min @ 30fps

    return (
        <>
            <Composition
                id="KineticVideo"
                component={Main}
                durationInFrames={durationInFrames}
                fps={30}
                width={1080}
                height={1920} // Vertical for TikTok/Reels
                defaultProps={{
                    transcript: transcript
                }}
            />
            <Composition
                id="PropertyTour"
                component={PropertyTour}
                durationInFrames={30 * 15} // 15 seconds default (5 slides * 3s)
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    name: "Luxury Villa",
                    price: "0",
                    images: []
                }}
            />
        </>
    );
};
