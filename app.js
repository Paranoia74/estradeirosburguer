// app.js — SPA vanilla + Firebase (CDN v10 modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Import local config (you must copy firebase-config.example.js -> firebase-config.js and fill values)
import { firebaseConfig } from './firebase-config.js';

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Simple state
const state = {
  user: null,
  unsubscribers: [],
};

// Auth (anonymous) – requires enabling Anonymous sign-in in Firebase Console
onAuthStateChanged(auth, (u) => {
  state.user = u;
  document.getElementById('authState').textContent = u ? 'Conectado' : 'Desconectado';
  if (!u) signInAnonymously(auth).catch(console.error);
  else router();
});

// Basic router
const routes = {
  '#/dashboard': renderDashboard,
  '#/kanban': renderKanban,
  '#/ingredientes': renderIngredientes,
  '#/receitas': renderReceitas,
  '#/custos': renderCustos,
  '#/sobre': renderSobre,
};

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  if (!location.hash) location.hash = '#/dashboard';
  document.getElementById('btnSync').addEventListener('click', () => router(true));
});

function clearSubs(){
  state.unsubscribers.forEach(u => u());
  state.unsubscribers = [];
}

async function router(force=false){
  const view = document.getElementById('view');
  const hash = location.hash;
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href')===hash));
  clearSubs();
  if (routes[hash]) {
    view.innerHTML = '<div class="card">Carregando...</div>';
    await routes[hash](view, force);
  } else {
    view.innerHTML = '<div class="card">Não encontrado.</div>';
  }
}

// Utils
function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);
  Object.entries(attrs||{}).forEach(([k,v])=>{
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k==='html') el.innerHTML = v;
    else el.setAttribute(k,v);
  });
  children.flat().forEach(c => {
    if (c instanceof Node) el.appendChild(c);
    else if (c!=null) el.appendChild(document.createTextNode(c));
  });
  return el;
}

function openModal(title, bodyNode, onConfirm){
  const dlg = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = title;
  const body = document.getElementById('modalBody');
  body.innerHTML = '';
  body.appendChild(bodyNode);
  const confirmBtn = document.getElementById('modalConfirm');
  const handler = (ev)=>{
    if (ev.target.returnValue==='confirm') onConfirm?.();
    confirmBtn.removeEventListener('click', handler);
  };
  confirmBtn.addEventListener('click', handler);
  dlg.showModal();
  dlg.addEventListener('close', ()=>{
    confirmBtn.removeEventListener('click', handler);
  }, {once:true});
}

// ---------- Dashboard ----------
async function renderDashboard(view){
  // Summaries
  const [tasksSnap, ingSnap, recSnap] = await Promise.all([
    getDocs(collection(db, 'tasks')),
    getDocs(collection(db, 'ingredients')),
    getDocs(collection(db, 'recipes')),
  ]);
  const tasks = tasksSnap.docs.map(d=>({id:d.id, ...d.data()}));
  const ingredients = ingSnap.docs.map(d=>({id:d.id, ...d.data()}));
  const recipes = recSnap.docs.map(d=>({id:d.id, ...d.data()}));

  const byStatus = {todo:0, doing:0, done:0};
  tasks.forEach(t=>byStatus[t.status||'todo']=(byStatus[t.status||'todo']||0)+1);

  view.innerHTML = '';
  view.append(
    h('div',{class:'grid cols-3'},
      h('div',{class:'card'}, h('h3',{},'Tarefas'), h('p',{}, `A Fazer: ${byStatus.todo||0}`), h('p',{}, `Fazendo: ${byStatus.doing||0}`), h('p',{}, `Prontas: ${byStatus.done||0}`)),
      h('div',{class:'card'}, h('h3',{},'Ingredientes'), h('p',{}, `${ingredients.length} ingredientes cadastrados`)),
      h('div',{class:'card'}, h('h3',{},'Receitas / Fichas Técnicas'), h('p',{}, `${recipes.length} fichas`)),
    ),
    h('div',{class:'card'},
      h('h3',{},'Atalhos'),
      h('div',{}, 
        h('button',{class:'btn',onClick:()=>location.hash='#/kanban'},'Abrir Kanban'),
        ' ',
        h('button',{class:'btn',onClick:()=>location.hash='#/ingredientes'},'Cadastrar Ingrediente'),
        ' ',
        h('button',{class:'btn',onClick:()=>location.hash='#/receitas'},'Nova Ficha Técnica'),
      ),
      h('p',{class:'small'},'Dica: arraste as tarefas entre colunas no Kanban para atualizar o status em tempo real.')
    )
  );
}

// ---------- Kanban ----------
async function renderKanban(view){
  view.innerHTML = '';
  const wrapper = h('div',{}, 
    h('div',{class:'card'},
      h('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:12px'},
        h('h2',{},'Quadro Kanban'),
        h('div',{}, h('button',{class:'btn', onClick:()=>openTaskModal()},'+ Nova tarefa'))
      ),
      h('div',{class:'kanban', id:'kanban'},
        column('todo','Backlog'),
        column('doing','Em Progresso'),
        column('done','Concluído'),
      )
    )
  );
  view.append(wrapper);

  function column(status, title){
    const col = h('div',{class:'column', 'data-status':status},
      h('h3',{}, title),
      h('div',{class:'dropzone', onDragOver:(e)=>e.preventDefault(), onDrop:onDrop})
    );
    return col;
  }

  function renderTask(t){
    const el = h('div',{class:'task', draggable:true, 'data-id':t.id, onDragStart:(e)=>{
      e.dataTransfer.setData('text/plain', t.id);
    }}, 
      h('strong',{}, t.title||'Sem título'),
      h('div',{class:'meta'},
        h('span',{}, t.assignee||'Sem responsável'),
        h('span',{}, t.dueDate? new Date(t.dueDate).toLocaleDateString() : '')
      ),
      h('div',{}, h('button',{class:'btn ghost small', onClick:()=>openTaskModal(t)},'Editar'))
    );
    return el;
  }

  function onDrop(e){
    const id = e.dataTransfer.getData('text/plain');
    const status = e.currentTarget.parentElement.getAttribute('data-status');
    updateDoc(doc(db, 'tasks', id), {status});
  }

  // real-time
  const q = query(collection(db,'tasks'), orderBy('createdAt','asc'));
  const unsub = onSnapshot(q, (snap)=>{
    const lists = {
      todo: wrapper.querySelector('[data-status="todo"] .dropzone'),
      doing: wrapper.querySelector('[data-status="doing"] .dropzone'),
      done: wrapper.querySelector('[data-status="done"] .dropzone'),
    };
    Object.values(lists).forEach(l=>l.innerHTML='');
    snap.forEach(docSnap=>{
      const t = {id:docSnap.id, ...docSnap.data()};
      (lists[t.status||'todo']||lists.todo).appendChild(renderTask(t));
    });
  });
  state.unsubscribers.push(unsub);
}

function openTaskModal(task={title:'', status:'todo'}){
  const body = h('div',{},
    h('label',{},'Título', h('input',{id:'tTitle', value: task.title||''})),
    h('label',{},'Responsável', h('input',{id:'tAssignee', value: task.assignee||''})),
    h('label',{},'Prazo', h('input',{id:'tDue', type:'date', value: task.dueDate? new Date(task.dueDate).toISOString().slice(0,10):''})),
    h('label',{},'Status', h('select',{id:'tStatus'},
      h('option',{value:'todo', selected: task.status==='todo'},'Backlog'),
      h('option',{value:'doing', selected: task.status==='doing'},'Em Progresso'),
      h('option',{value:'done', selected: task.status==='done'},'Concluído'),
    )),
    h('label',{},'Descrição', h('textarea',{id:'tDesc', rows:4}, task.description||'')),
  );
  openModal(task.id? 'Editar tarefa':'Nova tarefa', body, async ()=>{
    const payload = {
      title: document.getElementById('tTitle').value.trim(),
      assignee: document.getElementById('tAssignee').value.trim()||null,
      dueDate: document.getElementById('tDue').value? new Date(document.getElementById('tDue').value).toISOString(): null,
      status: document.getElementById('tStatus').value,
      description: document.getElementById('tDesc').value.trim()||null,
      createdAt: task.createdAt || Date.now(),
    };
    if (task.id) await updateDoc(doc(db,'tasks',task.id), payload);
    else await addDoc(collection(db,'tasks'), payload);
  });
}

// ---------- Ingredientes ----------
async function renderIngredientes(view){
  view.innerHTML = '';
  const snap = await getDocs(query(collection(db,'ingredients'), orderBy('name','asc')));
  const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
  const table = h('table',{class:'table'},
    h('thead',{}, h('tr',{}, h('th',{},'Nome'), h('th',{},'Unid.'), h('th',{},'Custo/Unid'), h('th',{},'Ações'))),
    h('tbody',{}, items.map(row=>trIng(row)))
  );
  const addBtn = h('button',{class:'btn', onClick:()=>openIngModal()}, '+ Ingrediente');
  view.append(h('div',{class:'card'}, h('h2',{},'Ingredientes'), addBtn, table));
  function trIng(row){
    return h('tr',{},
      h('td',{},row.name),
      h('td',{},row.unit),
      h('td',{}, `R$ ${Number(row.unitCost||0).toFixed(2)}`),
      h('td',{}, h('button',{class:'btn ghost', onClick:()=>openIngModal(row)},'Editar'))
    );
  }
  function openIngModal(ing={name:'', unit:'g', unitCost:0}){
    const body = h('div',{},
      h('label',{},'Nome', h('input',{id:'iName', value:ing.name||''})),
      h('label',{},'Unidade (ex: g, ml, un)', h('input',{id:'iUnit', value:ing.unit||'g'})),
      h('label',{},'Custo por unidade', h('input',{id:'iCost', type:'number', step:'0.01', value:ing.unitCost||0})),
    );
    openModal(ing.id? 'Editar ingrediente':'Novo ingrediente', body, async ()=>{
      const payload = {
        name: document.getElementById('iName').value.trim(),
        unit: document.getElementById('iUnit').value.trim(),
        unitCost: Number(document.getElementById('iCost').value||0),
      };
      if (ing.id) await updateDoc(doc(db,'ingredients', ing.id), payload);
      else await addDoc(collection(db,'ingredients'), payload);
      router(true);
    });
  }
}

// ---------- Receitas / Fichas Técnicas ----------
async function renderReceitas(view){
  view.innerHTML = '';
  const snap = await getDocs(query(collection(db,'recipes'), orderBy('name','asc')));
  const recipes = snap.docs.map(d=>({id:d.id, ...d.data()}));
  const list = h('div',{}, ...recipes.map(r=>recipeCard(r)));
  const addBtn = h('button',{class:'btn', onClick:()=>openRecipeModal()}, '+ Nova ficha técnica');
  view.append(h('div',{class:'card'}, h('h2',{},'Fichas Técnicas'), addBtn, list));

  function recipeCard(r){
    const cost = Number(calcRecipeCost(r)).toFixed(2);
    const price = Number(suggestedPrice(r)).toFixed(2);
    return h('div',{class:'card'},
      h('div',{style:'display:flex; justify-content:space-between; align-items:center'},
        h('h3',{}, r.name),
        h('div',{}, h('button',{class:'btn ghost', onClick:()=>openRecipeModal(r)},'Editar'))
      ),
      h('p',{}, r.description||''),
      h('p',{}, `Rendimento: ${r.yieldAmount||1} ${r.yieldUnit||'un'}`),
      h('table',{class:'table'},
        h('thead',{}, h('tr',{}, h('th',{},'Ingrediente'), h('th',{},'Qtd'), h('th',{},'Unid'), h('th',{},'Custo'))),
        h('tbody',{}, ...(r.items||[]).map(it=>h('tr',{},
          h('td',{}, it.ingredientName || it.ingredientId),
          h('td',{}, it.qty),
          h('td',{}, it.unit),
          h('td',{}, `R$ ${(it.cost||0).toFixed(2)}`),
        ))),
      ),
      h('p',{}, `Custo total: R$ ${cost}`),
      h('p',{}, `Preço sugerido (markup ${(r.markup||2)}x + embalagem R$${(r.packaging||0).toFixed(2)} + overhead ${(r.overheadPct||0.1)*100}%): R$ ${price}`)
    );
  }

  async function openRecipeModal(rec={name:'', items:[], yieldAmount:1, yieldUnit:'un', markup:2, packaging:2.00, overheadPct:0.1}){
    // Build ingredient options
    const ingSnap = await getDocs(collection(db,'ingredients'));
    const ings = ingSnap.docs.map(d=>({id:d.id, ...d.data()}));
    const container = h('div',{});
    function renderItems(){
      const tbl = h('table',{class:'table'},
        h('thead',{}, h('tr',{}, h('th',{},'Ingrediente'), h('th',{},'Qtd'), h('th',{},'Un'), h('th',{},' '))),
        h('tbody',{}, ...(rec.items||[]).map((it,idx)=>row(it,idx)))
      );
      return tbl;
    }
    function row(it, idx){
      const sel = h('select',{}, ...ings.map(i=>h('option',{value:i.id, selected: i.id===it.ingredientId}, i.name)));
      const qty = h('input',{type:'number', step:'any', value:it.qty||0});
      const unit = h('input',{value: it.unit || (ings.find(i=>i.id===it.ingredientId)?.unit || 'g')});
      return h('tr',{},
        h('td',{}, sel),
        h('td',{}, qty),
        h('td',{}, unit),
        h('td',{}, h('button',{class:'btn danger', onClick:()=>{rec.items.splice(idx,1); rerender();}},'Remover'))
      );
    }
    function rerender(){
      container.innerHTML = '';
      container.append(
        h('label',{},'Nome', h('input',{id:'rName', value:rec.name||''})),
        h('label',{},'Descrição', h('textarea',{id:'rDesc', rows:3}, rec.description||'')),
        h('div',{class:'grid cols-3'},
          h('label',{},'Rendimento (quantidade)', h('input',{id:'rYieldAmount', type:'number', step:'any', value:rec.yieldAmount||1})),
          h('label',{},'Rendimento (unidade)', h('input',{id:'rYieldUnit', value:rec.yieldUnit||'un'})),
          h('label',{},'Markup (multiplicador)', h('input',{id:'rMarkup', type:'number', step:'any', value:rec.markup||2})),
        ),
        h('div',{class:'grid cols-3'},
          h('label',{},'Embalagem (R$)', h('input',{id:'rPack', type:'number', step:'0.01', value:rec.packaging||0})),
          h('label',{},'Overhead (%)', h('input',{id:'rOver', type:'number', step:'any', value:(rec.overheadPct||0)*100})),
          h('div',{}, h('button',{class:'btn', onClick:()=>{rec.items = rec.items||[]; rec.items.push({ingredientId:ings[0]?.id, qty:0, unit:ings[0]?.unit || 'g'}); rerender();}}, '+ Item')),
        ),
        h('div',{}, renderItems()),
      );
    }
    rerender();
    openModal(rec.id? 'Editar ficha técnica' : 'Nova ficha técnica', container, async ()=>{
      // Map to items with cost pre-calculated for convenience
      const name = document.getElementById('rName').value.trim();
      const description = document.getElementById('rDesc').value.trim();
      const yieldAmount = Number(document.getElementById('rYieldAmount').value||1);
      const yieldUnit = document.getElementById('rYieldUnit').value.trim();
      const markup = Number(document.getElementById('rMarkup').value||2);
      const packaging = Number(document.getElementById('rPack').value||0);
      const overheadPct = Number(document.getElementById('rOver').value||0)/100;
      const normalizedItems = (rec.items||[]).map(it=>{
        const ing = ings.find(i=>i.id===it.ingredientId);
        const unitCost = ing?.unitCost||0;
        const cost = unitCost * Number(it.qty||0);
        return {ingredientId:it.ingredientId, ingredientName: ing?.name||null, qty:Number(it.qty||0), unit:it.unit||ing?.unit||'g', cost};
      });
      const payload = {name, description, items: normalizedItems, yieldAmount, yieldUnit, markup, packaging, overheadPct, updatedAt: Date.now()};
      if (rec.id) await updateDoc(doc(db,'recipes', rec.id), payload);
      else await addDoc(collection(db,'recipes'), payload);
      router(true);
    });
  }
}

function calcRecipeCost(r){
  return (r.items||[]).reduce((sum,it)=> sum + Number(it.cost||0), 0) * (1 + (r.overheadPct||0)) + Number(r.packaging||0);
}

function suggestedPrice(r){
  return calcRecipeCost(r) * Number(r.markup||2);
}

// ---------- Custos & Preços ----------
async function renderCustos(view){
  const rs = await getDocs(query(collection(db,'recipes'), orderBy('name','asc')));
  const recipes = rs.docs.map(d=>({id:d.id, ...d.data()}));
  const table = h('table',{class:'table'},
    h('thead',{}, h('tr',{}, h('th',{},'Produto'), h('th',{},'Custo'), h('th',{},'Preço sugerido'), h('th',{},'Markup'), h('th',{},'Ações'))),
    h('tbody',{}, ...recipes.map(r=>row(r)))
  );
  view.innerHTML = '';
  view.append(h('div',{class:'card'}, h('h2',{},'Custos & Preços'), table));
  function row(r){
    const cost = calcRecipeCost(r);
    const price = suggestedPrice(r);
    return h('tr',{},
      h('td',{}, r.name),
      h('td',{}, `R$ ${cost.toFixed(2)}`),
      h('td',{}, `R$ ${price.toFixed(2)}`),
      h('td',{}, `${(r.markup||2)}x`),
      h('td',{}, h('button',{class:'btn ghost', onClick:()=>location.hash='#/receitas'},'Abrir ficha'))
    );
  }
}

// ---------- Sobre ----------
async function renderSobre(view){
  view.innerHTML = '';
  view.append(
    h('div',{class:'card'},
      h('h2',{},'Sobre o sistema'),
      h('p',{},'Painel simples em Vanilla JS conectado ao Firebase (Auth anônimo + Firestore).'),
      h('ul',{}, 
        h('li',{},'Kanban arrasta-e-solta com 3 colunas.'),
        h('li',{},'Cadastro de ingredientes.'),
        h('li',{},'Fichas técnicas com cálculo automático de custo e preço sugerido.'),
        h('li',{},'Página de custos consolidada.'),
      ),
      h('p',{class:'small'},'Crie o arquivo firebase-config.js a partir do exemplo e ative o Sign-in anônimo.')
    )
  );
}
