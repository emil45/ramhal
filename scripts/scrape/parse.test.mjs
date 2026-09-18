import * as cheerio from 'cheerio';
import { describe, expect, it } from 'vitest';

import { blocksOf } from './parse.mjs';

// Fixtures for the two bugs described in blocksOf's own comment:
// docs/reviews/REVIEW-01-findings.md #8 (this one dropped prose around
// inline markup) and its predecessor (double-counted nested tables).

describe('blocksOf', () => {
  it('keeps prose on both sides of an inline span, and the span itself, without duplicating either', () => {
    const $ = cheerio.load(`
      <body>
        <p>Opening prose that is long enough to clear the threshold on its own.
        <span>A short inline aside worth keeping too</span>
        Closing prose that also comfortably clears the same threshold.</p>
      </body>
    `);

    const blocks = blocksOf($).map((b) => b.text);

    expect(blocks).toContain('A short inline aside worth keeping too');
    const paragraphBlock = blocks.find((t) => t.includes('Opening prose'));
    expect(paragraphBlock).toBeDefined();
    expect(paragraphBlock).toContain('Opening prose');
    expect(paragraphBlock).toContain('Closing prose');
    // The span's own text must appear exactly once across all blocks, not
    // once as part of the paragraph's aggregated text and once on its own.
    const occurrences = blocks.filter((t) => t.includes('A short inline aside')).length;
    expect(occurrences).toBe(1);
  });

  it('does not re-count a nested legacy table inside its wrapping cell', () => {
    const $ = cheerio.load(`
      <body>
        <td>
          <table><tr><td>The actual paragraph lives two levels down in a nested table, as on the legacy site.</td></tr></table>
        </td>
      </body>
    `);

    const blocks = blocksOf($).map((b) => b.text);

    expect(blocks).toEqual(['The actual paragraph lives two levels down in a nested table, as on the legacy site.']);
  });

  it('keeps a short block only when it carries a price', () => {
    const $ = cheerio.load(`
      <body>
        <div>too short<span>₪80.00</span></div>
      </body>
    `);

    const blocks = blocksOf($).map((b) => b.text);

    expect(blocks).toEqual(['₪80.00']);
  });
});
