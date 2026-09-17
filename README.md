# Scentscape

AI-assisted sensory visualization interface for exploring perfume data through fragrance families, note structure, sillage, mood, and generative visual interpretation.

[English](README.md) | [中文](README.zh-CN.md)

![Scentscape Home landing page](public/screenshots/home-hero.png)
*Scentscape Home landing page showing project vision and total count overview of the 9 fragrance families.*

## Overview

Scentscape is an experimental creative-technology prototype that turns a large perfume dataset into an interactive olfactory atlas. A short editorial Home introduces the project; the Atlas supports family browsing, search, note inspection, and optional visual interpretation.

The project is designed for fragrance enthusiasts, creative-technology reviewers, and applied AI / interaction design portfolios. Instead of treating perfume data as a static catalog, Scentscape frames each fragrance as a layered sensory system: family, subfamily, top/heart/base notes, mood scores, intensity over time, and an optional AI-generated synesthetic visual concept.

## My Role

- Designed the product concept, information architecture, and visual direction for an olfactory data interface.
- Built the Next.js / TypeScript frontend, including the fragrance wheel, search flow, detail panel, mood canvas, and sillage timeline.
- Structured and transformed fragrance data into family, subfamily, mood, note-stage, and intensity fields for interactive exploration.
- Implemented AI-assisted visualization routes that convert perfume profiles into JSON visual concepts and p5.js generative sketch code.
- Used AI coding assistance as workflow support while keeping product direction, interaction decisions, data interpretation, and final implementation review under my ownership.

## Key Features & Component Breakdown

### 1. Interactive Fragrance Wheel & Atlas Browsing

![Atlas main interface](public/screenshots/atlas-main.png)
*Atlas main interface featuring the D3 interactive double-ring fragrance wheel, search bar, family shortcuts, and right-hand paginated perfume list.*

- **Double-ring D3 fragrance wheel:** renders 9 primary fragrance families (Oriental, Woody, Fougere, Leather, Gourmand, Citrus, Fresh, Aquatic, Floral) and subfamilies as concentric radial arcs with hover previews and pointer selection.
- **Searchable perfume index:** real-time query by perfume name or brand with instant suggestions and paginated result lists.
- **Family shortcuts & toolbar:** touch-friendly bottom shortcuts, zoom/pan controls, and viewport reset support.

---

### 2. Perfume Detail Dialog & Sillage Timeline

![Perfume detail modal](public/screenshots/perfume-detail.png)
*Perfume detail modal presenting metadata, mood character, three-tier note structure, AI vision trigger, and interactive sillage timeline.*

- **Multidimensional profile:** displays brand, release year, gender target, subfamily classification, and descriptive notes.
- **CARACTÈRE mood score matrix:** visualizes mood scores (Warmth, Freshness, Spice, Darkness, Sweetness, Floral) as relative score bars.
- **Three-tier note structure (Tête / Cœur / Fond):** explicit categorization of top, heart, and base notes with color-coded note tags.
- **Interactive sillage timeline:** slider and intensity curve allow users to scrub through time (0min -> 30min -> Heart -> Base -> 6h+) and inspect changing active note components.

---

### 3. AI Visual Generation

![AI visual generation interface - dark theme](public/screenshots/ai-vision-dark.png)
*Full-screen AI visual overlay displaying color palettes, mood labels, and generated text descriptions based on perfume components.*

![AI visual generation interface - Amber Queen](public/screenshots/ai-vision-amber.png)
*Warm-toned background interface and visual description generated for the perfume Amber Queen.*

- **AI fragrance analysis:** calls the DeepSeek model to analyze perfume notes, intensity curves, and mood scores, generating a 3-5 color palette, dominant mood labels, and bilingual text descriptions.
- **Dynamic Canvas background:** uses HTML5 Canvas with smooth animation algorithms to render gradient background graphics based on the generated palette.
- **Full-screen view & replay:** click the "VISUALISER L'ESSENCE" button to open the full-screen view, inspect color distributions, and replay the visual animation at any time.

---

### 4. Mood-Responsive Canvas

- The underlying `MoodCanvas` system smoothly adjusts ambient background colors, density, warmth, and texture (smooth, grainy, crystalline) according to the selected perfume's visual parameters.

---

### 5. Local Data Pipeline

- Data import scripts (`scripts/import-fragrantica.mjs`) normalize CSV/XLSX raw data into a clean, searchable JSON dataset of 37,923 fragrances.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, custom CSS variables, `next/font`
- **Visualization:** D3.js, p5.js
- **Motion:** Framer Motion
- **AI:** DeepSeek chat completions for visual concept generation and generative sketch planning
- **Data:** JSON fragrance dataset, CSV/XLSX transformation scripts

## Architecture / Workflow

```text
User opens Scentscape Home
        |
        v
Chooses Atlas or a fragrance family
        |
        v
FragranceWheel renders family / subfamily atlas
        |
        +--> SearchBar queries /api/perfumes?q=&offset=&limit=
        |
        +--> Family click queries /api/perfumes?family=&offset=&limit=
        |
        +--> Subfamily click queries /api/perfumes?subfamily=&offset=&limit=
        |
        v
PerfumeDetail shows notes, mood, metadata, and sillage
        |
        +--> MoodCanvas updates ambient background
        |
        +--> SillageTimeline maps intensity over time
        |
        +--> AI Visualize calls /api/visualize/concept
                 |
                 v
              /api/visualize/render prepares sanitized p5.js sketch output
```

Core project files:

- `app/page.tsx`: editorial Home and family entry points.
- `app/atlas/page.tsx`: responsive interactive olfactory atlas.
- `components/FragranceWheel/`: D3 radial fragrance-family visualization.
- `components/PerfumeDetail/`: paged family and subfamily lists, perfume profile, mood bars, and AI visualize trigger.
- `components/SillageTimeline/`: intensity curve, time slider, and note-stage cards.
- `components/MoodCanvas/`: ambient background system driven by fragrance visual parameters.
- `app/api/perfumes/route.ts`: paginated search, family, and subfamily perfume API.
- `lib/pagination.ts`: validated offset/limit pagination shared by the API.
- `app/api/visualize/`: AI concept and p5.js render-generation routes.
- `data/perfumes.json`: normalized perfume dataset used by the app.
- `scripts/import-fragrantica.mjs`: CSV-to-JSON transformation workflow.

## Results

- Normalized **37,923 perfume records** for interactive search and family exploration.
- Implemented a 9-family olfactory taxonomy with subfamily filtering, hover previews, pointer controls, and keyboard selection.
- Built a working prototype that combines data visualization, sensory interaction, responsive navigation, and AI-assisted generative-art planning.
- Kept the AI visual layer optional and cached on the client, so core browsing remains usable without AI credentials or repeated concept generation.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

Useful development commands:

```bash
npm run lint
npm run check:pagination
npm run build
```

To use the AI visualization routes, configure:

```bash
DEEPSEEK_API_KEY=your_api_key
```

## Data Notes

The fragrance dataset is derived from local CSV/XLSX source material and transformed into app-ready JSON. Family, subfamily, mood, and intensity fields are heuristic classifications based on note keywords. Treat them as exploratory interface metadata rather than official perfumery taxonomy or measured performance data.

Some records have richer note-stage data than others. When top, heart, and base notes are unavailable, the app falls back to a flatter note presentation. The timeline is an estimated evolution, not a longevity measurement; the optional AI vision is an artistic interpretation.

## Current Status

- Implemented: Home and Atlas routes, warm editorial surface system, fragrance wheel, responsive and accessible navigation, paginated search and family/subfamily browsing, perfume detail dialog, mood canvas, sillage timeline, AI concept/render routes, and data import workflow.
- Verified: lint, TypeScript, production build, focused pagination checks, and browser checks across 360px, 390px, 768px, 1280px, and 1440px viewports.
