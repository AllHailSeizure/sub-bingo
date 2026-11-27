# LLMPhysics Bingo

**Turn everyday subreddit chaos into a live 5×5 bingo game—cards fill themselves as the community posts, argues, and moderates.**

Built for communities like [r/LLMPhysics](https://reddit.com/r/LLMPhysics), where the discourse has its own recurring patterns. This is a [Devvit](https://developers.reddit.com/docs) app (**`llmphysics-bingo`**, version **1.0.0**).

<!-- SCREENSHOT: Splash screen with the LLMPhysics Bingo logo and the blue “Get your card now!” button -->
> 📸 Screenshot coming soon: Splash screen with logo and “Get your card now!”

<!-- SCREENSHOT: Expanded bingo board showing marked tiles, the center FREE square, and a winning row highlighted -->
> 📸 Screenshot coming soon: Full 5×5 card with marked tiles and a winning line

---

## What you get

- **Your own card** — Every player who opens the bingo post gets a unique 5×5 board (24 random tiles plus a free center square).
- **Automatic marking** — Tiles turn on when real things happen in the subreddit (new posts, comments, reports, mod actions). No manual checking.
- **Fair play** — If *you* caused the event that would mark a tile, that square does not count toward your win until someone else triggers the same tile too.
- **Two ways to win** — Complete any row, column, or diagonal for **Bingo**, or mark every square for **Full Card**.
- **Public shout-outs** — The app posts winner comments on the game thread using customizable messages.
- **Mod dashboard** — Settings, live stats, tile testing, and a 7-day historical simulation—all inside the game post (gear icon), not a separate Reddit settings page.

**Legal:** [Terms of Service](https://allhailseizure.github.io/sub-bingo/terms/) · [Privacy Policy](https://allhailseizure.github.io/sub-bingo/privacy/)

---

## Install on your subreddit

1. Install the Devvit app **`llmphysics-bingo`** on the subreddit where you want bingo to run. Use Reddit’s current Devvit installation flow ([developer documentation](https://developers.reddit.com/docs)).
2. The app needs **moderator**-level access (it watches posts, comments, reports, and mod actions, and can post winner comments).
3. After installation, moderators can start a round from the subreddit menu (below).

There are **no chat commands** for players or mods—everything runs through the bingo post UI and the **Create Bingo Post** menu action.

---

## Start a game (moderators)

1. Open your subreddit as a moderator.
2. Open the subreddit **⋮** menu and choose **Create Bingo Post** (*“Manually create this week's bingo post.”*).
3. Reddit creates a custom post titled **LLMPhysics Bingo!** That post is the game hub.
4. Share the post with the community. Game data is kept for about **8 days** from when the round starts.

---

## Play (everyone)

1. Open the **LLMPhysics Bingo!** post.
2. Tap **Get your card now!** on the splash screen to open the full board.
3. Watch squares light up as matching events happen anywhere in the subreddit (not only on the bingo thread).
4. **Tap any tile** (except FREE) to read its short flavor text and what it’s watching for.
5. Your card refreshes about every **30 seconds**. If you complete a line, you’ll see a **🎉 BINGO! 🎉** toast in the client.
6. Winners are also announced in **comments** on the game post (first bingo, later bingos, and full-card wins use different templates mods can edit).

### How wins work

| Goal | Rule |
|------|------|
| **Bingo** | Any complete **row**, **column**, or **diagonal** of marked tiles (center **FREE** always counts). |
| **Full card** | All **25** squares marked (again, tiles you alone triggered don’t count until the community also triggers them). |

The app checks for new marks and winners on a schedule (**once per hour**). Marks can lag real activity by up to about an hour unless a moderator runs validation early from the mod panel.

---

## Moderator tools (inside the bingo post)

Moderators see a **gear** button on the board. It opens a panel with four tabs:

### Settings

- Edit **First winner message**, **Bingo message**, and **Full card message** (`{userId}` is replaced with the winner’s username).
- **Save** — stores messages for future announcements.
- **Run batch validation now** — immediately re-checks all tiles and announces any new winners (same work the hourly job does).

Default announcement text (if you never change it):

```text
🎉 **FIRST BINGO!** Congrats to u/{userId} for being the first to win!
✅ Bingo! u/{userId} got five in a row!
⭐ FULL CARD! u/{userId} marked all 25 tiles! Incredible!
```

### Stats

- **Pacing verdict** and rough time-to-bingo estimates (median, p10, p90, % never bingo).
- Per-tile table: first time each tile fired in this game and who was attributed (when applicable).

### Testing

Private sandbox for your mod account only—**does not change the live game**.

1. Choose **Post** or **Comment** and paste a Reddit thing ID (`t3_…` for posts, `t1_…` for comments) from **this subreddit only**.
2. **Add to test batch** — pulls real content into your batch.
3. **Run validation** — shows which tiles would trigger.
4. **Clear** — empties your batch.

### Sim

- Fetches **7 days** of real subreddit posts and comments, then runs **5,000** simulated cards to estimate how fast games finish.
- **Start 7-day fetch** / resume / reset controls; optional **Graph** and **Tiles** views when data is ready.
- Cached simulation lasts about **48 hours**, then you can re-fetch.

---

## What the app listens for

These run automatically in the background (you don’t configure them):

| Source | Used for |
|--------|----------|
| New posts | Keyword and behavior tiles tied to post titles/bodies |
| New comments | Comment-pattern tiles |
| Post & comment reports | Report-related patterns |
| Mod actions | Tiles such as mass comment removal |

Tile text on your card comes from a pool of **33** community-themed squares—for example posts mentioning “coherence” or “Hubble tension,” comment wars, em-dash excess, Lean 4 proofs, XKCD 3155 citations, and moderation rampages. Each game draws **24** of them at random plus **FREE**.

---

## License

This project is licensed under the **MIT License** (Copyright © 2026 Nate Bosma). See [LICENSE](LICENSE) for the full text.