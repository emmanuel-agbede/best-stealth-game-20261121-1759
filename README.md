# best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/emmanuel-agbede/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/emmanuel-agbede/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Lamplight** — a top-down stealth game about robbing a museum after hours. Slip past the wardens' swinging lamplight, use crates and pillars as cover, steal the Star Sapphire on each of three floors, and reach the exit unseen. Wardens patrol learnable loops, investigate noises and glimpses, and chase when the shared alarm meter fills — but break line of sight and suspicion fades. Your footsteps carry (watch the ring around the thief); sneaking is slow and near silent. All sound is synthesized live with WebAudio — a warden's round can be heard coming. No build step, no libraries, no network: plain static files and a canvas.

## Run it

```sh
python3 -m http.server 8080 --directory game
# then open http://localhost:8080 in a desktop browser
# Move: WASD or arrow keys · Sneak: hold Shift · Restart floor: R · Pause: P · Mute: M

# Hand the entry in (writes game/, screenshots/ and dossier.json to the output):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=eg1d3bmd&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
