// Entry point: localization, navigation and lazy initialisation of every exhibition module.
import { initI18n, t, onLangChange, auditDictionaries } from './i18n/i18n.js';
import { initNav } from './ui/nav.js';
import { mountExhibits } from './ui/exhibits.js';
import { initChapterMilestones } from './ui/milestones.js';
import { initHeroCopy } from './ui/heroCopy.js';
import { initTimeline } from './ui/timeline.js';
import { initCallFlow } from './ui/callflow.js';
import { initGenerations } from './ui/generations.js';
import { initGallery } from './ui/gallery.js';
import { initDataFlow } from './ui/dataflow.js';
import { initAiDemo } from './ui/aidemo.js';
import { initConvergence } from './ui/convergence.js';
import { initReferences } from './ui/references.js';
import { initReveal } from './ui/reveal.js';
import { initHero3D } from './ui/hero.js';
import { initIntro } from './ui/intro.js';

initI18n();
initIntro();
initNav();
initHeroCopy();
initTimeline();
initChapterMilestones();
initCallFlow();
initGenerations();
mountExhibits();
initGallery();
initDataFlow();
initAiDemo();
initConvergence();
initReferences();
initReveal();
initHero3D();

// Development aid: report any key missing from either dictionary.
const missing = auditDictionaries();
if (missing.length) console.warn('[i18n] dictionary mismatch:', missing);

export { t, onLangChange };
