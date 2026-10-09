import LiveAudioStream from '@fugood/react-native-audio-pcm-stream';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { pcm16ToWav } from '@/lib/audio/wav';
import { base64ToBytes, bytesToBase64 } from '@/utils/base64';

export const MIC_SAMPLE_RATE = 16000;

let chunks: Uint8Array[] = [];
let isListening = false;

async function writeWav(parts: Uint8Array[]): Promise<{ wavPath: string; seconds: number }> {
  const length = parts.reduce((n, c) => n + c.length, 0);
  const pcm = new Uint8Array(length);
  let offset = 0;
  for (const c of parts) {
    pcm.set(c, offset);
    offset += c.length;
  }
  const wavPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/mic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`;
  await ReactNativeBlobUtil.fs.writeFile(wavPath, bytesToBase64(pcm16ToWav(pcm, MIC_SAMPLE_RATE)), 'base64');
  return { wavPath, seconds: length / 2 / MIC_SAMPLE_RATE };
}

/** Starts capturing 16 kHz mono 16-bit PCM, the format whisper expects. Caller must hold mic permission. */
export function startMic(): void {
  if (!isListening) {
    LiveAudioStream.on('data', (b64) => chunks.push(base64ToBytes(b64)));
    isListening = true;
  }
  // the native module releases its AudioRecord on every stop(), so it must be re-initialized before each start()
  // audioSource 6 = VOICE_RECOGNITION on Android
  LiveAudioStream.init({ sampleRate: MIC_SAMPLE_RATE, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 4096, wavFile: '' });
  chunks = [];
  LiveAudioStream.start();
}

/** Takes everything recorded since the last drain as a WAV slice, while the mic keeps recording. */
export async function drainMic(): Promise<{ wavPath: string; seconds: number }> {
  const parts = chunks;
  chunks = [];
  return writeWav(parts);
}

/** Stops capture and returns the audio recorded since the last drain. */
export async function stopMic(): Promise<{ wavPath: string; seconds: number }> {
  await LiveAudioStream.stop();
  return drainMic();
}

/**
 * Deletes a temporary voice slice. Voice is never kept, only the scores computed from it.
 * @param wavPath path from drainMic or stopMic
 */
export async function discardAudio(wavPath: string): Promise<void> {
  if (await ReactNativeBlobUtil.fs.exists(wavPath)) await ReactNativeBlobUtil.fs.unlink(wavPath);
}
