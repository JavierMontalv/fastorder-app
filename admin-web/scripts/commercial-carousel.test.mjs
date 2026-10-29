import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../src/pages/Inicio.jsx', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../src/styles/ComandaInicio.css', import.meta.url), 'utf8');

test('commercial carousels autoplay independently from image and OS animation preferences', () => {
  assert.doesNotMatch(pageSource, /setPaused\(motion\.matches\)/);
  assert.doesNotMatch(pageSource, /paused\s*\|\|\s*!photosReady/);
  assert.match(pageSource, /paused\s*\|\|\s*stepWidth\s*<=\s*0/);
  assert.match(pageSource, /setInterval[\s\S]*?6000/);
  assert.match(pageSource, /setInterval[\s\S]*?4200/);
  assert.match(pageSource, /Pausar vistas/);
  assert.match(pageSource, /Pausar recorrido automático/);
});

test('hero cycles through visibly distinct, brand-safe ambient colors', () => {
  assert.match(styleSource, /animation:cm-ambient-surface 14s/);
  assert.match(styleSource, /@keyframes cm-ambient-surface/);
  assert.match(styleSource, /#ffe8dc/);
  assert.match(styleSource, /#dff1e4/);
});

test('optional commercial guides collapse and the timeline hands off compactly to plans', () => {
  assert.match(pageSource, /<details className="cm-section cm-resource-links cm-resource-disclosure">/);
  assert.match(pageSource, /Despliega aquí/);
  assert.match(styleSource, /\.cm-public \.cm-service-timeline\{padding-bottom:10px\}/);
  assert.match(styleSource, /\.cm-public \.cm-plans\{padding-top:24px\}/);
});

test('commercial questions use compact two-item rows with a centered final question', () => {
  assert.match(styleSource, /\.cm-public \.cm-faq>div:last-child\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /\.cm-public \.cm-faq details:last-child\{grid-column:1\/-1;width:calc\(50% - 6px\);justify-self:center\}/);
  assert.match(styleSource, /@media\(max-width:760px\)[\s\S]*?\.cm-public \.cm-faq>div:last-child\{grid-template-columns:1fr/);
});

test('plan cards are compact, tiered and conversion-focused', () => {
  assert.match(pageSource, /data-plan=\{plan\.clave\}/);
  assert.match(pageSource, /MÁS ELEGIDO/);
  assert.match(pageSource, /Empezar con Básico/);
  assert.match(pageSource, /Crecer con Premium/);
  assert.match(styleSource, /\.cm-public \.cm-plan\{[\s\S]*?min-height:500px/);
  assert.match(styleSource, /\.cm-public \.cm-plan-pro\{[\s\S]*?transform:translateY\(-6px\)/);
});

test('commercial header and hero keep a compact premium first fold', () => {
  assert.match(styleSource, /\.cm-home>\.cm-nav\{[\s\S]*?padding-block:18px/);
  assert.match(styleSource, /\.cm-home \.cm-sales-hero\{[\s\S]*?margin-top:14px/);
  assert.match(styleSource, /padding-block:clamp\(26px,3vw,42px\)/);
  assert.match(styleSource, /@media\(max-width:760px\)[\s\S]*?\.cm-home>\.cm-nav\{padding-block:14px\}/);
});
