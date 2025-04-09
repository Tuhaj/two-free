# Two Free

[Play the game](https://twofree.tuhaj.pl/)

In a world torn apart by war, you are one of the two remaining free robots. Your mission is to collect precious energy diamonds deep underground while avoiding deadly missile strikes from above.

## Game Features

- Collect energy diamonds to power your movement
- Hide underground to escape missile attacks
- Progress through increasingly difficult levels
- Collect achievements as you play
- Touch controls for mobile devices
- Background music (press speaker button twice to enable)

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

- **Arrow Keys** - Move left/right and jump
- **Down Arrow** - Dig underground
- **⚡ Fire Button** - Shoots energy blast (consumes energy points)
- **🔊 Speaker Button** - Press twice to enable background music
- **⏸️ Pause Button** - Pause the game
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

## Credits

Developed at [WarsawJS Cursor AI Jam](https://jam.warsawjs.com/)  
Game idea by Leon 2025
