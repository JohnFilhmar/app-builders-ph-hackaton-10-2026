# Tara: 3D to 2D hero, shop rework, leaderboard

Status: draft, decisions pending (2026-10-10). Inputs: ten level PNGs (`D:\Downloads\tara-character-assets-levels-1-10`), three reference mockups, the mascot master prompt, and an llm-council review.

## What the inputs actually give us

- Ten 768x768 RGBA PNGs, one static front pose per level, the same chibi boy. Gear grows per level. Male only. No frames, no layers.
- The mockups are concept art for a full reskin (ivory/anime, 5 tabs). They are a direction, not assets.
- page-mascot is a React DOM component driven by 3x3 sprite sheets. It does not run in React Native and we have no sprite sheets, so only its idea (state-driven sprite reactions) carries over.

Consequences:
- Motion on a single PNG is transforms only: breathing scale, squash and stretch jump, tilt, particle overlays. We call it "reactive hero", never skeletal animation.
- Layered outfits cannot align on flattened per-level art. The current outfit and companion shop items have no usable asset path.

## Phase 0: before the 05:00 demo (only if it fits, hard stop 04:35)

1. Safety APK: the Shop tab split is built and installed on the A54 (done 04:00).
2. `AvatarStage` internals switch from the 3D canvas to an `Image` of the current level's PNG. Props `{ className, fx, celebrate }` stay the same, so Home, Setup, ResultPanel and LevelUpOverlay do not change. Reanimated: breathing loop, squash jump on tap, bigger hop on `celebrate`. Ignore taps while a jump plays.
3. PNGs go into `tara/assets/hero/level_01.png` to `level_10.png` through a static `require()` table (Metro cannot bundle computed paths), and they are prefetched on start.
4. `LEVELS` grows from 3 to 10. The first three thresholds stay the same (0, 150, 400), so the demo phone (296 XP, level 2) does not jump levels on launch.
   Proposed: 0, 150, 400, 700, 1050, 1450, 1900, 2400, 2950, 3550.
   Proposed ranks: Baguhan, Masigla, Masipag, Matiyaga, Masikap, Matatag, Magiting, Bihasa, Dakila, Alamat, each with an English subtitle.
5. Gender: the art is male only. Hide the setup toggle and render male regardless of the stored `baseAvatar`.
6. Shop tab: hide it until Phase 2 items exist.
7. Leave three, r3f, expo-gl and the GLBs installed. Just stop importing them, so no native rebuild is needed.

If step 2 is not working in a release build by 04:35, revert and demo the safety APK.

## Phase 1: 2D hero proper

- Delete the 3D stack (`three`, `@react-three/fiber`, `expo-gl`, `src/lib/viewer3d/`, `assets/avatar/*.glb`) and prebuild.
- Hero controller (`src/lib/hero/`): typed states `idle | tap | happy | thinking | quest_done | level_up | error | achievement`, priority order, one-shot back to idle, no stacked celebrations, paused while unfocused or backgrounded, and a reduced-motion check (`AccessibilityInfo.isReduceMotionEnabled`).
- Hook the states to real events only: thinking while chat planning or Ask Tara runs, happy when drafts are ready, error when a model call fails, quest_done after the ledger append succeeds, and level_up when `levelForXp` changes. When one action crosses several levels, show one overlay with the final level.
- Level-up scene: crossfade from the old level PNG to the new one behind gold particles.
- Evolution strip (Character screen): unlocked levels in full, locked ones as silhouettes (tinted Image).
- Real frames, such as a blink or a jump pose, only once art is commissioned. A frame player can then sit under the same controller.

## Phase 2: shop rework

Sell only things that are one flattened PNG and need no anchoring to the hero:
- Stage backdrops behind the hero: sari-sari store, rice terraces, jeepney stop, plaza.
- Hero card frames and title badges.
- Aura overlays drawn behind the hero (reuses the `HeroFx` slot).

The level forms themselves are free unlocks from XP, never sold.
Existing purchases: add an `item_refunded` ledger event that returns the price for any retired `item_id`. Never delete ledger events.
Add equip state (`equipped: { backdrop, frame, aura }`) to the derived state and show the equipped items on Home, the Character screen, the result panel and the level-up scene.
Do not show an item until its art is in `assets/shop/`.

## Phase 3: leaderboard (backend + new tab)

Identity (MVP):
- `user_id`: UUID created on first launch (`expo-crypto` `randomUUID`) and stored in SecureStore. No edit path in the app.
- Set `android:allowBackup="false"`, or Android auto-backup restores the id after a reinstall and breaks the "resets only on uninstall" rule.
- `username`: a display label the user picks at setup. It must be unique (case-insensitive) on the server, 3 to 16 characters from `[a-z0-9_]`, and pass a profanity blocklist. Tell users not to use their real name (users may be minors). The server keys everything on `user_id`.

Server (`backend/server.ts`, still zero-dependency, JSON file):
- `POST /lb/register {user_id, username}` returns 409 when the username is taken.
- `POST /lb/events {user_id, events[]}`: the phone uploads its ledger events. The server recomputes XP with the same rule functions (shared code, so the phone's number is not trusted) and stores per-user totals.
- `GET /lb?period=week|all` returns rank, username, weekly Sipag and level.
- Rate limit per `user_id`. Cap event batch size.

App:
- New tab "Ranks" showing the weekly list, the user's own row pinned, and a "you are offline" state. Uploads queue offline and flush when reachable.
- The board needs a server the phones can reach (hosted, or the laptop on the venue Wi-Fi). Over adb reverse it is single-device only.

Later: class or section codes so teachers moderate their own board.

## Phase 4: navigation and reskin

Target tabs: Home, Quests, Character (evolution + shop), Ranks, Profile (rewards, badges, stats, settings, AI provider).
The ivory/anime reskin from the mockups comes last, after the art direction is settled, because it touches every screen.

## Open decisions (owner: user)

See the decision list in the chat report of 2026-10-10.
