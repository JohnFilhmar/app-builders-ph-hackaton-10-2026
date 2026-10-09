import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;

/**
 * Plays a local audio file, stopping whatever played before.
 * @param path local file path (no file:// prefix)
 */
export function playAudioFile(path: string): void {
  player?.remove();
  player = createAudioPlayer({ uri: `file://${path}` });
  player.play();
}
