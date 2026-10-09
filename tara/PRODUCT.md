# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Filipino students, young workers and families sharing one phone, often a low-end Android. Copy must be readable by a tita: large type, big tap targets, one main action per screen.

## Product Purpose

Tara LEVEL UP! turns a day's chores, study, reading and exercise into quests. The user declares a quest, does it, and proves it with a Before & After photo pair, a quiz built from a photo of their notes, a read-aloud check, or reps counted aloud. Tara the tarsier checks the proof on-device and awards Sipag (XP), multiplied by proof strength: Sabi Ko 1x, Nakita 2x, Patunay 3x. Success for the hackathon: a working offline MVP on a Samsung A54 by 2026-10-10 05:00.

## Positioning

On-device AI proof checks by default, fully offline. Optional stronger sources per job (text, photos, voice): an Ollama laptop on the same Wi-Fi or an OpenRouter cloud model, chosen in AI settings, with on-device as the fallback. The Home badge always says where the AI runs. XP comes from fixed rules, never from AI-assigned points; verification only ratchets XP up and the user can always dispute ("Ginawa ko talaga").

## Capabilities and Constraints

- Expo SDK 57, React Native 0.86, NativeWind 4 (Tailwind 3.4), react-native-svg, expo-font, three.js hero via expo-gl.
- English first, Tagalog toggle; AI output stays English for now.
- Model names live only in the backend catalog; the app shows tiers.
- Home chat (Plan quests / Ask Tara, typed or hold-to-talk) drafts quest cards the user confirms; scheduled quests fire local reminders.

## Brand Commitments

- Name "Tara LEVEL UP!", mascot Tara the tarsier, Taglish voice that never scolds.
- Palette tokens banig, sipag, tara, leaf (tailwind.config.js).
- Visual reference supplied by the user on 2026-10-09: parchment cream surfaces, dark ink primary buttons, thin-bordered cards, gold accents, fantasy rock backdrops. Binding: polygon-style elements and a pixelated font.

## Evidence on Hand

- Hero GLB: `assets/avatar/female_jump.glb` (Idle + Jump). No male hero yet.
- No real background, aura, level-up or quest-finished effect art yet: placeholders only, never fabricated art.

## Product Principles

1. Tara never scolds: failed checks show what Tara saw and offer the dispute in the same place.
2. Something is always moving: every wait over 300 ms shows Tara thinking.
3. One main action per screen.
4. Big celebration only for real wins (Patunay, level up), so it keeps meaning.
