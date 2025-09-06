# 🌀 Simple Random Maze Runner (SRMR) — Web PC Edition

A browser-based maze game built with HTML5 Canvas, JavaScript, and CSS—featuring both single-player and two-player modes, persistent level progress, a leaderboard, and a responsive layout.

##  Table of Contents
- [Live Demo](#live-demo)
- [Features](#features)
- [How to Use](#how-to-use)
- [Developer Notes](#developer-notes)
- [Contributing](#contributing)
- [License](#license)

---

##  Live Demo  
You can play the game directly via GitHub Pages:  https://0PKunal.github.io/srmr/

---

##  Features

- **Single & Two-Player Modes** with on-canvas controls:
  - Player 1: Arrow keys  
  - Player 2: WASD keys

- **Persisted Progress** using `localStorage`:
  - Stores current level, unlocked levels, random seeds per level, and top leaderboard scores.

- **Maze Generation**:
  - Each level's layout is deterministically seeded and reproducible.

- **Responsive Canvas**:
  - Canvas and maze scale dynamically to fit the viewport across devices, maintaining centered alignment.

- **Simple Interface**:
  - Select levels, view leaderboard, restart, and reset progress—all with intuitive controls.

---

##  How to Use

### 1. Clone or Download the Repo
```bash
git clone https://github.com/0PKunal/srmr.git
````

### 2. File Structure

* `index.html` – The main game page (should reference the CSS & JS correctly).
* `rmr.css` — Stylesheet for layout, panels, and responsive design.
* `rmr.js` — Core game logic, including maze generation, rendering, controls, and persistence.

### 3. Run Locally

Open `index.html` in your browser (preferably Chrome or Firefox) and enjoy the game instantly.

---

## Developer Notes

* All maze levels are seeded and stored—no repetition unless cleared.
* The **Creator** link (top-right) points to my GitHub and remains always visible.
* Clearing progress resets levels and leaderboard through a modal confirmation.
* Code is segmented across:

  * `index.html` — markup
  * `rmr.css` — UI styling
  * `rmr.js` — game logic and interaction

---

## Contributing

Feel free to fork, suggest improvements, or make enhancements! Some ideas:

* Add sound effects
* Improve layout for mobile
* Add themes or difficulty adjustments
* Refactor for TypeScript or modular design

---
## License
This project is shared under a simple custom license:  
- Feel free to play and share the game.  
- A little shout-out to [0PKunal](https://github.com/0PKunal/) is appreciated.  
- If you’d like to change or reuse the code, just ask first.
---
<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/0PKunal">0PKunal</a></p>
  <p>If this project helped you, please give it a ⭐️</p>
</div>
