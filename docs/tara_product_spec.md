# Tara LEVEL UP! product spec

As of 2026-10-09. Product plan only: no models, frameworks or architecture.

Tara turns daily routines into a game where **the user decides what counts and the on-device AI only checks proof that it happened**. That one change, agreed by all five council advisors, replaces three parts of the original pitch: the AI no longer judges what is productive, the camera takes Before and After photos instead of shots at intervals, and the microphone works only while the user holds a button. The team should confirm these changes with the teammate who proposed the idea.

## Council verdict

**Where the council agrees**

- The AI judges proof, never worth. The user declares the quest; Tara checks that it happened.
- Interval photos and an always-on microphone are out. Before & After photos and hold-to-talk replace them.
- No shaming rival. "Ikaw Kahapon" (You Yesterday), a ghost of your own last week, does the rival's job.
- Phase 1 is a three-minute airplane-mode demo with a guaranteed level-up.

**Where the council clashed, and the call**

- **Scope.** Demo only, or full spec? Full spec, tagged by phase, with only Phase 1 built for judging.
- **Sleep and late nights.** No sleep XP and no late-night rewards; a rest day planned in advance protects the streak.
- **Rival.** Self-ghost in Phase 2, an opt-in friend ghost traded by QR code in Phase 3.
- **Alarms.** Opt-in "Nanay Mode" (Mom Mode) with a hard volume cap.

**Blind spots the peer review caught**

- The AI will sometimes wrongly reject real effort. A "Ginawa ko talaga" (I really did it) button always pays 1x, never zero.
- Turning the phone's clock back could farm streaks, so time-based rewards pause when the clock jumps backward.
- A lost or reset phone would wipe progress: a backup file in Phase 1, phone-to-phone transfer in Phase 2.
- Shared phones need separate profiles, and a child's voice needs a parent's consent.
- Levels need a real-world payoff: a "Pabuya" (reward) list the user or a parent writes.

**First step:** storyboard the three-minute demo frame by frame and write the five Phase 1 quest cards with their proof rules.

## Product summary

Tara LEVEL UP! is a fully offline Android app for Filipino students, young workers and families sharing one phone, in English, Tagalog or Taglish. The user declares a quest (cleaning, a study block, reading aloud, exercise, or a task of their own) and proves it happened with a Before & After photo pair, a quiz built from a photo of their own notes, a read-aloud check, or reps counted aloud. Their companion Tara, a tarsier, checks the proof and awards "Sipag" (diligence) points, multiplied by how strong the proof is.

Points fill a bar through twelve named levels, from Baguhan (Beginner) to Alamat (Legend), and unlock characters, outfits, rooms, sounds, features and real-world rewards. Nothing leaves the phone: photos delete themselves after 7 days, voice is never stored, and the app works the same in a brownout or in airplane mode. On screen, XP reads "+15 Sipag" and quests are called "Gawain" (tasks); this spec says XP and quest for clarity.

## Core gameplay loop

One weekday for a college student at level 4.

1. **6:30, wake-up.** A gentle chime. Tara: "Magandang umaga! Ano'ng plano natin today?" (Good morning! What's our plan today?)
2. **6:35, plan.** The user types or says 3 to 5 quests. Tara suggests a duration and a proof type for each, and never refuses one.
3. **6:40, "Ayusin ang kama" (Make the bed), 10 minutes.** Before photo, make the bed, After photo. The cards slide together and a gold PATUNAY stamp lands. +30.
4. **9:00, Aral block (study block), 45 minutes.** The user photographs a page of notes. When the timer ends, Tara asks 5 questions from that page; 4 correct earns Patunay.
5. **12:30, Linis Mesa (clean desk) alert.** With Nanay Mode on, it steps from a chime to Tara's voice to an urgent tone, capped at the set volume. Quiet mode switches to vibration when others are asleep.
6. **17:30, Ehersisyo (exercise).** The user holds the mic button and counts squats aloud. Reaching 60 earns Patunay.
7. **19:00, Sariling Gawain (own task): "Samahan si Lola sa check-up" (go with Lola to her check-up).** No photo makes sense, so it is logged as Sabi Ko at 1x, and Tara does not question it.
8. **20:30, Basa Nang Malakas (read aloud).** A "Nakikinig" (listening) badge glows while the user reads. Tara shows words per minute and skipped words, and discards the recording on the spot.
9. **21:00, day close.** The streak reaches day 9 (1.45x). An affordable Pabuya reward glows: "Milk tea, 500 Sipag. Kaya na!" (You can afford it!)
10. **22:00, bedtime.** Tara switches to sleepy mode. Starting a quest after bedtime asks "Sigurado ka? Pahinga muna?" (Are you sure? Rest first?)

## Levels and XP rules

Twelve levels take about three months at a typical 200 XP a day: level 5 in roughly a week, level 10 in about six weeks. The 300 XP daily cap means no one reaches Alamat in under 57 days.

| Level | Name | XP to reach | Unlocks | Phase |
| --- | --- | --- | --- | --- |
| 1 | Baguhan (Beginner) | 0 | Tara; Linis, Aral, Basa and Sariling Gawain quests; Before & After; dispute button; backup file | P1 |
| 2 | Masigla (Lively) | 150 | Ehersisyo with Bilang Mode (count aloud); Bukang-liwayway (Dawn) theme | P1 |
| 3 | Masipag (Hardworking) | 400 | Baon Days (saved days that protect the streak); Uniporme (uniform) outfit | P1 |
| 4 | Matiyaga (Persistent) | 800 | Pabuya list; Kampana (church bell) sound pack | P1 |
| 5 | Maaasahan (Dependable) | 1,400 | Nanay Mode; Tag-ulan (Rainy season) theme | P1 |
| 6 | Masinop (Orderly) | 2,200 | Coach Ate Ces, daily quests, end-of-day summary | P2 |
| 7 | Bihasa (Skilled) | 3,300 | Ikaw Kahapon rival; Barong/Filipiniana outfit | P2 |
| 8 | Matatag (Steadfast) | 4,700 | Sunod-sunod (back-to-back) quest chains; Dorm room | P2 |
| 9 | Dalubhasa (Expert) | 6,500 | Repaso deck (review missed quiz questions); Kabit (habit stacking); Kulintang sound pack | P2 |
| 10 | Bida (Star) | 9,000 | Boss Week; Bahay Kubo (nipa hut) room; Medalya (medal) | P2 |
| 11 | Idolo (Role model) | 12,500 | Mentor mode; Barkada (friend) ghost by QR | P3 |
| 12 | Alamat (Legend) | 17,000 | Alamat Hall (lifetime record); Alamat Gold theme; Bagong Kabanata (New chapter) prestige | P3 |

| Rule | Detail | Phase |
| --- | --- | --- |
| Base XP | 1 XP per minute done; a quest counts for at least 10 and at most 60 minutes | P1 |
| Sabi Ko (I say so) | Self-reported, 1x, capped at 60 XP a day | P1 |
| Nakita (Seen) | One mid-task Silip (peek) photo or one spoken check-in, 2x | P1 |
| Patunay (Proof) | Before & After shows change, quiz passed at 70% or more, 80% or more of the page read aloud, or the rep target counted aloud, 3x | P1 |
| Repeat limit | Only 3 quests of the same type earn XP per day | P1 |
| Daily cap | 300 XP a day from quests; daily and weekly quest bonuses sit outside it | P1 |
| Streak | +0.05x per streak day, capped at 1.5x from day 10; a day counts if any quest is finished at any tier | P1 |
| Dispute | "Ginawa ko talaga" always pays at least 1x; if the Sabi Ko cap is full, it is banked to the next morning | P1 |
| Comeback | After 3 or more days away: +20, and "Best: 12. Bagong simula ngayon." (New start today.) No red zero | P1 |
| Clock flag | If the clock moves backward, streak and daily rewards pause until it passes the latest time Tara has seen; quest XP still lands | P1 |
| Balik-Tara week (Back to Tara) | After 7 or more days away, the first 3 Patunay quests earn +50% | P2 |
| Pahinga day (Rest day) | Planned the day before, keeps the streak, earns no XP, once a week | P2 |

## Characters

Seven characters, and none of them shames the user: the rival is your own past week, and a friend rival only exists if both people opt in face to face.

| Character | Role | Unlock | Sample line | Phase |
| --- | --- | --- | --- | --- |
| Tara, a Philippine tarsier with happy, cheering and sleepy moods | Companion who checks proof and names what changed | Start | "Tara, simulan na natin! Konting linis lang, kaya mo 'yan." (Let's start! Just a bit of cleaning, you can do it.) | P1 |
| Ate Ces, a calm older-sister figure who just passed her board exam | Coach: end-of-day summary, quiz difficulty, next-day suggestions | Level 6 | "Ang galing mo sa Aral block kanina. Bukas, 30 minutes naman, ha?" (You were great in the study block. Tomorrow, 30 minutes, okay?) | P2 |
| Ikaw Kahapon (You Yesterday), a translucent ghost built from the user's own last week | Rival: weekly duel against your past self | Level 7 | "Last week, 4 Patunay ako. Lalampasan mo ba 'ko?" (Last week I had 4 Patunay. Will you beat me?) | P2 |
| Lola Ising, a grandmother in a duster with a fan | Rest guide: suggests Pahinga days and bedtime wind-down; never awards sleep XP | First Pahinga day kept | "Anak, pahinga muna. Bukas ulit tayo." (Child, rest first. We go again tomorrow.) | P2 |
| Kuya Jun, a barangay basketball coach with a whistle | Exercise hype voice for Bilang Mode | 10 Ehersisyo quests at Patunay | "Isa pa! Huling sampu, kapit lang!" (One more! Last ten, hang on!) | P2 |
| Bunso (Youngest), Tara's baby tarsier cousin | Companion for child profiles in Reading Buddy | A parent creates a child profile and gives consent | "Basa tayo! Isang page lang, tapos sticker!" (Let's read! Just one page, then a sticker!) | P2 |
| Barkada ghost (friend ghost), a friend's weekly record traded by QR in person | Friendly rival with no server and no leaderboard; both sides opt in | Level 11 | "Si Migs, 3 Patunay na today. Ikaw?" (Migs already has 3 Patunay today. You?) | P3 |

## Assets, features and milestone effects

| Type | Items and how they unlock |
| --- | --- |
| Themes | Kwarto (Bedroom; start), Bukang-liwayway (Dawn; level 2), Tag-ulan (Rainy season; level 5), Gabi sa Probinsya (Night in the province; 14-day streak, P2), Parol (Christmas lantern; Ber Months season, P3), Alamat Gold (level 12, P3) |
| Tara outfits | Uniporme (uniform; level 3), Barong/Filipiniana (level 7), Jersey (20 Ehersisyo quests at Patunay), Kapote (raincoat; rainy season, P3), Sablay (graduation sash; "Tinapos ang Thesis", P3) |
| Rooms | Kwarto (start), Dorm (level 8), Sari-sari store (neighborhood store; 30-day streak), Bahay Kubo (level 10), Jeepney interior (Bakasyon season, P3) |
| Sounds | Tunog Tara chime and Tagumpay (Victory) flourish (start), Kampana (level 4), Busina (jeepney horn; Brownout Warrior), Kulintang (gong ensemble; level 9), Videoke "Perfect score!" (Fiesta week, P3) |
| Avatar items | Salakot (woven hat; first Patunay), Bimpo sa likod (towel on the back; 10 Ehersisyo quests), Salamin ng Iskolar (scholar's glasses; 20 quizzes passed), Medalya (level 10), Alamat sash (level 12) |

| Feature | What the user can do | Unlock | Phase |
| --- | --- | --- | --- |
| Before & After | Prove a visible change with two photos | Level 1 | P1 |
| Aral quiz | Turn a photo of notes into a quiz | Level 1 | P1 |
| Basa Nang Malakas | Read aloud with pace and skipped-word feedback | Level 1 | P1 |
| Ginawa ko talaga | Dispute a check and still earn 1x | Level 1 | P1 |
| I-save ang progreso (Save progress) | Export a backup file and restore it on any phone | Level 1 | P1 |
| Bilang Mode | Count exercise reps aloud | Level 2 | P1 |
| Baon Days | Earn one saved day per 7-day streak, hold up to 2 | Level 3 | P1 |
| Pabuya list | Set real rewards with an XP price | Level 4 | P1 |
| Nanay Mode | Opt-in three-step alerts, volume cap, quiet mode | Level 5 | P1 |
| Profiles | Up to 4 profiles per phone, each with a PIN and its own Tara | From start once P2 ships | P2 |
| Lipat Tara (Move Tara) | Move progress to a new phone by QR, no internet | From start once P2 ships | P2 |
| Bagyo Pass (Storm pass) | Switch on streak protection for up to 3 days, once a month | From start once P2 ships | P2 |
| Daily quests and summary | Three suggested quests a day and Ate Ces's nightly recap | Level 6 | P2 |
| Ikaw Kahapon duel | Weekly race against your own last week | Level 7 | P2 |
| Sunod-sunod chains | Three focus blocks with 5-minute breaks | Level 8 | P2 |
| Repaso deck | Review missed quiz questions | Level 9 | P2 |
| Boss Week | One big weekly goal split into parts | Level 10 | P2 |
| Mentor mode | Assign quests to a family profile and approve its Pabuya claims | Level 11 | P3 |
| Alamat Hall and Bagong Kabanata | Lifetime record, and a restart with a permanent prestige star and every unlock kept | Level 12 | P3 |

| Milestone | Visual | Sound | Phase |
| --- | --- | --- | --- |
| Quest done at Sabi Ko | "+15" pops and the bar fills | Soft "ting" | P1 |
| Quest done at Patunay | Before and After cards slide together, gold PATUNAY stamp | Stamp thud and bright chime | P1 |
| Level up | A banig (woven mat) banner unrolls, Tara jumps, confetti | Tagumpay brass flourish | P1 |
| Achievement | Badge drops like a hung medal | Palakpakan (clapping) | P1 |
| 7-day streak | A parol lights one point per streak day | Bamboo wind chime | P2 |
| Hidden achievement | Screen dims and a lantern reveals the badge | Low gong | P2 |
| Comeback | Tara waves at an open door: "Welcome back, +20" | "Tao po!" (Anyone home?) | P2 |
| Level 10, Bida | Fireworks over the Bahay Kubo | Short brass band fanfare | P2 |
| Season finale | Banderitas (fiesta flags) drop across the screen | Jeepney horn and crowd cheer | P3 |
| Level 12, Alamat | Story card with Tara in a sablay | Full kulintang piece | P3 |

## Achievements, challenge types and retention

Hidden achievements show as "???" until earned. None reward bad sleep or late nights.

| Category | Name | Exact condition | Rarity | Phase |
| --- | --- | --- | --- | --- |
| Simula (Start) | Unang Hakbang (First step) | Finish your first quest | Common | P1 |
| Simula | Unang Patunay (First proof) | Finish your first quest at Patunay | Common | P1 |
| Linis (Clean) | Malinis na Kwarto (Clean room) | 10 Linis quests at Patunay | Common | P1 |
| Sipag (Diligence) | Tatlong Araw (Three days) | 3-day streak | Common | P1 |
| Sipag | Isang Linggo (One week) | 7-day streak | Uncommon | P1 |
| Aral (Study) | Perpekto (Perfect) | 10 of 10 on one Aral quiz | Uncommon | P1 |
| Basa (Reading) | Basa Bida (Reading star) | 30 total minutes of read-aloud | Common | P1 |
| Pabuya (Reward) | Pabuya Natanggap (Reward received) | Claim your first Pabuya | Common | P1 |
| Offline | Walang Signal, Walang Problema (No signal, no problem) | Finish a Patunay quest in airplane mode | Hidden | P1 |
| Basa | Dalawang Wika (Two languages) | Read aloud in English and in Tagalog in the same week | Uncommon | P2 |
| Katawan (Body) | Bilang Lakas (Counted strength) | 500 total reps counted aloud | Uncommon | P2 |
| Balanse (Balance) | Pahinga Master | Keep 4 planned Pahinga days | Hidden | P2 |
| Balanse | Payapang Gabi (Peaceful night) | 7 nights with no quest activity after your set bedtime | Uncommon | P2 |
| Sipag | Gising Na (Wide awake) | A quest before 6:00 on 5 days, each after a night with no quest past 22:00 | Hidden | P2 |
| Sipag | Tapat sa Plano (True to the plan) | Finish every scheduled quest for 5 days in a row | Rare | P2 |
| Balik (Return) | Bumalik ang Bida (The star returns) | Return after 7 or more days away and finish 3 quests within 2 days | Uncommon | P2 |
| Offline | Brownout Warrior | Finish a Patunay quest with battery under 15% and not charging | Hidden, rare | P2 |
| Pamilya (Family) | Kuya/Ate ng Bahay (Big brother/sister of the house) | As mentor, assign 10 quests the other profile finishes | Rare | P3 |
| Aral | Tinapos ang Thesis (Finished the thesis) | 100 total hours of Aral quests | Rare | P3 |
| Season | Ber Months Champion | Finish every chapter goal of a Ber Months season | Rare | P3 |
| Sipag | Buong Taon (Whole year) | 300 active days within 365 days | Hidden, rare | P3 |
| Alamat | Alamat ng Sipag (Legend of diligence) | Reach level 12 | Rare | P3 |

| Challenge type | What it asks | Unlock | Phase |
| --- | --- | --- | --- |
| Solo quest | Declare it, do it, prove it at any tier | Level 1 | P1 |
| Before & After | Show a visible change | Level 1 | P1 |
| Quiz quest | Pass a quiz from your own notes | Level 1 | P1 |
| Read-aloud | Read a page aloud in English or Tagalog | Level 1 | P1 |
| Rep count | Hit a rep target counted aloud | Level 2 | P1 |
| Pahinga planning | Schedule rest a day ahead and keep it | First kept rest day | P2 |
| Daily trio | Finish three suggested quests in one day | Level 6 | P2 |
| Self duel | Beat Ikaw Kahapon's Patunay count this week | Level 7 | P2 |
| Sunod-sunod chain | 3 focus blocks back to back with short breaks | Level 8 | P2 |
| Kabit (Attach) | Attach a new habit right after an existing one, for 7 days | Level 9 | P2 |
| Boss Week | One big goal in 7 days, for example "Hell Week: 5 Aral quests at Patunay" | Level 10 | P2 |
| Mentor quests | Set quests for a family profile and approve their rewards | Level 11 | P3 |
| Barkada duel | Weekly race against a friend's record traded by QR | Level 11 | P3 |
| Season chapters | Four monthly chapter goals per season | Season start | P3 |
| Bagong Kabanata | Restart the levels with a permanent prestige star | Level 12 | P3 |

| Retention mechanic | Detail | Phase |
| --- | --- | --- |
| First 60 seconds | One quest ("Ayusin ang kama"), one Before & After, one level-up sound; locked systems stay hidden until they unlock | P1 |
| Comeback | +20 and a kind restart message after 3 or more days away | P1 |
| Pabuya list | Rewards the user writes, with a price: "Milk tea, 500", "1 oras ML (an hour of Mobile Legends), 300", "Sine sa Linggo (Sunday movie), 1,500". Claims spend a separate balance, so levels never drop | P1 |
| Parent approval | On a child profile, the parent's PIN approves each claim | P2 |
| Daily quests | Three a day, refreshed at 5:00. +15 each, +30 for all three | P2 |
| Weekly quest | One each Monday, such as "5 Patunay quests". +100 and one Kahon (box) holding a random cosmetic | P2 |
| Balik-Tara week | +50% on the first 3 Patunay quests after 7 or more days away | P2 |
| Bagyo Pass | User-activated streak protection for up to 3 days, once a month | P2 |
| Season: Bagong Simula (New start) | January to March; resolution chapters ending in a Hell Week exam chapter. Reward: Medalya variant, Gising Na badge frame | P3 |
| Season: Bakasyon (Summer break) | April to May; reading and chores chapters with a Fiesta week in May. Reward: Jeepney room, Videoke sounds | P3 |
| Season: Pasukan at Tag-ulan (School opening and rainy season) | June to August; back-to-school study chapters. Reward: Kapote outfit | P3 |
| Season: Ber Months | September to December; a daily countdown to Pasko (Christmas). Reward: Parol theme | P3 |
| Yearly recap | "Taon ng Sipag" (Year of diligence) card with total hours, best streak and Patunay count, kept only on the phone | P3 |

## How the AI turns scheduled tasks into level-ups

The user decides what is productive; Tara only checks that the evidence matches the task the user declared, and a failed check never pays zero.

1. **Declare.** The user types or says the quest, for example "Linis ng kwarto, 30 mins". Any quest is valid. Tara only suggests a quest type, a duration and a proof option.
2. **Choose proof.** Tara offers the tiers that fit the task. Sabi Ko is always available.
3. **Start.** A timer runs and Tara keeps the user company. An optional Silip photo or one spoken check-in earns Nakita.
4. **Finish and show proof.** The user takes the After photo, finishes the quiz, reads the page or counts the reps.
5. **Tara checks** only that the evidence matches the declared task (table below).
6. **Tara explains** what it saw, never what is wrong with the user: "Nakita ko: wala na ang damit sa kama, malinis ang mesa." (I saw that the clothes are off the bed and the desk is clean.)
7. **Dispute.** If Tara could not confirm the proof, the user can retake the After photo once or tap "Ginawa ko talaga". It pays Sabi Ko 1x, or banks it to the next morning if the cap is full. No warning, no strike, no lecture.
8. **XP lands.** Base × proof tier × streak, checked against the caps, then the stamp, the bar and a level-up if one is reached.
9. **Quiet integrity checks.** Repeat limits and daily caps apply. If the phone's clock moves backward, Tara shows "Nagbago ang oras ng phone. Babalik ang streak bukas." (The phone's time changed. The streak returns tomorrow.)

| Quest type | What Tara checks for Patunay | Nakita | Sabi Ko |
| --- | --- | --- | --- |
| Linis (Clean) | Before & After of the same spot shows clear change: items put away, surface cleared, bed made | One Silip photo of the task underway | Always allowed |
| Aral (Study) | 70% or more on a quiz built from the notes photo | Notes photo, no quiz | Always allowed |
| Basa (Read aloud) | 80% or more of the page's words read, with pace shown | A spoken one-line summary of what was read | Always allowed |
| Ehersisyo (Exercise) | Rep target reached, counted aloud | One spoken check-in mid-workout | Always allowed |
| Sariling Gawain (Own task) | Before & After when the task changes something visible | One spoken check-in | The default for family time, prayer, errands and caregiving |

**What Tara never judges:** whether a quest is worthy, the user's body or looks, how nice or poor a home is, accent or Taglish mixing, pronunciation beyond skipped words, the beliefs in what someone reads, the people in a photo, and how long or how well someone sleeps.

| Data | Where it lives | How long |
| --- | --- | --- |
| Before & After photos | This phone only | Deleted after 7 days unless the user saves the card to their Gallery of Sipag |
| Silip photos | This phone only | Deleted right after the check |
| Voice (Basa, Bilang, check-ins) | Never stored | Only scores are kept: pace, words read, reps |
| Notes photos | This phone only | Deleted 7 days after the quiz; missed questions stay in the Repaso deck until deleted |
| Quest log, XP, unlocks | This phone and the user's own backup file | Until the user deletes them |
| Child profiles | Microphone features stay locked until a parent reads a consent screen and enters their PIN | The child's voice is never stored; the parent sees pages read and scores only |
| People in photos | Tara asks "May tao sa litrato. Kunan ulit ang mesa lang?" (There's a person in the photo. Retake just the desk?) | The photo is not checked until it is retaken |
| Everything | Nothing is uploaded, ever. There is no account and no sign-in | Not applicable |

## Phased roadmap and demo

Only Phase 1 is built for judging; Phases 2 and 3 go on the roadmap slide.

**Phase 1: core loop.** Tara with three moods; five quest cards (Linis, Aral, Basa, Ehersisyo, Sariling Gawain); proof tiers, base XP, caps, repeat limit, streak multiplier, dispute path and clock flag; levels 1 to 5 with their unlocks; Phase 1 assets, effects and achievements; Baon Days, Pabuya list, Nanay Mode with a cap and quiet mode, comeback bonus, backup file, and the 60-second onboarding.

By the end, the user can plan a day of quests, prove them with photos, quizzes, reading or counting, dispute a wrong check, level up to Maaasahan, claim a real reward, protect a streak, and back up their progress, all with no signal.

**Phase 2: progression depth.** Levels 6 to 10; Ate Ces, Ikaw Kahapon, Lola Ising, Kuya Jun and Bunso; profiles, Reading Buddy with parent consent, Lipat Tara transfer, Bagyo Pass, Balik-Tara week, Pahinga days; daily and weekly quests, quest chains, Kabit, Repaso deck, Boss Week, hidden achievements, rooms, more outfits and sound packs.

By the end, the user can share one phone with family on separate profiles, let a younger sibling practice reading safely, move progress to a new phone without internet, duel their own past week, and keep a streak through a typhoon or a rest day.

**Phase 3: long-term engagement.** Four yearly seasons with chapters and cosmetics, Fiesta week, levels 11 and 12, mentor mode, Barkada ghost by QR, Alamat Hall, Bagong Kabanata prestige, rare achievements, and the yearly Taon ng Sipag recap.

By the end, the user can play through the Filipino calendar year, guide a younger family member's habits, compete with a friend face to face without a server, reach Alamat, and start a new chapter while keeping everything they earned.

**Demo script: three minutes, airplane mode.** The account is pre-seeded 30 XP short of level 3. Two quests are started backstage: Linis Mesa (15 minutes, Before photo taken) and an Aral block (20 minutes).

1. **0:00 to 0:20.** Show airplane mode and Wi-Fi off. "No signal. Everything you see happens on this phone."
2. **0:20 to 0:45.** The Linis Mesa timer is nearly done and the Before photo of a messy prop desk is on screen. The presenter clears the desk live.
3. **0:45 to 1:15.** After photo. The cards slide together and Tara says "Nawala ang tatlong tasa at ang tambak ng papel. Malinis na!" (The three cups and the pile of paper are gone. It's clean!) PATUNAY lands, +45, level up to Masipag with the Tagumpay sound; the Uniporme outfit and Baon Days unlock.
4. **1:15 to 1:55.** The Aral block ends. Photograph a page of Taglish notes, answer Tara's 3 questions, Patunay lands. "These notes never left this phone."
5. **1:55 to 2:25.** Basa Nang Malakas. Hold to talk while the Nakikinig badge glows and read two Tagalog lines. Tara shows pace and one skipped word, then "Hindi na-save ang boses mo." (Your voice was not saved.)
6. **2:25 to 2:45.** Open a quest Tara could not confirm and tap "Ginawa ko talaga". +15, no accusation.
7. **2:45 to 3:00.** Close: "A phone that watches you clean and hears you read is only okay if nothing leaves it. With Tara, nothing does."

Fallback: if any check misreads on stage, the presenter uses the dispute live, which also shows the feature. The level-up still lands by step 4, since both quests at 1x give 35 XP against the 30 needed.

## Disagreements and how each was settled

| Topic | Positions | Decision | Reason |
| --- | --- | --- | --- |
| Who decides "productive" | Pitch: the AI decides. All five advisors: the user decides | The user declares; Tara checks proof only | An AI that refuses XP for caring for a sick lola loses the user and invites the judges' question "who defines productive?" |
| Camera | Pitch: interval photos. Expansionist: time-lapse reel. First Principles: a random mid-task check. Others: Before & After only | Before & After plus an optional Silip the user takes; no automatic capture | Automatic shots catch family members who never agreed, and fail for exercise and chores away from the desk |
| Microphone | Pitch: listens to track progress. Everyone else: user-started only | Hold-to-talk with a visible Nakikinig badge; voice never stored | An always-on mic in a shared home reads as surveillance |
| Sleep and late nights | Executor: "Tulog Bago 11" and "Hatinggabi Hero". Expansionist: "Walang Tulugan". Contrarian: reject | No sleep XP and no late-night rewards; Payapang Gabi rewards no activity after bedtime | Sleep XP cannot be verified, and late-night rewards pay for harm |
| Rest and family time | Outsider: they earn XP. Contrarian: rest only as a hidden achievement | Family time and prayer declared at Sabi Ko; planned rest protects the streak but earns no XP | Respects real life without letting rest farm points |
| Rival | Pitch: a rival character. Expansionist: a friend's ghost by QR. Contrarian, First Principles: a self-ghost | Ikaw Kahapon in P2, an opt-in Barkada ghost in P3 | A self-rival never shames; a friend duel works once trust in the app exists |
| Streak breaks | Pitch implied breakable streaks. Contrarian: Baon Days. Outsider: no red zero | Baon Days from level 3, Bagyo Pass, and the comeback message | Brownouts and shared phones break streaks through no fault of the user |
| Automatic typhoon detection | Expansionist: Bagyo Streak. Reviewers: an offline phone cannot know the weather | Rejected; the user switches on Bagyo Pass | The user knows when a storm hits; the app does not |
| Alarms | Executor: three-step escalation as core. Contrarian, Outsider: opt-in with a cap | Nanay Mode, opt-in from level 5, with a volume cap and quiet mode | Punishing alarms drive uninstalls and wake the household |
| Anti-cheat | Pitch: heavy. Contrarian: a cap is enough. First Principles: proof tiers | Proof tiers, caps, repeat limit, clock flag | Cheating earns only 1x, so it is pointless rather than forbidden |
| Wrong AI rejections | Missed by all five advisors, raised in peer review | "Ginawa ko talaga" pays 1x, never zero | Denying real effort is worse than letting a few cheats through |
| Children's voices | Expansionist: Basa Quest and Reading Buddy for kids. Reviewers: no consent model | Child profiles in P2 with a parent consent screen and PIN; voice never stored | Recording a minor needs a parent's consent |
| Scope | Executor, Contrarian: demo only. Reviewers: the full spec | Full spec tagged by phase; only P1 built for judging | The brief asked for the full spec; judges see three minutes |
| Demo order | Expansionist: Basa and a reel. First Principles: Linis and Basa. Contrarian: Before & After and a notes quiz | Linis, then the Aral quiz, then Basa, then the dispute | Each beat shows a different private input: room, notes, voice |
| Jargon | Outsider: "XP" and "quest" mean nothing to a tita (aunt) | On screen: "+15 Sipag" and "Gawain"; levels keep Filipino names | Anyone in the household can read a bar and a number |
| Demo head start | Executor: 40 XP short | 30 XP short | At 30, the level-up lands even if both checks fall back to 1x |
