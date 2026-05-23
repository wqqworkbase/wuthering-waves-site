# 🌊 Wuthering Waves Resource Hub

An anime-aesthetic, high-performance information hub for Wuthering Waves players. Built as a **zero-dependency static site** — just HTML, CSS, and vanilla JS. No npm, no build step needed.

## Features

- 🌊 **Hero Scroll Animation** — 5-slide Ken Burns crossfade, star particle canvas, parallax scroll
- 📅 **Real-time Event Countdown** — Live countdown timers, active/upcoming tab switch
- 🎭 **Character Codex** — Multi-filter grid (element × weapon × rarity), Cmd+K search
- 📰 **News & Guides** — Categorized articles with glassmorphism cards
- 🎨 **Anime Aesthetic** — Dark sci-fi theme, cyan/purple accents, glassmorphism throughout
- 📱 **Fully Responsive** — Mobile nav, touch-friendly, all breakpoints covered
- 📢 **AdSense Ready** — Pre-configured ad slots (replace placeholder in HTML)
- ⚡ **Zero Dependencies** — Works directly in browser, no server needed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| HTML | Semantic HTML5 |
| CSS | Custom CSS with variables, animations, glassmorphism |
| JS | Vanilla ES modules (no build, no npm) |
| Smooth Scroll | Lenis (CDN, ~5KB) |
| Fonts | Google Fonts: Orbitron + Rajdhani + Inter |
| Deployment | GitHub Pages (free) |

## Quick Start (Zero Setup)

Open any HTML file directly in your browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

That's it. No `npm install`, no build, no server.

## Deployment to GitHub Pages (Free)

1. **Push to GitHub**
   ```bash
   cd ~/development/wuthering-waves-site
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create wuthering-waves-site --public --push
   ```

2. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Source: Deploy from a branch → `main` → `/ (root)`
   - Save. Your site goes live at `https://yourusername.github.io/wuthering-waves-site`

3. **Custom Domain** (optional)
   - Add `wutheringwaves.info` in Settings → Pages → Custom Domain
   - Point your domain's DNS to GitHub Pages

## Adding Real Wallpaper Images

Currently the hero uses gradient placeholders. Replace them with real images:

1. Download 5 Wuthering Waves official wallpapers
2. Put them in `assets/` folder (e.g., `assets/bg1.jpg`)
3. In `js/app.js`, find the `WALLPAPERS` array and replace the gradient strings with image URLs:

```js
const WALLPAPERS = [
  { src: 'assets/bg1.jpg', alt: 'Hero 1' },
  { src: 'assets/bg2.jpg', alt: 'Hero 2' },
  // ...
];
```

4. In `js/app.js`, update `initHeroSlides()` to use the `src` property:
```js
slide.style.backgroundImage = `url(${wp.src})`;
slide.style.backgroundSize = 'cover';
```

## Content Management

### Notion CMS (optional)

Create a Notion database with pages for each article, then use the wiki scraper:

```bash
# Dry run
node scripts/wiki-scraper.js

# Sync to Notion
NOTION_API_KEY=secret_xxx NOTION_DATABASE_ID=xxx node scripts/wiki-scraper.js --sync
```

### Manual Updates

Edit the HTML files directly — everything is static. To update events, edit the dates in `data-countdown` attributes and the event data in `events.html`.

## Adding Google AdSense

1. Apply at [google.com/adsense](https://www.google.com/adsense)
2. Get your **AdSense Client ID** (e.g., `ca-pub-xxxxxxxxxx`)
3. Replace in each HTML file's `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
  crossorigin="anonymous"></script>
```
4. Replace the placeholder `<div class="ad-banner">` divs with your real ad unit code.

## Project Structure

```
wuthering-waves-site/
├── index.html          # Home (hero + active events + chars + news)
├── characters.html     # Character codex with filters
├── events.html         # Event/banner tracker with countdown
├── news.html           # News feed
├── guides.html         # Guide articles
├── css/
│   └── style.css       # All styles (glassmorphism, animations, responsive)
├── js/
│   └── app.js          # Lenis, hero, countdown, filters, mobile nav
├── scripts/
│   └── wiki-scraper.js # Fetches wiki → Notion
├── assets/             # (add your wallpaper images here)
└── .env.example        # Environment variable template
```

## Domain Recommendation

- `wutheringwaves.info` — fits the suggested domain
- `.gg`, `.ggame`, `.hub` — also strong options
- GitHub Pages: free `*.github.io` subdomain

---

*Unofficial fan project. Not affiliated with Kuro Games or Nexon.*
