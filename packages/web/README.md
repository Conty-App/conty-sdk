<p>
  <picture>
    <img alt="Conty SDK: atribuição de creator do clique à compra" src="../../.github/assets/banner.png" width="100%">
  </picture>
</p>

# @conty/web

SDK de navegador da [Conty](https://appconty.com) para eventos de conversão com atribuição de creator.

<p>
  <a href="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Conty-App/conty-sdk/blob/main/LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-2073df"></a>
</p>

- Lê `utm_source`, `utm_medium`, `utm_campaign` e `utm_content` da URL e guarda em `localStorage` (`conty_attribution`) por 30 dias. Vale o último toque com creator: só guarda quando o link traz `utm_campaign` e o `utm_content` é o código de um creator (`cr_` seguido de 8 caracteres hexadecimais, como `cr_948643af`, ou o id do creator). Um link só de campanha, sem creator, ou um link de creator sem `utm_campaign` não apaga a atribuição guardada.
- Usa só a chave pública (`cpk_...`). A chave secreta (`cev_...`) é ignorada no navegador, com um aviso no console.
- Manda cada evento com `fetch` e `keepalive`, então o envio sobrevive à troca de página.
- Gera o `external_id` sozinho quando você não passa um, e manda `$os: "web"` em `properties`.
- O `sdk.js` da script tag pesa cerca de 1,8 KB com gzip.

## Chave pública e chave secreta

A Conty tem dois tipos de chave de eventos, criados no painel em Desenvolvedores:

| Chave | Onde usar | O que a API faz |
| --- | --- | --- |
| Pública, `cpk_...` | Site e app (`@conty/web`, `@conty/react-native`) | Aceita o evento, ignora `value_cents` e guarda o `external_id` com o prefixo `pk:`. Recusa com 403 `origin_not_allowed` quando a origem não está nas origens permitidas da chave. |
| Secreta, `cev_...` | Só no servidor (`@conty/node`) | Aceita o evento inteiro, com valor e o seu id do pedido. |

A chave pública fica visível no código da página, por isso ela não conta dinheiro. **A compra com valor sai do servidor**, com o [`@conty/node`](../node) e a chave secreta, no webhook de pagamento aprovado. No navegador, mande os passos do funil (`sign_up`, `begin_checkout`, ...).

## Script tag

```html
<script async src="https://conty.link/sdk.js" data-key="cpk_..."></script>
```

Com `data-key`, o SDK inicia sozinho. Quando o script vem de `/sdk.js` na raiz de um domínio, o endpoint sai do próprio `src` (`https://conty.link/sdk.js` manda para `https://conty.link/v1/events`, e um proxy seu em `https://eventos.suamarca.com/sdk.js` manda para `https://eventos.suamarca.com/v1/events`). Vindo de qualquer outro caminho, como uma CDN (`https://cdn.jsdelivr.net/npm/@conty/web/dist/sdk.js` ou `https://unpkg.com/@conty/web/dist/sdk.js`), o endpoint é `https://conty.link`.

Para chamar `conty.track` antes do script carregar, crie o stub antes da tag:

```html
<script>
  window.conty = window.conty || { q: [], track(...args) { this.q.push(args); } };
</script>
```

Cada item de `q` é a lista de argumentos de um `track`. Uma fila no formato de array (`window.conty = [["track", "sign_up"]]`) também é aceita.

## npm

```bash
npm install @conty/web
```

```ts
import { conty } from "@conty/web";

conty.init("cpk_...");
conty.track("begin_checkout", { plan: "anual" });
```

Importar o pacote não mexe em `window` nem em `localStorage`. As UTMs da URL atual são lidas no `init`. Fora do navegador (SSR), `init` e `track` não fazem nada.

Exemplos prontos em [`examples/`](examples): [script tag](examples/html) e [Next.js](examples/nextjs).

## API

### `conty.init(key, options?)`

- `key`: chave pública de eventos, começa com `cpk_`. Outra chave é ignorada, e a secreta (`cev_`) gera um aviso no console uma vez: "Conty: use a publishable key (cpk_) in the browser".
- `options.apiHost`: troca a origem do endpoint, por exemplo um proxy próprio (`https://eventos.suamarca.com` manda para `https://eventos.suamarca.com/v1/events`).

### `conty.track(name, props?)`

- `name`: nome do evento (`sign_up`, `purchase`, ...). Sem `init`, nada é enviado.
- `props.value_cents`: valor em centavos, arredondado para inteiro. Com a chave pública, a API ignora o valor: mande a compra com valor pelo servidor.
- `props.external_id`: id do evento. Sem ele, o SDK gera um UUID. Com a chave pública, a API grava `pk:<id>`, então um id vindo do navegador nunca ocupa o id de um pedido mandado pelo servidor.
- `props.link_code`: código do link da Conty, se você tiver.
- Qualquer outro campo vai em `properties`, junto com `$os` e com `utm_source` e `utm_medium` da atribuição. Um `$os` seu tem prioridade.

Falha de rede nunca lança erro.

### `createConty(options?)`

O `conty` exportado é `createConty()` com os padrões do navegador. Crie o seu para trocar alguma peça, por exemplo em teste:

| Opção | Padrão |
| --- | --- |
| `fetch` | `fetch` global |
| `storage` | `localStorage` (qualquer objeto com `getItem`, `setItem` e `removeItem`) |
| `location` | `location` (só `search` é lido) |
| `clock` | `Date` (objeto com `now()`) |
| `randomId` | `crypto.randomUUID` |
| `warn` | `console.warn` (aviso da chave secreta no navegador) |

## Contrato com a API

O corpo enviado (`{ events: [...] }`) segue o schema de `POST /v1/events` da API da Conty. Os testes validam o corpo contra uma cópia desse schema em [`test/fixtures/event-schema.ts`](../../test/fixtures/event-schema.ts), que usa os limites de `packages/core`. Se o schema da API mudar, a cópia muda junto.

Guia completo: [Eventos de conversão](https://help.appconty.com/api/guias/eventos-de-conversao).
