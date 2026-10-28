# Hoshizora Spike

An anime volleyball coach sim in a single HTML file. You coach Hoshizora High through the Spring Nationals bracket against three rival schools, each with its own identity.

**Play it:** https://dianteclark.github.io/Spike/

## How it plays

- **Season or exhibition.** The season runs the bracket: quarterfinal vs **Tetsuheki Academy** (the Iron Wall: a commit block and a 95 blocker), semifinal vs **Kazehaya Tech** (small and fast: quicks off every pass, a 95 libero, man-up defense), final vs **Raijin Gakuen** (every server a weapon: two jump servers above 90). Lose and the run restarts; win the final and you are champions. Exhibition lets you pick any school. Each school has its own roster, colors, court crest, skills and default tactics.
- **Set your tactics** in the locker room, across six axes. Play style: offense (Tempo, Power, Spread), serve (Float, Balanced, Jump) and block (Read, Commit, Swing). Formations: offensive system (5-1, 6-2, 4-2), serve receive (2-, 3-, 4- or 5-person W) and defense (Perimeter, Rotation, Man-up). Every player likes or dislikes each option, and **cohesion** shows how well the roster buys in. A live court diagram shows exactly where everyone stands in receive and on defense.
- **Formations change the game.** In a 6-2 the back-row setter sets, so three hitters attack in every rotation, but the second setter has to be able to set (bring Aoi off the bench). A 4-2 forgives bad passes and adds setter dumps with only two hitters. More passers close the seams against tough servers, while servers hunt the weakest passer. Man-up eats tips and dumps but gives up deep shots, and hitters adjust to what they see.
- **Watch the match.** Every rally is simulated from player ratings, real heights and reaches, rotations, the libero and fatigue.
- **Huddles** are the only time you can change tactics: your timeouts (button or `T`, two per set), Tetsuheki's timeouts, and between sets. Every huddle has three tabs:
  - **Tactics:** the six axes and the formation preview.
  - **Lineup:** fit per player and live stamina, plus a two-player bench per team. Six substitutions per set under real re-entry rules: a starter can leave once and come back once, only for their replacement. Lineup changes between sets are free.
  - **Scouting:** a report built from the match data (their attack tendencies and efficiency, where their kills land, passing under serve, block stuffs, hot and cold hitters, tired legs), each with a one-tap suggestion, plus a point-by-point **momentum chart** marking runs, timeouts, breakouts, subs and tactic changes.
- **Rotation-specific receive.** Step through all six rotations in the court preview and give any rotation its own receive pattern.
- **Serve aim.** Hunt the weakest passer (default), serve the seams (more pressure, more errors), make their ace pass, or pick a passer by name.
- **Quick huddle.** Timeouts open a one-screen board: the two biggest reads, tired legs and the six choices. "Full board" opens everything.
- **Compare before you commit.** Hover or focus an option to see the cohesion change, what it does on court and which players love or hate it. After a change, the line shows what moved since the huddle opened.
- **Presets.** Three built-in plans plus up to six of your own, saved by name.
- **Tactics you can see.** When a tactic decides a moment, a broadcast tag calls it ("Man-up dig", "Swing block", "Seam ace", "6-2: three hitters") and the scouting report counts them. Receive formations flash as ghost rings before each serve, and rival tactic changes get a "Tactical change" graphic.
- **Broadcast juice.** Tired players move slower, jump lower, land heavier and sweat; substitutions show number paddles. The crowd follows momentum, the arena warms up during long rallies, and a 5-0 run gets a split screen of both benches. Big blocks zoom in on the hands at the tape, loose balls turn into jousts, full-stretch digs get a slow-motion dig cam, and set point quiets the arena with a heartbeat on the score bug before the release.
- **Live stat strip** (Stats button): hitting, passing and side-out for both teams this set, plus your point margin in each rotation.
- **Real movement.** Hitters load and take an explosive approach, decoys fake, the setter and back row cover the hitter, blockers read or commit by scheme, and defenders react a beat late.
- **Your setup is remembered** in this browser: tactics, per-rotation receive, serve aim, presets, starting six, season progress, mode, level, format and speed.
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
- Loose balls above the net become jousts between one front-row player from each side.
- Two timeouts per team per set. Six substitutions per set with standard re-entry rules; libero replacements don't count.
- In serve receive the setter can hide behind a front-row teammate, and every receive pattern is checked against the overlap rule.

## Run locally

Open `index.html` in any modern browser. There is no build step and no dependencies beyond Google Fonts.

## Tests

`tests/run.cjs` is a headless test suite (Node + Playwright) that runs on every push through GitHub Actions:

- **Rules:** sixty simulated sets against all three schools with random tactics, serve aims, per-rotation receive and mid-set substitutions on both sides, checked against the rules above (rotation, overlap, libero, back-row, contacts, sides). It also checks that kill and sideout rates stay realistic.
- **Formations:** every rotation × system × receive pattern × lineup variant, for Hoshizora and all three rivals, is overlap-legal at the serve, and defenders never stack.
- **Substitutions:** the 6-per-set and re-entry rules.
- **Live:** a full match in a real browser at desktop and phone sizes, clicking through every huddle (quick board and full board). No script errors, nobody crosses the net, and the page never scrolls.

```
npm install --no-save playwright && npx playwright install chromium
node tests/run.cjs index.html          # add --quick for a shorter run
```
