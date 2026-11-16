# Tofu Delivery — Mountain Drift (v0.1 Alpha)

A small **3D, third-person, free-roam mountain drifting game** for `https://spookcoffee.github.io/Tofu-Delivery/`.

**Mount Akina**, the famous fictional pass in *Initial D*, is inspired by Mount Haruna and Gunma Route 33 in Japan. **This project is an ORIGINAL stylized mountain**, not an exact real road or an official Initial D recreation. The car is an original simple model loosely resembling a white-and-black Toyota Sprinter Trueno AE86; there are no commercial game assets, copied maps, logos, licensed music, or anime artwork in this repository.

## Features

- White/black AE86-style low-poly coupe, front-engine rear-wheel-drive arcade handling.
- Uphill and downhill road with significant 3D elevation; mountain terrain blends up to the asphalt.
- Hairpin switchbacks, guardrails, forests, rocky slopes, road lines, mountain fog.
- Drift physics with lateral slip, countersteering, handbrake and **animated tire smoke**.
- Speedometer, slip angle, altitude, score, surface indicator and accurate route minimap.
- C to change between three camera distances; separate summit/base spawn buttons.
- Touch buttons included as early mobile support; desktop keyboard is the intended Alpha input.
- No login, database or backend. GitHub Pages serves the whole project.

## Controls

| Input | Action |
| --- | --- |
| W / ↑ | Accelerate |
| S / ↓ | Brake, then reverse |
| A / ← | Steer left |
| D / → | Steer right |
| Space | Handbrake: lower rear tire grip for drifting |
| C | Cycle chase cameras |
| Start downhill | Restart at mountain summit |
| Start uphill | Restart at tofu shop base |

**Drifting tip:** Pick up speed before a corner, steer, hold Space briefly to break traction, then countersteer to control the slide. Smoke appears behind both rear wheels when sliding.

## Open in VS Code

1. Clone `https://github.com/SpookCoffee/Tofu-Delivery.git` if not already cloned.
2. Work in a **new development branch** (recommended) rather than directly on `main`:
   ```powershell
   git status
   git fetch origin
   git switch -c MountainDrift origin/main
   ```
3. Extract the project ZIP and copy **its contents** into your cloned `Tofu-Delivery` folder. Do **not** replace its `.git` directory.
4. Use **Live Server** on `index.html`, or from the repository root run:
   ```powershell
   py -m http.server 5500
   ```
   Then visit `http://localhost:5500/`.
5. The browser needs internet to download Three.js from jsDelivr when first opening the game.
6. Run the source/physics tests locally (Node.js required):
   ```powershell
   npm test
   ```
7. Once tested, push the branch:
   ```powershell
   git add .
   git commit -m "Add mountain drift game prototype"
   git push -u origin MountainDrift
   ```
8. Only merge the branch into `main` when you're ready to replace the public placeholder. If Pages deploys from `main`, your public site remains unchanged until merge.

## Project structure

```text
index.html                 Main UI and Three.js loading
assets/css/style.css       HUD, theme, controls, layout
src/main.js                Game startup and error handling
src/game/Game.js           Rendering/update loop
src/game/MountainWorld.js  Elevated roads, mountain, trees, props
src/game/trackData.js      Original route control points and width
src/game/AE86Car.js        Coupe model, movement and tilt
src/game/DriftPhysics.js   Arcade RWD steering/drifting math
src/game/TireSmoke.js      Smoke/dust particles behind rear tires
src/game/ChaseCamera.js    Three follow-camera modes
src/game/Input.js          Keyboard and touch controls
src/ui/Hud.js              Speed, slip, score and minimap
.nojekyll                  Disables Jekyll processing on GitHub Pages
tests/                     Node built-in test runner
```

## Changing the mountain

Edit `PASS_WAYPOINTS` in `src/game/trackData.js`. Each entry is `[x,z]` on a 2D map; `waypointHeight(i)` provides smoothly rising height along the route. Adjust the height function for steeper/shallower slopes. The terrain is generated to follow the new route automatically.

## Current limitations

- **Alpha arcade handling**, not physically accurate suspension, tires or gearbox.
- No exact GPS terrain; elevation is **procedural**, not imported from real-world height data.
- No traffic, race AI, multiplayer, missions, vehicle selection, audio, or collision damage yet.
- No official Toyota / Initial D branding or assets.
- Browser needs WebGL 2 and internet to fetch Three.js from CDN. For a fully offline GitHub Pages build, vendor the library in a future update.
- Intended for desktop first. Mobile controls are a starting point, not fully optimized.
