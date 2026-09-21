import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as cheerio from "cheerio";
import matter from "gray-matter";

const ROOT = process.cwd();
const SITE = path.join(ROOT, "_site");
const errors = [];
const warnings = [];

const VALID_PROJECT_STATUS = new Set(["in-progress", "completed"]);
const VALID_PUB_STATUS = new Set(["presented", "published", "ongoing", "under-review"]);

function walk(dir, test) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, test));
    else if (test(full)) out.push(full);
  }
  return out;
}

function wordCount(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function checkFrontMatter() {
  const projectFiles = walk(path.join(ROOT, "src/content/projects"), (f) => f.endsWith(".md"));
  const pubFiles = walk(path.join(ROOT, "src/content/publications"), (f) => f.endsWith(".md"));

  for (const file of projectFiles) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    checkItem(file, parsed, "project");
  }
  for (const file of pubFiles) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    checkItem(file, parsed, "publication");
  }

  const pageFiles = ["src/about.md", "src/arts.md", "src/contact.md"].map((f) =>
    path.join(ROOT, f)
  );
  for (const file of pageFiles) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const { data } = parsed;
    for (const field of ["title", "description"]) {
      if (!data[field]) errors.push(`${file}: missing ${field}`);
    }
    checkDescription(file, data.description);
  }
}

function checkDescription(file, description) {
  const len = String(description || "").length;
  if (len < 120 || len > 160) {
    errors.push(`${file}: description is ${len} characters (need 120–160)`);
  }
}

function checkItem(file, parsed, type) {
  const { data, content } = parsed;
  const required = ["title", "description", "date"];
  if (data.hasPage === undefined) errors.push(`${file}: missing hasPage`);
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      errors.push(`${file}: missing ${field}`);
    }
  }
  checkDescription(file, data.description);
  if (type === "project") {
    if (!data.status) errors.push(`${file}: missing status`);
    else if (!VALID_PROJECT_STATUS.has(data.status)) {
      errors.push(`${file}: invalid project status ${data.status}`);
    }
  }
  if (type === "publication") {
    if (!data.status) errors.push(`${file}: missing status`);
    else if (!VALID_PUB_STATUS.has(data.status)) {
      errors.push(`${file}: invalid publication status ${data.status}`);
    }
    if (data.venue === undefined) errors.push(`${file}: missing venue`);
  }
  const words = wordCount(content);
  if (data.hasPage === true && words < 150) {
    errors.push(`${file}: hasPage true but body has ${words} words`);
  }
}

function builtPages() {
  return walk(SITE, (f) => f.endsWith(".html"));
}

function toSitePath(abs) {
  return "/" + path.relative(SITE, abs).split(path.sep).join("/");
}

function fileForHref(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean.startsWith("http") || clean.startsWith("mailto:") || clean.startsWith("tel:")) {
    return { skip: true };
  }
  let rel = clean;
  if (rel.endsWith("/")) rel += "index.html";
  else if (!path.extname(rel)) rel += "/index.html";
  const file = path.join(SITE, rel.replace(/^\//, ""));
  return { file, rel };
}

function checkHtml() {
  const titles = new Map();
  const descriptions = new Map();
  const htmlFiles = builtPages();
  if (!htmlFiles.length) {
    errors.push("No HTML files in _site/. Run npm run build first.");
    return;
  }

  const sitemapPath = path.join(SITE, "sitemap.xml");
  const robotsPath = path.join(SITE, "robots.txt");
  if (!fs.existsSync(sitemapPath)) errors.push("Missing _site/sitemap.xml");
  if (!fs.existsSync(robotsPath)) errors.push("Missing _site/robots.txt");

  let sitemapLocs = new Set();
  if (fs.existsSync(sitemapPath)) {
    const xml = fs.readFileSync(sitemapPath, "utf8");
    sitemapLocs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const robots = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, "utf8") : "";
    if (!/Sitemap:\s*https?:\/\//i.test(robots)) {
      errors.push("robots.txt does not reference an absolute sitemap URL");
    }
  }

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const $ = cheerio.load(html);
    const rel = toSitePath(file);
    const title = $("title").text().trim();
    const desc = $('meta[name="description"]').attr("content") || "";
    const canonical = $('link[rel="canonical"]').attr("href") || "";
    const robots = $('meta[name="robots"]').attr("content") || "";
    const noindex = /noindex/i.test(robots);
    const h1s = $("h1");
    const lang = $("html").attr("lang");

    if (!lang) errors.push(`${rel}: missing html lang`);
    if (h1s.length !== 1) errors.push(`${rel}: expected 1 h1, found ${h1s.length}`);
    if (title.length < 15 || title.length > 65) {
      errors.push(`${rel}: title is ${title.length} characters (need 15–65): "${title}"`);
    }
    if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`);
    else titles.set(title, rel);
    if (descriptions.has(desc)) errors.push(`${rel}: duplicate description with ${descriptions.get(desc)}`);
    else descriptions.set(desc, rel);
    if (!canonical || !/^https?:\/\//i.test(canonical)) {
      errors.push(`${rel}: canonical missing or not absolute`);
    }
    if (!$('meta[property="og:title"]').attr("content")) errors.push(`${rel}: missing og:title`);
    if (!$('meta[property="og:description"]').attr("content")) errors.push(`${rel}: missing og:description`);
    if (!$('meta[property="og:url"]').attr("content")) errors.push(`${rel}: missing og:url`);

    const jsonld = $('script[type="application/ld+json"]').first().text();
    try {
      JSON.parse(jsonld);
    } catch {
      errors.push(`${rel}: JSON-LD did not parse`);
    }

    $("img").each((_, el) => {
      const img = $(el);
      const alt = img.attr("alt");
      const decorative = img.attr("data-decorative") !== undefined;
      if (alt === undefined && !decorative) errors.push(`${rel}: img missing alt`);
      if (!img.attr("width") || !img.attr("height")) {
        errors.push(`${rel}: img missing width or height (${img.attr("src")})`);
      }
    });

    $("main a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href === "#") errors.push(`${rel}: href="#"`);
      if (/smartflowinventory\.com/i.test(href) && /\bnofollow\b/i.test($(el).attr("rel") || "")) {
        errors.push(`${rel}: nofollow on SmartFlow link`);
      }
      const resolved = fileForHref(href);
      if (!resolved.skip && !fs.existsSync(resolved.file)) {
        errors.push(`${rel}: internal href does not resolve: ${href}`);
      }
    });

    const sfInMain = $("main a[href]").filter((_, el) =>
      /smartflowinventory\.com/i.test($(el).attr("href") || "")
    ).length;
    if (sfInMain > 2) {
      warnings.push(`${rel}: ${sfInMain} SmartFlow links in main (max 2)`);
    }

    const visible = $("main").text();
    if (visible.includes("—") || visible.includes("–")) {
      warnings.push(`${rel}: em dash or en dash in visible text`);
    }
    if (/\bnot\b.+\bbut\b/i.test(visible)) {
      warnings.push(`${rel}: possible "not X, but Y" construction`);
    }

    const pageUrl = canonical;
    if (noindex && sitemapLocs.has(pageUrl)) {
      errors.push(`${rel}: noindex page is in sitemap`);
    }
    if (!noindex && rel.endsWith(".html") && !rel.endsWith("/404.html") && sitemapLocs.size) {
      if (pageUrl && !sitemapLocs.has(pageUrl)) {
        errors.push(`${rel}: indexable page missing from sitemap (${pageUrl})`);
      }
    }
  }
}

checkFrontMatter();
checkHtml();

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length) process.exit(1);
