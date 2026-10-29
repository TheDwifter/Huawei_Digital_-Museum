// Verified milestones. Text lives in the dictionaries under milestones.<id>.
// `date` precision: 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'. `status` flags qualified / announced / future items.
export const DOMAINS = ['telecom', 'devices', 'power', 'computing', 'ai'];

export const DOMAIN_COLORS = {
  telecom: '#2a8fd8',
  devices: '#d0202a',
  power: '#e09a1a',
  computing: '#5b6cff',
  ai: '#9b3df0',
};

export const MILESTONES = [
  { id: 'founding', date: '1987', domain: 'telecom', chapter: 'ch1', sources: ['hw-corp', 'wiki-huawei'] },
  { id: 'pbxRnd', date: '1990', domain: 'telecom', chapter: 'ch1', sources: ['wiki-huawei', 'cbs-history'], status: 'qualified' },
  { id: 'cc08', date: '1993', domain: 'telecom', chapter: 'ch1', sources: ['wiki-huawei', 'businessday'], status: 'qualified' },
  { id: 'etisalat3g', date: '2003-12', domain: 'telecom', chapter: 'ch2', sources: ['lightreading-etisalat', 'arabianbusiness-3g'] },
  { id: 'u8220', date: '2009-02', domain: 'devices', chapter: 'ch3', sources: ['fierce-u8220', 'wiki-pulse'] },
  { id: 'osloLte', date: '2009-12', domain: 'telecom', chapter: 'ch2', sources: ['telecoms-lte'] },
  { id: 'ascendP1', date: '2012-01', domain: 'devices', chapter: 'ch3', sources: ['androidcentral-p1'] },
  { id: 'pvEntry', date: '2013', domain: 'power', chapter: 'ch4', sources: ['solar-decade', 'pvtech-us'], status: 'qualified' },
  { id: 'inverterLead', date: '2015', domain: 'power', chapter: 'ch4', sources: ['pvmag-2021', 'solarquarter-2024'] },
  { id: 'p9', date: '2016-04-06', domain: 'devices', chapter: 'ch3', sources: ['gsmarena-p9', 'anandtech-p9'] },
  { id: 'kirin970', date: '2017-09', domain: 'ai', chapter: 'ch6', sources: ['gsmarena-kirin970', 'counterpoint-mate10'] },
  { id: 'mate10', date: '2017-10-16', domain: 'devices', chapter: 'ch3', sources: ['counterpoint-mate10', 'pcworld-mate10'] },
  { id: 'balong5g01', date: '2018-02', domain: 'telecom', chapter: 'ch2', sources: ['totaltele-5g01', 'hw-5g-communicate'] },
  { id: 'kunpeng920', date: '2019-01-07', domain: 'computing', chapter: 'ch5', sources: ['cnbc-kunpeng', 'dcd-kunpeng'] },
  { id: 'p30pro', date: '2019-03-26', domain: 'devices', chapter: 'ch3', sources: ['telecompaper-p30', 'wiki-p30'] },
  { id: 'harmonyos', date: '2019-08-09', domain: 'devices', chapter: 'ch3', sources: ['axios-harmony'] },
  { id: 'ascend910', date: '2019-08-23', domain: 'ai', chapter: 'ch6', sources: ['telecompaper-910'] },
  { id: 'atlas900', date: '2019-09', domain: 'computing', chapter: 'ch5', sources: ['cio-atlas900'] },
  { id: 'pangu', date: '2021', domain: 'ai', chapter: 'ch6', sources: ['counterpoint-pangu'] },
  { id: 'digitalPower', date: '2021-06', domain: 'power', chapter: 'ch4', sources: ['dp-about'] },
  { id: 'pangu3', date: '2023-07', domain: 'ai', chapter: 'ch6', sources: ['qna-pangu3'] },
  { id: 'mate60pro', date: '2023-08-29', domain: 'devices', chapter: 'ch3', sources: ['yicai-mate60', 'aa-mate60'] },
  { id: 'puraRename', date: '2024-04-18', domain: 'devices', chapter: 'ch3', sources: ['hw-pura-rename', 'technode-pura70'] },
  { id: 'puraX', date: '2025-03-20', domain: 'devices', chapter: 'ch3', sources: ['technode-purax'] },
  { id: 'mate80', date: '2025-11-25', domain: 'devices', chapter: 'ch3', sources: ['oledinfo-mate80', 'fonearena-matex7'] },
  { id: 'pura90', date: '2026-04-20', domain: 'devices', chapter: 'ch3', sources: ['fonearena-pura90', 'aa-puraxmax'] },
  { id: 'mateXT', date: '2024-09-10', domain: 'devices', chapter: 'ch3', sources: ['hc-matext', '9to5-matext'] },
  { id: 'cloudmatrix', date: '2025-04', domain: 'computing', chapter: 'ch5', sources: ['hc-cloudmatrix'] },
  { id: 'inverterTenth', date: '2025-07', domain: 'power', chapter: 'ch4', sources: ['solarquarter-2024'] },
  { id: 'openPangu', date: '2025-06-30', domain: 'ai', chapter: 'ch6', sources: ['decoder-openpangu'] },
  { id: 'atlas950', date: '2025-09', domain: 'ai', chapter: 'ch6', sources: ['aimag-atlas950', 'techradar-mwc26'], status: 'announced' },
  { id: 'anniversary', date: '2037', domain: null, chapter: 'finale', sources: ['hw-corp'], status: 'future' },
].map((m) => ({ ...m, t: dateToYear(m.date) }))
  .sort((a, b) => a.t - b.t);

/** Fractional year for positioning on the timeline. */
export function dateToYear(date) {
  const [y, m = 1, d = 1] = date.split('-').map(Number);
  const hasMonth = date.length > 4;
  return y + (hasMonth ? (m - 1) / 12 + (d - 1) / 365 : 0.5);
}

export const milestonesFor = (chapter) => MILESTONES.filter((m) => m.chapter === chapter);
