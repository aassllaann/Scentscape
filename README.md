# Scentscape

AI-assisted sensory visualization interface for exploring perfume data through fragrance families, note structure, sillage, mood, and generative visual interpretation.

[English](README.md) | [中文](README.zh-CN.md)

<!-- Preview image / GIF placeholder: add the final interface screenshot or short interaction GIF here after visual review. -->

## Overview

Scentscape is an experimental creative-technology prototype that turns a large perfume dataset into an interactive olfactory atlas. It helps users browse scent families, search individual fragrances, inspect note composition, and translate scent profiles into visual language.

The project is designed for fragrance enthusiasts, creative-technology reviewers, and applied AI / interaction design portfolios. Instead of treating perfume data as a static catalog, Scentscape frames each fragrance as a layered sensory system: family, subfamily, top/heart/base notes, mood scores, intensity over time, and an optional AI-generated synesthetic visual concept.

## My Role

- Designed the product concept, information architecture, and visual direction for an olfactory data interface.
- Built the Next.js / TypeScript frontend, including the fragrance wheel, search flow, detail panel, mood canvas, and sillage timeline.
- Structured and transformed fragrance data into family, subfamily, mood, note-stage, and intensity fields for interactive exploration.
- Implemented AI-assisted visualization routes that convert perfume profiles into JSON visual concepts and p5.js generative sketch code.
- Used AI coding assistance as workflow support while keeping product direction, interaction decisions, data interpretation, and final implementation review under my ownership.

## Key Features

- **Interactive fragrance wheel:** D3 renders 9 fragrance families and their subfamilies as a radial atlas, with hover previews and click-based filtering.
- **Searchable perfume index:** users can search by perfume or brand name and jump directly into a fragrance detail view.
- **Family and subfamily browsing:** the side panel lists matching perfumes, preserves total result counts, and limits long lists for scanability.
- **Perfume detail panel:** each fragrance shows brand, year, gender, subfamily, mood scores, note structure, and optional description.
- **Sillage timeline:** a slider and intensity curve reveal how top, heart, and base notes change across the perfume's perceived duration.
- **Mood-responsive canvas:** the page background shifts by fragrance visual parameters such as warmth, density, color, and texture.
- **AI synesthetic vision:** DeepSeek-powered API routes generate a visual concept and sanitized p5.js sketch prompt path from the selected perfume's scent profile.
- **Local data pipeline:** scripts convert Fragrantica-style CSV/XLSX source data into a normalized JSON dataset for the app.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, custom CSS variables, `next/font`
- **Visualization:** D3.js, p5.js
- **Motion:** Framer Motion
- **AI:** DeepSeek chat completions for visual concept generation and generative sketch planning
- **Data:** JSON fragrance dataset, CSV/XLSX transformation scripts

## Architecture / Workflow

```text
User opens Scentscape
        |
        v
FragranceWheel renders family / subfamily atlas
        |
        +--> SearchBar queries /api/perfumes?q=
        |
        +--> Family click queries /api/perfumes?family=
        |
        +--> Subfamily click queries /api/perfumes?subfamily=
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

- `app/page.tsx`: main two-panel application layout.
- `components/FragranceWheel/`: D3 radial fragrance-family visualization.
- `components/PerfumeDetail/`: family lists, subfamily lists, perfume profile, mood bars, and AI visualize trigger.
- `components/SillageTimeline/`: intensity curve, time slider, and note-stage cards.
- `components/MoodCanvas/`: ambient background system driven by fragrance visual parameters.
- `app/api/perfumes/route.ts`: search, family, and subfamily perfume API.
- `app/api/visualize/`: AI concept and p5.js render-generation routes.
- `data/perfumes.json`: normalized perfume dataset used by the app.
- `scripts/import-fragrantica.mjs`: CSV-to-JSON transformation workflow.

## Results

- Normalized **37,923 perfume records** for interactive search and family exploration.
- Implemented a 9-family olfactory taxonomy with subfamily filtering and hover previews.
- Built a working prototype that combines data visualization, sensory interaction, and AI-assisted generative-art planning.
- Kept the AI visual layer optional and cached on the client, so the core browsing experience remains usable without repeatedly regenerating concepts.

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
npm run build
```

To use the AI visualization routes, configure:

```bash
DEEPSEEK_API_KEY=your_api_key
```

## Data Notes

The fragrance dataset is derived from local CSV/XLSX source material and transformed into app-ready JSON. Family, subfamily, mood, and intensity fields are heuristic classifications based on note keywords and should be treated as exploratory interface metadata rather than official perfumery taxonomy.

Some records have richer note-stage data than others. When top, heart, and base notes are unavailable, the app falls back to a flatter note presentation.

## Current Status

- Implemented: fragrance wheel, search, family/subfamily browsing, perfume detail panel, mood canvas, sillage timeline, AI concept route, AI render route, and data import workflow.
- Pending: final GitHub screenshot/GIF, public deployment link, mobile layout pass, and final data-source attribution polish before a fully public portfolio release.

## Repository Packaging Notes

Suggested GitHub About description:

```text
AI-assisted sensory visualization interface for exploring perfume data through scent families, notes, sillage, and generative visuals.
```

Suggested GitHub topics:

```text
creative-technology, human-ai-interaction, data-visualization, interactive-visualization, generative-ai, nextjs, typescript, d3, p5js
```

Suggested LinkedIn Featured title:

```text
Scentscape - AI-Assisted Sensory Visualization Interface
```

Suggested LinkedIn Featured description:

```text
Built an interactive perfume-data interface that combines fragrance-family visualization, note-stage exploration, sillage timelines, and AI-assisted generative visual concepts.
```
