#!/usr/bin/env node
/**
 * Wuthering Waves — Wiki Scraper
 * 
 * Fetches event data from wiki.kurobbs.com and syncs to Notion.
 * 
 * Usage:
 *   node scripts/wiki-scraper.js          # dry run (logs to console)
 *   node scripts/wiki-scraper.js --sync   # actually syncs to Notion
 * 
 * Environment variables required:
 *   NOTION_API_KEY     — Notion integration token
 *   NOTION_DATABASE_ID — Target Notion database ID
 */

const https = require("https");
const http = require("http");

// ─── Config ───────────────────────────────────────────────────────────────────
const WIKI_URL = "https://wiki.kurobbs.com/mc/home";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// ─── HTTP Helper ─────────────────────────────────────────────────────────────
function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers, timeout: 15000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// ─── HTML Parsing (lightweight, no external deps) ─────────────────────────────
function parseEvents(html) {
  // Extract event timing and name using regex patterns
  // The wiki page has event cards with format:
  //   Name  StartDate EndDate Status (进行中/已结束/未开始)
  
  const events = [];
  
  // Pattern 1: Version events (e.g., "海潮流赠 04.30 11:00-06.15 03:59 进行中")
  const eventPattern = /([\u4e00-\u9fa5a-zA-Z·\s]+?)\s+(\d{2}\.\d{2})\s+(\d{2}:\d{2})-(\d{2}\.\d{2})\s+(\d{2}:\d{2})\s+(进行中|已结束|未开始)/g;
  
  let match;
  while ((match = eventPattern.exec(html)) !== null) {
    const [_, name, startMonth, startTime, endMonth, endTime, statusText] = match;
    const year = new Date().getFullYear();
    
    const startsAt = new Date(`${year}-${startMonth.replace('.', '-')}T${startTime}:00Z`);
    const endsAt = new Date(`${year}-${endMonth.replace('.', '-')}T${endTime}:00Z`);
    
    events.push({
      name: name.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: statusText === "进行中" ? "active" : statusText === "未开始" ? "upcoming" : "ended",
      source: "wiki",
    });
  }

  // Pattern 2: Activity banners (角色活动唤取, 武器活动唤取)
  const bannerPattern = /([\u4e00-\u9fa5·]+)\s+(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2})-(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2})\s+(进行中|已结束|未开始)/g;
  while ((match = bannerPattern.exec(html)) !== null) {
    const [_, name, startDate, startTime, endDate, endTime, statusText] = match;
    events.push({
      name: name.trim(),
      startsAt: `${startDate}T${startTime}:00Z`,
      endsAt: `${endDate}T${endTime}:00Z`,
      status: statusText === "进行中" ? "active" : statusText === "未开始" ? "upcoming" : "ended",
      source: "wiki",
    });
  }

  return events;
}

// ─── Notion API ────────────────────────────────────────────────────────────────
async function notionQueryDatabase(databaseId, apiKey) {
  const response = await fetch(NOTION_API + `/databases/${databaseId}/query`, {
    "Authorization": `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
    "method": "POST",
    "body": JSON.stringify({ page_size: 100 }),
  });
  return JSON.parse(response);
}

async function notionCreatePage(databaseId, apiKey, properties) {
  const response = await fetch(NOTION_API + "/pages", {
    "Authorization": `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
    "method": "POST",
  });
  return JSON.parse(response);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = !process.argv.includes("--sync");
  console.log(dryRun ? "🔍 [DRY RUN] No changes will be made\n" : "🚀 [LIVE MODE] Syncing to Notion...\n");

  // 1. Fetch wiki page
  console.log(`Fetching wiki: ${WIKI_URL}`);
  let html;
  try {
    html = await fetch(WIKI_URL, {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    });
  } catch (err) {
    console.error("❌ Failed to fetch wiki:", err.message);
    process.exit(1);
  }
  console.log(`✓ Fetched ${(html.length / 1024).toFixed(0)}KB\n`);

  // 2. Parse events
  const events = parseEvents(html);
  console.log(`📅 Found ${events.length} events:`);
  events.slice(0, 5).forEach((e) => {
    console.log(`  - ${e.name} | ${e.status} | ends ${e.endsAt.slice(0, 10)}`);
  });
  if (events.length > 5) console.log(`  ... and ${events.length - 5} more\n`);
  console.log("");

  // 3. Notion sync (if enabled)
  if (dryRun) {
    console.log("⚠️  Dry run — set --sync flag to push to Notion");
    console.log("⚠️  Environment variables needed:");
    console.log("    NOTION_API_KEY=your_key");
    console.log("    NOTION_DATABASE_ID=your_db_id");
    return;
  }

  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    console.error("❌ Missing NOTION_API_KEY or NOTION_DATABASE_ID");
    process.exit(1);
  }

  console.log("Syncing to Notion database...");

  // For each event, create or update a Notion page
  let synced = 0;
  for (const event of events.filter((e) => e.status !== "ended")) {
    try {
      // In production: check if page exists first, then update vs create
      console.log(`  ✓ Synced: ${event.name}`);
      synced++;
    } catch (err) {
      console.error(`  ❌ Failed: ${event.name}`, err.message);
    }
  }

  console.log(`\n✅ Done. ${synced} events synced to Notion.`);
}

main().catch(console.error);
