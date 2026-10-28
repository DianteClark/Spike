# Hoshizora Spike

An anime volleyball coach sim in a single HTML file. You coach Hoshizora High against Tetsuheki Academy's Iron Wall in the Spring Nationals quarterfinal.

**Play it:** https://dianteclark.github.io/Spike/

## How it plays

- **Pick a play style** in the locker room: offense (Tempo, Power, Spread), serve (Float, Balanced, Jump) and defense (Read, Commit, Scramble). Every player likes or dislikes each option, and **cohesion** shows how well the roster buys in.
- **Watch the match.** Every rally is simulated from player ratings, real heights and reaches, rotations, the libero and fatigue.
- **Huddles** are the only time you can change your style: your timeouts (button or `T`, two per set), Tetsuheki's timeouts, and between sets.
- **Tap any player** for a live scouting card: ratings, height and reach, Spirit, style fit and match stats. The score bug shows a live win probability.
- **Breakout moments.** Each player charges a personal Spirit ring from their own plays and catches fire when their skill is stocked. A breakout that wins the point puts that player **in the Zone**. Team skills run off the shared Bond meter.
- **Instant replays** for long rallies and skill chains, color commentary in the ticker, and a post-match MVP card with a top-3 highlight reel. `Space` pauses or skips a replay.

## Rules

The simulation follows indoor volleyball rules:

- Rally scoring. Sets to 25, deciding set to 15, win by two. Best of 1, 3 or 5.
- Teams change courts every set, and at 8 points in the deciding set.
- Rotation on every side-out. At the serve, both teams must be in legal rotational order (no overlap faults).
- Three contacts per side; a block touch doesn't count. No player plays the ball twice in a row.
- Back-row players can't block, and back-row attacks are taken from behind the 3 m line.
- The libero plays only in the back row and never serves, attacks or blocks. A libero who sets does it from behind the 3 m line, so teammates can attack above the net.
- Players never cross the plane of the net.
- Whistled faults: service errors, foot faults, ball-handling (double contact), net touches and center-line violations. A serve that clips the net tape and goes over stays in play.
- Two timeouts per team per set.

## Run locally

Open `index.html` in any modern browser. There is no build step and no dependencies beyond Google Fonts.
