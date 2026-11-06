<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: script de reenvio

Manda vários pedidos de uma vez com `trackBatch`. O SDK divide em lotes de 100 eventos e 120 KB, e `null` nos campos opcionais é ignorado. Se um lote falhar, `error.accepted` diz quantos eventos dos lotes anteriores já entraram.
Usa a chave secreta (`cev_...`). O exemplo fica fora dos workspaces da raiz e instala o `@conty/node` local por `file:../..`: rode `npm install` e `npm run build` na raiz, depois `npm install` e `CONTY_EVENT_KEY=cev_... npm start` nesta pasta.
