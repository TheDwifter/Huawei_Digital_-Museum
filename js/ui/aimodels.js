// Small, transparent local "models" used by the AI demonstration. They are simulations, not neural networks.
import { MILESTONES } from '../content/milestones.js';

const KEYWORDS = {
  telecom: ['5g', '4g', '3g', '2g', 'lte', 'gsm', 'network', 'antenna', 'signal', 'base station', 'switch', 'exchange', 'call', 'telephone', 'mimo', 'radio', 'telecom', 'beam', 'operator', 'mobile network',
    '网络', '天线', '信号', '基站', '交换', '通话', '电话', '通信', '波束', '运营商', '移动通信'],
  devices: ['phone', 'smartphone', 'camera', 'leica', 'mate', 'p30', 'p9', 'harmonyos', 'android', 'screen', 'display', 'fold', 'satellite', 'handset', 'device',
    '手机', '摄像', '徕卡', '鸿蒙', '屏幕', '折叠', '卫星', '终端', '设备', '安卓'],
  power: ['solar', 'inverter', 'pv', 'battery', 'energy', 'power', 'grid', 'charging', 'electric', 'sun', 'photovoltaic', 'storage battery',
    '光伏', '逆变器', '电池', '能源', '电网', '充电', '储能', '太阳', '发电', '电力'],
  computing: ['server', 'data centre', 'data center', 'cloud', 'cpu', 'kunpeng', 'storage', 'rack', 'computing', 'taishan', 'processor', 'datacenter',
    '服务器', '数据中心', '云', '鲲鹏', '存储', '机柜', '计算', '泰山', '处理器'],
  ai: ['ai', 'artificial', 'intelligence', 'npu', 'ascend', 'model', 'pangu', 'neural', 'accelerator', 'mindspore', 'training', 'learning', 'inference', 'llm', 'kirin 970',
    '人工智能', '智能', '昇腾', '模型', '盘古', '神经', '加速器', '训练', '算力', '推理'],
};

const hasCJK = (s) => /[一-鿿]/.test(s);

export function tokenize(text) {
  const tokens = [];
  const re = /[一-鿿]|[a-z0-9]+(?:[-'][a-z0-9]+)*/gi;
  let m;
  while ((m = re.exec(text))) tokens.push(m[0].toLowerCase());
  return tokens;
}

/** Keyword-weighted topic classifier with softmax confidences. */
export function classify(text, milestoneText) {
  const q = ` ${text.toLowerCase()} `;
  const tokens = tokenize(text);
  const scores = {};
  for (const [topic, words] of Object.entries(KEYWORDS)) {
    scores[topic] = words.reduce((s, w) => {
      if (hasCJK(w)) return s + (q.includes(w) ? 1.2 : 0);
      const re = new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
      return s + (re.test(q) ? (w.length <= 3 ? 1.4 : 1) : 0);
    }, 0);
  }
  const max = Math.max(...Object.values(scores));
  if (max === 0) return { tokens, match: false, scores: Object.fromEntries(Object.keys(scores).map((k) => [k, 0.2])) };
  const exps = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.exp(v * 1.6)]));
  const sum = Object.values(exps).reduce((a, b) => a + b, 0);
  const probs = Object.fromEntries(Object.entries(exps).map(([k, v]) => [k, v / sum]));
  const top = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0];

  // related milestones: same domain, ranked by token overlap with their (localized) text
  const related = MILESTONES.filter((m) => m.domain === top)
    .map((m) => {
      const txt = milestoneText(m.id).toLowerCase();
      const overlap = tokens.filter((tk) => tk.length > 2 || hasCJK(tk)).reduce((s, tk) => s + (txt.includes(tk) ? 1 : 0), 0);
      return { m, score: overlap + m.t / 10000 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.m);
  return { tokens, match: true, scores: probs, top, related };
}

/** Simplified clear-sky PV model with cloud attenuation (Kasten–Czeplak form). */
export function solarForecast(cloud, capacity = 6) {
  const points = [];
  let energy = 0;
  let peak = { kw: 0, h: 12 };
  for (let h = 5; h <= 20.001; h += 0.25) {
    const s = h > 6 && h < 18 ? Math.sin((Math.PI * (h - 6)) / 12) : 0;
    const clear = capacity * 0.86 * Math.pow(s, 1.15);
    const ripple = 1 - 0.06 * cloud * Math.abs(Math.sin(h * 3.1));
    const kw = clear * (1 - 0.75 * Math.pow(cloud, 3.4)) * ripple;
    points.push([h, kw]);
    energy += kw * 0.25;
    if (kw > peak.kw) peak = { kw, h };
  }
  return { points, energy, peak };
}

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Robust anomaly detector: each value is compared with the median of its neighbours (rolling baseline),
 * and residuals are scored with a median/MAD z-score so normal daily ramps are not flagged.
 */
export function detectAnomalies(values) {
  const baseline = values.map((_, i) => median(values.filter((__, j) => j !== i && Math.abs(j - i) <= 2)));
  const resid = values.map((v, i) => v - baseline[i]);
  const mad = median(resid.map((r) => Math.abs(r - median(resid)))) || 1;
  const flags = values.map((v, i) => ({ i, v, base: baseline[i], z: (0.6745 * resid[i]) / mad })).filter((p) => Math.abs(p.z) > 3.5);
  return { median: median(values), baseline, flags };
}

export const SAMPLE_TRAFFIC = [41, 39, 37, 36, 38, 44, 58, 71, 80, 83, 81, 79, 82, 84, 80, 78, 190, 86, 92, 88, 74, 9, 52, 45];
