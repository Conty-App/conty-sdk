<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: Expo

O `init` fica no `app/_layout.tsx`, com a chave pública (`cpk_...`), e o SDK lê sozinho o deep link que abriu o app. O botão manda `begin_checkout`. A compra com valor sai do servidor, com o `@conty/node` e a chave secreta.

O exemplo não faz parte dos workspaces da raiz: ele instala o `@conty/react-native` local por `file:../..`. Rode `npm install` e `npm run build` na raiz do repositório, depois `npm install` e `EXPO_PUBLIC_CONTY_KEY=cpk_... npm start` nesta pasta.
Com o app aberto no simulador, teste o deep link com `npx uri-scheme open "minhaloja://?utm_campaign=verao&utm_content=cr_abc12345" --ios`.
O `metro.config.js` observa o pacote fora da pasta e resolve `react-native` e o async-storage só do `node_modules` deste exemplo.
