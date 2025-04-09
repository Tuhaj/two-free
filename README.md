# Two Free

A Mario-like treasure digging game where you collect treasures to gain energy, which helps you move more quickly.

The game is set in a war-torn environment where you need to dig for treasures while avoiding incoming missile attacks. You can hide underground to be safe from missiles!

## SEO & Social Media

Add the following meta tags to your HTML `<head>` section for better SEO and social media sharing:

```html
<!-- Primary Meta Tags -->
<title>Two Free - Treasure Digging Adventure Game</title>
<meta name="title" content="Two Free - Treasure Digging Adventure Game">
<meta name="description" content="A Mario-like treasure digging game where you collect treasures and avoid missiles in a war-torn environment. Dig underground to stay safe!">
<meta name="keywords" content="game, treasure hunting, arcade game, browser game, HTML5 game, indie game, missile dodge, digging game">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="Two Free - Treasure Digging Adventure Game">
<meta property="og:description" content="Dig for treasures, avoid missiles, and collect energy in this exciting browser-based adventure game!">
<meta property="og:image" content="two-free.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="Two Free - Treasure Digging Adventure Game">
<meta property="twitter:description" content="Dig for treasures, avoid missiles, and collect energy in this exciting browser-based adventure game!">
<meta property="twitter:image" content="two-free.png">

<!-- Mobile Specific -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="https://your-game-url.com">

<!-- Mobile og:image -->
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="alternate" media="only screen and (max-width: 640px)" href="two-free-mobile.png">
```

## Game Features

- Dig for treasures to gain energy and progress
- Avoid missiles by hiding underground 
- Progress through increasingly difficult levels
- Collect achievements as you play
- Touch controls for mobile play

## Project Structure

The game has been modularized using ES6 modules:

- **main.js** – Initializes the game and coordinates modules
- **player.js** – Handles player logic, movement, and collisions
- **world.js** – Terrain generation & collision detection
- **ui.js** – Updates DOM elements (energy, diamonds, achievements)
- **controls.js** – Keyboard and touch input handling
- **renderer.js** – Drawing functions for game elements
- **achievements.js** – Achievement system and tracking
- **missiles.js** – War background and missile attack system
- **effects.js** – Visual effects like particles and explosions
- **constants.js** – Game settings and constants

## Development

The game uses Vite as a build tool for modern JavaScript development.

### Requirements

- Node.js 14 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/two-free.git
cd two-free

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## Controls

- **Arrow Keys / WASD** - Move left/right and jump
- **Down Arrow / S** - Dig
- **P / ESC** - Pause game
- **Touch Controls** - Available on mobile devices

## License

This project is licensed under the ISC License - see [ISC License](https://www.isc.org/licenses/) for details.

```text
Copyright © 2025

Permission to use, copy, modify, and/or distribute this software for any purpose 
with or without fee is hereby granted, provided that the above copyright notice 
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO 
THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. 
IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR 
CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA 
OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS 
ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS 
SOFTWARE.
``` 