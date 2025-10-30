// seed.js — popula dados iniciais se o banco estiver vazio
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async function seed(){
  try{
    const ingSnap = await getDocs(collection(db,'ingredients'));
    if (ingSnap.empty){
      const baseIngs = [
        {name:'Pão brioche 80g', unit:'un', unitCost:1.80},
        {name:'Blend bovino 160g', unit:'un', unitCost:5.50},
        {name:'Queijo prato 25g', unit:'un', unitCost:0.90},
        {name:'Queijo cheddar 20g', unit:'un', unitCost:0.85},
        {name:'Bacon 30g', unit:'g', unitCost:0.06},
        {name:'Manteiga 10g', unit:'g', unitCost:0.02},
        {name:'Maionese da casa 25g', unit:'g', unitCost:0.03},
        {name:'Cebola caramelizada 30g', unit:'g', unitCost:0.04},
        {name:'Picles 10g', unit:'g', unitCost:0.05},
        {name:'Embalagem hambúrguer', unit:'un', unitCost:1.20},
      ];
      for(const ing of baseIngs){ await addDoc(collection(db,'ingredients'), ing); }
      console.log('Ingredientes de exemplo criados');
    }

    const taskSnap = await getDocs(collection(db,'tasks'));
    if (taskSnap.empty){
      const tasks = [
        {title:'Definir cardápio inicial', status:'todo', createdAt:Date.now(), assignee:'Vitor'},
        {title:'Cadastrar fornecedores', status:'doing', createdAt:Date.now(), assignee:'Vitor'},
        {title:'Testar ponto do blend', status:'doing', createdAt:Date.now(), assignee:'Cozinha', dueDate:new Date().toISOString()},
        {title:'Criar Instagram @estradeirosburger', status:'done', createdAt:Date.now(), assignee:'Marketing'},
      ];
      for(const t of tasks){ await addDoc(collection(db,'tasks'), t); }
      console.log('Tarefas de exemplo criadas');
    }

    const recSnap = await getDocs(collection(db,'recipes'));
    if (recSnap.empty){
      // We'll need to read back ingredient ids to reference
      const ings = (await getDocs(collection(db,'ingredients'))).docs.map(d=>({id:d.id, ...d.data()}));
      const byName = (n)=> ings.find(i=>i.name===n);
      const burger = {
        name:'Cheeseburger Estradeiros',
        description:'Pão brioche, blend 160g, queijo prato, maionese da casa.',
        items:[
          {ingredientId: byName('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost: byName('Pão brioche 80g')?.unitCost||0},
          {ingredientId: byName('Blend bovino 160g')?.id, ingredientName:'Blend bovino 160g', qty:1, unit:'un', cost: byName('Blend bovino 160g')?.unitCost||0},
          {ingredientId: byName('Queijo prato 25g')?.id, ingredientName:'Queijo prato 25g', qty:1, unit:'un', cost: byName('Queijo prato 25g')?.unitCost||0},
          {ingredientId: byName('Maionese da casa 25g')?.id, ingredientName:'Maionese da casa 25g', qty:25, unit:'g', cost: (byName('Maionese da casa 25g')?.unitCost||0)*25},
          {ingredientId: byName('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost: byName('Embalagem hambúrguer')?.unitCost||0},
        ],
        yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.5, updatedAt:Date.now()
      };
      const bacon = {
        name:'Cheddar Bacon',
        description:'Pão brioche, blend 160g, cheddar, bacon e maionese.',
        items:[
          {ingredientId: byName('Pão brioche 80g')?.id, ingredientName:'Pão brioche 80g', qty:1, unit:'un', cost: byName('Pão brioche 80g')?.unitCost||0},
          {ingredientId: byName('Blend bovino 160g')?.id, ingredientName:'Blend bovino 160g', qty:1, unit:'un', cost: byName('Blend bovino 160g')?.unitCost||0},
          {ingredientId: byName('Queijo cheddar 20g')?.id, ingredientName:'Queijo cheddar 20g', qty:1, unit:'un', cost: byName('Queijo cheddar 20g')?.unitCost||0},
          {ingredientId: byName('Bacon 30g')?.id, ingredientName:'Bacon 30g', qty:30, unit:'g', cost: (byName('Bacon 30g')?.unitCost||0)*30},
          {ingredientId: byName('Embalagem hambúrguer')?.id, ingredientName:'Embalagem hambúrguer', qty:1, unit:'un', cost: byName('Embalagem hambúrguer')?.unitCost||0},
        ],
        yieldAmount:1, yieldUnit:'un', packaging:0, overheadPct:0.1, markup:2.6, updatedAt:Date.now()
      };
      await addDoc(collection(db,'recipes'), burger);
      await addDoc(collection(db,'recipes'), bacon);
      console.log('Receitas de exemplo criadas');
    }
  }catch(e){
    console.warn('Seed falhou', e);
  }
})();
