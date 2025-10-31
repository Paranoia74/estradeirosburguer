// Seed de dados — exporta runSeed(force)
import {
  getFirestore, collection, getDocs, addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  initializeApp, getApps, getApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { firebaseConfig } from './firebase-config.js';

// ⚠️ Usa o app já existente (evita erro de "app already exists")
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// LOG para ajudar a depurar
console.log('[SEED] pronto para popular…');

export async function runSeed(force=false){
  console.log('[SEED] executando, force=', force);

  // Ingredientes base
  const ingSnap = await getDocs(collection(db,'ingredients'));
  if (force || ingSnap.empty){
    console.log('[SEED] populando ingredients…');
    const baseIngs = [
      {name:'Pão brioche 80g', unit:'un', unitCost:1.90},
      {name:'Blend bovino 160g', unit:'un', unitCost:5.80},
      {name:'Blend suíno 160g (toscana+filé mignon suíno)', unit:'un', unitCost:5.20},
      {name:'Queijo prato 25g', unit:'un', unitCost:0.95},
      {name:'Queijo cheddar 20g', unit:'un', unitCost:0.90},
      {name:'Bacon 30g', unit:'g', unitCost:0.065},
      {name:'Maionese da casa 25g', unit:'g', unitCost:0.035},
      {name:'Cebola caramelizada 30g', unit:'g', unitCost:0.042},
      {name:'Picles 10g', unit:'g', unitCost:0.055},
      {name:'Manteiga 10g', unit:'g', unitCost:0.022},
      {name:'Hambúrguer soja+beterraba 120g', unit:'un', unitCost:2.40},
      {name:'Embalagem hambúrguer', unit:'un', unitCost:1.30},
      {name:'Embalagem combo', unit:'un', unitCost:2.10},
    ];
    for (const ing of baseIngs){ await addDoc(collection(db,'ingredients'), ing); }
  }

  // Kanban
  const taskSnap = await getDocs(collection(db,'tasks'));
  if (force || taskSnap.empty){
    console.log('[SEED] populando tasks…');
    const tasks = [
      {title:'Definir cardápio de estreia', status:'todo', assignee:'Vitor', createdAt:Date.now()},
      {title:'Cadastrar fornecedores (pão, carne, embalagens)', status:'doing', assignee:'Vitor', createdAt:Date.now()},
      {title:'Testar ponto do blend suíno 160g', status:'doing', assignee:'Cozinha', createdAt:Date.now()},
      {title:'Abrir Instagram @estradeirosburguer', status:'done', assignee:'Marketing', createdAt:Date.now()},
      {title:'Precificar combos com margem alvo 65%', status:'todo', assignee:'Financeiro', createdAt:Date.now()},
    ];
    for (const t of tasks){ await addDoc(collection(db,'tasks'), t); }
  }

  // Receitas
  const recSnap = await getDocs(collection(db,'recipes'));
  if (force || recSnap.empty){
    console.log('[SEED] populando recipes…');
    const ings = (await getDocs(collection(db,'ingredients'))).docs.map(d=>({id:d.id,...d.data()}));
    const by = (n)=> ings.find(i=>i.name===n);
    const recipes = [
      {name:'Cheeseburguer Estradeiros (bovino)', description:'Brioche, blend bovino 160g, queijo prato, maionese da casa.',
       items:[
        {ingredientId:by('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost:by('Pão brioche 80g')?.unitCost||0},
        {ingredientId:by('Blend bovino 160g')?.id, ingredientName:'Blend bovino 160g', qty:1, unit:'un', cost:by('Blend bovino 160g')?.unitCost||0},
        {ingredientId:by('Queijo prato 25g')?.id, ingredientName:'Queijo prato 25g', qty:1, unit:'un', cost:by('Queijo prato 25g')?.unitCost||0},
        {ingredientId:by('Maionese da casa 25g')?.id, ingredientName:'Maionese da casa 25g', qty:25, unit:'g', cost:(by('Maionese da casa 25g')?.unitCost||0)*25},
        {ingredientId:by('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost:by('Embalagem hambúrguer')?.unitCost||0},
       ],
       yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.6, updatedAt:Date.now()
      },
      {name:'Cheddar Bacon', description:'Brioche, blend bovino 160g, cheddar e bacon crocante.',
       items:[
        {ingredientId:by('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost:by('Pão brioche 80g')?.unitCost||0},
        {ingredientId:by('Blend bovino 160g')?.id, ingredientName:'Blend bovino 160g', qty:1, unit:'un', cost:by('Blend bovino 160g')?.unitCost||0},
        {ingredientId:by('Queijo cheddar 20g')?.id, ingredientName:'Queijo cheddar 20g', qty:1, unit:'un', cost:by('Queijo cheddar 20g')?.unitCost||0},
        {ingredientId:by('Bacon 30g')?.id, ingredientName:'Bacon 30g', qty:30, unit:'g', cost:(by('Bacon 30g')?.unitCost||0)*30},
        {ingredientId:by('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost:by('Embalagem hambúrguer')?.unitCost||0},
       ],
       yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.6, updatedAt:Date.now()
      },
      {name:'Clássico Suíno 160g', description:'Blend suíno (toscana + filé mignon suíno), brioche, queijo prato e maionese.',
       items:[
        {ingredientId:by('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost:by('Pão brioche 80g')?.unitCost||0},
        {ingredientId:by('Blend suíno 160g (toscana+filé mignon suíno)')?.id, ingredientName:'Blend suíno 160g (toscana+filé mignon suíno)', qty:1, unit:'un', cost:by('Blend suíno 160g (toscana+filé mignon suíno)')?.unitCost||0},
        {ingredientId:by('Queijo prato 25g')?.id, ingredientName:'Queijo prato 25g', qty:1, unit:'un', cost:by('Queijo prato 25g')?.unitCost||0},
        {ingredientId:by('Maionese da casa 25g')?.id, ingredientName:'Maionese da casa 25g', qty:25, unit:'g', cost:(by('Maionese da casa 25g')?.unitCost||0)*25},
        {ingredientId:by('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost:by('Embalagem hambúrguer')?.unitCost||0},
       ],
       yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.6, updatedAt:Date.now()
      },
      {name:'Veggie da Estrada', description:'Hambúrguer de soja com beterraba 120g, brioche, cheddar e picles.',
       items:[
        {ingredientId:by('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost:by('Pão brioche 80g')?.unitCost||0},
        {ingredientId:by('Hambúrguer soja+beterraba 120g')?.id, ingredientName:'Hambúrguer soja+beterraba 120g', qty:1, unit:'un', cost:by('Hambúrguer soja+beterraba 120g')?.unitCost||0},
        {ingredientId:by('Queijo cheddar 20g')?.id, ingredientName:'Queijo cheddar 20g', qty:1, unit:'un', cost:by('Queijo cheddar 20g')?.unitCost||0},
        {ingredientId:by('Picles 10g')?.id, ingredientName:'Picles 10g', qty:10, unit:'g', cost:(by('Picles 10g')?.unitCost||0)*10},
        {ingredientId:by('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost:by('Embalagem hambúrguer')?.unitCost||0},
       ],
       yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.6, updatedAt:Date.now()
      },
    ];
    for (const r of recipes){ await addDoc(collection(db,'recipes'), r); }
  }

  console.log('[SEED] finalizado ✅');
}

// Remova a autoexecução se quiser; deixa o botão controlar
// (async()=>{ try{ await runSeed(false); } catch(e){ console.warn('[SEED] ignorado:', e.message); } })();
