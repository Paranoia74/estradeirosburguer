import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { runSeed } from './seed.js';

function showError(msg){
  const v = document.getElementById('view');
  if (v) v.innerHTML = `<div class="card"><strong>Erro:</strong> ${msg}<br><span class="small">Confira o arquivo <code>firebase-config.js</code> e se Auth Anônimo + Firestore estão ativos.</span></div>`;
  console.error('[EB]', msg);
}
let app; try{ app = initializeApp(firebaseConfig); }catch(e){ showError('Config Firebase ausente ou inválida.'); throw e; }
const auth = getAuth(app); const db = getFirestore(app);

const state={user:null,unsub:[]};
onAuthStateChanged(auth,(u)=>{
  state.user=u; document.getElementById('authState').textContent=u?'Conectado':'Desconectado';
  if(!u) signInAnonymously(auth).catch(err=>showError(err.message));
  else { router(); document.dispatchEvent(new Event('eb:ready')); }
});

const routes={'#/dashboard':renderDashboard,'#/kanban':renderKanban,'#/ingredientes':renderIngredientes,'#/receitas':renderReceitas,'#/custos':renderCustos,'#/sobre':renderSobre};
window.addEventListener('hashchange',router);
window.addEventListener('load',()=>{ if(!location.hash) location.hash='#/dashboard'; document.getElementById('btnSync').addEventListener('click',()=>router(true)); });
function clearSubs(){state.unsub.forEach(u=>u()); state.unsub=[];}
async function router(force=false){ const v=document.getElementById('view'); const hsh=location.hash; document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===hsh)); clearSubs(); if(routes[hsh]){ v.innerHTML='<div class="card">Carregando...</div>'; try{ await routes[hsh](v,force);}catch(e){showError(e.message);} } else v.innerHTML='<div class="card">Não encontrado.</div>'; }
function h(tag,attrs={},...children){const el=document.createElement(tag); Object.entries(attrs||{}).forEach(([k,v])=>{if(k.startsWith('on')&&typeof v==='function')el.addEventListener(k.slice(2),v); else if(k==='html')el.innerHTML=v; else el.setAttribute(k,v)}); children.flat().forEach(c=>el.appendChild(c instanceof Node?c:document.createTextNode(c))); return el;}

// Dashboard
async function renderDashboard(v){
  const [tasks,ings,recs]=await Promise.all([getDocs(collection(db,'tasks')).then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),getDocs(collection(db,'ingredients')).then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),getDocs(collection(db,'recipes')).then(s=>s.docs.map(d=>({id:d.id,...d.data()})))]);
  const by={todo:0,doing:0,done:0}; tasks.forEach(t=>by[t.status||'todo']=(by[t.status||'todo']||0)+1);
  v.innerHTML=''; v.append(h('div',{class:'grid cols-3'},h('div',{class:'card'},h('h3',{},'Tarefas'),h('p',{},`A Fazer: ${by.todo||0}`),h('p',{},`Fazendo: ${by.doing||0}`),h('p',{},`Prontas: ${by.done||0}`)),h('div',{class:'card'},h('h3',{},'Ingredientes'),h('p',{},`${ings.length} itens`)),h('div',{class:'card'},h('h3',{},'Fichas Técnicas'),h('p',{},`${recs.length} fichas`))),h('div',{class:'card'},h('h3',{},'Atalhos'),h('div',{},h('button',{class:'btn',onClick:()=>location.hash='#/kanban'},'Abrir Kanban'),' ',h('button',{class:'btn',onClick:()=>location.hash='#/ingredientes'},'Cadastrar Ingrediente'),' ',h('button',{class:'btn',onClick:()=>location.hash='#/receitas'},'Nova Ficha')),h('p',{class:'small'},'Dica: arraste as tarefas entre colunas.')));
}

// Kanban
async function renderKanban(v){
  v.innerHTML='';
  const board=h('div',{class:'kanban'},column('todo','Backlog'),column('doing','Em Progresso'),column('done','Concluído'));
  v.append(h('div',{class:'card'},h('div',{style:'display:flex;justify-content:space-between;align-items:center'},h('h2',{},'Quadro Kanban'),h('button',{class:'btn',onClick:()=>openTaskModal()},'+ Nova tarefa')),board));
  function column(status,title){return h('div',{class:'column','data-status':status},h('h3',{},title),h('div',{class:'drop',onDragOver:e=>e.preventDefault(),onDrop:onDrop}));}
  function taskEl(t){return h('div',{class:'task',draggable:true,'data-id':t.id,onDragStart:e=>e.dataTransfer.setData('text/plain',t.id)},h('strong',{},t.title||'Sem título'),h('div',{class:'meta'},h('span',{},t.assignee||'Sem responsável'),h('span',{},t.dueDate?new Date(t.dueDate).toLocaleDateString():'')),h('div',{},h('button',{class:'btn ghost small',onClick:()=>openTaskModal(t)},'Editar')));}
  function onDrop(e){const id=e.dataTransfer.getData('text/plain'); const s=e.currentTarget.parentElement.getAttribute('data-status'); updateDoc(doc(db,'tasks',id),{status:s});}
  const unsub=onSnapshot(query(collection(db,'tasks'), orderBy('createdAt','asc')), snap=>{
    const zones={todo:board.querySelector('[data-status="todo"] .drop'),doing:board.querySelector('[data-status="doing"] .drop'),done:board.querySelector('[data-status="done"] .drop')}; Object.values(zones).forEach(z=>z.innerHTML='');
    snap.forEach(s=>{const t={id:s.id,...s.data()}; (zones[t.status||'todo']||zones.todo).appendChild(taskEl(t));});
  }); state.unsub.push(unsub);
}
function openTaskModal(task={title:'',status:'todo'}){
  const b=h('div',{},h('label',{},'Título',h('input',{id:'tTitle',value:task.title||''})),h('label',{},'Responsável',h('input',{id:'tAssignee',value:task.assignee||''})),h('label',{},'Prazo',h('input',{id:'tDue',type:'date',value:task.dueDate?new Date(task.dueDate).toISOString().slice(0,10):''})),h('label',{},'Status',h('select',{id:'tStatus'},h('option',{value:'todo',selected:task.status==='todo'},'Backlog'),h('option',{value:'doing',selected:task.status==='doing'},'Em Progresso'),h('option',{value:'done',selected:task.status==='done'},'Concluído'))),h('label',{},'Descrição',h('textarea',{id:'tDesc',rows:4},task.description||'')));
  openModal(task.id?'Editar tarefa':'Nova tarefa',b,async()=>{
    const payload={title:document.getElementById('tTitle').value.trim(),assignee:document.getElementById('tAssignee').value.trim()||null,dueDate:document.getElementById('tDue').value?new Date(document.getElementById('tDue').value).toISOString():null,status:document.getElementById('tStatus').value,description:document.getElementById('tDesc').value.trim()||null,createdAt:task.createdAt||Date.now()};
    if(task.id) await updateDoc(doc(db,'tasks',task.id),payload); else await addDoc(collection(db,'tasks'),payload);
  });
}

// Ingredientes
async function renderIngredientes(v){
  const snap=await getDocs(query(collection(db,'ingredients'), orderBy('name','asc')));
  const items=snap.docs.map(d=>({id:d.id,...d.data()}));
  const table=h('table',{class:'table'},h('thead',{},h('tr',{},h('th',{},'Nome'),h('th',{},'Unid.'),h('th',{},'Custo/Unid'),h('th',{},'Ações'))),h('tbody',{},...items.map(row=>h('tr',{},h('td',{},row.name),h('td',{},row.unit),h('td',{},`R$ ${Number(row.unitCost||0).toFixed(2)}`),h('td',{},h('button',{class:'btn ghost',onClick:()=>openIngModal(row)},'Editar'))))));
  const addBtn=h('button',{class:'btn',onClick:()=>openIngModal()},'+ Ingrediente');
  v.innerHTML=''; v.append(h('div',{class:'card'},h('h2',{},'Ingredientes'),addBtn,table));
  function openIngModal(ing={name:'',unit:'g',unitCost:0}){
    const b=h('div',{},h('label',{},'Nome',h('input',{id:'iName',value:ing.name||''})),h('label',{},'Unidade (g, ml, un...)',h('input',{id:'iUnit',value:ing.unit||'g'})),h('label',{},'Custo por unidade',h('input',{id:'iCost',type:'number',step:'0.01',value:ing.unitCost||0})));
    openModal(ing.id?'Editar ingrediente':'Novo ingrediente',b,async()=>{
      const payload={name:document.getElementById('iName').value.trim(),unit:document.getElementById('iUnit').value.trim(),unitCost:Number(document.getElementById('iCost').value||0)};
      if(ing.id) await updateDoc(doc(db,'ingredients',ing.id),payload); else await addDoc(collection(db,'ingredients'),payload); router(true);
    });
  }
}

// Receitas
function calcRecipeCost(r){return (r.items||[]).reduce((s,it)=>s+Number(it.cost||0),0)*(1+(r.overheadPct||0))+Number(r.packaging||0)}
function suggestedPrice(r){return calcRecipeCost(r)*Number(r.markup||2)}
async function renderReceitas(v){
  const rs=await getDocs(query(collection(db,'recipes'), orderBy('name','asc'))); const recipes=rs.docs.map(d=>({id:d.id,...d.data()}));
  v.innerHTML=''; const cards=recipes.map(r=>{const cost=calcRecipeCost(r).toFixed(2),price=suggestedPrice(r).toFixed(2); return h('div',{class:'card'},h('div',{style:'display:flex;justify-content:space-between;align-items:center'},h('h3',{},r.name),h('button',{class:'btn ghost',onClick:()=>openRecipeModal(r)},'Editar')),h('p',{},r.description||''),h('p',{},`Rendimento: ${r.yieldAmount||1} ${r.yieldUnit||'un'}`),h('table',{class:'table'},h('thead',{},h('tr',{},h('th',{},'Ingrediente'),h('th',{},'Qtd'),h('th',{},'Un'),h('th',{},'Custo'))),h('tbody',{},...(r.items||[]).map(it=>h('tr',{},h('td',{},it.ingredientName||it.ingredientId),h('td',{},it.qty),h('td',{},it.unit),h('td',{},`R$ ${(it.cost||0).toFixed(2)}`))))),h('p',{},`Custo total: R$ ${cost}`),h('p',{},`Preço sugerido: R$ ${price} (markup ${r.markup||2}x)`));});
  v.append(h('div',{class:'card'},h('h2',{},'Fichas Técnicas'),h('button',{class:'btn',onClick:()=>openRecipeModal()},'+ Nova ficha'),...cards));

  async function openRecipeModal(rec={name:'',items:[],yieldAmount:1,yieldUnit:'un',markup:2.5,packaging:2,overheadPct:0.1}){
    const ingSnap=await getDocs(collection(db,'ingredients')); const ings=ingSnap.docs.map(d=>({id:d.id,...d.data()}));
    const container=h('div',{});
    function row(it,idx){const sel=h('select',{},...ings.map(i=>h('option',{value:i.id,selected:i.id===it.ingredientId},i.name))); const qty=h('input',{type:'number',step:'any',value:it.qty||0}); const unit=h('input',{value:it.unit||(ings.find(i=>i.id===it.ingredientId)?.unit||'g')}); return h('tr',{},h('td',{},sel),h('td',{},qty),h('td',{},unit),h('td',{},h('button',{class:'btn danger',onClick:()=>{rec.items.splice(idx,1); render();}},'Remover')));}
    function render(){container.innerHTML=''; container.append(h('label',{},'Nome',h('input',{id:'rName',value:rec.name||''})),h('label',{},'Descrição',h('textarea',{id:'rDesc',rows:3},rec.description||'')),h('div',{class:'grid cols-3'},h('label',{},'Rendimento (qtde)',h('input',{id:'rYA',type:'number',step:'any',value:rec.yieldAmount||1})),h('label',{},'Rendimento (unidade)',h('input',{id:'rYU',value:rec.yieldUnit||'un'})),h('label',{},'Markup (x)',h('input',{id:'rMk',type:'number',step:'any',value:rec.markup||2.5}))),h('div',{class:'grid cols-3'},h('label',{},'Embalagem (R$)',h('input',{id:'rPk',type:'number',step:'0.01',value:rec.packaging||0})),h('label',{},'Overhead (%)',h('input',{id:'rOh',type:'number',step:'any',value:(rec.overheadPct||0)*100})),h('div',{},h('button',{class:'btn',onClick:()=>{rec.items=rec.items||[]; rec.items.push({ingredientId:ings[0]?.id,qty:0,unit:ings[0]?.unit||'g'}); render();}},'+ Item'))),h('table',{class:'table'},h('thead',{},h('tr',{},h('th',{},'Ingrediente'),h('th',{},'Qtd'),h('th',{},'Un'),h('th',{},' '))),h('tbody',{},...(rec.items||[]).map((it,idx)=>row(it,idx)))) );}
    render();
    openModal(rec.id?'Editar ficha':'Nova ficha',container,async()=>{
      const name=document.getElementById('rName').value.trim(); const description=document.getElementById('rDesc').value.trim(); const yieldAmount=Number(document.getElementById('rYA').value||1); const yieldUnit=document.getElementById('rYU').value.trim(); const markup=Number(document.getElementById('rMk').value||2); const packaging=Number(document.getElementById('rPk').value||0); const overheadPct=Number(document.getElementById('rOh').value||0)/100;
      const normalized=(rec.items||[]).map(it=>{const ing=ings.find(i=>i.id===it.ingredientId); const cost=(ing?.unitCost||0)*Number(it.qty||0); return {ingredientId:it.ingredientId,ingredientName:ing?.name||null,qty:Number(it.qty||0),unit:it.unit||ing?.unit||'g',cost};});
      const payload={name,description,items:normalized,yieldAmount,yieldUnit,markup,packaging,overheadPct,updatedAt:Date.now()};
      if(rec.id) await updateDoc(doc(db,'recipes',rec.id),payload); else await addDoc(collection(db,'recipes'),payload); router(true);
    });
  }
}

// Custos
async function renderCustos(v){
  const rs=await getDocs(query(collection(db,'recipes'), orderBy('name','asc'))); const recipes=rs.docs.map(d=>({id:d.id,...d.data()}));
  const table=h('table',{class:'table'},h('thead',{},h('tr',{},h('th',{},'Produto'),h('th',{},'Custo'),h('th',{},'Preço sugerido'),h('th',{},'Markup'),h('th',{},'Ações'))),h('tbody',{},...recipes.map(r=>h('tr',{},h('td',{},r.name),h('td',{},`R$ ${calcRecipeCost(r).toFixed(2)}`),h('td',{},`R$ ${suggestedPrice(r).toFixed(2)}`),h('td',{},`${r.markup||2}x`),h('td',{},h('button',{class:'btn ghost',onClick:()=>location.hash='#/receitas'},'Abrir ficha'))))));
  v.innerHTML=''; v.append(h('div',{class:'card'},h('h2',{},'Custos & Preços'),table));
}

// Sobre (com Forçar Seed)
async function renderSobre(v){
  v.innerHTML=''; v.append(h('div',{class:'card'},h('h2',{},'Sobre o sistema'),h('p',{},'Vanilla JS + Firebase.'),h('ul',{},h('li',{},'Kanban 3 colunas com arraste.'),h('li',{},'Ingredientes e fichas com custo e preço.'),h('li',{},'Custos consolidados.')),h('div',{},h('button',{class:'btn',id:'seedBtn'},'Forçar Seed (popular dados)')),h('p',{class:'small'},'Use apenas para testes; adiciona itens se já existir dado.'))); document.getElementById('seedBtn').addEventListener('click',async()=>{ try{ await runSeed(true); router(true);}catch(e){showError(e.message);} });
}

function openModal(title, bodyNode, onConfirm){ const dlg=document.getElementById('modal'); document.getElementById('modalTitle').textContent=title; const body=document.getElementById('modalBody'); body.innerHTML=''; body.append(bodyNode); const confirm=document.getElementById('modalConfirm'); const handler=(ev)=>{ if(ev.target.returnValue==='confirm') onConfirm?.(); confirm.removeEventListener('click',handler); }; confirm.addEventListener('click',handler); dlg.showModal(); dlg.addEventListener('close',()=>confirm.removeEventListener('click',handler),{once:true}); }
