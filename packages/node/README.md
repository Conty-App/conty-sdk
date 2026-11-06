<p>
  <picture>
    <img alt="Conty SDK: atribuição de creator do clique à compra" src="../../.github/assets/banner.png" width="100%">
  </picture>
</p>

# @conty/node

SDK de servidor da [Conty](https://appconty.com) para a API de eventos de conversão.

<p>
  <a href="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Conty-App/conty-sdk/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Conty-App/conty-sdk/blob/main/LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-2073df"></a>
</p>

- Sem dependências. Usa o `fetch`, o `crypto.randomUUID` e o `AbortSignal.timeout` globais: Node 20+, Cloudflare Workers, Deno e Bun.
- Usa só a chave secreta (`cev_...`). A chave pública (`cpk_...`) é do site e do app e lança `ContyError` no `createConty`.
- Nunca lança erro de API nem de rede: toda chamada devolve `{ data, error }`.
- Preenche `occurred_at` (agora) e `external_id` (UUID) quando você não passa, e ignora campos `null`.
- Divide lotes grandes no limite da API: 100 eventos e 120 KB por requisição.
- Cada tentativa tem limite de tempo (`timeoutMs`, 10 s por padrão).
- Tenta de novo em 429, 5xx, falha de rede e tempo esgotado, respeitando o `Retry-After`, até 2 minutos. Sem `Retry-After`, espera um tempo aleatório até o teto exponencial (500 ms, 1 s, 2 s, ..., no máximo 30 s). Nunca repete outro 4xx.

## Instalar

```bash
npm install @conty/node
```

## Webhook da loja

A compra com valor sempre sai do servidor, com a chave secreta: a chave pública do site e do app não conta valor. Guarde `utm_campaign` e `utm_content` no pedido quando ele é criado (o `@conty/web` deixa as duas em `localStorage`, na chave `conty_attribution`). No webhook de pagamento aprovado, mande a compra:

```ts
import { createConty } from "@conty/node";

const key = process.env.CONTY_EVENT_KEY;
if (!key) throw new Error("CONTY_EVENT_KEY ausente");

const conty = createConty({ key });

const { error } = await conty.track({
  event: "purchase",
  external_id: order.id,
  value_cents: order.totalCents,
  utm_campaign: order.utmCampaign,
  utm_content: order.utmContent,
  properties: { currency: "BRL", items: order.items.length },
});
if (error) logger.warn(error.code, error.message);
```

A Conty só atribui a venda a um creator quando o evento traz `link_code`, ou `utm_campaign` junto com `utm_content` (o código do creator, `cr_` seguido de 8 caracteres hexadecimais, como `cr_948643af`, ou o id (UUID) do creator). Só o `utm_content`, sem a campanha, não atribui.

Use o id do pedido como `external_id`: se o webhook chegar duas vezes, a Conty conta a venda uma vez só. Campos opcionais podem vir `null` direto do banco.

Exemplos prontos em [`examples/`](examples): [webhook com Express](examples/express) e [script de reenvio](examples/script).

## Vários eventos

```ts
const { data, error } = await conty.trackBatch(
  orders.map((order) => ({ event: "purchase", external_id: order.id, value_cents: order.totalCents })),
);
```

Os lotes saem em sequência. Se um falhar, `data` vem `null`, `error` vem preenchido e os seguintes não são enviados. `error.accepted` diz quantos eventos dos lotes anteriores a API já aceitou. Com `external_id` próprio, reenviar tudo é seguro.

## API

### `createConty(options)`

| Opção | Padrão | |
| --- | --- | --- |
| `key` | | Chave secreta de eventos, começa com `cev_`. Outra chave, inclusive a pública (`cpk_`), lança `ContyError` na hora, porque é erro de configuração. |
| `apiHost` | `https://conty.link` | Origem da API. O endpoint é `{apiHost}/v1/events`. |
| `maxRetries` | `2` | Novas tentativas depois da primeira em 429, 5xx, falha de rede e tempo esgotado (3 tentativas no total). Inteiro de 0 a 10: fora disso, o valor é cortado, e um valor que não é número volta ao padrão. |
| `timeoutMs` | `10000` | Tempo máximo de cada tentativa, em milissegundos. |
| `onError` | | Chamado com cada `ContyError` devolvido, para log centralizado. |
| `fetch` | `fetch` global | Troque para testes ou para um `fetch` próprio. |
| `clock` | `Date` | Objeto com `now()`, usado em `occurred_at` e no `Retry-After`. |
| `randomId` | `crypto.randomUUID` | Gera o `external_id` que falta. |
| `sleep` | `setTimeout` | Espera entre tentativas. Útil para testes sem timer falso. |

### `conty.track(event)` e `conty.trackBatch(events)`

Devolvem `{ data: { accepted }, error: null }` ou `{ data: null, error: ContyError }`. No erro, `error.accepted` é quantos eventos entraram antes da falha (0 no `track`).

| Campo | Tipo | |
| --- | --- | --- |
| `event` | `string` | Até 64 caracteres em `a-z 0-9 _ : . $ -`, por exemplo `purchase`. |
| `external_id` | `string \| null` | Seu id do pedido ou do usuário. Vazio ou ausente: UUID. |
| `occurred_at` | `string \| Date` | ISO 8601 com fuso. Padrão: agora. |
| `value_cents` | `number \| null` | Inteiro, em centavos, a partir de 0. |
| `utm_campaign` | `string \| null` | Campanha da Conty que trouxe o cliente. |
| `utm_content` | `string \| null` | Creator que trouxe o cliente. |
| `link_code` | `string \| null` | Código do link da Conty, se você tiver. |
| `properties` | `object` | Dados livres, até 2 KB. |

Quem valida o evento é a API: um campo fora da regra volta como `error` com status 422 (`invalid_event_batch`) e `details.index` com a posição do evento inválido no lote. O status 400 (`invalid_json`) só aparece quando o corpo não é JSON válido.

### `ContyError`

| Campo | |
| --- | --- |
| `status` | Status HTTP, ou `null` quando o erro é local (rede, chave). |
| `code` | Código da API (`invalid_event_batch`, `rate_limited`, ...) ou `invalid_event_key`, `invalid_event`, `network_error`, `timeout`, `unexpected_error`. |
| `message` | Mensagem da API, em português, ou a mensagem local, em inglês. |
| `details` | Detalhe da API, por exemplo o índice do evento inválido. |
| `accepted` | Eventos aceitos pelos lotes anteriores à falha no `trackBatch`. |

## Contrato com a API

O corpo enviado (`{ events: [...] }`) segue o schema de `POST /v1/events` da API da Conty. Os testes validam o corpo contra uma cópia desse schema em [`test/fixtures/event-schema.ts`](../../test/fixtures/event-schema.ts), que usa os limites de `packages/core`.

Guia completo: [Eventos de conversão](https://help.appconty.com/api/guias/eventos-de-conversao).
