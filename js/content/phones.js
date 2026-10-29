// Gallery devices. Dimensions (mm) drive the procedural model's outer proportions only (illustrative);
// text and specifications live in the dictionaries under phones.<id>.
// series: 'early' | 'p' (P / Pura) | 'mate' | 'nova'    class: 'early' | 'flagship' | 'foldable' | 'midrange'
// camera layouts: 'single' | 'p9strip' | 'mate10band' | 'p30stack' | 'ring' | 'square' | 'pura70' | 'centerRect' | 'pill'
// layers: stacked frame sections (2 = book/flip foldable shown folded, 3 = tri-fold)
export const PHONES = [
  {
    id: 'u8220', name: 'Huawei U8220', date: '2009-02', series: 'early', class: 'early',
    dims: [56, 114, 14], radius: 10, layout: 'single', chin: true,
    body: '#2b2d31', frame: '#b8bcc2', screenHue: 205, displayInch: 3.5,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['fierce-u8220', 'wiki-pulse', 'gsmarena-u8220'],
  },
  {
    id: 'ascendP1', name: 'Ascend P1', date: '2012-01', series: 'p', class: 'flagship',
    dims: [64.8, 127.4, 7.69], radius: 7, layout: 'single',
    body: '#1c1d20', frame: '#3b3e44', screenHue: 190, displayInch: 4.3,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['androidcentral-p1'],
  },
  {
    id: 'p9', name: 'P9', date: '2016-04-06', series: 'p', class: 'flagship',
    dims: [70.9, 145, 6.95], radius: 8, layout: 'p9strip',
    body: '#b9bcc0', frame: '#c9ccd0', screenHue: 30, displayInch: 5.2,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['gsmarena-p9', 'anandtech-p9'],
  },
  {
    id: 'mate10', name: 'Mate 10', date: '2017-10-16', series: 'mate', class: 'flagship',
    dims: [77.8, 150.5, 8.2], radius: 8, layout: 'mate10band',
    body: '#2a3a52', frame: '#45526a', screenHue: 220, displayInch: 5.9,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['counterpoint-mate10', 'pcworld-mate10'],
  },
  {
    id: 'p30pro', name: 'P30 Pro', date: '2019-03-26', series: 'p', class: 'flagship',
    dims: [73.4, 158, 8.41], radius: 9, layout: 'p30stack', gradient: ['#9fd4ff', '#5b4bd6', '#c6a6ff'],
    body: '#6d7ce0', frame: '#a9b4e6', screenHue: 260, displayInch: 6.47,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['telecompaper-p30', 'wiki-p30'],
  },
  {
    id: 'mate60pro', name: 'Mate 60 Pro', date: '2023-08-29', series: 'mate', class: 'flagship',
    dims: [79, 163.6, 8.1], radius: 10, layout: 'ring',
    body: '#2f4a3e', frame: '#8a978f', screenHue: 150, displayInch: 6.82,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['yicai-mate60', 'aa-mate60'],
  },
  {
    id: 'pura70ultra', name: 'Pura 70 Ultra', date: '2024-04-18', series: 'p', class: 'flagship',
    dims: [75.1, 162.6, 8.4], radius: 10, layout: 'pura70',
    body: '#4a3b30', frame: '#b3a58a', screenHue: 25, displayInch: 6.8,
    specs: ['announced', 'chip', 'camera', 'notable'], sources: ['hw-pura-rename', 'technode-pura70'],
  },
  {
    id: 'mateXT', name: 'Mate XT', date: '2024-09-10', series: 'mate', class: 'foldable',
    dims: [73.5, 156.7, 12.8], radius: 8, layout: 'square', layers: 3,
    body: '#8f1c22', frame: '#c9a46a', screenHue: 350, displayInch: 10.2,
    specs: ['announced', 'display', 'thickness', 'notable'], sources: ['hc-matext', '9to5-matext'],
  },
  {
    id: 'mateX6', name: 'Mate X6', date: '2024-11-26', series: 'mate', class: 'foldable',
    dims: [72.5, 156.9, 9.9], radius: 9, layout: 'ring', layers: 2,
    body: '#7a1f2b', frame: '#b8a27a', screenHue: 330, displayInch: 7.93,
    specs: ['announced', 'display', 'thickness', 'notable'], sources: ['hw-matex6-specs', 'gsmarena-matex6'],
  },
  {
    id: 'puraX', name: 'Pura X', date: '2025-03-20', series: 'p', class: 'foldable',
    dims: [91.7, 143.2, 7.2], radius: 10, layout: 'square',
    body: '#d9d4c8', frame: '#c8c0b0', screenHue: 40, displayInch: 6.3,
    specs: ['announced', 'display', 'notable'], sources: ['technode-purax'],
  },
  {
    id: 'nova14pro', name: 'nova 14 Pro', date: '2025-05-19', series: 'nova', class: 'midrange',
    dims: [74.3, 163.3, 7.2], radius: 10, layout: 'pill',
    body: '#9fc2d8', frame: '#c9d2da', screenHue: 200, displayInch: 6.7,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['fonearena-nova14', 'notebookcheck-nova14pro'],
  },
  {
    id: 'pura80ultra', name: 'Pura 80 Ultra', date: '2025-06-11', series: 'p', class: 'flagship',
    dims: [76.6, 163, 8.9], radius: 10, layout: 'centerRect',
    body: '#c9a96a', frame: '#d6bf8e', screenHue: 45, displayInch: 6.8,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['gsmarena-pura80date', 'gsmarena-pura80ultra'],
  },
  {
    id: 'mate80promax', name: 'Mate 80 Pro Max', date: '2025-11-25', series: 'mate', class: 'flagship',
    dims: [76.5, 163.5, 8.6], radius: 10, layout: 'ring',
    body: '#2b3550', frame: '#9aa2b1', screenHue: 230, displayInch: 6.9,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['oledinfo-mate80', 'gsmarena-mate80promax'],
  },
  {
    id: 'mateX7', name: 'Mate X7', date: '2025-11-25', series: 'mate', class: 'foldable',
    dims: [74.3, 156.6, 9.5], radius: 9, layout: 'ring', layers: 2,
    body: '#4a2d5c', frame: '#a99bb5', screenHue: 280, displayInch: 8.0,
    specs: ['announced', 'display', 'thickness', 'chip', 'notable'], sources: ['fonearena-matex7'],
  },
  {
    id: 'nova15pro', name: 'nova 15 Pro', date: '2025-12-22', series: 'nova', class: 'midrange',
    dims: [75, 163.4, 7.4], radius: 10, layout: 'pill',
    body: '#e7c9d2', frame: '#d8c3c9', screenHue: 340, displayInch: 6.84,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['gsmarena-nova15', 'hc-nova15global'],
  },
  {
    id: 'pura90promax', name: 'Pura 90 Pro Max', date: '2026-04-20', series: 'p', class: 'flagship',
    dims: [77, 163, 8.6], radius: 10, layout: 'centerRect',
    body: '#1e2a2a', frame: '#9aa5a5', screenHue: 170, displayInch: 6.9,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['fonearena-pura90'],
  },
  {
    id: 'puraXmax', name: 'Pura X Max', date: '2026-04-20', series: 'p', class: 'foldable',
    dims: [80, 150, 11], radius: 10, layout: 'square', layers: 2,
    body: '#e6e1d6', frame: '#c9c2b2', screenHue: 60, displayInch: 7.7,
    specs: ['announced', 'display', 'chip', 'camera', 'notable'], sources: ['aa-puraxmax'],
  },
];

export const SERIES_FILTERS = ['all', 'mate', 'p', 'nova', 'foldable'];

export const matchesFilter = (p, f) => f === 'all' || (f === 'foldable' ? p.class === 'foldable' : p.series === f);

export const phoneById = (id) => PHONES.find((p) => p.id === id) || PHONES[0];
