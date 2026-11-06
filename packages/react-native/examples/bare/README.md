<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: React Native (bare)

Copie `index.js` e `App.tsx` para um app criado com `npx @react-native-community/cli init MeuApp` e troque `cpk_SUA_CHAVE` pela sua chave pública. A chave secreta (`cev_...`) fica só no servidor: no app ela é ignorada.
O `init` roda uma vez antes do `registerComponent`. Configure os deep links do app como na documentação de Linking do React Native.
O `package.json` desta pasta instala o pacote local por `file:../..` e fica fora dos workspaces da raiz.
O `metro.config.js` existe só para este exemplo resolver o SDK direto deste repositório: ele observa o pacote fora da pasta e resolve `react-native` e o async-storage do `node_modules` do exemplo. Não copie esse arquivo. Um app real instala `@conty/react-native` pelo npm e usa o `metro.config.js` padrão gerado pela CLI.
