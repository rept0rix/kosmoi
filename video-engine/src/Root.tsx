import { Composition } from 'remotion';
import { Main } from './Main';
import { PropertyTour } from './PropertyTour';
import { CinemaTour } from './CinemaTour';
import { AppExplainer } from './AppExplainer';
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
                    name: "THE ROYAL HORIZON",
                    price: "65000",
                    images: [],
                    inc1: "TEST",
                    inc2: "TEST",
                    inc3: "TEST"
                }}
            />
            <Composition
                id="AppExplainer"
                component={AppExplainer}
                durationInFrames={1350} // 45 Seconds
                fps={30}
                width={1080}
                height={1920}
            />
            <Composition
                id="CinemaTour"
                component={CinemaTour}
                durationInFrames={45 * 4 + 60} // 4 slides * 1.5s + 2s CTA = ~8s total
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    name: "CINEMA MODE",
                    price: "999,999",
                    images: []
                }}
            />
        </>
    );
};
