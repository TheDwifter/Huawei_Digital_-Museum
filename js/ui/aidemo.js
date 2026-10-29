// Chapter 6: simulated AI request — device → network → data centre → NPU → result.
import { t, onLangChange, formatNumber } from '../i18n/i18n.js';
import { REDUCED_MOTION } from '../util/env.js';
import { classify, solarForecast, detectAnomalies, SAMPLE_TRAFFIC } from './aimodels.js';

const STAGES = ['device', 'network', 'dc', 'npu', 'result'];
const SCENARIOS = ['ask', 'solar', 'network'];
const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED_MOTION.matches ? 0 : ms));

export function initAiDemo() {
  const root = document.getElementById('ai-demo');
  const state = { scenario: 'ask', text: '', cloud: 0.3, traffic: SAMPLE_TRAFFIC.join(', '), running: false, result: null, stage: -1, inner: -1 };

  root.innerHTML = `
    <div class="ai-demo__head">
      <div><h3 class="display-2"></h3><p class="lede"></p></div>
      <span class="badge ai-badge"></span>
    </div>
    <div class="ai-demo__box">
      <div class="ai-demo__controls">
        <div class="ai-tabs" role="tablist"></div>
        <p class="ai-desc"></p>
        <div class="ai-input"></div>
        <button type="button" class="btn btn--primary ai-run"></button>
      </div>
      <div class="ai-pipe" aria-live="polite">
        <ol class="ai-pipe__stages"></ol>
        <div class="ai-pipe__packet" aria-hidden="true"></div>
      </div>
      <div class="ai-out"></div>
    </div>
    <p class="ai-honesty muted"></p>`;

  const $ = (s) => root.querySelector(s);

  function renderStatic() {
    $('.ai-demo__head h3').textContent = t('aidemo.title');
    $('.ai-demo__head .lede').textContent = t('aidemo.lede');
    $('.ai-badge').textContent = t('aidemo.badge');
    $('.ai-honesty').textContent = t('aidemo.honesty');
    const tabs = $('.ai-tabs');
    tabs.setAttribute('aria-label', t('aidemo.scenarioLabel'));
    tabs.innerHTML = SCENARIOS.map((s) => `<button type="button" role="tab" aria-selected="${s === state.scenario}" data-sc="${s}">${t(`aidemo.scenarios.${s}.name`)}</button>`).join('');
    $('.ai-desc').textContent = t(`aidemo.scenarios.${state.scenario}.desc`);
    renderInput();
    renderRun();
    renderPipe();
    renderResult();
  }

  function renderInput() {
    const box = $('.ai-input');
    const sc = state.scenario;
    if (sc === 'ask') {
      box.innerHTML = `
        <label class="ai-label" for="ai-q">${t('aidemo.inputLabel')}</label>
        <input id="ai-q" class="ai-field" type="text" maxlength="160" autocomplete="off" placeholder="${t('aidemo.scenarios.ask.placeholder')}">
        <div class="ai-examples">${t('aidemo.scenarios.ask.examples').map((ex) => `<button type="button" class="ai-chip" data-ex="${ex}">${ex}</button>`).join('')}</div>`;
      box.querySelector('input').value = state.text;
      box.querySelector('input').addEventListener('input', (e) => { state.text = e.target.value; });
      box.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    } else if (sc === 'solar') {
      box.innerHTML = `
        <label class="ai-label" for="ai-cloud">${t('aidemo.scenarios.solar.cloud')}: <b>${Math.round(state.cloud * 100)}%</b></label>
        <input id="ai-cloud" class="ai-range" type="range" min="0" max="100" step="5" value="${Math.round(state.cloud * 100)}">`;
      box.querySelector('input').addEventListener('input', (e) => {
        state.cloud = Number(e.target.value) / 100;
        box.querySelector('b').textContent = `${e.target.value}%`;
      });
    } else {
      box.innerHTML = `
        <label class="ai-label" for="ai-traffic">${t('aidemo.inputLabel')}</label>
        <textarea id="ai-traffic" class="ai-field" rows="3" placeholder="${t('aidemo.scenarios.network.placeholder')}"></textarea>
        <div class="ai-examples"><button type="button" class="ai-chip" data-sample>${t('aidemo.scenarios.network.sample')}</button></div>`;
      box.querySelector('textarea').value = state.traffic;
      box.querySelector('textarea').addEventListener('input', (e) => { state.traffic = e.target.value; });
    }
  }

  function renderRun() {
    const b = $('.ai-run');
    b.textContent = state.running ? t('aidemo.running') : t('aidemo.run');
    b.disabled = state.running;
  }

  function renderPipe() {
    $('.ai-pipe__stages').innerHTML = STAGES.map((s, i) => `
      <li class="ai-stage ${i === state.stage ? 'is-active' : ''} ${i < state.stage ? 'is-done' : ''}" data-st="${s}">
        <span class="ai-stage__dot">${i + 1}</span>
        <strong>${t(`aidemo.stages.${s}.name`)}</strong>
        <small>${t(`aidemo.stages.${s}.text`)}</small>
        ${s === 'npu' ? `<span class="ai-inner">${t(`aidemo.inner.${state.scenario}`).map((n, k) => `<i class="${k < state.inner || (state.stage > 3) ? 'is-done' : k === state.inner ? 'is-active' : ''}">${n}</i>`).join('')}</span>` : ''}
      </li>`).join('');
    const pkt = $('.ai-pipe__packet');
    pkt.style.setProperty('--i', String(Math.max(0, state.stage)));
    pkt.classList.toggle('is-on', state.stage >= 0 && state.running);
  }

  function renderResult() {
    const out = $('.ai-out');
    const r = state.result;
    if (!r) { out.innerHTML = ''; return; }
    const head = `<p class="ai-out__title">${t('aidemo.out.title')}${r.error ? '' : `<span>${t('aidemo.out.latency', { ms: r.latency })}</span>`}</p>`;
    if (r.error) { out.innerHTML = head + `<p>${t(r.error)}</p>`; return; }
    if (r.kind === 'ask') {
      if (!r.match) { out.innerHTML = head + `<p>${t('aidemo.out.noMatch')}</p><p class="muted">${t('aidemo.out.tokens', { n: r.tokens.length })}</p>`; return; }
      const bars = Object.entries(r.scores).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
        <div class="ai-bar ${k === r.top ? 'is-top' : ''}"><span>${t(`aidemo.topics.${k}`)}</span><div><i style="width:${(v * 100).toFixed(1)}%"></i></div><b>${formatNumber(v, { style: 'percent' })}</b></div>`).join('');
      out.innerHTML = head + `
        <p class="ai-out__lead">${t('aidemo.out.topic')}: <strong>${t(`aidemo.topics.${r.top}`)}</strong></p>
        <div class="ai-bars" aria-label="${t('aidemo.out.confidence')}">${bars}</div>
        <p class="ai-out__sub">${t('aidemo.out.related')}</p>
        <ul class="ai-related">${r.related.map((m) => `<li><a href="#${m.chapter}"><b>${m.date.slice(0, 4)}</b> ${t(`milestones.${m.id}.title`)}</a></li>`).join('')}</ul>
        <p class="muted">${t('aidemo.out.tokens', { n: r.tokens.length })}</p>`;
    } else if (r.kind === 'solar') {
      const w = 420, h = 130;
      const maxKw = 6;
      const x = (hh) => ((hh - 5) / 15) * w;
      const y = (kw) => h - (kw / maxKw) * (h - 10);
      const d = r.points.map(([hh, kw], i) => `${i ? 'L' : 'M'}${x(hh).toFixed(1)} ${y(kw).toFixed(1)}`).join('');
      const hhmm = `${String(Math.floor(r.peak.h)).padStart(2, '0')}:${String(Math.round((r.peak.h % 1) * 60)).padStart(2, '0')}`;
      out.innerHTML = head + `
        <div class="ai-kpis"><div><span>${t('aidemo.out.peak')}</span><b>${formatNumber(r.peak.kw, { maximumFractionDigits: 1 })} kW</b><small>${t('aidemo.out.peakAt', { time: hhmm })}</small></div>
        <div><span>${t('aidemo.out.energy')}</span><b>${formatNumber(r.energy, { maximumFractionDigits: 1 })} kWh</b><small>6 kW · ${Math.round(r.cloud * 100)}%</small></div></div>
        <svg class="ai-chart" viewBox="0 0 ${w} ${h + 18}" role="img" aria-label="${t('aidemo.scenarios.solar.name')}">
          <path d="${d}L${w} ${h}L0 ${h}Z" class="ai-chart__area"/><path d="${d}" class="ai-chart__line"/>
          ${[6, 9, 12, 15, 18].map((hh) => `<text x="${x(hh)}" y="${h + 14}">${hh}:00</text>`).join('')}
        </svg>`;
    } else {
      const w = 420, h = 110;
      const max = Math.max(...r.values) * 1.1;
      const x = (i) => (i / (r.values.length - 1)) * w;
      const y = (v) => h - (v / max) * (h - 8);
      const d = r.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
      out.innerHTML = head + `
        <p class="ai-out__lead">${r.flags.length ? t('aidemo.out.anomalies', { n: r.flags.length }) : t('aidemo.out.none')}</p>
        <svg class="ai-chart" viewBox="0 0 ${w} ${h + 6}" role="img" aria-label="${t('aidemo.scenarios.network.name')}">
          <path d="${d}" class="ai-chart__line"/>
          ${r.flags.map((f) => `<circle cx="${x(f.i)}" cy="${y(f.v)}" r="6" class="ai-chart__flag"/>`).join('')}
        </svg>
        <ul class="ai-related">${r.flags.map((f) => `<li>${t('aidemo.out.hour', { h: f.i })}: <b>${formatNumber(f.v)}</b> · ${t('aidemo.out.mean', { v: formatNumber(Math.round(f.base)) })}</li>`).join('')}</ul>`;
    }
  }

  async function run() {
    if (state.running) return;
    const sc = state.scenario;
    // compute first so invalid input fails fast
    let result;
    if (sc === 'ask') {
      const text = state.text.trim() || t('aidemo.scenarios.ask.examples')[0];
      if (!state.text.trim()) { state.text = text; const inp = root.querySelector('#ai-q'); if (inp) inp.value = text; }
      result = { kind: 'ask', ...classify(text, (id) => `${t(`milestones.${id}.title`)} ${t(`milestones.${id}.text`)}`) };
    } else if (sc === 'solar') {
      result = { kind: 'solar', cloud: state.cloud, ...solarForecast(state.cloud) };
    } else {
      const values = state.traffic.split(/[,，\s]+/).map(Number).filter((v) => Number.isFinite(v));
      if (values.length < 6) { state.result = { error: 'aidemo.out.invalid', latency: 0 }; renderResult(); return; }
      result = { kind: 'network', values, ...detectAnomalies(values) };
    }
    result.latency = 38 + Math.round((result.tokens?.length || 12) * 0.9 + (sc === 'solar' ? 21 : 9));
    state.running = true; state.result = null; renderRun(); renderResult();
    for (let i = 0; i < STAGES.length; i++) {
      state.stage = i; state.inner = -1; renderPipe();
      if (STAGES[i] === 'npu') {
        for (let k = 0; k < 4; k++) { state.inner = k; renderPipe(); await sleep(420); }
      } else await sleep(560);
    }
    state.running = false; state.inner = 4; state.result = result;
    renderRun(); renderPipe(); renderResult();
  }

  root.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-sc]');
    if (sc && !state.running) { state.scenario = sc.dataset.sc; state.result = null; state.stage = -1; renderStatic(); return; }
    const ex = e.target.closest('[data-ex]');
    if (ex) { state.text = ex.dataset.ex; renderInput(); run(); return; }
    if (e.target.closest('[data-sample]')) { state.traffic = SAMPLE_TRAFFIC.join(', '); renderInput(); return; }
    if (e.target.closest('.ai-run')) run();
  });

  renderStatic();
  onLangChange(renderStatic);
}
