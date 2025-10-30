# Estradeiros Burger — Painel Web (Firebase + Vanilla JS)

Painel simples para gerenciar **Kanban**, **Ingredientes**, **Fichas Técnicas** e **Custos & Preços** da sua hamburgueria. Pronto para publicar no GitHub Pages ou qualquer hosting estático.

## 🚀 Como rodar

1) **Crie um projeto Firebase** e ative **Authentication > Anonymous** e **Firestore Database** (modo production).  
2) Baixe/clon e este repo e copie `firebase-config.example.js` para `firebase-config.js` com os dados do seu projeto.
3) **(Opcional)** Revise as regras em `rules.firestore.txt` e publique no console do Firebase.
4) Abra `index.html` num servidor estático (ex: VSCode Live Server) ou publique no GitHub Pages.

> O app usa SDK via CDN, então não precisa de build. É literalmente abrir o `index.html`.

## 🧱 Coleções (Firestore)

- `ingredients` → { name, unit, unitCost }
- `tasks` → { title, status: "todo|doing|done", description?, assignee?, dueDate?, createdAt }
- `recipes` → { name, description?, items:[{ ingredientId, ingredientName, qty, unit, cost }], yieldAmount, yieldUnit, packaging, overheadPct, markup, updatedAt }

## 📦 Seed automático
O `seed.js` roda na primeira carga e cria **ingredientes**, **tarefas** e **receitas** de exemplo se as coleções estiverem vazias.

## 💸 Fórmulas de custo e preço
- **Custo da receita** = soma(items.cost) × (1 + overheadPct) + packaging  
- **Preço sugerido** = custo × markup

Você pode ajustar **markup**, **overheadPct** e **packaging** por receita.

## 🧩 Dicas
- Ative o login anônimo em Auth.
- Para bloquear acesso público, mantenha as regras como `auth != null` e compartilhe somente a URL com quem precisa.
- Quer multiusuário? Dá para evoluir adicionando `orgId` nos docs e regras que restringem por `request.auth.uid`/`orgId`.

---

Feito com 💚 para o **Estradeiros Burger**.
