import { ToolRegistry } from "./src/services/tools/ToolRegistry.js";
import "./src/features/agents/services/AgentService.js"; // This should trigger registrations

console.log("--- VERIFYING TOOL REGISTRATION ---");
const toolNames = ToolRegistry.getToolNames();
const videoTools = [
    "generate_video_speech",
    "generate_video_music",
    "transcribe_video_audio",
    "render_video",
    "create_kinetic_video"
];

let allFound = true;
videoTools.forEach(tool => {
    if (toolNames.includes(tool)) {
        console.log(`✅ [FOUND] ${tool}`);
    } else {
        console.error(`❌ [MISSING] ${tool}`);
        allFound = false;
    }
});

if (allFound) {
    console.log("\n🚀 ALL VIDEO TOOLS REGISTERED SUCCESSFULLY!");
    process.exit(0);
} else {
    console.error("\n💥 SOME TOOLS ARE MISSING!");
    process.exit(1);
}
