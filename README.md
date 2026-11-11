# nicolasgarcIA

Interactive portfolio of Juan Nicolás García, full-stack engineer (AI & Web3) from Bucaramanga, Colombia.

- A low-poly laptop, generated with a Blender Python script, comes apart piece by piece as you scroll. Each piece maps to a section.
- On the screen piece, screenshots of real systems disintegrate into the code behind them.
- At the end the laptop boots **nicOS**, a tiny desktop with a working terminal. Press `Ctrl + K` (or `⌘K`) anywhere.
- English at `/`, Spanish at `/es/`.

## Stack

Vite + TypeScript (no framework), three.js, GSAP ScrollTrigger, Lenis. Static HTML is generated at build time, so all content works without JavaScript; the 3D scene, the particle effect and nicOS are lazy-loaded.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
npm run modelo   # rebuild the 3D model from blender/laptop.py (needs Blender)
```
