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
| `requestId` | Id da requisição na API (`request_id`), para mandar ao suporte. |

## API pública: campanhas

`createContyApi` fala com a API pública da Conty (`/public/v1`) usando a **chave de API da marca** (`ck_live_...`, criada no painel em Desenvolvedores). É outra chave, diferente da `cev_` dos eventos. Só no servidor.

```ts
import { createContyApi } from "@conty/node";

const conty = createContyApi({ apiKey: process.env.CONTY_API_KEY! });

const { data: me } = await conty.me.get();
console.log(me?.campaign_model, me?.api_key.scopes);

const body = {
  kind: "agreement" as const,
  name: "Verão 2027",
  description: "Lançamento da coleção de verão.",
  status: "draft" as const,
  payment_type: "per_video" as const,
  budget_cents: 500_000,
  end_date: "2027-02-28",
  deliverables: [
    { key: "reels", network: "instagram" as const, formats: ["reels" as const, "collab" as const], videos_count: 1 },
    { key: "tiktok", network: "tiktok" as const, videos_count: 2 },
  ],
  scope_options: [
    {
      name: "Reels + TikTok",
      items: [
        { deliverable_key: "reels", quantity: 1 },
        { deliverable_key: "tiktok", quantity: 2 },
      ],
    },
  ],
  briefings: [{ title: "Briefing geral", body: "Mostre o produto em uso.", attachments: [] }],
};

const { data: check } = await conty.campaigns.validate(body);
if (!check?.valid) throw new Error(check?.issues.map((issue) => issue.message).join("; "));

const { data: campaign, error } = await conty.campaigns.create(body);
if (error) throw error;

const { data: cost } = await conty.campaigns.publishCost(campaign.id);
console.log(cost?.publish_cost_cents, cost?.balance_cents);

if (check.can_publish) {
  await conty.campaigns.setStatus(campaign.id, { status: "review" });
}

for await (const item of conty.campaigns.itemsAll(campaign.id, { stage: "interested" })) {
  console.log(item);
}
```

Cada entrega diz a rede em `network` (`instagram`, `tiktok`, `youtube`, `x`, `ugc` ou `repost`) e o formato em `formats` (`reels`, `collab`, `stories`, `feed`, `video`, `long`, `shorts`, `post`, `thread`, `vertical`), e o `key` dela é o que `scope_options[].items[].deliverable_key` cita. Na leitura, a campanha traz as redes em `networks` e cada bloco traz `network` e `formats`.

A API cria e edita acordos: entregas em `deliverables`, combinações de entregas em `scope_options` e textos em `briefings`. `kind` é opcional e só aceita `"agreement"`. Marca cujo `campaign_model` (em `me.get()`) não é acordo recebe 422 `unsupported_for_campaign_model`. O rascunho (`status: "draft"`) vai ao ar com `setStatus(id, { status: "review" })` ou `update(id, { status: "review" })`. Depois de publicado, os creators se candidatam pelo app: acompanhe as candidaturas pelo quadro (`stages` e `items`/`itemsAll` na etapa `interested`) ou pelo webhook da marca.

| Método | Rota |
| --- | --- |
| `me.get()` | `GET /me`: marca dona da chave, escopos da chave e `campaign_model` |
| `campaigns.list(params)` / `listAll(params)` | `GET /campaigns` (filtro `status`, busca `q`) |
| `campaigns.get(id)` | `GET /campaigns/{id}` |
| `campaigns.stages(id, params)` | `GET /campaigns/{id}/stages` |
| `campaigns.items(id, params)` / `itemsAll(id, params)` | `GET /campaigns/{id}/items` |
| `campaigns.validate(body)` | `POST /campaigns/validate`: confere e mostra o custo sem gravar |
| `campaigns.proposalSuggestions(params)` | `GET /campaigns/proposal-suggestions`: valores sugeridos para `creator_proposal` |
| `campaigns.create(body, opts)` | `POST /campaigns` |
| `campaigns.update(id, body, opts)` | `PATCH /campaigns/{id}` |
| `campaigns.setStatus(id, body, opts)` | `POST /campaigns/{id}/status` |
| `campaigns.remove(id)` | `DELETE /campaigns/{id}`: arquiva, responde 204 (`data: null`) |
| `campaigns.renew(id, body, opts)` | `POST /campaigns/{id}/renew`: datas novas em `blocks` ou `scope_options`; devolve a campanha, ou `{ job_id, total }` quando vai com `creator_ids` |
| `campaigns.publishCost(id)` | `GET /campaigns/{id}/publish-cost`: verba, taxa de direito de uso e saldo |
| `campaigns.briefings(id, params)` / `briefingsAll(id, params)` | `GET /campaigns/{id}/briefings` (busca `q`) |
| `campaigns.attachBriefingFile(id, body, opts)` | `POST /campaigns/{id}/briefings/attachments`: anexa por link https ou base64 |
| `uploads.create(body)` | `POST /uploads`: URL assinada para enviar o arquivo com `PUT` e o `upload_ref` |
| `uploads.import(body, opts)` | `POST /uploads/import`: a API busca o link https ou recebe base64 e devolve o `upload_ref` |

| `applications.approve(campaignId, applicationId, body?, opts)` | `POST /campaigns/{id}/applications/{application_id}/approve`: abre a missão com escopo, briefing e datas |
| `applications.reject(campaignId, applicationId, body?, opts)` | `POST .../applications/{application_id}/reject` |
| `applications.restore(campaignId, applicationId, body?, opts)` | `POST .../applications/{application_id}/restore` |
| `applications.setProposedDeadline(campaignId, applicationId, body, opts)` | `PATCH .../applications/{application_id}/proposed-deadline` |
| `applications.setProposedAmount(campaignId, applicationId, body, opts)` | `PATCH .../applications/{application_id}/proposed-amount` |
| `applications.bulk(campaignId, body, opts)` | `POST /campaigns/{id}/applications/bulk`: `approve` devolve `{ job_id, total }` (202), `reject` devolve as recusadas e as falhas (200) |
| `campaigns.creators.setScopeOption` / `setBriefing` / `setScopeAmount(campaignId, creatorId, body, opts)` | `PATCH /campaigns/{id}/creators/{creator_id}/scope-option`, `/briefing`, `/scope-amount` |
| `campaigns.creators.bulkExclude(campaignId, body, opts)` | `POST /campaigns/{id}/creators/bulk/exclude` (lote) |
| `missions.get(id)` | `GET /missions/{id}` |
| `missions.approve(id, body?, opts)` / `requestChanges(id, body, opts)` / `reject(id, body, opts)` | `POST /missions/{id}/approve`, `/request-changes`, `/reject` |
| `missions.reviewAsset(id, asset, body, opts)` | `POST /missions/{id}/assets/{asset}/review` (`script`, `cover` ou `caption`) |
| `missions.setAssetVersion(id, body, opts)` / `setDeadline(id, body, opts)` | `PATCH /missions/{id}/asset-version`, `/deadline` |
| `missions.send(id, body?, opts)` / `restore(id, body?, opts)` | `POST /missions/{id}/send`, `/restore` |
| `missions.reinviteEligibility(id)` / `reinvite(id, body?, opts)` | `GET /missions/{id}/reinvite-eligibility`, `POST /missions/{id}/reinvite` |
| `missions.remove(id)` | `DELETE /missions/{id}`: 204 (`data: null`), volta com `restore` |
| `missions.bulkStatus(campaignId, body, opts)` | `POST /campaigns/{id}/missions/bulk-status`: pede alteração ou recusa na hora |
| `missions.approvePending(body, opts)` / `bulkDeadline` / `bulkSend` / `bulkRemove` | `POST /missions/approve-pending`, `/missions/bulk/deadline`, `/bulk/send`, `/bulk/remove` (lote) |
| `missionCombos.setStatus(id, body, opts)` | `POST /mission-combos/{id}/status`: aprova o combo ou pede alteração nas missões citadas |
| `bulkJobs.get(id, params)` / `wait(id, { intervalMs, timeoutMs })` | `GET /bulk-jobs/{id}`: estado do lote e falhas por item |

| `missions.shipProduct(id, body?, opts)` / `productShipment(id)` | `POST` e `GET /missions/{id}/product-shipment` |
| `missions.setPostUrl(id, body, opts)` / `setPostedAt(id, body, opts)` | `PUT /missions/{id}/post-url`, `/posted-at` |
| `missions.acceptPostCheck(id, body, opts)` / `postChecks.accept(body, opts)` | `POST /missions/{id}/post-check/accept`, `POST /post-checks/accept` |
| `missions.createCoupon(id, body, opts)` | `POST /missions/{id}/coupon` |
| `missions.comments.list(id, params)` / `comments.create(id, body, opts)` | `GET` e `POST /missions/{id}/comments` |
| `missions.notify(id, body, opts)` | `POST /missions/{id}/notify` |
| `missions.syncMetrics(id, opts)` | `POST /missions/{id}/sync-metrics` |
| `missions.scriptFile(id, params)` / `deliveryDownload(id)` | `GET /missions/{id}/script-file`, `/delivery-download` |
| `campaigns.export(id, params)` | `GET /campaigns/{id}/export`: CSV como `string`, ou `{ columns, rows, total }` com `format: "json"` |
| `campaigns.coupons.pool.list/listAll(id, params)` / `pool.add(id, body, opts)` | `GET` e `POST /campaigns/{id}/coupon-pool` |
| `campaigns.coupons.bulk(id, body, opts)` | `POST /campaigns/{id}/coupons/bulk` |
| `campaigns.coupons.setCommissionBudget(id, body, opts)` | `POST /campaigns/{id}/coupon-commission/budget` |
| `campaigns.coupons.sales/salesAll(id, params)` | `GET /campaigns/{id}/coupon-sales` |
| `campaigns.results.overview` / `timeseries(id, params)` | `GET /campaigns/{id}/results`, `/results/timeseries` |
| `campaigns.results.creators/creatorsAll(id, params)` / `deliveries(id, creatorId, params)` | `GET /campaigns/{id}/results/creators`, `/results/creators/{creator_id}/deliveries` |
| `campaigns.results.traffic(id, params)` / `trafficEvents/trafficEventsAll(id, params)` | `GET /campaigns/{id}/results/traffic`, `/results/traffic/events` |
| `campaigns.counts(id, params)` / `segments(id, params)` | `GET /campaigns/{id}/counts`, `/segments` |
| `campaigns.suggestions/suggestionsAll(id, params)` | `GET /campaigns/{id}/suggestions` |
| `campaigns.aiRubric.get(id)` / `aiRubric.set(id, body, opts)` | `GET` e `PUT /campaigns/{id}/ai-rubric` |
| `campaigns.tracking/trackingAll(id, params)` / `setTrackingDestination(id, body, opts)` | `GET /campaigns/{id}/tracking`, `PUT /tracking/destination` |
| `campaigns.shortLinks.create(id, body, opts)` | `POST /campaigns/{id}/short-links` |
| `campaigns.creatorInvoices/creatorInvoicesAll(id, params)` | `GET /campaigns/{id}/creator-invoices` |
| `campaigns.syncMetrics(id, opts)` / `syncMetricsJob(id, jobId)` | `POST /campaigns/{id}/sync-metrics`, `GET /sync-metrics/jobs/{job_id}` |
| `conversionEvents.set(body, opts)` | `PUT /conversion-events`: quais eventos de analytics contam como conversão na marca |

- **Em beta, ainda não publicado em produção.** A leitura (`list`, `get`, `stages`, `items`) já está em produção. As rotas de escrita, `uploads`, o quadro (`applications`, `missions`, `missionCombos`, `bulkJobs`), a pós-entrega (`postChecks`, cupons, resultados, rastreio, exportação, `conversionEvents`) e as leituras novas (`publishCost`, `briefings`, `proposalSuggestions`) existem na API, mas ainda não foram publicadas em produção.
- **Escopos da chave.** `campaigns:write` monta o rascunho e edita. `campaigns:spend` é exigido, além dele, em tudo que compromete saldo da marca: publicar (`create` com `status: "review"` ou sem `status`, `setStatus` e `update` com `status: "review"`), renovar (`renew`) e editar acordo que está em `review`. Sem o escopo a API responde 403 `insufficient_scope`, com o escopo que falta em `error.details[0].required_scope`. Os escopos da chave vêm em `me.get()`, em `api_key.scopes`.
- **`validate`** aceita corpo incompleto e sempre responde 200. `valid` diz se o corpo pode ser gravado como está; `can_publish` diz se ele iria ao ar agora; `missing` lista os campos que faltam. Cada item de `issues` traz `blocking`: com `status: "draft"`, o que só impede publicar (regra de publicação, saldo insuficiente) vem com `blocking: false` e não derruba `valid`.
- **Status.** `review` publica o rascunho, `paused` pausa, `approved` retoma a campanha pausada, `completed` encerra (não volta), `archived` arquiva e `active` só restaura a arquivada. Transição que não vale para o status atual responde 409 `invalid_transition`. Pausar ou encerrar com entrega em andamento responde 409 `blocking_missions`, e `force_close: true` encerra mesmo assim. `remove` com entrega em andamento também responde 409 `blocking_missions`: encerre antes com `setStatus(id, { status: "completed", force_close: true })`.
- **Dinheiro em centavos inteiros** (`budget_cents: 500_000` é R$ 5.000,00).
- **Idempotência.** As rotas em que a API exige a chave sempre mandam `Idempotency-Key` (a sua em `opts.idempotencyKey` ou uma gerada) e repetem a mesma chave nas retentativas, então um timeout nunca cria duas campanhas: `campaigns.create`, `renew`, `attachBriefingFile`, `uploads.import`, `applications.bulk`, `campaigns.creators.bulkExclude`, `missions.reinvite`, `approvePending`, `bulkDeadline`, `bulkSend`, `bulkRemove`, `missions.createCoupon`, `missions.comments.create`, `campaigns.coupons.pool.add`, `coupons.bulk`, `coupons.setCommissionBudget` e `campaigns.shortLinks.create`. As outras escritas que aceitam `opts` só mandam a chave, e só retentam, quando você passa `idempotencyKey`. `remove`, `validate` e `uploads.create` não têm chave e não são retentados.
- **Retentativa** em 429, 5xx e falha de rede, só em `GET` e em requisição com `Idempotency-Key`, respeitando `Retry-After`. Erro de regra (403, 409, 422) nunca é repetido.
- **Nunca lança** erro de API: todo método devolve `{ data, error }`. A exceção é o `for await` dos métodos `*All` (`listAll`, `itemsAll`, `briefingsAll`, `salesAll`, `suggestionsAll`, `trackingAll` e os outros), que lança o `ContyError` da página que falhou.

## Quadro da campanha

O quadro é o mesmo do painel: `stages` dá as etapas e `items`/`itemsAll` lista as candidaturas (`kind: "application"`) e as missões (`kind: "mission"`) de uma etapa. Cada decisão devolve o item relido, e uma transição que não vale para o estado atual responde 409 `invalid_transition` (nunca é repetida).

```ts
for await (const item of conty.campaigns.itemsAll(campaignId, { stage: "interested" })) {
  if (item.kind !== "application") continue;
  const { data: application, error } = await conty.applications.approve(campaignId, item.id, {
    scope_option_id: scopeOptionId,
    briefing_id: briefingId,
    delivery_date: "2026-12-10T23:59:00-03:00",
  });
  if (error?.code === "invalid_transition") continue;
  if (error) throw error;
  console.log(application.mission_id);
}

for await (const item of conty.campaigns.itemsAll(campaignId, { stage: "submitted" })) {
  if (item.kind !== "mission") continue;
  console.log(item.dates.delivery_deadline_at);
  if (needsChanges(item)) {
    await conty.missions.requestChanges(item.id, {
      feedback: "Mostre o produto nos 3 primeiros segundos.",
      change_deadline_at: "2026-12-12T23:59:00-03:00",
    });
  } else {
    await conty.missions.approve(item.id, { rating: 5, approval_message: "Ficou ótimo, obrigado!" });
  }
}
```

- **Prazo da entrega.** A missão traz as datas em `dates`: `delivery_deadline_at` é o prazo da entrega, `script_deadline_at` o do roteiro e `change_deadline_at` o da alteração pedida. Mude com `missions.setDeadline` ou, em lote, `missions.bulkDeadline`.
- **Peças.** Roteiro, capa e legenda são revisados um a um com `missions.reviewAsset(id, "script" | "cover" | "caption", { decision })`; o vídeo, com `approve`, `requestChanges` ou `reject`.
- **Lotes.** `applications.bulk` com `approve`, `campaigns.creators.bulkExclude`, `missions.approvePending`, `bulkDeadline`, `bulkSend` e `bulkRemove` respondem 202 com `{ job_id, total }`. `bulkJobs.wait(job_id)` consulta até `done` ou `failed` (padrão: a cada 1 s, por até 2 min) e devolve `{ data, error }`: um lote `failed` vem em `data`, com as falhas por item em `failures`; passar do tempo devolve `error.code === "bulk_job_timeout"`. `missions.bulkStatus` e `applications.bulk` com `reject` respondem na hora.

```ts
const { data: accepted, error } = await conty.missions.bulkSend({ mission_ids: missionIds, briefing_id: briefingId });
if (error) throw error;
const { data: job } = await conty.bulkJobs.wait(accepted.job_id, { timeoutMs: 60_000 });
console.log(job?.succeeded, job?.failures);
```

## Entrega e pós-entrega

Depois que a entrega é aprovada, o resto do caminho até o post publicado passa pelos mesmos métodos de `missions` e `campaigns`:

```ts
const { error } = await conty.missions.shipProduct(missionId, {
  tracking_code: "AA123456789BR",
});
if (error) throw error;

const { data: shipment } = await conty.missions.productShipment(missionId);
console.log(shipment?.carrier_status, shipment?.received_at, shipment?.received_photo_url);

await conty.missions.setPostUrl(missionId, {
  network: "instagram",
  url: "https://www.instagram.com/p/abc123/",
});
await conty.missions.setPostedAt(missionId, { posted_at: "2026-12-01" });

await conty.missions.createCoupon(missionId, { code: "ANA10", discount_description: "10% off" });

await conty.missions.comments.create(missionId, { channel: "creator", body: "Ficou ótimo!" });

const { data: csv } = await conty.campaigns.export(campaignId, {
  stage: "content.published",
  fields: ["creator_name", "stage", "instagram"],
});
const { data: table } = await conty.campaigns.export(campaignId, {
  stage: "content.published",
  format: "json",
});
console.log(csv?.length, table?.columns, table?.rows.length);
```

- **Envio do produto.** `shipProduct` marca o produto como enviado, com o código de rastreio opcional; o creator é avisado no primeiro envio, e chamar de novo só troca o código. Produto já recebido responde 409 `already_received`; campanha sem produto, 409 `no_product`; sem envio físico, 409 `shipping_disabled`.
- **`productShipment`** devolve `shipped_at`, `tracking_code`, `received_at` (quando o creator confirmou), `received_photo_url` (a foto que ele mandou, em URL assinada que expira em minutos: baixe na hora, não guarde o link) e `carrier_status` (`posted`, `in_transit`, `out_for_delivery`, `delivered`, `returned` ou `unknown`) com `carrier_delivered_at`. O rastreio automático só existe com o módulo ligado; sem ele, `carrier_status` vem `null`. Entregue pela transportadora não é recebido: `received_at` só muda quando o creator confirma.
- **Post.** `setPostUrl` grava o link do post por rede e `setPostedAt` a data de publicação. A conferência automática do post é aceita com `acceptPostCheck(id, { check_id })`, ou em lote com `postChecks.accept({ items })`.
- **Cupom do creator.** `missions.createCoupon` aceita `{ coupon_id }` (um cupom do pool da campanha) ou `{ code, discount_description }` (um código novo). O pool fica em `campaigns.coupons.pool.list/listAll/add`, a distribuição em lote em `campaigns.coupons.bulk` e as vendas em `campaigns.coupons.sales/salesAll`.
- **Comentários.** `missions.comments.list(id, { channel })` lê a conversa da entrega (`creator` ou `agency`) e marca como lida; `comments.create` publica como o dono da marca.
- **Exportar.** `campaigns.export(id, { stage, fields, ... })` usa os mesmos filtros de `items`. Sem `format`, ou com `format: "csv"`, devolve o arquivo como texto (`string`); com `format: "json"`, devolve `{ columns, rows, total }`. Até 2000 linhas: etapa maior responde 422 pedindo filtro.
- **Métricas.** `missions.syncMetrics(id)` e `campaigns.syncMetrics(id)` pedem a atualização das métricas (202). O progresso da campanha fica em `campaigns.syncMetricsJob(id, jobId)`.

### Webhooks do produto

| Evento | Quando |
| --- | --- |
| `mission.product_received` | O creator confirmou que recebeu o produto (só a primeira confirmação). |
| `mission.product_delivered_by_carrier` | O rastreio automático viu a entrega pela transportadora. Não quer dizer que o creator confirmou o recebimento. |

Os dois trazem o produto em `data.product`, sem a foto e sem o endereço do creator. Para a foto, chame `missions.productShipment(id)`.

## Contrato com a API

O corpo enviado (`{ events: [...] }`) segue o schema de `POST /v1/events` da API da Conty. Os testes validam o corpo contra uma cópia desse schema em [`test/fixtures/event-schema.ts`](../../test/fixtures/event-schema.ts), que usa os limites de `packages/core`.

Guia completo: [Eventos de conversão](https://help.appconty.com/api/guias/eventos-de-conversao).
