# Two Free

A Mario-like treasure digging game where you collect treasures to gain energy, which helps you move more quickly.

The game is set in a war-torn environment where you need to dig for treasures while avoiding incoming missile attacks. You can hide underground to be safe from missiles!

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

ISC 