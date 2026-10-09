# iPhone setup: installing Local AI Lab for testing

This guide installs the test app on an iPhone without a Mac. Expo's cloud service (EAS) builds the app, and Apple's ad hoc distribution installs it from a link.

The app cannot run in Expo Go. It contains native code (llama.rn, whisper.rn, ExecuTorch), so it needs its own build.

## What you need

- A **paid Apple Developer Program** membership ($99/year). A free Apple ID is not enough for this method.
- A free **Expo account** from https://expo.dev/signup.
- The iPhone you will test on, with Safari.
- A computer with Node.js 22 and this repository cloned. Windows works.

New Apple memberships can take 24 to 72 hours before a newly registered iPhone can install builds. If the first build refuses to install, wait and rebuild.

## 1. Log in to Expo

From the `mobile` folder:

```bash
cd mobile
npm install
npx eas-cli@latest login
```

On Windows, run `npm install` from PowerShell, not Git Bash. The `llama.rn` install step breaks with Git Bash's `tar`.

## 2. Link the project to your Expo account

Only needed once per Expo account:

```bash
npx eas-cli@latest init
```

This writes a project ID into `app.json`. Commit that change so teammates share the same project.

## 3. Register the iPhone

```bash
npx eas-cli@latest device:create
```

Pick the website option. It prints a link and a QR code.

On the iPhone:

1. Open the link in **Safari** (other browsers will not work).
2. Allow the configuration profile download.
3. Go to **Settings → General → VPN & Device Management**, open the downloaded profile, and install it.

The iPhone is now on the Apple account's device list. Check with `npx eas-cli@latest device:list`.

## 4. Build the app in the cloud

```bash
npx eas-cli@latest build --platform ios --profile preview
```

- When asked, log in with the Apple ID that holds the paid membership and enter its two-factor code. EAS creates the signing certificate and the ad hoc profile for you.
- Say yes when it asks to include the registered devices.
- The build runs on Expo's servers. Expect 15 to 30 minutes, plus queue time on the free plan.
- When it finishes, you get an install link and a QR code. The same link is on the build page at expo.dev.

Every time you register a new iPhone, rebuild. Only devices registered before the build can install it.

## 5. Install on the iPhone

1. Open the install link in **Safari** and tap **Install**.
2. Turn on Developer Mode: **Settings → Privacy & Security → Developer Mode**, switch it on, and restart when asked. After the restart, confirm the prompt.
3. Open **Local AI Lab** from the home screen.

## 6. Connect to the laptop backend

The app works offline with the model catalog built into it. The laptop backend adds three things: the latest catalog, fast model downloads from the laptop, and the shared results table.

1. On the laptop, start the backend:

   ```bash
   cd backend
   npm start
   ```

   It prints the laptop's addresses, for example `http://192.168.1.20:8787`.

2. Put the iPhone and the laptop on the **same network**. Guest Wi-Fi networks usually block devices from reaching each other. If yours does, turn on the iPhone's **Personal Hotspot** and connect the laptop to it, then restart the backend to see the new address.
3. In the app, open **Models**, enter the laptop address in **Backend URL**, and tap **Save & reload catalog**. Allow the local network prompt.
4. If Windows Firewall asks about Node.js, allow it on private networks.

The results table is at `http://<laptop-address>:8787/results` on the laptop.

## 7. What to test

Run the same checks as on Android so the two phones compare:

- **Text:** chat and translation, English and Tagalog, with Gemma 3 1B. Score each answer 1 to 5.
- **Voice:** record twice in a row, Tagalog and English. Try the system voice with the Tagalog sample.
- **Vision:** describe a photo, then generate an image. On iOS, ExecuTorch uses its CoreML models, which compile once on first use.
- **Assets:** open a `.glb` file (Files app or AirDrop it to the phone) and rotate, move and pinch it.

Every run posts to the results table with the phone model, so iPhone and Android numbers sit side by side.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Unable to install" from the link | The iPhone was registered after the build. Rebuild with step 4. On a new Apple membership, wait up to 72 hours. |
| "Developer Mode Required" when opening the app | Turn on Developer Mode and restart. See step 5. |
| Catalog says "from bundled" | The app cannot reach the laptop. Check the network (step 6) and the Backend URL. |
| Model download stalls | It fails into a **Retry** button after 60 seconds without data. Tap Retry, or put the files in `backend/models/` on the laptop so the app downloads them from the laptop. |
