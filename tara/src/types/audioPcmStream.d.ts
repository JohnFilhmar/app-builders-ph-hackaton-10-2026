// The package ships typings under the wrong module name, so declare the real one.
declare module '@fugood/react-native-audio-pcm-stream' {
  type Options = {
    sampleRate: number;
    channels: 1 | 2;
    bitsPerSample: 8 | 16;
    audioSource?: number;
    bufferSize?: number;
    wavFile: string;
  };

  const LiveAudioStream: {
    init: (options: Options) => void;
    start: () => void;
    stop: () => Promise<string>;
    on: (event: 'data', callback: (base64Chunk: string) => void) => void;
  };

  export default LiveAudioStream;
}
