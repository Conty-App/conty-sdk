<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: script tag

Troque `cpk_SUA_CHAVE` pela sua chave pública de eventos e abra `index.html` com UTMs na URL, por exemplo `?utm_campaign=verao&utm_content=cr_abc12345`. A chave secreta (`cev_...`) nunca vai para o navegador: com ela, o SDK não manda nada e avisa no console.
A tag guarda a atribuição sozinha. O stub `{ q: [] }` guarda os `track` feitos antes de o script carregar, então o botão funciona desde o primeiro clique.
Compra com valor sai do servidor, com o `@conty/node`. Para servir a página, rode `npm start` nesta pasta.
