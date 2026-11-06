<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: Next.js

O `init` fica em `instrumentation-client.ts`, que o Next roda no navegador antes do app, com a chave pública (`cpk_...`). O botão manda `begin_checkout`. A compra com valor sai do servidor, com o `@conty/node` e a chave secreta (veja o [exemplo de webhook](../../../node/examples/express)).

O exemplo não faz parte dos workspaces da raiz: ele instala o `@conty/web` local por `file:../..`. Rode `npm install` e `npm run build` na raiz do repositório, depois `npm install` e `NEXT_PUBLIC_CONTY_KEY=cpk_... npm run dev` nesta pasta.
