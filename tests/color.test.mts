import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shades, DEFAULT_COLORS } from '../lib/color.ts';

const luminance = (hex: string) => {
  const rgb = hex.slice(1).match(/../g)!.map((n) => parseInt(n, 16) / 255)
    .map((n) => n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};

test('automatic palettes share readable text and paper across both layers', () => {
  for (const main of ['#b8cbea', '#ff0000', '#00ff00', '#000000', '#ffffff']) {
    const p = shades(main, '#98dfb0');
    assert.equal(p['--ct-ink'], p['--ct-main-text']);
    assert.equal(p['--ct-page-bg'], p['--ct-card-bg']);
    assert.ok((luminance(p['--ct-page-bg']) + 0.05) / (luminance(p['--ct-ink']) + 0.05) >= 4.5);
  }
});

test('custom colors are exact and independent of the automatic palette', () => {
  const p = shades('#b8cbea', '#f3dfb5', {
    textColor: '#123456', pageColor: '#fedcba', cardColor: '#ffffff', envelopeColor: '#98dfb0',
  });
  assert.equal(p['--ct-ink'], '#123456');
  assert.equal(p['--ct-text'], '#123456');
  assert.equal(p['--ct-page-bg'], '#fedcba');
  assert.equal(p['--ct-card-bg'], '#ffffff');
  assert.equal(p['--ct-envelope'], '#98dfb0');
  assert.equal(p['--ct-main-text'], shades('#b8cbea', '#f3dfb5')['--ct-main-text']);
  assert.equal(p['--ct-accent'], shades('#b8cbea', '#f3dfb5')['--ct-accent']);
});


test('pink and moss defaults keep the chosen accent and coordinated surfaces', () => {
  const p = shades(DEFAULT_COLORS.mainColor, DEFAULT_COLORS.accentColor, DEFAULT_COLORS);
  assert.equal(p['--ct-accent'], '#1a561e');
  assert.equal(p['--ct-ink'], '#29372c');
  assert.equal(p['--ct-envelope'], '#eab8c2');
  for (const background of ['--ct-card-bg', '--ct-page-bg', '--ct-envelope']) {
    assert.ok((luminance(p[background]) + 0.05) / (luminance(p['--ct-ink']) + 0.05) >= 4.5);
  }
});
