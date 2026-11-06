<p>
  <picture>
    <img alt="Conty SDK: atribuição de creator do clique à compra" src="../../.github/assets/banner.png" width="100%">
  </picture>
</p>

# @conty/react-native

SDK de React Native e Expo da [Conty](https://appconty.com) para eventos de conversão com atribuição de creator.

<p>
  <a href="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Conty-App/conty-sdk/blob/main/LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-2073df"></a>
</p>

- Lê `utm_source`, `utm_medium`, `utm_campaign` e `utm_content` do deep link que abriu o app e dos links recebidos com o app aberto. Guarda por 30 dias. Vale o último toque com creator: só guarda quando o link traz `utm_campaign` e o `utm_content` é o código de um creator (`cr_` seguido de 8 caracteres hexadecimais, como `cr_948643af`, ou o id do creator). Um link só de campanha ou sem `utm_campaign` não apaga a atribuição guardada.
- Usa só a chave pública (`cpk_...`). A chave secreta (`cev_...`) fica no servidor: no app ela é ignorada.
- Guarda a atribuição no AsyncStorage (`conty_attribution`) ou no armazenamento que você passar.
- Os `track` feitos antes do `init`, ou antes de o armazenamento carregar, ficam na fila e saem quando o SDK fica pronto, em lotes de até 100 eventos e 120 KB, um depois do outro. Cada um espera até 10 segundos: sem `init` nesse tempo, a promessa resolve com `undefined` e o evento é descartado. A fila guarda até 100 eventos antes do `init`; os seguintes são descartados na hora e a promessa resolve com `undefined`.
- Gera o `external_id` sozinho quando você não passa um.
- Manda `$os` (`Platform.OS`) e `$os_version` (`Platform.Version`, em texto) em `properties` de todo evento. Valores seus com o mesmo nome têm prioridade.
- Sem dependência de runtime própria. Pesa cerca de 3,2 KB com gzip.

## Instalação

```bash
npm install @conty/react-native @react-native-async-storage/async-storage
```

O `@react-native-async-storage/async-storage` é peer dependency obrigatória: é o armazenamento padrão. Para usar outro (MMKV, por exemplo), passe `storage` no `createConty`.

## Chave pública

O app usa a chave pública (`cpk_...`), criada no painel em Desenvolvedores. Ela fica dentro do app, então a API ignora `value_cents` e grava o `external_id` com o prefixo `pk:`. **A compra com valor sai do servidor**, com o [`@conty/node`](../node) e a chave secreta (`cev_...`), no webhook de pagamento aprovado. No app, mande os passos do funil (`app_open`, `sign_up`, `begin_checkout`, ...).

## Expo

```bash
npx expo install @conty/react-native @react-native-async-storage/async-storage
```

Chame o `init` uma vez, fora de componente, por exemplo no `app/_layout.tsx`:

```tsx
import { conty } from "@conty/react-native";
import { Stack } from "expo-router";

conty.init("cpk_...");

export default function RootLayout() {
  return <Stack />;
}
```

O deep link precisa abrir o app: configure o `scheme` no `app.json` (e os universal links / app links, se usar link `https://`).

## React Native (bare)

```bash
npm install @conty/react-native @react-native-async-storage/async-storage
cd ios && pod install
```

```tsx
import { conty } from "@conty/react-native";
import { AppRegistry } from "react-native";
import App from "./App";

conty.init("cpk_...");

AppRegistry.registerComponent("MeuApp", () => App);
```

Configure os deep links do app como na [documentação de Linking do React Native](https://reactnative.dev/docs/linking).

Exemplos prontos em [`examples/`](examples): [Expo](examples/expo) e [bare](examples/bare).

## UTMs do deep link

No `init`, o SDK lê o link que abriu o app (`Linking.getInitialURL()`) e passa a ouvir os links recebidos com o app aberto (`Linking.addEventListener("url")`). O link do creator precisa levar as UTMs na query:

```
minhaloja://produto/42?utm_source=conty&utm_campaign=verao&utm_content=cr_abc12345
https://minhaloja.com/produto/42?utm_campaign=verao&utm_content=cr_abc12345
```

Um link novo com `utm_campaign` e o código de um creator em `utm_content` substitui a atribuição guardada. Um link sem UTM, só com a campanha ou sem `utm_campaign` não apaga nada.

## `captureUrl`

Quando o link chega por outro caminho (expo-router, React Navigation, link de push, link adiado de um provedor de atribuição), passe a URL você mesmo.

No expo-router, o `app/+native-intent.tsx` recebe todo link que abre o app:

```tsx
import { conty } from "@conty/react-native";

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  conty.captureUrl(path);
  return path;
}
```

Em qualquer outro caso, chame direto com a URL completa:

```ts
conty.captureUrl(notification.data.url);
```

`captureUrl` funciona antes do `init`.

## Armazenamento próprio

Crie o cliente com `createConty` e passe qualquer objeto com `getItem` e `setItem` que devolvem promessa, no formato do AsyncStorage. Exemplo com MMKV:

```ts
import { createConty } from "@conty/react-native";
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV();

export const conty = createConty({
  storage: {
    getItem: async (key) => mmkv.getString(key) ?? null,
    setItem: async (key, value) => mmkv.set(key, value),
  },
});

conty.init("cpk_...");
```

## API

### `conty.init(key, options?)`

- `key`: chave pública de eventos, começa com `cpk_`. Outra chave, inclusive a secreta (`cev_`), é ignorada.
- `options.apiHost`: troca a origem do endpoint, por exemplo um proxy próprio (`https://eventos.suamarca.com` manda para `https://eventos.suamarca.com/v1/events`).

### `conty.track(name, props?)`

- `name`: nome do evento (`sign_up`, `purchase`, ...).
- `props.value_cents`: valor em centavos, arredondado para inteiro. Com a chave pública, a API ignora o valor.
- `props.external_id`: id do evento. Sem ele, o SDK gera um UUID. A API grava `pk:<id>`.
- `props.link_code`: código do link da Conty, se você tiver.
- Qualquer outro campo vai em `properties`, junto com `$os`, `$os_version`, e `utm_source` e `utm_medium` da atribuição.

Devolve uma promessa com a `Response`, ou `undefined` em falha de rede ou quando o `init` não chega em 10 segundos. Falha de rede nunca lança erro. O `occurred_at` é o momento da chamada, mesmo quando o evento sai depois, da fila.

### `conty.captureUrl(url)`

Lê as UTMs de uma URL e guarda a atribuição. Devolve uma promessa que resolve quando a atribuição foi gravada.

### `createConty(options?)`

O `conty` exportado é `createConty()` com os padrões do app. Crie o seu para trocar alguma peça:

| Opção | Padrão |
| --- | --- |
| `storage` | AsyncStorage |
| `linking` | `Linking` do React Native (ou o `expo-linking`, que tem a mesma API) |
| `platform` | `Platform` do React Native (`OS` e `Version`) |
| `fetch` | `fetch` global |
| `clock` | `Date` (objeto com `now()`) |
| `randomId` | `crypto.randomUUID`, com alternativa quando o motor não tem |

## Contrato com a API

O corpo enviado (`{ events: [...] }`) segue o schema de `POST /v1/events` da API da Conty. Os testes validam o corpo contra uma cópia desse schema em [`test/fixtures/event-schema.ts`](../../test/fixtures/event-schema.ts), que usa os limites de `packages/core`. Se o schema da API mudar, a cópia muda junto.

Guia completo: [Eventos de conversão](https://help.appconty.com/api/guias/eventos-de-conversao).
