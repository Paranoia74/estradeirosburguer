// Estradeiros Burguer — SEED COMPLETO
// - Idempotente (não duplica por "name")
// - Usa app já inicializado pelo app.js (ou inicia se preciso)
// - Firestore CDN v10.12.2

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

// Reusa app existente (evita "Firebase App named '[DEFAULT]' already exists")
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Helpers -----------------------------------------------

async function upsertByName(colName, item) {
  const col = collection(db, colName);
  const q = query(col, where('name', '==', item.name));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(col, item);
    return true;
  }
  // já existe → não duplica
  return false;
}

async function getByName(colName, name) {
  const q = query(collection(db, colName), where('name', '==', name));
  const s = await getDocs(q);
  if (s.empty) return null;
  const d = s.docs[0];
  return { id: d.id, ...d.data() };
}

function cost(ing, qty) {
  // custo = unitCost * quantidade (quando a unidade é g/ml usamos custo por 1g/ml)
  return Number((ing?.unitCost || 0) * qty);
}

function now() { return Date.now(); }

// SEED --------------------------------------------------

export async function runSeed(force = false) {
  console.log('[SEED] iniciando... force:', force);

  // 1) INGREDIENTES ------------------------------------
  const ingredientes = [
    // Pães
    { name: 'Pão brioche 80g', unit: 'un', unitCost: 1.90 },
    { name: 'Pão australiano 90g', unit: 'un', unitCost: 2.20 },
    { name: 'Pão de batata 80g', unit: 'un', unitCost: 2.00 },
    // Proteínas / Blends
    { name: 'Blend bovino 160g', unit: 'un', unitCost: 5.80 },
    { name: 'Blend suíno 160g (toscana+filé mignon suíno)', unit: 'un', unitCost: 5.20 },
    { name: 'Costela bovina desfiada 120g', unit: 'un', unitCost: 7.40 },
    { name: 'Frango empanado crispy 140g', unit: 'un', unitCost: 4.90 },
    { name: 'Smash bovino 90g', unit: 'un', unitCost: 3.10 },
    { name: 'Hambúrguer soja+beterraba 120g', unit: 'un', unitCost: 2.40 },
    // Queijos
    { name: 'Queijo prato 25g', unit: 'un', unitCost: 0.95 },
    { name: 'Queijo cheddar 20g', unit: 'un', unitCost: 0.90 },
    { name: 'Queijo muçarela 25g', unit: 'un', unitCost: 0.92 },
    { name: 'Cream cheese 20g', unit: 'g', unitCost: 0.055 },
    // Molhos / Cremes
    { name: 'Maionese da casa 25g', unit: 'g', unitCost: 0.035 },
    { name: 'Barbecue 20g', unit: 'g', unitCost: 0.048 },
    { name: 'Mostarda e mel 20g', unit: 'g', unitCost: 0.050 },
    { name: 'Ketchup 20g', unit: 'g', unitCost: 0.030 },
    // Complementos
    { name: 'Bacon 30g', unit: 'g', unitCost: 0.065 },
    { name: 'Cebola caramelizada 30g', unit: 'g', unitCost: 0.042 },
    { name: 'Cebola roxa 10g', unit: 'g', unitCost: 0.020 },
    { name: 'Tomate 30g', unit: 'g', unitCost: 0.018 },
    { name: 'Alface 10g', unit: 'g', unitCost: 0.015 },
    { name: 'Picles 10g', unit: 'g', unitCost: 0.055 },
    { name: 'Pimenta jalapeño 8g', unit: 'g', unitCost: 0.075 },
    { name: 'Manteiga 10g', unit: 'g', unitCost: 0.022 },
    // Embalagens
    { name: 'Embalagem hambúrguer', unit: 'un', unitCost: 1.30 },
    { name: 'Embalagem combo', unit: 'un', unitCost: 2.10 },
  ];

  let createdIngs = 0;
  if (force) {
    // força popular: tentamos inserir todos (upsert cuida para não duplicar)
    for (const ing of ingredientes) {
      const ok = await upsertByName('ingredients', ing);
      if (ok) createdIngs++;
    }
  } else {
    // só insere se estiver vazio
    const snap = await getDocs(collection(db, 'ingredients'));
    if (snap.empty) {
      for (const ing of ingredientes) {
        await addDoc(collection(db, 'ingredients'), ing);
        createdIngs++;
      }
    }
  }
  console.log([SEED] ingredientes ok (${createdIngs} inseridos));

  // 2) KANBAN / TAREFAS --------------------------------
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
    // Cozinha / Produção
    'Preparar lote de maionese da casa (padrão)',
    'Produzir cebola caramelizada (rendimento)',
    'Padronizar corte de tomate e alface',
    'Produzir molho barbecue da casa',
    'Testar porcionamento do bacon',
    'Padronizar tostagem do brioche',
    'Avaliar textura do veggie soja+beterraba',
    'Ajustar blend suíno (toscana + filé mignon)',
    'Definir uso de pão australiano no Costela BBQ',
    'Revisar uso de cream cheese no Special',
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
    'Criar campanha “Aquecendo a chapa”',
    'Configurar Google Meu Negócio',
    'Ajustar link na bio do Instagram',
    'Criar artes de stories com bastidores',
    // Financeiro / Precificação
    'Definir margem alvo (65%) por produto',
    'Revisar markup mínimo por família',
    'Calcular preço sugerido do Cheeseburguer',
    'Calcular preço sugerido do Cheddar Bacon',
    'Calcular preço sugerido do Suíno 160g',
    'Calcular preço sugerido do Veggie',
    'Calcular preço sugerido do Costela BBQ',
    'Calcular preço sugerido do Frango Crispy',
    'Calcular preço sugerido do Smash Duplo',
    'Calcular preço sugerido do Special',
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
    // Marketing extra
    'Abrir Instagram @estradeirosburguer',
    'Publicar teaser “Vem coisa boa…”',
    'Publicar contagem regressiva da abertura',
    'Responder directs e comentários',
    // Pós-abertura
    'Coletar feedback dos 50 primeiros pedidos',
    'Ajustar produção conforme demanda',
    'Revisar tempos de preparo no pico',
    'Planejar edição 2 do cardápio (sazonal)',
    'Testar lote maior de cebola caramelizada',
    'Negociar redução de custo do brioche',
    'Planejar ação com influencers locais',
  ];

  // mapeia em objetos (status alternado pra espalhar colunas)
  const taskObjs = tarefas.map((t, i) => ({
    title: t,
    status: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'doing' : 'done',
    assignee: null,
    createdAt: now()
  }));

  let createdTasks = 0;
  if (force) {
    for (const t of taskObjs) {
      // upsert por título
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
  console.log([SEED] tarefas ok (${createdTasks} inseridas));

  // 3) FICHAS TÉCNICAS ---------------------------------
  // busca ingredientes por nome (já inseridos acima)
  const ing = {};
  for (const i of ingredientes) {
    ing[i.name] = await getByName('ingredients', i.name);
  }

  function recItem(name, qty, unit) {
    const found = ing[name];
    return {
      ingredientId: found?.id || null,
      ingredientName: name,
      qty,
      unit,
      cost: unit === 'un' ? (found?.unitCost || 0) * qty : cost(found, qty)
    };
  }

  const receitas = [
    {
      name: 'Cheeseburguer Estradeiros (bovino)',
      description: 'Brioche, blend bovino 160g, queijo prato, maionese da casa.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Blend bovino 160g', 1, 'un'),
        recItem('Queijo prato 25g', 1, 'un'),
        recItem('Maionese da casa 25g', 25, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Cheddar Bacon',
      description: 'Brioche, blend bovino 160g, cheddar e bacon crocante.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Blend bovino 160g', 1, 'un'),
        recItem('Queijo cheddar 20g', 1, 'un'),
        recItem('Bacon 30g', 30, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Clássico Suíno 160g',
      description: 'Blend suíno (toscana + filé mignon suíno), brioche, queijo prato e maionese.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Blend suíno 160g (toscana+filé mignon suíno)', 1, 'un'),
        recItem('Queijo prato 25g', 1, 'un'),
        recItem('Maionese da casa 25g', 25, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Veggie da Estrada',
      description: 'Hambúrguer de soja com beterraba 120g, brioche, cheddar e picles.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Hambúrguer soja+beterraba 120g', 1, 'un'),
        recItem('Queijo cheddar 20g', 1, 'un'),
        recItem('Picles 10g', 10, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Costela BBQ',
      description: 'Pão australiano, costela desfiada 120g, barbecue, cebola caramelizada.',
      items: [
        recItem('Pão australiano 90g', 1, 'un'),
        recItem('Costela bovina desfiada 120g', 1, 'un'),
        recItem('Barbecue 20g', 20, 'g'),
        recItem('Cebola caramelizada 30g', 30, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.12, markup: 2.7, updatedAt: now()
    },
    {
      name: 'Frango Crispy',
      description: 'Pão de batata, frango empanado, maionese da casa, alface e tomate.',
      items: [
        recItem('Pão de batata 80g', 1, 'un'),
        recItem('Frango empanado crispy 140g', 1, 'un'),
        recItem('Maionese da casa 25g', 25, 'g'),
        recItem('Alface 10g', 10, 'g'),
        recItem('Tomate 30g', 30, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Smash Duplo',
      description: 'Duplo smash 90g (2x), queijo muçarela e picles.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Smash bovino 90g', 2, 'un'),
        recItem('Queijo muçarela 25g', 1, 'un'),
        recItem('Picles 10g', 10, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.10, markup: 2.6, updatedAt: now()
    },
    {
      name: 'Estradeiros Special',
      description: 'Brioche, blend bovino 160g, bacon, cream cheese e cebola roxa.',
      items: [
        recItem('Pão brioche 80g', 1, 'un'),
        recItem('Blend bovino 160g', 1, 'un'),
        recItem('Bacon 30g', 30, 'g'),
        recItem('Cream cheese 20g', 20, 'g'),
        recItem('Cebola roxa 10g', 10, 'g'),
        recItem('Embalagem hambúrguer', 1, 'un'),
      ],
      yieldAmount: 1, yieldUnit: 'un', packaging: 0, overheadPct: 0.12, markup: 2.7, updatedAt: now()
    },
  ];

  let createdRec = 0;
  for (const r of receitas) {
    const ok = await upsertByName('recipes', r);
    if (ok) createdRec++;
  }
  console.log([SEED] receitas ok (${createdRec} inseridas));

  console.log('[SEED] concluído.');
  try { alert('Seed concluído ✅'); } catch (_) {}
}

// Executa automaticamente no primeiro load (não força)
(async () => {
  try { await runSeed(false); } catch (e) { /* silencioso */ }
})();
