// app.js — ES Module
// Inicializa Firebase + Firestore robusto e liga todos os botões via event delegation.
// Funciona mesmo sem onclick no HTML antigo.

import cfg from './firebase-config.js';

// ===== Firebase (CDN modular) =====
import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeFirestore, getFirestore,
  collection, addDoc, setDoc, doc, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// --- 1) Start Firebase uma única vez
if (!cfg || !cfg.apiKey) {
  console.error('Firebase config ausente em firebase-config.js');
  alert('Config do Firebase ausente. Abra firebase-config.js e cole sua configuração.');
  // não segue sem config
} 

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

// --- 2) Firestore com long-polling (evita “pending”)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// Disponível para debug
window.__db = db;

// =========== FUNÇÕES BÁSICAS (podem ser trocadas pelas suas telas) ===========
async function createIngredientQuick() {
  await addDoc(collection(db, 'ingredients'), {
    name: 'Ingrediente teste ' + new Date().toLocaleString(),
    unit: 'un',
    unitCost: 1.23,
    createdAt: Date.now()
  });
  toast('Ingrediente criado!');
  refreshIngredientsCount();
}

async function createTaskQuick() {
  await addDoc(collection(db, 'tasks'), {
    title: 'Tarefa ' + new Date().toLocaleString(),
    status: 'todo',
    createdAt: Date.now()
  });
  toast('Tarefa criada!');
  refreshTasksCount();
}

async function createRecipeQuick() {
  await setDoc(doc(collection(db, 'recipes'), 'teste-' + Date.now()), {
    name: 'Ficha teste',
    items: [],
    createdAt: Date.now()
  });
  toast('Ficha técnica criada!');
  refreshRecipesCount();
}

// =========== CONTADORES DO DASHBOARD (opcional, não quebra se não existir) ===========
async function refreshIngredientsCount() {
  try {
    const snap = await getDocs(collection(db, 'ingredients'));
    setBadgeText('ingredients', snap.size);
  } catch (e) { console.warn('Contagem ingredients:', e); }
}
async function refreshTasksCount() {
  try {
    const snap = await getDocs(collection(db, 'tasks'));
    setBadgeText('tasks', snap.size);
  } catch (e) { console.warn('Contagem tasks:', e); }
}
async function refreshRecipesCount() {
  try {
    const snap = await getDocs(collection(db, 'recipes'));
    setBadgeText('recipes', snap.size);
  } catch (e) { console.warn('Contagem recipes:', e); }
}

function setBadgeText(kind, n) {
  // tenta achar elementos comuns no seu layout para mostrar números
  const map = {
    ingredients: ['#ingredients-count', '[data-counter=ingredients]'],
    tasks:       ['#tasks-count',       '[data-counter=tasks]'],
    recipes:     ['#recipes-count',     '[data-counter=recipes]']
  };
  (map[kind] || []).forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.textContent = String(n);
  });
}

// =========== UTIL ===========
function toast(msg) {
  console.log(msg);
  try {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position:fixed; right:12px; bottom:12px; z-index:9999;
      background:#193b2d; color:#c3f3d1; padding:10px 12px; border-radius:8px;
      font: 14px/1.2 system-ui,Segoe UI,Roboto,Arial; box-shadow:0 6px 18px rgba(0,0,0,.3);`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  } catch {}
}

// =========== EVENT DELEGATION (liga TODA a UI sem mexer no HTML) ===========
document.addEventListener('click', (ev) => {
  const target = ev.target.closest('button, a, [role="button"]');
  if (!target) return;

  // 1) Primeiro, se houver data-action, usa
  const act = target.getAttribute?.('data-action');
  if (act) return handleAction(act, ev);

  // 2) Fallback: confere texto do botão/link (sem acentos / caixa)
  const txt = (target.textContent || '').trim().toLowerCase();
  if (['+ ingrediente', 'novo ingrediente', 'cadastrar ingrediente', 'add ingrediente'].some(t => txt.includes(t))) {
    return handleAction('add-ingredient', ev);
  }
  if (['+ nova tarefa', 'nova tarefa', 'add tarefa', 'adicionar tarefa'].some(t => txt.includes(t))) {
    return handleAction('new-task', ev);
  }
  if (['+ nova ficha', 'nova ficha', 'nova ficha técnica', 'add ficha'].some(t => txt.includes(t))) {
    return handleAction('new-recipe', ev);
  }
});

function handleAction(action, ev) {
  ev.preventDefault();
  try {
    if (action === 'add-ingredient') return createIngredientQuick();
    if (action === 'new-task')        return createTaskQuick();
    if (action === 'new-recipe')      return createRecipeQuick();
  } catch (e) {
    console.error(e);
    alert('Erro: ' + e.message);
  }
}

// =========== START ===========
console.log('App pronto. Firestore conectado, botões ligados.');
// Carrega contadores no dashboard, se existir:
refreshIngredientsCount();
refreshTasksCount();
refreshRecipesCount();
