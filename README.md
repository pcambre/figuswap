# Panini FIFA World Cup 2026 StickerSwap Matcher — Web App

A professional, single-page React application designed to help sticker collectors compare their inventories with friends. It takes raw text inputs copied from tracker apps (like Figuritas or Figuri), parses the "needs" and "swaps/repeats", and outputs the exact stickers the two users can trade with each other.

The application features a modern, high-fidelity **Obsidian Dark Theme** complete with a repeating node network pattern, floating glassmorphic summaries, dynamic list-updating exports, and print-ready PDF generators.

---

## Key Features

### 📦 Robust Inventory Parsing
- **Bilingual Headers**: Detects English (`I need` / `Swaps`) and Spanish (`❌ Me faltan` / `🔁 Repetidas`) headers.
- **Flexible Formats**: Parses country prefix codes, flag emojis (`MEX 🇲🇽`, `🇦🇷 ARG`), and parenthetical categories (`History (FWC)`).
- **Multiplicity Handling**: Strips multipliers like `(×2)` or `(x3)` to find unique sticker matches.
- **Categorization**: Groups and merges sub-categories like FWC histories under single headers.

### 🎨 Premium Obsidian Dark Theme
- **Deep Obsidian Surfaces**: Styled using `#08080C` obsidian tones and glassmorphic panels (`backdrop-filter`) with subtle glowing borders.
- **Geometric Network Grid**: A custom, repeating SVG grid dot pattern echoing the concept of interconnected swap nodes.
- **Vibrant Typography**: Styled using a premium grotesque/geometric pairing of **Outfit** (headers/numbers) and **DM Sans** (body text).
- **Custom Iconography**: Features inline custom SVGs for inflow (receive) and outflow (give) node connections, and a fair swap medallion emblem.

### 🔄 Interactive Selection & Summaries
- **Real-Time Recalculations**: Select or deselect individual sticker pills to tailor trades. The summary metrics ("You give", "You receive", and "Fair swap") update dynamically.
- **Outflow / Inflow Panels**: Mint-tinted column headers for giving duplicates and periwinkle-tinted headers for receiving needs.
- **Large Summary Numbers**: Main numbers pop using glowing violet `#8B5CF6` shades.

### 💾 Export & Inventory Synchronization
- **Updated Inventory Export**: Computes a new inventory list for the user after applying the selected trades (removes swaps given away and needs received).
- **Three Formats Supported**:
  - **Figuritas**: Formats the list with English headers.
  - **Figuri**: Formats the list with Spanish headers and total count indicators.
  - **JSON**: Outputs a structured raw JSON representation of the new needs/swaps arrays.
- **Copy & Download**: Users can copy the updated list to the clipboard or download it directly as a `.txt` (or `.json`) file.
- **Premium PDF Generator**: Generates print-ready A4 PDFs grouping trades by country.

---

## Technical Stack

- **Framework**: React 19 (Functional Hooks & state management)
- **Vite Tooling**: Vite 6 bundler for fast HMR dev servers
- **Styling**: Tailwind CSS v4 (configured via index.css `@theme` directives)
- **Iconography**: Lucide React + custom inline SVGs
- **PDF Generation**: jsPDF (dynamic vector-based canvas mapping)

---

## Project Structure

```
web/
├── index.html          # HTML Entry with font preconnects & favicon.svg
├── vite.config.js      # React & Tailwind build configurations
├── package.json        # Node package configurations
├── public/
│   ├── favicon.svg     # Stylized geometric soccer network favicon
│   ├── panini-logo.png # Panini emblem asset
│   └── world-cup-logo.png # World Cup 2026 emblem asset
└── src/
    ├── main.jsx        # Mount point
    ├── index.css       # Tailwind imports, custom theme variables, scrollbars
    ├── App.jsx         # Layout container & parsing coordinator
    ├── utils/
    │   └── matcherUtils.js  # Utility scripts (matching, inventory updates, PDF)
    └── components/
        ├── TextAreaInput.jsx    # Labeled text area components
        ├── CompareButton.jsx    # Glowing violet primary compare CTA
        ├── ResultsContainer.jsx # Floating summary cards & export panels
        ├── TradeResultList.jsx  # Interactive country-grouped lists
        └── EmptyState.jsx       # Fallback layout for zero-matches
```

---

## How to Run

### Installation
Run this command in the project directory to install dependencies:
```bash
npm install --prefer-offline
```

### Run Locally
To spin up the local development server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Build Production Assets
To compile production-ready assets:
```bash
npm run build
```
The compiled, static site will be generated under `dist/`.

---

## AI Pair Programming Attribution

This project was built, redesigned, and finalized in pair programming with AI agents using the following system configurations:
- **Large Language Models**: Google **Gemini 3.5 Flash** (High-speed UI iteration and exports) & Anthropic **Claude Opus 4.6** (Scaffolding and theme redesign planning).
- **Orchestration**: Orchestrated using the **Antigravity** developer agent SDK.
