# Low Entropy Wordle

A daily word-guessing game based on [Wordle](https://www.nytimes.com/games/wordle/index.html), built for **competitive play among friends**.

🎮 **Play it live:** [wordle.edeliverables.com](https://wordle.edeliverables.com)

![Low Entropy Wordle screenshot](docs/screenshot.png)

## Why this exists

This game was designed for **friend groups and tournaments** where everyone solves the same daily puzzle and wants to know who truly played best.

The standard Wordle only tells you how many guesses you used. That works fine until two (or more) players solve the puzzle in the same number of rows — then what? Who wins?

Low Entropy Wordle solves that with a **Skill Score tie-breaker**. If you and your friends all solved today's puzzle in 4 guesses, the Skill Score tells you who did it most efficiently — who found the right letters earliest, and who was just lucky on the last guess.

**The intended flow for a tournament:**
1. Everyone plays the same daily puzzle independently
2. Compare number of guesses first — fewest wins
3. If tied on guesses, compare Skill Scores — **highest wins**
4. If still tied on Skill Score, compare Time — **fastest wins**
5. Share your results using the built-in Share button, which includes your Skill Score and Time

## What makes it different?

Every day you start with a **free clue** — a pre-filled word that shares at least one letter with the answer. Use it wisely to guide your guesses.

At the end of each row you can see a **"X left"** badge to the right of the board — the number of valid words still consistent with all clues revealed so far. Watch the search space collapse toward 1 as you zero in on the answer.

At the end of the game you receive a **Skill Score** that measures how efficiently you identified letters across your guesses, and a **Time** showing how long the puzzle took you. Both are included in the shareable result.

---

## The Skill Score Algorithm

This is the defining feature of Low Entropy Wordle. Here's exactly how it works.

### The core idea

Each of your guesses is scored based on **how many letters you found** and **how early you found them**. Finding letters sooner is worth more than finding them later — because a skilled player squeezes as much information as possible out of every guess.

### Letter point values

Each tile in your guess contributes points:

| Tile | Meaning | Points |
|------|---------|--------|
| 🟩 Green | Correct letter, correct position | **1.0** |
| 🟨 Yellow | Correct letter, wrong position | **0.5** |
| ⬛ Gray | Letter not in the word | 0 |

### Row weights

Earlier rows are worth more. The weight for each row is:

```
weight = (6 - rowIndex) / 6
```

| Row | Weight |
|-----|--------|
| Row 0 ⭐ (free clue) | 6/6 = **1.00** |
| Row 1 (your 1st guess) | 5/6 ≈ **0.83** |
| Row 2 | 4/6 ≈ **0.67** |
| Row 3 | 3/6 = **0.50** |
| Row 4 | 2/6 ≈ **0.33** |
| Row 5 | 1/6 ≈ **0.17** |

### Formula

For each row played:

```
rowScore = lettersFound × weight
```

where `lettersFound` = (number of 🟩 greens × 1.0) + (number of 🟨 yellows × 0.5).

The total Skill Score is the **sum of all row scores**:

```
skillScore = Σ (lettersFound[row] × weight[row])
```

### Worked example

Take this game (target: **RANCH**):

```
Row 0 ⭐  S C A R Y   →  ⬛🟨🟨🟨⬛   greens=0, yellows=3  →  (0 + 1.5) × 1.00 = 1.50
Row 1     Y A C H T   →  ⬛🟩🟨🟨⬛   greens=1, yellows=2  →  (1 + 1.0) × 0.83 = 1.67
Row 2     R A N C H   →  🟩🟩🟩🟩🟩   greens=5, yellows=0  →  (5 + 0.0) × 0.67 = 3.33
                                                              ──────────────────────────
                                                              Skill Score  =  6.50
```

> **Note:** Row 0 is the free pre-filled clue — its letters count toward the score even though you didn't choose the word. This reflects the head start the game gives you.

### What makes a high score?

- **Finding greens and yellows early** — heavy row weights amplify early discoveries
- **Winning in fewer guesses** — fewer rows means the remaining rows have zero weight, but the early rows carry more weight relative to those played
- **Using the free clue wisely** — Row 0 always has weight 1.0, the highest possible, so understanding what it tells you directly boosts your score

### Implementation

The algorithm lives in [`src/utils/gameLogic.js`](src/utils/gameLogic.js):

```js
export function calculateSkillScore(guesses, currentRow, gameStatus) {
  if (gameStatus === 'playing') return 0;
  const rowsUsed = gameStatus === 'won' ? currentRow : MAX_GUESSES;
  let score = 0;
  for (let row = 0; row < rowsUsed; row++) {
    const weight = (MAX_GUESSES - row) / MAX_GUESSES;
    let lettersFound = 0;
    for (let col = 0; col < WORD_LENGTH; col++) {
      const cell = guesses[row][col];
      if (cell.state === 'correct') lettersFound += 1;
      else if (cell.state === 'present') lettersFound += 0.5;
    }
    score += lettersFound * weight;
  }
  return score;
}
```

---

## Search Space Tracker

After each submitted row, a small badge appears to the right of that row showing how many words from the full 12,915-word dictionary are still **consistent with every clue revealed so far**.

### How it works

For each candidate word in the dictionary, the game simulates running every submitted guess against it and checks whether the resulting tile pattern matches what was actually shown. If it does for all guesses so far, the word is still a valid candidate. The badge shows how many candidates survive.

```
Row 0 ⭐  S C A R Y   →  ⬛🟨🟨🟨⬛    843 left
Row 1     Y A C H T   →  ⬛🟩🟨🟨⬛     12 left
Row 2     R A N C H   →  🟩🟩🟩🟩🟩      1 left  ✓
```

This gives you real-time feedback on how efficiently your guesses are eliminating possibilities — the faster you drive the count down, the sharper your play.

The full candidate calculation is also logged to the browser console on each row for debugging and analysis.

---

## Game Timer

A timer starts the moment the game loads. When you win or lose, the elapsed time is captured and displayed as `M:SS` in the result modal alongside your Skill Score.

The time is also included in the shareable text:

```
Low Entropy Wordle 2026-03-08
3/6

⬛🟨🟨🟨⬛
⬛🟩🟨🟨⬛
🟩🟩🟩🟩🟩

Tie-Breaker Score: 6.50
Time: 1:42
```

**Use time as a final tie-breaker** — if two players have the same guess count and Skill Score, the faster solve wins.

---

## How to play

- Guess the 5-letter word in 6 tries
- Row 0 is pre-filled as a free starting clue (marked with ⭐)
- After each guess, tiles reveal how close you are:
  - 🟩 **Green** — correct letter, correct position
  - 🟨 **Yellow** — correct letter, wrong position
  - ⬛ **Gray** — letter not in the word
- A new puzzle is available every day at midnight (New York time)

## Tech stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- Deployed on a Linux/Nginx server

## Local development

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
rsync -av --delete dist/ user@yourserver:/var/www/your-site/
```

## Project structure

```
src/
├── components/
│   ├── Board.jsx         # 6-row game grid
│   ├── Keyboard.jsx      # On-screen keyboard
│   ├── ResultModal.jsx   # Win/loss modal + share button (shows score & time)
│   ├── Row.jsx           # A row of 5 tiles + remaining-candidates badge
│   ├── Tile.jsx          # Single letter tile with flip animation
│   └── WordleGame.jsx    # Main game layout
├── hooks/
│   └── useWordleGame.js  # All game state logic (timer, search space tracking)
├── utils/
│   └── gameLogic.js      # Pure functions (checkGuess, scoring, RNG, search space, etc.)
└── data/
    ├── words.js          # Curated target word pool (daily puzzle answers)
    └── 5-letter-words.txt  # Full 12,915-word dictionary (valid guess universe)
```
