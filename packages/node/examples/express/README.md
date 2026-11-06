<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: webhook com Express

Recebe o pagamento aprovado, confere o corpo e manda `purchase` com o valor para a Conty, com até 3 novas tentativas em 429, 5xx, falha de rede e tempo esgotado.
Usa a chave secreta (`cev_...`), que só existe no servidor. O exemplo fica fora dos workspaces da raiz e instala o `@conty/node` local por `file:../..`: rode `npm install` e `npm run build` na raiz, depois `npm install` e `CONTY_EVENT_KEY=cev_... npm start` nesta pasta.
Teste com `curl -X POST localhost:3000/webhooks/pagamento -H 'Content-Type: application/json' -d '{"id":"pedido-1","totalCents":15990,"utmCampaign":"verao","utmContent":"cr_948643af"}'`.
