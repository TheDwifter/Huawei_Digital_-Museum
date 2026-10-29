// DOM half of an exhibit: header, controls, stage text and component list.
// Works without WebGL so every exhibit stays readable if the 3D view cannot load.
import { t, onLangChange } from '../i18n/i18n.js';
import { EXHIBIT_META } from '../exhibits/meta.js';

const ICON = {
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',
  replay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  restart: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5v11M13 2.5v11L5 8z" fill="currentColor" stroke="currentColor" stroke-width="1.2"/></svg>',
  explode: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.5h12M2 10.5h12M8 1v3M8 12v3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  labels: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 5h7M3 11h11" stroke="currentColor" stroke-width="1.5"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="1.6"/></svg>',
  reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>',
  cube: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M60 8 100 28v28L60 76 20 56V28z M20 28l40 20 40-20M60 48v28" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};

const SPEEDS = [0.5, 1, 2];

export class ExhibitPanel {
  constructor(el, id) {
    this.el = el;
    this.id = id;
    this.meta = EXHIBIT_META[id];
    this.handlers = {};
    this.stage = 0;
    this.complete = false;
    this.selected = null;
    this.pending = new Set();
    this.build();
    this.relabel();
    this.unsub = onLangChange(() => this.relabel());
  }

  k(path) { return `ex.${this.id}.${path}`; }

  build() {
    const el = this.el;
    el.innerHTML = `
      <div class="exhibit__head">
        <div><h3 class="exhibit__title"></h3><p class="exhibit__sub"></p></div>
        <span class="badge" data-l="illustrative"></span>
      </div>
      <div class="exhibit__frame">
        <div class="exhibit__body">
          <div class="exhibit__stage">
            <div class="exhibit__canvas" tabindex="0" role="application"></div>
            <div class="ex-hotspots"></div>
            <div class="ex-float ex-float--tr">
              <button type="button" class="icon-btn" data-act="zoomIn">${ICON.plus}</button>
              <button type="button" class="icon-btn" data-act="zoomOut">${ICON.minus}</button>
              <button type="button" class="icon-btn" data-act="reset">${ICON.reset}</button>
            </div>
            <div class="ex-float ex-float--bl"><span class="ex-hint"></span></div>
            <div class="ex-status">
              <div class="ex-status__inner" data-state="loading"><div class="ex-spinner"></div><p data-l="loading"></p></div>
            </div>
          </div>
          <div class="exhibit__info">
            <div class="ex-stage" aria-live="polite">
              <div class="ex-stage__count"><span class="ex-stage__n"></span><span class="ex-stage__done"></span></div>
              <div class="ex-stage__title"></div>
              <p class="ex-stage__text"></p>
              <div class="ex-stage__pips"></div>
            </div>
            <div class="ex-parts">
              <h4 data-l="components"></h4>
              <ul></ul>
              <div class="ex-detail" aria-live="polite"></div>
            </div>
            <div class="ex-extra"></div>
          </div>
        </div>
        <div class="exhibit__toolbar">
          <button type="button" class="tb-btn tb-btn--primary" data-act="play"></button>
          <button type="button" class="tb-btn" data-act="restart">${ICON.restart}<span data-l="restart"></span></button>
          <div class="tb-scrub">
            <div class="scrubber"><div class="scrubber__ticks"></div><input type="range" min="0" max="1000" value="0" step="1"></div>
            <span class="tb-time">0.0 / 0.0s</span>
          </div>
          <span class="seg-label" data-l="speed"></span>
          <div class="seg" role="group">${SPEEDS.map((s) => `<button type="button" data-speed="${s}" aria-pressed="${s === 1}">${s}×</button>`).join('')}</div>
          <button type="button" class="tb-btn" data-act="explode" aria-pressed="false">${ICON.explode}<span data-l="explode"></span></button>
          <button type="button" class="tb-btn" data-act="labels" aria-pressed="true">${ICON.labels}<span data-l="labels"></span></button>
        </div>
      </div>`;

    const q = (s) => el.querySelector(s);
    this.dom = {
      title: q('.exhibit__title'), sub: q('.exhibit__sub'), canvas: q('.exhibit__canvas'), hotspots: q('.ex-hotspots'),
      status: q('.ex-status'), hint: q('.ex-hint'), stageN: q('.ex-stage__n'), stageDone: q('.ex-stage__done'),
      stageTitle: q('.ex-stage__title'), stageText: q('.ex-stage__text'), pips: q('.ex-stage__pips'),
      parts: q('.ex-parts ul'), detail: q('.ex-detail'), extra: q('.ex-extra'), play: q('[data-act="play"]'),
      range: q('input[type="range"]'), time: q('.tb-time'), ticks: q('.scrubber__ticks'), seg: q('.seg'),
      explode: q('[data-act="explode"]'), labels: q('[data-act="labels"]'), stageEl: q('.exhibit__stage'),
    };
    this.canvasHost = this.dom.canvas;
    this.hotspotLayer = this.dom.hotspots;
    this.extraHost = this.dom.extra;

    // stage pips
    for (let i = 0; i < this.meta.stages; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => this.emit('stage', i));
      this.dom.pips.appendChild(b);
    }
    // component chips + hotspots
    this.chips = new Map();
    this.spots = new Map();
    this.meta.components.forEach((c, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'part-chip'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span>${i + 1}</span><em></em>`;
      b.querySelector('em').style.fontStyle = 'normal';
      b.addEventListener('click', () => this.select(this.selected === c ? null : c, true));
      li.appendChild(b);
      this.dom.parts.appendChild(li);
      this.chips.set(c, b);

      const s = document.createElement('button');
      s.type = 'button'; s.className = 'hotspot is-hidden'; s.tabIndex = -1;
      s.innerHTML = `<span class="hotspot__dot">${i + 1}</span><span class="hotspot__label"></span>`;
      s.addEventListener('click', () => this.select(this.selected === c ? null : c, true));
      this.dom.hotspots.appendChild(s);
      this.spots.set(c, s);
    });

    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn && el.contains(btn)) this.emit(btn.dataset.act);
      const sp = e.target.closest('[data-speed]');
      if (sp) {
        this.setSpeed(Number(sp.dataset.speed));
        this.emit('speed', Number(sp.dataset.speed));
      }
    });
    this.dom.range.addEventListener('input', () => this.emit('scrub', Number(this.dom.range.value) / 1000));
    this.dom.canvas.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] };
      if (map[e.key]) { e.preventDefault(); this.emit('orbit', map[e.key]); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.emit('zoomIn'); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.emit('zoomOut'); }
      else if (e.key === ' ') { e.preventDefault(); this.emit('play'); }
    });
    this.setStage(0, false);
    this.setPlaying(false, false);
  }

  emit(name, arg) { this.handlers[name]?.(arg); }

  relabel() {
    const name = t(this.k('title'));
    this.dom.title.textContent = name;
    this.dom.sub.textContent = t(this.k('sub'));
    this.el.querySelectorAll('[data-l]').forEach((n) => { n.textContent = t(`viewer.${n.dataset.l}`); });
    this.dom.canvas.setAttribute('aria-label', t('viewer.canvasLabel', { name }));
    this.dom.hint.textContent = t('viewer.hint');
    const lbl = (sel, key) => { const b = this.el.querySelector(sel); b.setAttribute('aria-label', t(key)); b.title = t(key); };
    lbl('[data-act="zoomIn"]', 'viewer.zoomIn');
    lbl('[data-act="zoomOut"]', 'viewer.zoomOut');
    lbl('[data-act="reset"]', 'viewer.reset');
    this.dom.range.setAttribute('aria-label', t('viewer.scrub'));
    this.dom.seg.setAttribute('aria-label', t('viewer.speed'));
    this.meta.components.forEach((c) => {
      const nm = t(this.k(`parts.${c}.name`));
      this.chips.get(c).querySelector('em').textContent = nm;
      this.chips.get(c).title = this.pending.has(c) ? t('viewer.pending') : '';
      const s = this.spots.get(c);
      s.querySelector('.hotspot__label').textContent = nm;
      s.setAttribute('aria-label', nm);
    });
    [...this.dom.pips.children].forEach((b, i) => {
      b.setAttribute('aria-label', t('viewer.goToStage', { n: i + 1, title: t(this.k(`stages.${i}.title`)) }));
    });
    this.setPlaying(this.playing, this.atEnd);
    this.setStage(this.stage, this.complete, true);
    this.renderDetail();
    if (this.statusState && this.statusState !== 'ready') this.setStatus(this.statusState);
    this.onRelabel?.();
  }

  setStatus(state) {
    this.statusState = state;
    const st = this.dom.status;
    if (state === 'ready') { st.hidden = true; return; }
    st.hidden = false;
    if (state === 'loading') {
      st.innerHTML = `<div class="ex-status__inner"><div class="ex-spinner"></div><p>${t('viewer.loading')}</p></div>`;
    } else {
      st.innerHTML = `<div class="ex-status__inner"><div class="ex-fallback-art">${ICON.cube}</div><strong>${t('viewer.errorTitle')}</strong><p>${t('viewer.errorText')}</p><button type="button" class="tb-btn" data-act="retry">${t('viewer.retry')}</button></div>`;
    }
  }

  setPlaying(playing, atEnd) {
    this.playing = playing;
    this.atEnd = atEnd;
    const b = this.dom.play;
    const key = playing ? 'pause' : atEnd ? 'replay' : 'play';
    b.innerHTML = `${ICON[key]}<span>${t(`viewer.${key}`)}</span>`;
    b.setAttribute('aria-pressed', String(playing));
  }

  setProgress(time, duration) {
    const p = duration ? time / duration : 0;
    this.dom.range.value = String(Math.round(p * 1000));
    this.dom.range.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
    this.dom.time.textContent = `${time.toFixed(1)} / ${duration.toFixed(1)}s`;
  }

  setTicks(fractions) {
    this.dom.ticks.innerHTML = fractions.map((f) => `<span style="left:${(f * 100).toFixed(2)}%"></span>`).join('');
  }

  setStage(i, complete, force = false) {
    if (!force && i === this.stage && complete === this.complete) return;
    this.stage = i;
    this.complete = complete;
    const total = this.meta.stages;
    this.dom.stageN.textContent = t('viewer.stageOf', { n: i + 1, total });
    this.dom.stageDone.textContent = complete ? `✓ ${t('viewer.complete')}` : '';
    this.dom.stageTitle.textContent = t(this.k(`stages.${i}.title`));
    this.dom.stageText.textContent = t(this.k(`stages.${i}.text`));
    [...this.dom.pips.children].forEach((b, k) => {
      b.classList.toggle('is-current', k === i && !complete);
      b.classList.toggle('is-done', k < i || complete);
    });
  }

  setSpeed(s) {
    this.dom.seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === s)));
  }

  setExplode(on) { this.dom.explode.setAttribute('aria-pressed', String(on)); }

  setLabels(on) {
    this.dom.labels.setAttribute('aria-pressed', String(on));
    this.dom.hotspots.classList.toggle('is-off', !on);
  }

  setPending(set) {
    this.pending = set;
    this.chips.forEach((b, c) => {
      b.classList.toggle('is-pending', set.has(c));
      b.title = set.has(c) ? t('viewer.pending') : '';
    });
  }

  select(component, fromUser = false) {
    this.selected = component;
    this.chips.forEach((b, c) => b.setAttribute('aria-pressed', String(c === component)));
    this.spots.forEach((s, c) => s.classList.toggle('is-selected', c === component));
    this.renderDetail();
    if (fromUser) this.emit('select', component);
  }

  renderDetail() {
    const c = this.selected;
    this.dom.detail.innerHTML = c
      ? `<strong>${t(this.k(`parts.${c}.name`))}</strong><p>${t(this.k(`parts.${c}.desc`))}</p>`
      : `<p class="muted">${t('viewer.select')}</p>`;
  }

  /** Position hotspots: positions = Map(component -> {x,y} | null). */
  placeHotspots(positions) {
    this.spots.forEach((s, c) => {
      const p = positions.get(c);
      s.classList.toggle('is-hidden', !p);
      if (p) s.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    });
  }

  destroy() { this.unsub?.(); }
}
