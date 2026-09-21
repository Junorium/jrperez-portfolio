# Portfolio Rebuild and Content Intake: Cursor Handoff

Owner: JR Perez (full name John Richard Perez)
Site: personal portfolio that also builds search authority for SmartFlow (https://www.smartflowinventory.com)
Design source of truth: `design-reference/index-b-green-field.html` (called "Homepage B", approved)

Save this file as `docs/HANDOFF.md` in the repo. In Phase 1, also create `.cursor/rules/site.mdc` (`alwaysApply: true`) containing a condensed copy of Sections 1, 6, 7 and 8 that points back to this file. That rules file is what makes every future Cursor chat follow the intake process without being re-briefed.

---

## 0. How JR will use this

1. JR gives Cursor a Google Doc (as an exported Markdown file or pasted text) plus a one-line instruction.
2. Cursor follows Section 7 and ends with the report in 7.9.
3. Cursor cannot open private Google Docs. JR exports with File > Download > Markdown (.md), or pastes the text. If the doc has images, JR includes the export's image folder.

Standard prompt JR will paste with each doc:

```
Add the attached doc to the site per docs/HANDOFF.md section 7.
Type: <project | publication | update | page>
Anything the doc does not state stays a TODO. Do not invent facts.
```

---

## 1. Goals and rules that do not bend

Goals
- **Modular.** One doc becomes one content file. The listing page, home page sections, sitemap, related links, breadcrumbs, and structured data all update at build time. Adding an item never requires hand-editing another page.
- **Crawlable.** Every page ships complete HTML from the build. No content depends on client-side JavaScript. Every internal page is reachable through real `<a href>` links.
- **SmartFlow SEO.** The portfolio passes authority and entity signals to smartflowinventory.com (Section 8.4).
- **Name search.** The site is findable for both "JR Perez" and "John Richard Perez" (Section 8.1).

Rules
- **Do not break existing functionality.** All existing copy, links, the nav order (minus Case Studies), and the footer carry over. Diff the new output against the old HTML files before finishing each phase.
- **Do not invent facts.** No made-up dates, statistics, quotes, collaborators, awards, or product claims. Missing information becomes a `TODO` in the file and a line in the report.
- **No new design system.** Reuse Homepage B tokens and components (Section 3). Any new component must use existing tokens.
- **Simplest path.** Eleventy plus plain HTML and CSS. Zero client-side JavaScript unless JR asks for it.
- **Case studies are out of scope for now.** Do not create a collection, layout, nav item, sitemap entry, or page for them. Leave the existing `casestudies/` folder untouched. Reserve the path `/case-studies/` (Section 5).
- Work on a branch named `rebuild-b`. One commit per phase in Section 10.

---

## 2. Ask once, then proceed

Send JR these four questions in one message. If JR says "go" or does not answer, use the defaults.

| # | Question | Default |
|---|----------|---------|
| Q1 | Production domain? | `https://YOUR-DOMAIN.com`, stored only in `src/_data/site.js` as `site.url` |
| Q2 | Hosting provider? | None. Output plain static files to `_site/`, no host-specific config |
| Q3 | Is the current site live and indexed? | No. If yes, add 301 redirects from old `.html` URLs (Section 5) |
| Q4 | Contact form backend? | Remove the broken `script.js` form. Show a `mailto:` link with the placeholder `[EMAIL]`, and list it in the report |

---

## 3. Design source of truth

- Copy `index-b-green-field.html` into `design-reference/`. Its `<style>` block becomes `src/assets/styles.css` without visual changes. Its markup becomes layouts and partials.
- Do not restyle anything to "improve" it. If something needs to change, ask JR.

### Tokens (already in the file)

| Token | Value | Use |
|-------|-------|-----|
| `--shell` | `#F6F4EC` | Eggshell, warmed slightly from `#F8F9FB` so the green reads harder |
| `--ink` | `#121416` | Body text on paper, footer background |
| `--field` | `#1B4D3E` | Brand green: header, hero, closing band, buttons on paper |
| `--deep` | `#0F2E25` | Deep green: SmartFlow panel, research band |
| `--leaf` | `#9AD1B8` | Link and hover color on green |
| `--paper`, `--paper-fg`, `--paper-muted`, `--paper-line`, `--paper-accent` | light and dark variants | Paper bands. Dark mode remaps them to deep green |
| Status tags | Presented `#295284`, Published `#1B4D3E`, Ongoing `#D4A017`, Under review `#7851A9`, In progress `#1B4D3E` | `.tag--*` classes |

- Radius: 12px panels, 8px buttons and placeholders, 999px tags.
- Fonts: display is Helvetica Black through `@font-face` with `local()` sources, falling back to Inter Tight 900. Body is Helvetica Neue with Inter Tight fallback. Do not change the stack. A licensed webfont is a TODO for JR (Section 12). The file marks where it goes.
- Light and dark mode must both keep working. Use tokens only, never hard-coded colors, except the tag colors above.

### Components already in Homepage B (reuse these)
`masthead` and `.nav`, `.hero` with `.byline`, `.feature` panel, `.section` and `.section-head`, `.work` (open columns, no card chrome), `.research` with `.pubs` and `.pub`, `.updates`, `.close` band, `.footer`, `.btn` and `.btn--ghost`, `.tag` variants, `.ph` (dashed placeholder), `.skip` link, `.on-field`, `.on-deep`, `.on-paper` band classes.

### Navigation (exact order)
Home, SmartFlow (external, `target="_blank"`, `rel="noopener"`), Theses, Projects, Publications, Arts, Updates, Contact.
Case Studies is removed for now. Leave a code comment where it will return. The nav lives in one partial. `aria-current="page"` is set from the page URL.

---

## 4. Architecture

**Decision: Eleventy 3.** It removes the duplicated navbar and footer, builds collections, sitemap and schema from content files, and still outputs plain static HTML. This replaces the previous "no build step" setup on purpose.

Dependencies: `@11ty/eleventy`, `@11ty/eleventy-img`. Dev only: `cheerio`. Node 20 LTS. Nothing else without asking JR.

```
portfolio/
  .cursor/rules/site.mdc
  design-reference/index-b-green-field.html
  docs/HANDOFF.md
  docs/content-templates/{project,publication,update,page}.md
  scripts/check.mjs
  eleventy.config.js
  package.json
  src/
    _data/
      site.js            name, alternateName, url, description, socials, smartflow{}
      nav.js             nav items in order
      updates.json       grouped by month, newest first at build
    _includes/
      layouts/           base, home, listing, project, publication, updates, page, 404
      partials/          head, header, footer, tag, card-work, row-pub, related, breadcrumbs, smartflow-cta
    assets/styles.css
    fonts/               (empty until JR supplies licensed files)
    images/<type>/<slug>/
    content/
      projects/          projects.json (directory data) + one .md per project
      publications/      publications.json + one .md per publication
    index.njk
    about.md
    projects.njk
    publications.njk
    updates.njk
    arts.md
    contact.md
    404.md
    sitemap.xml.njk
    robots.txt.njk
```

Config requirements
- `dir`: input `src`, output `_site`. Markdown and HTML use Nunjucks.
- Pass through `src/assets`, `src/fonts`, `src/images` (images also go through the image shortcode).
- Directory data files set `layout`, `tags`, and `permalink`. Example for `src/content/projects/projects.json`:
  ```json
  { "layout": "layouts/project.njk", "tags": "projects", "permalink": "/projects/{{ page.fileSlug }}/" }
  ```
- Front matter uses `topics:` for subject keywords. Never use `tags:` in content files, because Eleventy treats `tags` as collection names.
- Sort rule everywhere: `order` ascending if present, otherwise `date` descending.
- Filters and shortcodes to write: `absoluteUrl`, `isoDate`, `monthLabel`, `related` (shares `topics`, max 3), `image` (via eleventy-img: webp plus jpeg fallback, `srcset`, width and height, `loading="lazy"` and `decoding="async"` except the first image on a page), `jsonld` (serialize a JS object with `JSON.stringify`, never hand-write JSON in templates).
- Scripts: `dev` (`eleventy --serve`), `build` (`eleventy`), `check` (`node scripts/check.mjs`, runs against `_site/`).

---

## 5. URL map

| Page | URL | Notes |
|------|-----|-------|
| Home | `/` | Homepage B |
| About | `/about/` | Content from `theses.html`. Nav label stays "Theses" |
| Projects list | `/projects/` | |
| Project detail | `/projects/<slug>/` | Only when `page: true` |
| Publications list | `/publications/` | |
| Publication detail | `/publications/<slug>/` | Only when `page: true` |
| Updates | `/updates/` | No detail pages |
| Arts | `/arts/` | Placeholder page: `noindex`, excluded from sitemap until it has real content |
| Contact | `/contact/` | |
| 404 | `/404.html` | `noindex`, links to main sections |
| Sitemap, robots | `/sitemap.xml`, `/robots.txt` | Generated |
| Reserved | `/case-studies/` | Do not build |

Rules: lowercase, hyphens, trailing slash, and a slug never changes after it is published.
If Q3 is "live": 301 redirect `theses.html` to `/about/`, and `projects.html`, `publications.html`, `arts.html`, `updates.html`, `contact.html` to their clean URLs, in the format the host uses.

---

## 6. Content model

### 6.1 Thin-page rule
A detail page is created only when the body has at least 150 words of real content. Set `page: true` or `page: false` at intake. When `page: false`, the item shows in listings and on the home page, and its card links to `link` or `doi` if present, otherwise it is not a link. Do not ship thin pages.

### 6.2 Fields shared by all content types

| Field | Required | Rule |
|-------|----------|------|
| `title` | yes | Plain title. The layout appends ` | JR Perez`, so keep it 48 characters or fewer, or add `seoTitle` |
| `seoTitle` | no | Full `<title>`, 65 characters or fewer, overrides the suffix rule |
| `description` | yes | 120 to 160 characters, one factual sentence, no cut-off words. Also used as the card blurb |
| `date` | yes | ISO date. Existing items without a known date use `order` and a `TODO` comment |
| `updated` | no | ISO date. Feeds sitemap `lastmod` and schema `dateModified` |
| `order` | no | Integer that overrides date sorting |
| `page` | yes | `true` or `false` (Section 6.1) |
| `featured` | no | `true` shows the item on the home page |
| `smartflow` | no | `true` when the item relates to SmartFlow. Adds the SmartFlow CTA and schema `mentions` |
| `topics` | no | List of lowercase keywords. Drives related links |
| `image`, `imageAlt` | no | Cover image path and its alt text. Missing image renders the `.ph` placeholder and goes in the report |
| `noindex` | no | `true` excludes the page from the sitemap and adds a robots meta tag |

### 6.3 Project (`src/content/projects/<slug>.md`)

```yaml
---
title: Smart Mold Technologies
description: Capstone with Prof. John Coulter on translating intelligent mold systems into advanced manufacturing.
date: 2026-01-01        # TODO confirm
order: 1
page: false
featured: true
smartflow: false
category: Capstone project
status: in-progress      # in-progress | completed
topics: [manufacturing, capstone]
image: null
imageAlt: null
---
```

Body (H2 headings only, omit any section the doc does not support):
Overview, My role, Approach, Results, Tools and methods, Collaborators and sponsors, What is next.

### 6.4 Publication (`src/content/publications/<slug>.md`)

```yaml
---
title: Semiconductor Impurities
description: Interstitial hydrogen in semiconductors to increase conductivity.
date: TODO
page: false
featured: true
venue: null
status: published        # presented | published | ongoing | under-review
doi: 10.1063/5.0271156
authors: []              # list in the order the doc gives
role: null               # for example "Lead author"
topics: [semiconductors]
---
```

Body: Abstract, Contribution, Method, Result, Where to read it. The DOI renders as a link to `https://doi.org/<doi>`.

### 6.5 Update (`src/_data/updates.json`)
One object per month. Add items to the existing month if it exists.

```json
[
  { "month": "2026-05", "items": [
      { "text": "Joined the Ventures Lab incubator." },
      { "text": "World Bank presentation on energy systems and utility planning accepted." }
  ]}
]
```

An item may include `"link": "/projects/<slug>/"` when it relates to a page on the site. Sorted newest first at build. The home page shows the latest three months, at most two items each. The `/updates/` page shows all months.

### 6.6 Page (about, arts, contact)
Plain Markdown with front matter. Same shared fields. `about.md` migrates the current Theses copy.

---

## 7. Google Doc intake protocol

Follow these steps in order for every doc.

### 7.1 Classify
Use the type JR states. If JR does not state one:
- Project: describes something built, designed, or analyzed, with a goal, a method, and an outcome.
- Publication: has a venue, DOI, conference, journal, or co-authors and a submission or presentation status.
- Update: one to three sentences about something that happened (award, talk, role, launch).
- Page: everything else, such as an about or contact rewrite.
If it could be two types, ask one question.

### 7.2 Extract
Map doc content to fields by meaning, not by exact heading names.

| Doc contains | Goes to |
|--------------|---------|
| Title or first heading | `title` |
| Summary, TL;DR, abstract | `description` (rewrite to 120 to 160 characters) and body Overview |
| Dates, timeline, "started", "presented" | `date`, `updated` |
| Status words: ongoing, completed, submitted, accepted, presented | `status` |
| Role, responsibilities | body "My role" |
| Method, process, design, analysis | body "Approach" |
| Outcomes, findings, numbers | body "Results", using only numbers the doc states |
| Tools, software, materials | body "Tools and methods" |
| Advisors, sponsors, teammates | body "Collaborators and sponsors", names exactly as written |
| Mentions SmartFlow or ABV Dynamics | `smartflow: true` |
| Links, DOI, repo, demo | `link`, `doi`, or a "Links" list in the body |

### 7.3 Missing information
- Required fields: `title`, `description`, `date`, `page`. Also `status` for projects and publications, and `venue` for publications.
- If any required field cannot be derived, ask JR in a single message, then continue. If JR does not answer, use `TODO` and list it in the report.
- Never guess dates, names, numbers, or outcomes.

### 7.4 Write the file
- Path from Section 4. Slug: kebab-case, three to five words, derived from the title, unique, and permanent.
- Copy `docs/content-templates/<type>.md`, fill the front matter, then write the body.
- Body headings start at H2. The layout supplies the single H1.
- Keep the doc's substance and facts. Tighten wording to the voice rules in Section 13. Do not add claims.
- Set `page` from the thin-page rule.

### 7.5 SEO fields
- `title`: descriptive, includes the subject and the discipline when natural.
- `description`: states what it is and why it matters, includes one natural keyword phrase, no keyword lists.
- `topics`: two to five lowercase keywords, reused across items so related links connect.
- Do not put "John Richard Perez" in every title. See Section 8.1 for where it belongs.

### 7.6 Images
- Save under `src/images/<type>/<slug>/`, lowercase, hyphenated file names.
- Every content image needs meaningful alt text. If the doc has a caption, base the alt on it. If not, describe what is literally in the image, or ask.
- Decorative images use `alt=""` and `data-decorative`.
- No hotlinked images. The Unsplash images from the old site are not carried over. Use `.ph` placeholders until JR supplies real images, and list each one in the report.

### 7.7 Links
- SmartFlow links: follow Section 8.4.
- Internal links use root-relative clean URLs and descriptive anchor text. Never "click here".
- External links get `rel="noopener"` and open in a new tab only when the old site did. Never add `nofollow` to SmartFlow or to sources the doc cites.
- Add `link` items to `updates.json` when an update relates to the new item.

### 7.8 Build and check
Run `npm run build` then `npm run check`. Fix every error. Warnings go in the report.

### 7.9 Report format
End every intake with this, in this order:
1. Files created or changed.
2. Front matter values you derived, and every field left as `TODO`.
3. `page: true` or `false`, with the word count.
4. The `<title>` and meta description as rendered.
5. Internal links added (related items, updates).
6. SmartFlow link status (added, not applicable).
7. Placeholders still in use.
8. Voice-rule flags (Section 13) found in the source doc.
9. `check` output.

---

## 8. SEO specification

### 8.1 Identity and name search

Goal: rank for "JR Perez" and "John Richard Perez".
- `src/_data/site.js` holds: `name: "JR Perez"`, `fullName: "John Richard Perez"`, `givenName: "John"`, `additionalName: "Richard"`, `familyName: "Perez"`, `url`, `description`, `socials`, and a `smartflow` object (`name`, `url`, `description`, `legalName: "ABV Dynamics, Inc."`).
- The full name appears as visible text, not only in metadata:
  - Home hero support line: "I'm John Richard Perez, and I go by JR. I build inventory software for manufacturing floors and do research at Lehigh University." (JR confirms wording.)
  - About page: H1 "About JR Perez", first paragraph opens with "JR Perez (John Richard Perez) is a mechanical engineer and product designer."
  - Structured data, on every page.
- `<title>` and description use both forms on Home and About only:
  - Home title: `JR Perez (John Richard Perez) | Mechanical Engineer, SmartFlow Founder`
  - Home description: `JR Perez (John Richard Perez) is a mechanical engineer and founder of SmartFlow, inventory software for manufacturing floors. Research at Lehigh University.`
  - About title: `About JR Perez (John Richard Perez) | Mechanical Engineer`
  - All other pages: `{title} | JR Perez`.
- Add `<meta name="author" content="JR Perez">` site-wide. Bylines on detail pages read "JR Perez".
- Do not repeat the full name in every heading or footer. Stuffing hurts more than it helps.

### 8.2 Head on every page (`partials/head.njk`)
- `<title>` and `<meta name="description">`, unique per page.
- `<link rel="canonical">` absolute, self-referencing, trailing slash.
- `<meta name="robots" content="index,follow,max-image-preview:large">`, or `noindex,follow` when `noindex: true`.
- Open Graph: `og:type` (`website` for home, `article` for detail pages), `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (1200x630, per-item cover if present, otherwise `/images/og-default.jpg`).
- Twitter: `summary_large_image`.
- `<html lang="en">`, viewport with `viewport-fit=cover`, theme-color.
- The safe-area and font-loading lines already in Homepage B stay as they are.
- Preload the display font once licensed and self-hosted.

### 8.3 Structured data
Build every object in JS and serialize with the `jsonld` filter.

Site-wide graph (in `head.njk` on every page):
- `WebSite` (`@id` = `{site.url}/#website`).
- `Person` (`@id` = `{site.url}/#person`):
  ```json
  {
    "@type": "Person",
    "name": "JR Perez",
    "givenName": "John",
    "additionalName": "Richard",
    "familyName": "Perez",
    "alternateName": ["John Richard Perez"],
    "url": "{site.url}/",
    "jobTitle": "Mechanical Engineer and Product Designer",
    "worksFor": { "@id": "https://www.smartflowinventory.com/#organization" },
    "affiliation": { "@type": "CollegeOrUniversity", "name": "Lehigh University" },
    "sameAs": ["<LinkedIn>", "<GitHub>", "<ORCID or Google Scholar if JR has one>"]
  }
  ```
- `Organization` for SmartFlow (`@id` = `https://www.smartflowinventory.com/#organization`), with `url`, `description`, `founder` pointing at the Person `@id`, and `parentOrganization` ABV Dynamics, Inc.

Per page:
- `BreadcrumbList` on every page except home, with a matching visible breadcrumb.
- Project detail: `CreativeWork` with `author` (Person `@id`), `datePublished`, `dateModified`, `image`, and `mentions` (SmartFlow `@id`) when `smartflow: true`.
- Publication detail: `ScholarlyArticle` only when `status: published`, with `sameAs: https://doi.org/<doi>`. Any other status uses `CreativeWork`. Never present an under-review paper as published.
- Listings and Updates: `CollectionPage`.
- Use only `sameAs` URLs JR has supplied. Never invent profile links. No fake ratings or reviews.

### 8.4 How the site boosts SmartFlow
- **Links out.** Followed links (only `rel="noopener"`) from the portfolio to smartflowinventory.com in these places: header nav, home H1, SmartFlow panel CTA, and the footer. Every item with `smartflow: true` gets the `smartflow-cta` partial.
- **Anchor text.** Vary it: "SmartFlow", "SmartFlow inventory software", "inventory software for manufacturing floors". No exact-match repeats on every page. At most two SmartFlow links inside a page's main content.
- **Claims.** Product statements come only from `site.smartflow.description` and copy JR supplies. Never write feature claims on your own.
- **Entity signals.** The Person and Organization link to each other through `@id`, `founder`, and `worksFor`. The Organization `@id` must match the one on the SmartFlow site (Section 12).
- **Contextual relevance.** Project and publication pages that touch inventory, manufacturing, or shop-floor work state that relationship in the body and link to SmartFlow once.
- **Optional, later:** a `/smartflow/` founder page on the portfolio, only if JR provides real copy. Do not build it from guesses.
- No UTM parameters on SmartFlow links.

### 8.5 Crawlability
- All text, headings, links, and JSON-LD exist in the built HTML. Nothing is injected by JavaScript.
- All navigation uses `<a href>` with real URLs. No `href="#"`, no JS-only routing, no content behind click-to-reveal.
- Content images are `<img>` elements, never CSS backgrounds.
- Exactly one `<h1>` per page. Headings do not skip levels.
- Every indexable page is reachable from the home page within three clicks and is linked from its listing.
- Internal linking is automatic: listing to detail, detail to listing, `related` block (up to three items sharing `topics`), previous and next within a collection, breadcrumbs.
- No soft 404s. The 404 page returns 404 on the host. No orphan pages. No duplicate URLs (one trailing-slash form).
- Paginate a listing with real links only if it exceeds 30 items.

### 8.6 Sitemap and robots
- `sitemap.xml.njk`: absolute `<loc>` for every page that is not `noindex`, `<lastmod>` from `updated`, else `date`, else build date. Exclude 404, drafts, and placeholders.
- `robots.txt.njk`:
  ```
  User-agent: *
  Allow: /
  Sitemap: {site.url}/sitemap.xml
  ```

### 8.7 Performance and accessibility
- Targets: Lighthouse 95 or higher for SEO, Accessibility, and Best Practices; performance 90 or higher on mobile.
- Text contrast at least 4.5:1 (the tokens already meet this).
- Visible focus states, skip link, real buttons and links, `aria-label` on icon-only controls, `prefers-reduced-motion` respected.

---

## 9. Layouts to build

- `base`: head, header, `{{ content }}`, footer.
- `home`: Homepage B exactly. Data-driven: featured projects (max 3), featured publications (max 3), latest three months of updates. No hard-coded items.
- `listing` (projects, publications): H1, intro line, items using `card-work` or `row-pub`, breadcrumb.
- `project` and `publication` detail: `.on-field` band with breadcrumb, H1, tag, and meta line (category or venue, date). Then an `.on-paper` body with a reading width of about 720px. Then `related`, `smartflow-cta` when applicable, and a link back to the listing.
- `updates`: all months, grouped, with `<time datetime>`.
- `page`: about, arts, contact.
- `404`: `noindex`, short message, links to Home, Projects, Publications, Contact.

---

## 10. Phases

1. **Scaffold.** Eleventy, dependencies, `site.js`, `nav.js`, base layout, header and footer partials, `styles.css` from Homepage B, home layout with real data, `.cursor/rules/site.mdc`, `docs/content-templates/`. Commit.
2. **Migrate content verbatim** from the current HTML files:
   - Theses copy to `about.md`, keeping the same headings and text.
   - Three projects to `content/projects/` (Smart Mold Technologies, Virtual Power Plant Deep Learning, Nuclear Regulation Compliance).
   - Five publications to `content/publications/` (Ultrabroadband Optical Limiting and Phase Behavior of Colloids, Semiconductor Impurities, Multi-agent Homogenous Systems, Hybrid Information-Retrieval Pipeline for RAG AI/LLM, Microfluidics and Robotics Engineering).
   - The full updates timeline (September 2023 through May 2026) to `updates.json`, one month per object.
   - Contact and Arts pages.
   Set `page: false` on all migrated items unless the source has 150 or more words of body. Commit.
3. **SEO layer.** Head partial, JSON-LD, breadcrumbs, related links, sitemap, robots, 404. Commit.
4. **Checks.** Write `scripts/check.mjs` (below), run it, fix errors. Commit.
5. **Handoff to JR.** Post the report and wait for the first Google Doc.

Old assets that were missing or external and are not carried over: `images/gear.png` (replaced by the inline SVG mark), `script.js`, Unsplash images (placeholders), `images/aps-poster.jpg`, `images/semiconductor.png` (placeholders until JR supplies them).

### `scripts/check.mjs` must verify (errors unless marked warning)
- Front matter: required fields present, `status` values valid, `description` 120 to 160 characters, `page: true` items have 150 or more body words.
- Built HTML: one `<h1>`, `<title>` 15 to 65 characters, unique titles and descriptions, canonical present and absolute, Open Graph tags present, JSON-LD parses, `lang` set.
- Images: every `<img>` has `alt` (or `data-decorative`) plus width and height.
- Links: every internal `href` resolves to a built file, no `href="#"`, no `nofollow` on smartflowinventory.com links. Warning if a page has more than two SmartFlow links in main content.
- Sitemap: contains every indexable page, contains no `noindex` page, `robots.txt` references it.
- Warning: em dashes or "not X, but Y" constructions in visible text (Section 13).

---

## 11. Definition of done

- `npm run build` and `npm run check` pass with no errors.
- Home renders identically to Homepage B in light and dark mode.
- All migrated content matches the old site word for word (except the case studies omission and the voice flags reported to JR).
- View source on any page shows full content, title, canonical, Open Graph, and valid JSON-LD.
- `sitemap.xml` and `robots.txt` exist and are correct.
- Adding a new project takes exactly one new Markdown file, with no other edits, and it appears on `/projects/`, on the home page if `featured`, in the sitemap, and in related links.

---

## 12. Off-repo tasks for JR (not for Cursor)

- Buy or confirm the domain, then set `site.url`.
- Verify the site in Google Search Console and Bing Webmaster Tools, then submit `sitemap.xml`.
- Make the name consistent across LinkedIn, GitHub, Lehigh profiles, and any ORCID or Google Scholar page: "JR Perez" as the display name, "John Richard Perez" in the bio. Link each back to the portfolio. Cursor puts these URLs in `sameAs` once JR supplies them.
- On smartflowinventory.com, add a link to the portfolio (for example a founder or about section) and matching Organization structured data:
  ```json
  {
    "@type": "Organization",
    "@id": "https://www.smartflowinventory.com/#organization",
    "name": "SmartFlow",
    "url": "https://www.smartflowinventory.com",
    "founder": {
      "@type": "Person",
      "@id": "https://YOUR-DOMAIN.com/#person",
      "name": "JR Perez",
      "alternateName": "John Richard Perez",
      "url": "https://YOUR-DOMAIN.com/"
    }
  }
  ```
- License a Helvetica Black webfont (for example Helvetica Neue LT Pro 95 Black from Monotype) and self-host the woff2. Until then, Inter Tight 900 renders as the stand-in on machines without it.
- Provide real photos and screenshots, an Open Graph default image (1200x630), a contact email or form service, and the real dates for the three migrated projects.
- Expect name-search results to take weeks. "John Perez" is a common name, so the full three-part name and consistent profiles do most of the work.

---

## 13. Voice rules for all written copy

- First person, direct, short sentences. Say what the thing is and what JR did.
- No em dashes. Use a period, comma, or colon.
- No parallel aphorisms or slogan pairs.
- No filler, hype words, or invented statistics.
- Sentence case for headings and labels. No all-caps labels.
- Bold only for a true thesis line.
- Migrated copy stays verbatim. Report any lines that break these rules and let JR decide. Known cases in the current Theses copy: "Build, measure, learn—repeat" and the closing three-sentence "exists to" thesis.

---

## 14. Out of scope for now

- Case studies (page, collection, nav item, sitemap entry, PDF viewer).
- A contact form backend, until JR answers Q4.
- A `/smartflow/` founder page, until JR supplies copy.
- RSS or Atom feeds, analytics, comments, search box, newsletter.
- Any client-side JavaScript.
