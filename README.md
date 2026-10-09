# Tara LEVEL UP!

Tara LEVEL UP! is an Android app that turns everyday chores, study, reading and exercise into quests. You say what you are about to do, you do it, and you prove it. Tara, a tarsier who never scolds, checks the proof with AI that runs on the phone itself and pays you in Sipag, the app's XP. Sipag levels up a chibi hero through ten forms, buys cosmetics in the shop, and puts you on a leaderboard.

It was built for the App Builders PH hackathon (October 2026, "Local AI" theme) and runs fully offline on a mid-range phone. The test device was a Samsung Galaxy A54.

## How a quest works

1. Declare a quest, or tell Tara in the Home chat ("I'm going to the gym tomorrow") and confirm the quest card she drafts. Scheduled quests fire a local reminder.
2. Do it. A timer runs while you work.
3. Prove it. Each quest type has its own check:
   - **Linis (cleaning).** A Before and an After photo. The vision model describes both, then asks yes or no about each object, and code decides what is gone.
   - **Aral (study).** Photograph your notes and Tara writes a 5-question quiz from them before the timer starts.
   - **Basa (reading).** Read a passage aloud. Speech-to-text scores how much matched.
   - **Ehersisyo (exercise).** Count your reps out loud.
   - **Sariling (your own task).** Your word counts, at the lowest tier.
4. Get paid. XP is minutes times proof strength times your streak bonus. Sabi Ko (your word) pays 1x, Nakita (seen) 2x, Patunay (proven) 3x. A failed check shows what Tara saw and offers "Ginawa ko talaga" (I really did it) right there.

The AI never decides how much XP you get. It only judges whether the proof holds, and fixed rules in `tara/src/lib/game/` do the math. The limits that stop farming:

- 10 to 60 minutes per quest
- 300 Sipag per day from quests, and 60 of those at most from Sabi Ko
- only the first 3 quests of a type each day earn Sipag (Tara jokes about it when you try a 4th)
- the streak bonus grows 5% a day for up to 10 days
- cancelling an overdue quest costs 5, letting one expire after 6 hours costs 10, and finishing late earns 75%

## What is in the app

Five tabs:

- **Bahay (Home).** Your hero, today's numbers, a daily quote, the Plan and Ask chat (typed or hold-to-talk), and your quests by day or on a calendar.
- **Gawain (Quests).** Start, run and prove quests.
- **Bida (Hero).** Your hero in the look you equipped, Sipag to the next form, an evolution grid of all ten forms (future ones show as silhouettes) and the item shop.
- **Ranggo (Ranks).** A weekly and all-time leaderboard.
- **Ako (Profile).** Total Sipag, quests done, current and longest streak, your own real-life rewards ("30 min ML", "merienda") bought with Sipag, badges, language and reminder settings, and AI settings.

The hero is a 2D chibi adventurer with one illustration per level, from Baguhan (Beginner) at level 1 to Alamat (Legend) at level 10. It breathes while idle, hops when tapped, sways while Tara thinks, and bursts gold on achievements, finished quests and level ups. Levelling up cross-fades the old form into the new one.

The shop sells backdrops (sari-sari store, rice terraces, jeepney stop, plaza at night), frames and auras. They are drawn in code as low-poly SVG behind or around the hero, so they line up with every level's art.

## Where the AI runs

By default everything runs on the phone, with [llama.rn](https://github.com/mybigday/llama.rn) for text and vision and [whisper.rn](https://github.com/mybigday/whisper.rn) for speech. Each job has tiers, and a tier stays locked when the phone has too little RAM for it:

| Job | Tier | Model | Min RAM |
| --- | --- | --- | --- |
| Brain (plans, quizzes, chat) | Balanse | Gemma 3 1B Q4_K_M | 6 GB |
| Eyes (photos) | Mabilis | SmolVLM 256M Q8_0 | 4 GB |
| Eyes | Malinaw | SmolVLM 500M Q8_0 | 6 GB |
| Ears (voice) | Mabilis / Balanse / Tumpak | Whisper tiny / base / small, q5_1 | 3 to 4 GB |

Model names live only in `backend/tara_catalog.json`. The app shows tier names with plain pros and cons, so models can change without an app update.

In AI settings you can move any job to a stronger machine:

- **Laptop over Wi-Fi.** An Ollama server for text and photos, and any OpenAI-style Whisper server (whisper.cpp, Speaches) for voice. The voice server can take an optional Authorization key.
- **Cloud.** An OpenRouter model, with the key kept in the phone's secure storage.

If a laptop or the cloud fails or sends an empty answer, the job falls back to the phone. The Home badge always says where the AI is running (Offline AI, LAN AI or Cloud AI).

## Repository layout

| Path | What it is |
| --- | --- |
| `tara/` | The app. Expo SDK 57, React Native 0.86, Expo Router, NativeWind, Zustand, zod. |
| `backend/` | A zero-dependency Node server: the model catalog, model file mirror, leaderboard, and benchmark results. |
| `ai-feasibility/` | The model test lab app used to pick the on-device models before Tara was built. |
| `docs/` | Product spec, MVP design, 2D hero transition plan, laptop AI server setup, iPhone setup. |

## Running it

### What you need

- Node 22.6 or newer (the backend runs TypeScript directly with `--experimental-strip-types`)
- JDK 17 and the Android SDK, for building the APK
- An Android phone with USB debugging on, and `adb` on your PATH
- About 1.5 GB free on the phone for the on-device models

On Windows, run `npm install` in `tara/` from PowerShell, not Git Bash. llama.rn's postinstall step needs Windows' `tar`.

### 1. The backend

The app talks to the hosted backend at https://tara.filhmar.online by default (landing page, model catalog, leaderboard). To host it yourself with Docker, from the repo root:

```bash
docker compose -f backend/docker-compose.prod.yml up -d --build
```

It binds `127.0.0.1:8787`; put nginx in front with `docs/nginx/tara.filhmar.online.conf` and run `certbot --nginx`. To run it on a laptop instead:

```bash
cd backend
npm start
```

It listens on port 8787. The app's setup screen downloads models from the catalog this server serves. Model files placed in `backend/models/` are served from the laptop instead of Hugging Face, which saves venue Wi-Fi.

Over USB, point the phone at a laptop backend, then type `http://localhost:8787` as the backend address on the setup screen:

```bash
adb reverse tcp:8787 tcp:8787
```

On a shared Wi-Fi instead, type the laptop's address (for example `http://192.168.1.5:8787`) on the setup screen. Some routers isolate devices from each other. If the phone cannot reach the laptop, use USB.

### 2. Build and install the app

```bash
cd tara
npm install
npx expo run:android          # development build with Metro
```

For a release APK (no Metro needed, about 5 to 8 minutes). `tara/android/` is generated and not in git, so a fresh clone makes it first:

```bash
cd tara
npx expo prebuild --platform android
cd android
./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

The release build is signed with the debug keystore, so `adb install -r` upgrades it in place and keeps your progress.

### 3. First launch

Pick a language and a hero name, then let setup download a tier for each job. After that the app works with no signal at all.

### Optional: a laptop for stronger AI

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
ollama pull qwen3-vl:4b        # photos
ollama pull llama3.1:8b        # text
```

In the app, open Ako, then AI settings, choose "Laptop (Wi-Fi)" for a job, enter the laptop address, tap "Find models" and then "Test". Over USB, run `adb reverse tcp:11434 tcp:11434` and use the `localhost:11434` chip. Thinking models such as qwen3-vl work too: the app closes their think block for them, so they answer straight away instead of spending the whole token budget reasoning. Voice needs a separate Whisper server; see `docs/laptop_ai_servers.md`.

### Checks

```bash
cd tara
npx tsc --noEmit
npx jest

cd ../backend
npm run check                  # leaderboard rules self-check
```

## How it was set up

The project started with a feasibility question: which small models can a mid-range Android phone run well enough, in English and in Tagalog? The `ai-feasibility/` app loaded candidate models on the A54 and posted timings and scores to the backend's `/results` table. Gemma 3 1B handled Tagalog acceptably at about 10 tokens per second. Qwen2.5 0.5B was faster at 21 to 25 tokens per second but failed in Tagalog, and so did SmolVLM. So the brain is Gemma, the eyes are SmolVLM with an English-first prompt, and AI output stays English first until better Tagalog models fit on the phone.

Several decisions came out of trying things on the phone:

- **XP comes from fixed rules, never from the model.** A small model is too easy to argue with, and it cannot be audited. The AI only judges the proof.
- **Chat planning is rule-based, Ask Tara uses Gemma.** Gemma 1B kept returning quest type names as quest titles, so splitting a sentence into tasks and parsing "tomorrow at 7" is plain code. Gemma answers open questions.
- **Before & After describes first, then asks yes or no.** SmolVLM answered list prompts with a bare number ("3."), but it answers yes or no reliably. So it describes each photo freely, code picks out household objects, and a yes or no probe per object decides what disappeared.
- **The hero moved from 3D to 2D.** The first hero was a rigged GLB rendered with three.js. Ten illustrated level forms made growth visible at a glance and dropped a heavy native dependency.
- **The leaderboard does not trust the phone.** Phones upload their event ledger. The server imports the app's own game rules (`backend/app_paths.mjs` maps the app's `@/` imports), replays every completed quest, and lowers any XP above what the rules allowed at that moment. A player joins with a unique, filtered username tied to a random id in the phone's secure storage. Android backup is off, so the id changes only when the app is uninstalled.

## How it was made

The app is offline first. Everything the player does is an append-only event ledger stored on the phone (`tara/src/lib/stores/gameStore.ts`), and one pure function, `deriveState`, folds that ledger into levels, streaks, balances, badges and equipped items. The same function runs on the phone and on the leaderboard server, which is why the server can recompute scores instead of trusting them.

The UI follows a polygon and pixel style: chamfered SVG frames, Pixelify Sans for headings, Space Mono for numbers, and a parchment, ink and gold palette (`tara/tailwind.config.js`). Copy is written in pairs, English and Tagalog, through a small `t(en, tl)` helper.

## License

MIT. See [LICENSE](LICENSE).
