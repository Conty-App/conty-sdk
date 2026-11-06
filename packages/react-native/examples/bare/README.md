<img alt="Conty SDK" src="../../../../.github/assets/banner.png" width="100%">

# Exemplo: React Native (bare)

Copie `index.js` e `App.tsx` para um app criado com `npx @react-native-community/cli init MeuApp` e troque `cpk_SUA_CHAVE` pela sua chave pública. A chave secreta (`cev_...`) fica só no servidor: no app ela é ignorada.
O `init` roda uma vez antes do `registerComponent`. Configure os deep links do app como na documentação de Linking do React Native.
O `package.json` desta pasta instala o pacote local por `file:../..` e fica fora dos workspaces da raiz.
O `metro.config.js` observa o pacote fora da pasta e resolve `react-native` e o async-storage só do `node_modules` deste exemplo; copie-o junto para o app.
