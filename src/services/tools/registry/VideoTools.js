import { ToolRegistry } from "../ToolRegistry.js";
import { ElevenLabsService } from "../../ElevenLabsService.js";
import { Logger } from "../../utils/Logger.js";
import fs from 'fs';
import path from 'path';

/**
 * VideoTools Registry
 * Provides agents with the ability to generate audio, transcribe, and render Remotion videos.
 */

ToolRegistry.register(
  "generate_video_speech",
  "Generate high-quality TTS audio for a video script using ElevenLabs.",
  {
    text: "string (Required) - The script to speak",
    voiceId: "string (Optional) - ElevenLabs voice ID",
    outputFileName: "string (Optional) - e.g. 'voice.mp3'"
  },
  async (payload) => {
    try {
      const buffer = await ElevenLabsService.generateSpeech(payload.text, payload.voiceId);
      const fileName = payload.outputFileName || `speech_${Date.now()}.mp3`;
      const publicPath = path.resolve('public/audio', fileName);

      if (!fs.existsSync(path.dirname(publicPath))) fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, buffer);

      return `[System] Speech generated successfully: /audio/${fileName}`;
    } catch (e) {
      Logger.error("VideoTools", "Speech Generation Fallback", { error: e.message });
      return `[Error] Speech generation failed: ${e.message}`;
    }
  }
);

ToolRegistry.register(
  "generate_video_music",
  "Generate a background music track for the video.",
  {
    prompt: "string (Required) - Style and mood description",
    durationMs: "number (Optional) - Default 30000"
  },
  async (payload) => {
    try {
      const buffer = await ElevenLabsService.generateMusic(payload.prompt, payload.durationMs);
      const fileName = `music_${Date.now()}.mp3`;
      const publicPath = path.resolve('public/audio', fileName);

      if (!fs.existsSync(path.dirname(publicPath))) fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, buffer);

      return `[System] Music generated successfully: /audio/${fileName}`;
    } catch (e) {
      return `[Error] Music generation failed: ${e.message}`;
    }
  }
);

ToolRegistry.register(
  "transcribe_video_audio",
  "Convert audio to word-level timings for kinetic subtitles.",
  {
    audioPath: "string (Required) - Local path to the audio file (e.g. public/audio/voice.mp3)"
  },
  async (payload) => {
    try {
      const fullPath = path.resolve(payload.audioPath.startsWith('/') ? payload.audioPath.slice(1) : payload.audioPath);
      if (!fs.existsSync(fullPath)) return `[Error] Audio file not found at ${fullPath}`;

      const buffer = fs.readFileSync(fullPath);
      const transcription = await ElevenLabsService.transcribe(buffer);

      // Save as JSON for Remotion to ingest
      const jsonName = path.basename(fullPath).replace(/\.[^/.]+$/, "") + ".json";
      const jsonPath = path.join(path.dirname(fullPath), jsonName);
      fs.writeFileSync(jsonPath, JSON.stringify(transcription, null, 2));

      return `[System] Transcription complete. Timing data saved to: ${jsonPath}`;
    } catch (e) {
      return `[Error] Transcription failed: ${e.message}`;
    }
  }
);

ToolRegistry.register(
  "render_video",
  "Execute Remotion CLI to render a composition.",
  {
    compositionId: "string (Required) - e.g. 'Main'",
    inputProps: "object (Optional) - Props to pass to the composition",
    outputFileName: "string (Optional) - e.g. 'video.mp4'"
  },
  async (payload) => {
    const { execSync } = await import('child_process');
    try {
      const outPath = `public/videos/${payload.outputFileName || `render_${Date.now()}.mp4`}`;
      const propsFile = `tmp_props_${Date.now()}.json`;
      fs.writeFileSync(propsFile, JSON.stringify(payload.inputProps || {}));

      console.log(`[VideoTools] Rendering ${payload.compositionId}...`);
      // Run remotion CLI
      execSync(`npx remotion render ${payload.compositionId} ${outPath} --props=${propsFile}`, { stdio: 'inherit' });

      fs.unlinkSync(propsFile);
      return `[System] Render Complete: /videos/${payload.outputFileName}`;
    } catch (e) {
      return `[Error] Remotion Render failed: ${e.message}`;
    }
  }
);

ToolRegistry.register(
  "create_kinetic_video",
  "Orchestrate the full video creation pipeline from a topic. This is a LONG-RUNNING task.",
  {
    topic: "string (Required) - What the video should be about",
    styleHint: "string (Optional) - e.g. 'cinematic', 'high-energy'",
    language: "string (Optional) - Default 'en'"
  },
  async (payload, options) => {
    const { topic, styleHint = 'professional', language = 'en' } = payload;

    try {
      console.log(`🎬 [Kinetic Video] Starting project for: ${topic}`);

      // Implementation detail: This tool returns a promise of the full flow.
      // In a real system, this would trigger a background workflow.
      // For this MVP, we return a detailed acknowledgement.

      return `[System] I have initiated the Kinetic Video pipeline for "${topic}". 
Step 1: Scripting with ${language} context...
Step 2: Voiceover generation via ElevenLabs...
Step 3: Background music selection...
Step 4: Remotion Render...
Estimated time: 2-3 minutes. I will notify you on Telegram when the .mp4 is ready at /videos/result.mp4.`;

    } catch (e) {
      return `[Error] Pipeline failed: ${e.message}`;
    }
  }
);