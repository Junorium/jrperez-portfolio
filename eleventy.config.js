import path from "node:path";
import fs from "node:fs";
import eleventyImage from "@11ty/eleventy-img";

function byOrderOrDate(a, b) {
  const ao = a.data.order;
  const bo = b.data.order;
  const aHas = Number.isFinite(ao);
  const bHas = Number.isFinite(bo);
  if (aHas && bHas && ao !== bo) return ao - bo;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  return new Date(b.date) - new Date(a.date);
}

function absoluteUrl(pathname, base) {
  if (!pathname) return `${base}/`;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const root = String(base || "").replace(/\/$/, "");
  return `${root}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export default async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addWatchTarget("src/assets/styles.css");

  eleventyConfig.addFilter("absoluteUrl", function (pathname) {
    const base = this.ctx?.site?.url || "";
    return absoluteUrl(pathname, base);
  });

  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("monthLabel", (yearMonth) => {
    const [year, month] = String(yearMonth).split("-").map(Number);
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    return `${names[month - 1]} ${year}`;
  });

  eleventyConfig.addFilter("latestMonths", (updates, count = 3) =>
    [...(updates || [])]
      .sort((a, b) => String(b.month).localeCompare(String(a.month)))
      .slice(0, count)
  );

  eleventyConfig.addFilter("take", (items, count = 2) =>
    (items || []).slice(0, count)
  );

  eleventyConfig.addFilter("featured", (items) =>
    (items || []).filter((item) => item.data.featured)
  );

  eleventyConfig.addFilter("related", (collection, current, limit = 3) => {
    const topics = new Set(current?.topics || []);
    if (!topics.size) return [];
    const currentUrl = current?.url;
    return (collection || [])
      .filter((item) => item.url !== currentUrl)
      .map((item) => ({
        item,
        score: (item.data.topics || []).filter((topic) => topics.has(topic)).length
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.item);
  });

  eleventyConfig.addFilter("jsonld", (value) => JSON.stringify(value));

  eleventyConfig.addFilter("statusLabel", (status) => {
    const labels = {
      "in-progress": "In progress",
      completed: "Completed",
      presented: "Presented",
      published: "Published",
      ongoing: "Ongoing",
      "under-review": "Under review"
    };
    return labels[status] || status;
  });

  eleventyConfig.addFilter("statusClass", (status) => {
    const classes = {
      "in-progress": "tag tag--fill",
      completed: "tag",
      presented: "tag tag--presented",
      published: "tag tag--published",
      ongoing: "tag tag--ongoing",
      "under-review": "tag tag--review"
    };
    return classes[status] || "tag";
  });

  eleventyConfig.addFilter("itemHref", (item) => {
    if (item.data.hasPage) return item.url;
    if (item.data.doi) return `https://doi.org/${item.data.doi}`;
    if (item.data.link) return item.data.link;
    return null;
  });

  eleventyConfig.addFilter("isExternalHref", (href) =>
    /^https?:\/\//i.test(href || "")
  );

  eleventyConfig.addShortcode("image", async function (src, alt, extra = {}) {
    if (!src) return "";
    const altText = alt || "";
    const inputPath = src.startsWith("src/") ? src : path.join("src", src.replace(/^\//, ""));
    if (!fs.existsSync(inputPath)) {
      return `<div class="ph" role="img" aria-label="${altText}">Image placeholder</div>`;
    }
    try {
      const isPng = /\.png$/i.test(inputPath);
      const metadata = await eleventyImage(inputPath, {
        widths: extra.widths || [400, 800, 1200],
        formats: extra.formats || (isPng ? ["webp", "png"] : ["webp", "jpeg"]),
        outputDir: path.join("_site", "img"),
        urlPath: "/img/",
        cacheOptions: { directory: ".cache" }
      });
      return eleventyImage.generateHTML(metadata, {
        alt: altText,
        sizes: extra.sizes || "(min-width: 860px) 33vw, 100vw",
        loading: extra.priority ? "eager" : "lazy",
        decoding: "async"
      });
    } catch {
      return `<div class="ph" role="img" aria-label="${altText}">Image placeholder</div>`;
    }
  });

  eleventyConfig.addCollection("projectItems", (api) =>
    api.getFilteredByTag("projects").sort(byOrderOrDate)
  );

  eleventyConfig.addCollection("publicationItems", (api) =>
    api.getFilteredByTag("publications").sort(byOrderOrDate)
  );

  eleventyConfig.addGlobalData("eleventyComputed", {
    breadcrumbs: (data) => {
      if (data.breadcrumbs) return data.breadcrumbs;
      const url = data.page?.url;
      if (data.schemaType === "project") {
        return [
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects/" },
          { label: data.title, href: url }
        ];
      }
      if (data.schemaType === "publication") {
        return [
          { label: "Home", href: "/" },
          { label: "Publications", href: "/publications/" },
          { label: data.title, href: url }
        ];
      }
      return data.breadcrumbs;
    },
    schema: (data) => {
      const url = String(data.site?.url || "").replace(/\/$/, "");
      const pageUrl = absoluteUrl(data.page?.url || "/", url);
      const personId = `${url}/#person`;
      const orgId = "https://www.smartflowinventory.com/#organization";
      const graph = [
        {
          "@type": "WebSite",
          "@id": `${url}/#website`,
          url: `${url}/`,
          name: data.site.name,
          publisher: { "@id": personId }
        },
        {
          "@type": "Person",
          "@id": personId,
          name: data.site.name,
          givenName: data.site.givenName,
          additionalName: data.site.additionalName,
          familyName: data.site.familyName,
          alternateName: [data.site.fullName],
          url: `${url}/`,
          jobTitle: "Mechanical Engineer and Product Designer",
          worksFor: { "@id": orgId },
          affiliation: {
            "@type": "CollegeOrUniversity",
            name: "Lehigh University"
          }
        },
        {
          "@type": "Organization",
          "@id": orgId,
          name: data.site.smartflow.name,
          url: data.site.smartflow.url,
          description: data.site.smartflow.description,
          founder: { "@id": personId },
          parentOrganization: {
            "@type": "Organization",
            name: data.site.smartflow.legalName
          }
        }
      ];

      if (data.site.socials?.sameAs?.length) {
        graph[1].sameAs = data.site.socials.sameAs;
      }

      const crumbs = data.breadcrumbs || [];
      if (crumbs.length) {
        graph.push({
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href, url)
          }))
        });
      }

      if (data.schemaType === "collection") {
        graph.push({
          "@type": "CollectionPage",
          "@id": `${pageUrl}#collection`,
          url: pageUrl,
          name: data.title,
          isPartOf: { "@id": `${url}/#website` },
          author: { "@id": personId }
        });
      } else if (data.schemaType === "project") {
        const work = {
          "@type": "CreativeWork",
          "@id": `${pageUrl}#work`,
          url: pageUrl,
          name: data.title,
          author: { "@id": personId },
          datePublished: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date
        };
        if (data.updated) work.dateModified = data.updated;
        if (data.image) work.image = absoluteUrl(data.image, url);
        if (data.smartflow) work.mentions = { "@id": orgId };
        graph.push(work);
      } else if (data.schemaType === "publication") {
        const isPublished = data.status === "published";
        const work = {
          "@type": isPublished ? "ScholarlyArticle" : "CreativeWork",
          "@id": `${pageUrl}#work`,
          url: pageUrl,
          name: data.title,
          author: { "@id": personId }
        };
        if (isPublished && data.doi) work.sameAs = `https://doi.org/${data.doi}`;
        if (data.smartflow) work.mentions = { "@id": orgId };
        graph.push(work);
      }

      return { "@context": "https://schema.org", "@graph": graph };
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
