import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { seoRoutes, renderRouteHtml } from "../scripts/create-seo-route-html.mjs";

const base = await readFile("dist/index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");

test("static HTML metadata shells cover all and only indexable sitemap routes", () => {
  const sitemapPaths = [...sitemap.matchAll(/<loc>https:\/\/www\.istesport\.com([^<]*)<\/loc>/g)]
    .map((match) => match[1])
    .filter((path) => path !== "/").sort();
  assert.deepEqual(seoRoutes.map((route) => route.path).sort(), sitemapPaths);
  assert.equal(new Set(seoRoutes.map((route) => route.path)).size, seoRoutes.length);
});

test("each public page returns correct route-specific title, description and canonical", async () => {
  for (const route of seoRoutes) {
    const html = renderRouteHtml(base, route);
    const generated = await readFile(join("dist", "_seo", route.path.slice(1).replaceAll("/", "__") + ".html"), "utf8");
    assert.equal(generated, html);
    assert.ok(html.includes("<title>" + route.title + "</title>"));
    assert.ok(html.includes('rel="canonical" href="https://www.istesport.com' + route.path + '"'));
    assert.ok(html.includes('property="og:url" content="https://www.istesport.com' + route.path + '"'));
    assert.ok(html.includes('property="og:title" content="' + route.title + '"'));
    assert.ok(html.includes('name="twitter:description" content="' + route.description + '"'));
    assert.ok(html.includes('src="/assets/'), "JS assets must remain absolute from site root");
  }
});

test("HTML escaping makes SEO metadata safe to render", () => {
  const html = renderRouteHtml(base, {
    title: 'CS2 <team> "win"',
    description: "Play & compete",
    path: "/team",
  });
  assert.ok(html.includes("<title>CS2 &lt;team&gt; &quot;win&quot;</title>"));
  assert.ok(html.includes('content="Play &amp; compete"'));
});
