// Centralized localization: dictionaries, lookup, DOM binding and change notifications.
import en from './en.js';
import zh from './zh.js';

const DICTS = { en, zh };
const STORAGE_KEY = 'journey-lang';
const listeners = new Set();
let current = detectInitial();

function detectInitial() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && DICTS[q]) return q;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);

export const getLang = () => current;
export const locale = () => (current === 'zh' ? 'zh-CN' : 'en-GB');

/** Translate a key; `{name}` placeholders are filled from vars. Never falls back to another language. */
export function t(key, vars) {
  let v = lookup(DICTS[current], key);
  if (v === undefined) {
    console.warn(`[i18n] missing key "${key}" (${current})`);
    return '';
  }
  if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return v;
}

export const has = (key) => lookup(DICTS[current], key) !== undefined;

export function setLang(lang) {
  if (!DICTS[lang] || lang === current) return;
  current = lang;
  try { sessionStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  applyDocument();
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Bind declarative attributes: data-i18n (text), data-i18n-html (trusted dictionary markup), data-i18n-attr="attr:key;attr2:key2". */
export function translateTree(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

function applyDocument() {
  const html = document.documentElement;
  html.lang = current === 'zh' ? 'zh-Hans' : 'en';
  html.dataset.lang = current;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  translateTree(document);
}

export function initI18n() { applyDocument(); }

/** Format a milestone-style date string ('YYYY', 'YYYY-MM', 'YYYY-MM-DD') for the current language. */
export function formatDate(date, { short = false } = {}) {
  const [y, m, d] = date.split('-').map(Number);
  if (!m) return current === 'zh' ? `${y}年` : String(y);
  const opts = { timeZone: 'UTC', year: 'numeric', month: short ? 'short' : 'long', ...(d ? { day: 'numeric' } : {}) };
  return new Intl.DateTimeFormat(locale(), opts).format(new Date(Date.UTC(y, m - 1, d || 1)));
}

export const formatNumber = (n, opts) => new Intl.NumberFormat(locale(), opts).format(n);

/** Development aid: list keys present in one dictionary but not the other. */
export function auditDictionaries() {
  const missing = [];
  const walk = (a, b, path, label) => {
    for (const k of Object.keys(a)) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in b)) missing.push(`${label} missing ${p}`);
      else if (a[k] && typeof a[k] === 'object') walk(a[k], b[k], p, label);
    }
  };
  walk(en, zh, '', 'zh');
  walk(zh, en, '', 'en');
  return missing;
}
