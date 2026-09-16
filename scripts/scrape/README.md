# Legacy site scraper

One-time migration tooling. Extracts content from the three legacy sites —
`ramhal.com` (Hebrew), `frramhal.com` (French), `enramhal.com` (nominally English) —
into JSON we can load into Payload.

This is throwaway code with a job to do. It is deliberately separate from the app
(its own `package.json`, its own dependencies) so it can be deleted once the
migration is done without touching anything else.

## Where to run it

Run the crawl from **your own Terminal on the Mac**, not from an agent shell.

Agent shells (Cowork's device sandbox, and the cloud container) run behind an egress
allowlist: the npm registry is reachable, so `npm install` works, but `ramhal.com` is
not, and `fetch()` fails with a bare "fetch failed". Parsing has no such problem —
`parse.mjs` only reads `.cache/`, so an agent can run and re-run that freely.

Split of labour: **you run `crawl.mjs`, anyone can run `parse.mjs`.**

## Run it

```bash
cd scripts/scrape
npm install

# ~15 deliberately awkward pages. A few minutes. Start here.
node crawl.mjs --mode=sample
node parse.mjs

# Everything. ~340 URLs across three sites, ~40 minutes.
node crawl.mjs --mode=full
node parse.mjs
```

Long runs are better detached:

```bash
nohup node crawl.mjs --mode=full > crawl.log 2>&1 &
tail -f crawl.log
```

Safe to interrupt at any point. Rerunning skips whatever is already cached.

## Two phases, on purpose

**`crawl.mjs`** fetches and caches raw HTML in `.cache/`. Nothing is parsed.
**`parse.mjs`** reads only from `.cache/` and writes `out/*.json`. Never touches the network.

The split matters because these sites declare `Crawl-delay: 5` and the French host
returns 429s under light load, so a full pass costs ~40 minutes of wall time. We pay
that exactly once. Extraction rules can then be rewritten and rerun as often as needed.

## The trap that will bite you

**Hebrew URLs encode the hyphen separator as `%2D`, not `-`.**

```
https://www.ramhal.com/%D7%9E%D7%A1%D7%99%D7%9C%D7%AA%2D%D7%99%D7%A9%D7%A8%D7%99%D7%9D.html
                                                 ^^^
```

Decode that to `-` and the URL 404s. Node's WHATWG `URL` preserves `%2D`, so passing
the raw string to `fetch()` is safe — but **any `decodeURIComponent()` round-trip in
between silently breaks every Hebrew URL**. In this code decoding happens only for
display and for matching, never to build a URL we request.

Other traps, all real, all in the sample set:

| Page | What is wrong with it |
|---|---|
| `/NOUVEAU.html` | Is actually the Noa'h parsha essay |
| `/Hanouka.html` | Is actually an essay about Kippour |
| `/emor.html` | A real essay with no title line at all |
| `/devarim.html` | Exists, renders, entirely empty — as do all 8 Devarim pages |
| `/Botiquw-en-ligne.html` | Typo in the slug, on the live site |
| `/סוכות.html` vs `/סוכות-1.html` | One is the article, one is the video page. Reversed for ט״ו בשבט |
| `/Category.html` on `frramhal.com` | HTTP 500, along with all six homepage tiles |

## How content is separated from chrome

Every page repeats the entire ~150-link global menu and footer, and there are no
useful semantic containers to select on. So instead of guessing CSS selectors for a
2010 ASP template, the parser detects boilerplate empirically: any text block
appearing on more than half the pages is chrome, and what remains is content.

Useful side effect — pages left with nothing after stripping are exactly the stub
pages that render the homepage template. They identify themselves rather than
needing a list.

Tune with `--boilerplate=0.4` if too much or too little is being stripped.

## Output

```
.cache/<site>/<sha1>.html     raw HTML, one file per URL
.cache/<site>/index.jsonl     url → cache key, status, charset, size
.cache/crawl-summary.json     what was fetched, what failed
out/<site>.json               parsed pages, sorted longest first
out/report.json               counts by type, word totals, media refs, empty pages
```

Both `.cache/` and `out/` are gitignored — they are regenerable, and `.cache/`
gets large.

## Politeness

Serial, one host at a time, 5s between requests with jitter, exponential backoff on
429 and 5xx, and an honest User-Agent. This is the client's own site, but it is
crawled the way a stranger's would be.
