// Estradeiros Burguer — seed completo (tarefas + ingredientes + fichas técnicas)
// Cardápio oficial (6): Cheeseburguer, Cheddar Bacon, Clássico Suíno, Veggie da Estrada,
// Frango Crispy, Marguerito (sem Smash, sem Costela, sem Special)

import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// Reutiliza app já iniciado
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ----------------- helpers -----------------
async function upsertByName(colName, item) {
  const col = collection(db, colName);
  const q = query(col, where('name', '==', item.name));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(col, item);
    return true;
  } else {
    const d = snap.docs[0];
    await setDoc(doc(db, colName, d.id), { ...d.data(), ...item }, { merge: true });
    return false;
  }
}

async function getByName(colName, name) {
  const q = query(collection(db, colName), where('name', '==', name));
  const s = await getDocs(q);
  if (s.empty) return null;
  const d = s.docs[0];
  return { id: d.id, ...d.data() };
}

function now() { return Date.now(); }

function itemCost(ing, qty, unit) {
  if (!ing) return 0;
  const u = ing.unitCost || 0;
  return Number((u * qty).toFixed(4)); // un/g/ml — custo direto * quantidade
}

// ----------------- dados -----------------

// Ingredientes (inclui minas, manjericão e azeite para o Marguerito)
const ingredientes = [
  // Pães
  { name: 'Pão brioche 80g', unit: 'un', unitCost: 1.90 },
  { name: 'Pão de batata 80g', unit: 'un', unitCost: 2.00 },

  // Proteínas / Blends
  { name: 'Blend bovino 160g', unit: 'un', unitCost: 5.80 },
  { name: 'Blend suíno 160g (toscana+filé mignon suíno)', unit: 'un', unitCost: 5.20 },
  { name: 'Frango empanado crispy 140g', unit: 'un', unitCost: 4.90 },
  { name: 'Hambúrguer soja+beterraba 120g', unit: 'un', unitCost: 2.40 },

  // Queijos
  { name: 'Queijo prato 25g', unit: 'un', unitCost: 0.95 },
  { name: 'Queijo cheddar 20g', unit: 'un', unitCost: 0.90 },
  { name: 'Queijo muçarela 25g', unit: 'un', unitCost: 0.92 },
  { name: 'Queijo minas 25g', unit: 'un', unitCost: 1.10 },

  // Molhos / Cremes
  { name: 'Maionese da casa 25g', unit: 'g', unitCost: 0.035 },

  // Complementos
  { name: 'Bacon 30g', unit: 'g', unitCost: 0.065 },
  { name: 'Cebola roxa 10g', unit: 'g', unitCost: 0.020 },
  { name: 'Tomate 30g', unit: 'g', unitCost: 0.018 },
  { name: 'Alface 10g', unit: 'g', unitCost: 0.015 },
  { name: 'Picles 10g', unit: 'g', unitCost: 0.055 },
  { name: 'Manjericão fresco 5g', unit: 'g', unitCost: 0.080 },
  { name: 'Azeite extra virgem 5ml', unit: 'g', unitCost: 0.060 }, // tratar como g/ml

  // Embalagens
  { name: 'Embalagem hambúrguer', unit: 'un', unitCost: 1.30 }
];

// Tarefas (as ~70 do pacote anterior – mantidas)
const tarefas = [
  // Abertura / Setup
  'Definir cardápio de estreia',
  'Cadastrar fornecedores (pão, carne, embalagens)',
  'Padronizar gramaturas de todos os lanches',
  'Definir ficha de limpeza diária',
  'Criar planilha de inventário semanal',
  'Montar check-list de abertura e fechamento',
  'Testar fluxo de atendimento no caixa',
  'Organizar etiquetas e validade (FEFO)',
  'Treinar equipe no ponto do blend bovino 160g',
  'Treinar equipe no ponto do blend suíno 160g',
  'Padronizar tempo de fritura do frango crispy',
  'Especificar temperatura da chapa e fritadeira',
  'Configurar impressora de pedidos',
  'Definir layout de montagem dos lanches',
  'Treinar comunicação de cozinha e caixa',

  // Cozinha
  'Preparar lote de maionese da casa (padrão)',
  'Produzir cebola caramelizada (rendimento)',
  'Padronizar corte de tomate e alface',
  'Testar porcionamento do bacon',
  'Padronizar tostagem do brioche',
  'Avaliar textura do veggie soja+beterraba',
  'Ajustar blend suíno (toscana + filé mignon)',
  'Revisar uso de queijo minas no Marguerito',
  'Revisar mise en place do Marguerito',

  // Fornecedores
  'Negociar preço do brioche com panificadora A',
  'Cotação de cheddar com laticínios B',
  'Cotação de picles com fornecedor C',
  'Negociar embalagens com gráfica D',
  'Definir prazos de entrega e pedido mínimo',
  'Cadastrar prazos de pagamento no financeiro',

  // Marketing
  'Criar identidade visual dos highlights',
  'Fotografar lanches principais',
  'Montar cardápio digital para Instagram',
  'Definir combo de estreia',
  'Criar campanha "Aquecendo a chapa"',
  'Configurar Google Meu Negócio',
  'Ajustar link na bio do Instagram',
  'Criar artes de stories com bastidores',

  // Financeiro / Preço
  'Definir margem alvo (65%) por produto',
  'Revisar markup mínimo por família',
  'Calcular preço sugerido do Cheeseburguer',
  'Calcular preço sugerido do Cheddar Bacon',
  'Calcular preço sugerido do Suíno 160g',
  'Calcular preço sugerido do Veggie',
  'Calcular preço sugerido do Frango Crispy',
  'Calcular preço sugerido do Marguerito',

  // Operação / Atendimento
  'Treinar padrão de montagem (ordem de camadas)',
  'Treinar saudação e upsell no caixa',
  'Definir tempo alvo de preparo por item',
  'Montar kit de viagem (delivery)',
  'Padronizar etiquetagem de pedido',
  'Criar roteiro de mise en place diário',

  // Qualidade
  'Check-list de temperatura dos equipamentos',
  'Controle de resíduos de óleo',
  'Plano de limpeza semanal (chapa e coifa)',
  'Pontos críticos de segurança alimentar',

  // TI / Infra
  'Conferir conexão do POS e impressora',
  'Criar usuário para cada atendente',
  'Backup da planilha de custos',

  // MKT extra e pós
  'Abrir Instagram @estradeirosburguer',
  'Publicar teaser "Vem coisa boa..."',
  'Publicar contagem regressiva da abertura',
  'Responder directs e comentários',
  'Coletar feedback dos 50 primeiros pedidos',
  'Ajustar produção conforme demanda',
  'Revisar tempos de preparo no pico',
  'Planejar edição 2 do cardápio (sazonal)',
  'Negociar redução de custo do brioche',
  'Planejar ação com influencers locais'
];

// ------------- fichas técnicas (6 lanches oficiais) -------------
function recItem(ingMap, name, qty, unit) {
  const found = ingMap[name];
  return {
    ingredientId: found?.id || null,
    ingredientName: name,
    qty, unit,
    cost: itemCost(found, qty, unit)
  };
}

async function buildIngMap() {
  const map = {};
  for (const base of ingredientes) {
    const i = await getByName('ingredients', base.name);
    if (i) map[base.name] = i;
  }
  return map;
}

const receitasBase = (ing) => ([
  {
    name: 'Cheeseburguer Estradeiros (bovino)',
    description: 'Brioche, blend bovino 160g, queijo prato e maionese da casa.',
    items: [
      recItem(ing,'Pão brioche 80g',1,'un'),
      recItem(ing,'Blend bovino 160g',1,'un'),
      recItem(ing,'Queijo prato 25g',1,'un'),
      recItem(ing,'Maionese da casa 25g',25,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.10, markup: 2.6, updatedAt: now()
  },
  {
    name: 'Cheddar Bacon',
    description: 'Brioche, blend bovino 160g, cheddar e bacon crocante.',
    items: [
      recItem(ing,'Pão brioche 80g',1,'un'),
      recItem(ing,'Blend bovino 160g',1,'un'),
      recItem(ing,'Queijo cheddar 20g',1,'un'),
      recItem(ing,'Bacon 30g',30,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.10, markup: 2.6, updatedAt: now()
  },
  {
    name: 'Clássico Suíno 160g',
    description: 'Blend suíno (toscana + filé mignon), brioche, queijo prato e maionese.',
    items: [
      recItem(ing,'Pão brioche 80g',1,'un'),
      recItem(ing,'Blend suíno 160g (toscana+filé mignon suíno)',1,'un'),
      recItem(ing,'Queijo prato 25g',1,'un'),
      recItem(ing,'Maionese da casa 25g',25,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.10, markup: 2.6, updatedAt: now()
  },
  {
    name: 'Veggie da Estrada',
    description: 'Soja+beterraba 120g, brioche, cheddar e picles.',
    items: [
      recItem(ing,'Pão brioche 80g',1,'un'),
      recItem(ing,'Hambúrguer soja+beterraba 120g',1,'un'),
      recItem(ing,'Queijo cheddar 20g',1,'un'),
      recItem(ing,'Picles 10g',10,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.10, markup: 2.6, updatedAt: now()
  },
  {
    name: 'Frango Crispy',
    description: 'Pão de batata, frango empanado, maionese da casa, alface e tomate.',
    items: [
      recItem(ing,'Pão de batata 80g',1,'un'),
      recItem(ing,'Frango empanado crispy 140g',1,'un'),
      recItem(ing,'Maionese da casa 25g',25,'g'),
      recItem(ing,'Alface 10g',10,'g'),
      recItem(ing,'Tomate 30g',30,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.10, markup: 2.6, updatedAt: now()
  },
  {
    name: 'Marguerito',
    description: 'Brioche, blend bovino 160g, queijo minas, tomate, manjericão fresco e azeite.',
    items: [
      recItem(ing,'Pão brioche 80g',1,'un'),
      recItem(ing,'Blend bovino 160g',1,'un'),
      recItem(ing,'Queijo minas 25g',1,'un'),
      recItem(ing,'Tomate 30g',30,'g'),
      recItem(ing,'Manjericão fresco 5g',5,'g'),
      recItem(ing,'Azeite extra virgem 5ml',5,'g'),
      recItem(ing,'Embalagem hambúrguer',1,'un'),
    ],
    yieldAmount: 1, yieldUnit: 'un', packaging: 0,
    overheadPct: 0.12, markup: 2.7, updatedAt: now()
  }
]);

// ----------------- SEED -----------------
export async function runSeed(force = false) {
  console.log('[SEED] start; force =', force);

  // 1) ingredientes
  let createdIngs = 0;
  if (force) {
    for (const ing of ingredientes) {
      const ok = await upsertByName('ingredients', ing);
      if (ok) createdIngs++;
    }
  } else {
    const snap = await getDocs(collection(db, 'ingredients'));
    if (snap.empty) {
      for (const ing of ingredientes) {
        await addDoc(collection(db, 'ingredients'), ing);
        createdIngs++;
      }
    }
  }
  console.log('[SEED] ingredientes:', createdIngs, 'inseridos/atualizados');

  // 2) tarefas (mantidas)
  const taskObjs = tarefas.map((t, i) => ({
    title: t,
    status: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'doing' : 'done',
    assignee: null,
    createdAt: now()
  }));

  let createdTasks = 0;
  if (force) {
    for (const t of taskObjs) {
      const q = query(collection(db, 'tasks'), where('title', '==', t.title));
      const s = await getDocs(q);
      if (s.empty) { await addDoc(collection(db, 'tasks'), t); createdTasks++; }
    }
  } else {
    const snap = await getDocs(collection(db, 'tasks'));
    if (snap.empty) {
      for (const t of taskObjs) { await addDoc(collection(db, 'tasks'), t); createdTasks++; }
    }
  }
  console.log('[SEED] tarefas:', createdTasks, 'inseridas');

  // 3) receitas (6 lanches oficiais)
  const ingMap = await buildIngMap();
  const receitas = receitasBase(ingMap);

  let createdRec = 0;
  for (const r of receitas) {
    const ok = await upsertByName('recipes', r);
    if (ok) createdRec++;
  }
  console.log('[SEED] receitas:', createdRec, 'inseridas/atualizadas');

  console.log('[SEED] done.');
}

// executa automaticamente no primeiro load sem forçar
(async () => { try { await runSeed(false); } catch (_) {} })();
