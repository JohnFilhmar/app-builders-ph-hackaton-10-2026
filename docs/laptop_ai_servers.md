# Laptop AI servers on the local network

Status as of 2026-10-10. The Lenovo LOQ speech-to-text server works end to end on the laptop. Nothing else in this plan is running yet.

Tara keeps its on-device models on the phone, and adds team laptops on the same Wi-Fi as stronger optional servers for text, voice and image. The phone calls whichever source is configured for each job and falls back to its own on-device model when a laptop is unreachable. This still fits the hackathon's "Local AI" theme: the slides list "AI on PCs, laptops, phones, or edge hardware" and "Hybrid local + cloud systems" as in scope, and nothing here touches the cloud.

## Why laptops were added

The phone is a Samsung Galaxy A54 5G (Exynos 1380, about 7.3 GB RAM). A model research pass done during planning (its report is not committed) found:

- Phone LLM speed is limited by memory bandwidth. Measured on the A54: Gemma 3 1B Q4_K_M about 10 tok/s, Qwen2.5 0.5B Q4_K_M 21 to 25 tok/s.
- The A54's Mali GPU gives llama.cpp no speedup, so everything on the phone runs on its CPU.
- Whisper base on the phone runs at a real-time factor of 0.4 to 0.9, and its English error rate (10.32 average WER on the Open ASR Leaderboard) is well behind larger models.

Laptops can run models several times larger and faster. The phone stays useful offline because every job keeps an on-device fallback.

## How the plan changed

1. **First idea: Ollama on every laptop.** Ollama serves text and vision models, but not speech-to-text or text-to-speech. The voice laptop therefore runs Speaches, an OpenAI-compatible speech server, instead of Ollama.
2. **First role split:** Mac M2 for images, Lenovo LOQ for voice, Thunderobot Ryzen for the chatbot. The Ryzen has only integrated Radeon graphics, which Ollama uses only through an experimental Vulkan mode, so the chatbot would have run mostly on CPU.
3. **Correction:** the Lenovo LOQ has an NVIDIA RTX 3050 with 6 GB of video memory, the only discrete GPU in the group. The roles were reassigned so the GPU carries the heavy work.
4. **Final split (below):** the LOQ serves voice and images, the Mac M2 (16 GB) serves the text chatbot, and the Ryzen becomes the backup chatbot.

## Final setup

| Machine | Serves | Server and port | Models | Status |
| --- | --- | --- | --- | --- |
| Lenovo LOQ, i5 13th gen, 24 GB RAM, RTX 3050 6 GB | Speech-to-text | Speaches, port 8000 | `deepdml/faster-whisper-large-v3-turbo-ct2`, int8_float16 | Working on the laptop |
| Lenovo LOQ | Text-to-speech | Speaches, port 8000 | `speaches-ai/Kokoro-82M-v1.0-ONNX` | Not installed yet |
| Lenovo LOQ | Image recognition | Ollama, port 11434 | `qwen3-vl:4b` (sized so it fits on the 6 GB card next to Whisper) | Not installed yet |
| Mac M2, 16 GB | Text chatbot | Ollama, port 11434 | `qwen3:8b` with thinking off; `gemma3:12b` as an optional tone test | Not installed yet |
| Thunderobot Ryzen 7, 16 GB, integrated GPU | Backup chatbot | Ollama, port 11434 | `qwen3:4b` | Not installed yet |
| Galaxy A54 | Offline fallback for every job | On-device (llama.rn, whisper.rn) | Current feasibility-app models | Exists in `mobile/` |

Video memory budget on the LOQ (estimates, not yet measured): Whisper turbo int8 about 1 to 1.5 GB, `qwen3-vl:4b` about 3.5 to 4 GB, Kokoro on CPU. Total about 4.5 to 5.5 GB of the 6 GB card.

```
                 same Wi-Fi or phone hotspot
 Galaxy A54 app ───────────────┬──────────────────────────┬──────────────────────┐
  (on-device fallback)         │                          │                      │
                     Lenovo LOQ (RTX 3050)        Mac M2 16 GB            Ryzen 7 16 GB
                     :8000 Speaches (STT, TTS)    :11434 Ollama (chat)    :11434 Ollama (backup chat)
                     :11434 Ollama (vision)
```

## How the LOQ speech server was set up

All commands ran in PowerShell on Windows.

1. Checked the NVIDIA driver with `nvidia-smi`.
2. Installed Docker Desktop with the WSL 2 backend.
3. Started Speaches with GPU access. The first run showed `ttl=300` (the model unloads after 5 idle minutes) and `api_key=None` (anyone on the Wi-Fi could use it), so the container was recreated with these settings:

   ```powershell
   docker rm -f speaches
   docker run -d --restart unless-stopped --name speaches -p 8000:8000 `
     -v hf-hub-cache:/home/ubuntu/.cache/huggingface/hub --gpus=all `
     -e WHISPER__INFERENCE_DEVICE=cuda `
     -e WHISPER__COMPUTE_TYPE=int8_float16 `
     -e WHISPER__TTL=-1 `
     -e STT_MODEL_TTL=-1 `
     -e API_KEY=<key> `
     ghcr.io/speaches-ai/speaches:latest-cuda
   ```

   The startup log then confirmed `api_key=SecretStr('**********')`, `inference_device='cuda'`, `compute_type='int8_float16'` and `ttl=-1`. The key itself is never written to the repo.

4. Listed the available speech models. `uvx speaches-cli registry ls` failed with `Not authenticated` because the CLI did not send the key, so the API was called directly:

   ```powershell
   $key="<key>"
   curl.exe -H "Authorization: Bearer $key" "http://localhost:8000/v1/registry?task=automatic-speech-recognition"
   ```

   The registry lists many large-v3-turbo conversions. `deepdml/faster-whisper-large-v3-turbo-ct2` was chosen as a widely used early conversion. The server applies int8 at load time, so no pre-quantized copy is needed.

5. Downloaded the model and confirmed it is installed:

   ```powershell
   curl.exe -X POST -H "Authorization: Bearer $key" "http://localhost:8000/v1/models/deepdml/faster-whisper-large-v3-turbo-ct2"
   curl.exe -s -H "Authorization: Bearer $key" "http://localhost:8000/v1/models"
   ```

6. Made a test clip with Windows' built-in voice, saved outside the repo:

   ```powershell
   Add-Type -AssemblyName System.Speech
   $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
   $s.SetOutputToWaveFile("$env:TEMP\test.wav")
   $s.Speak("Hello, this is a test of the speech to text server for Tara.")
   $s.Dispose()
   ```

7. Transcribed it:

   ```powershell
   curl.exe http://localhost:8000/v1/audio/transcriptions -H "Authorization: Bearer $key" `
     -F "file=@$env:TEMP\test.wav" -F "model=deepdml/faster-whisper-large-v3-turbo-ct2" `
     -F "language=en" -F "prompt=Tara, Sipag, Patunay, Gawain, Baguhan"
   ```

## Test results on the LOQ

| Test | Result |
| --- | --- |
| Transcription, no prompt, 7 runs | `Hello, this is a test of the speech-to-text server for Terra.` every time |
| Transcription with the vocabulary prompt | `Hello, this is a test of the speech-to-text server for Tara.` |
| Round-trip time, 3 runs, one roughly 4 second clip, measured with `Measure-Command` | 889 ms, 640 ms, 630 ms |

Lessons from the tests:

- Whisper misspells the app's own words ("Tara" became "Terra") unless it gets a hint. The app should send a `prompt` with the companion names and quest words on every request.
- `curl: (26) Failed to open/read local data` means the audio file path was wrong, not that the server failed. Use a full path.
- Not yet confirmed: that the work runs on the GPU. The timings suggest it, but `nvidia-smi` during a transcription has not been checked.

## What is left

- [ ] Confirm GPU use: run `nvidia-smi` during a transcription and look for about 1 to 1.5 GB used by Speaches.
- [ ] Install Kokoro text-to-speech on the LOQ and test `/v1/audio/speech`.
- [ ] Install Ollama on the LOQ with `qwen3-vl:4b`, then check total video memory with both models loaded.
- [ ] Open the firewall on each laptop (port 8000 on the LOQ, 11434 for Ollama) on the Private network profile, and set `OLLAMA_HOST=0.0.0.0` and `OLLAMA_KEEP_ALIVE=-1` for Ollama.
- [ ] From the phone's browser, open `http://<laptop-ip>:8000/v1/models`. A `{"detail":"Not authenticated"}` reply proves the phone can reach the server.
- [ ] Set up the Mac M2 (`qwen3:8b`) and the Ryzen backup (`qwen3:4b`).
- [ ] Replace the API key that was pasted into a chat during setup.
- [ ] App integration (below).

## App integration needed

The feasibility app on `main` can only use a laptop for text chat. `mobile/src/lib/runtimes/lanRuntime.ts` calls `/v1/chat/completions` with no API key, and the Voice tab only runs Whisper on the phone. To use these servers the app needs:

- Settings for each job (text, voice, image): a server URL, an optional API key, and a model name, stored with the existing settings store. Voice and chat point at different laptops.
- A speech-to-text runtime that uploads the recorded WAV (`mobile/src/lib/audio/micRecorder.ts`, `wav.ts`) as form data to `{url}/v1/audio/transcriptions` with `file`, `model`, `language=en`, `prompt`, and the header `Authorization: Bearer <key>`.
- An Authorization header on the existing chat runtime when a key is set.
- Automatic fallback to the on-device model for any job whose laptop fails or times out, so the airplane-mode demo still works.

## Network and safety rules

- Run the phone and laptops on your own phone hotspot or travel router, not the venue Wi-Fi. Other teams can't reach the servers, and some venue networks block device-to-device traffic.
- Keep every server LAN-only. Never forward these ports to the internet. Ollama has no login at all.
- Keep keys out of the repo and out of chat messages.
