# AGENTS.md

Monorepo público dos SDKs da Conty. npm workspaces em `packages/*` (os exemplos ficam fora). Guia de contribuição completo em [CONTRIBUTING.md](CONTRIBUTING.md).

- `packages/core` (`@conty/core`, privado, não é publicado): lógica comum. Constantes, atribuição de 30 dias, UTM, montagem do evento, `external_id`, lotes, requisição e as portas (`fetch`, `clock`, `randomId`). Cada pacote publicado embute o core no build (`noExternal` e `dts.resolve` no `tsup.config.ts`).
- `packages/web` (`@conty/web`): navegador, módulo npm e bundle `dist/sdk.js` da script tag.
- `packages/node` (`@conty/node`): servidor, `createConty` com retry e `{ data, error }`.
- `packages/react-native` (`@conty/react-native`): React Native e Expo. UTM pelo deep link (`Linking`), atribuição no AsyncStorage.

## Comandos

Na raiz, Node 22 (os pacotes publicados rodam em Node 20+):

```bash
npm install
npm run lint        # biome check .
npm run format      # biome check --write .
npm run typecheck   # tsc em cada pacote
npm test            # vitest em cada pacote
npm run build       # tsup em cada pacote publicado
```

Um pacote só: `npm test -w @conty/node`. A CI (`.github/workflows/ci.yml`) roda os mesmos passos em PR e na `main`. Exemplo: `npm install` e `npm run build` na raiz, depois `npm install` na pasta do exemplo.

## Estrutura

```
packages/core/src/
  config/       constants.ts (API, KEY, EVENT, BATCH, UTM, ATTRIBUTION, RETRY, QUEUE)
  ports/        types.ts (Fetch, Clock, RandomId, Deps), deps.ts (withDeps)
  event/        types.ts, event.ts, compact.ts, batch.ts
  attribution/  types.ts, attribution.ts, utm.ts
  transport/    request.ts, json.ts
  key/          types.ts, key.ts
packages/web/src/          client/, attribution/, ports/, install/ (script tag)
packages/node/src/         client/ (conty.ts, options.ts), errors/, event/, transport/
packages/react-native/src/ client/, linking/
packages/*/examples/       exemplos mínimos, fora dos workspaces, do build, do typecheck e do npm (cada um instala o pacote por file:../..)
test/fixtures/             event-schema.ts, cópia do schema da API
```

Pasta por domínio, mesmo nome do core quando o conceito é o mesmo. Cada pasta tem o seu `__tests__`. O `index.ts` de cada pacote só exporta a superfície pública.

## Regras

- O corpo do evento espelha o schema de `POST /v1/events` da conty-api (`src/features/events/schemas.ts`). Os testes validam o corpo enviado contra `test/fixtures/event-schema.ts`, que lê os limites de `packages/core/src/config/constants.ts`. Mudou o schema ou um limite na API, muda as constantes, a cópia e os SDKs no mesmo ciclo.
- Constantes agrupadas em objetos `as const` (`EVENT.batch.max`, `ATTRIBUTION.ttlMs`). Nada de constante solta.
- Sem validação de evento no cliente: a API valida e responde 422 (`invalid_event_batch`, com `details.index`); 400 só para `invalid_json`. O SDK só divide lotes (100 eventos, 120 KB) e confere o tipo da chave.
- Duas chaves (`KEY.prefix`): a pública `cpk_` é a única aceita no `@conty/web` e no `@conty/react-native` (com `cev_`, o `init` é ignorado; no web, um `console.warn` por instância pela porta `warn`); a secreta `cev_` é a única aceita no `@conty/node` (com `cpk_` ou outra, o `createConty` lança). Com a chave pública a API ignora `value_cents`, grava o `external_id` como `pk:<id>` e confere as origens permitidas: README e exemplos de site e app nunca mandam compra com valor.
- `@conty/node` nunca lança erro de API ou de rede: devolve `{ data, error: null } | { data: null, error: ContyError }`. Só erro de programação (chave inválida no `createConty`) lança. Lote que falha no meio devolve o erro com `error.accepted` (eventos aceitos antes). Cada tentativa tem `AbortSignal.timeout(timeoutMs)`, `maxRetries` é cortado para inteiro de 0 a 10, e o backoff sem `Retry-After` tem jitter total.
- Toda dependência de ambiente entra por porta injetável com padrão: `fetch`, `clock`, `randomId`, `storage`, `location` (web), `linking` e `platform` (react-native). Os testes injetam fakes em vez de mexer em global.
- Mesmo comportamento em todas as plataformas: atribuição de último toque com creator por 30 dias (só guarda UTM quando o `utm_content` é código de creator, `cr_` + 8 hex ou o id do creator, como o `matchUtmContent` da API; link só de campanha não sobrescreve), `external_id` gerado quando falta ou vem vazio. No web e no react-native, falha de rede nunca lança e o evento leva `$os` (e `$os_version` no app) em `properties`, sem sobrescrever o valor do cliente.
- O cliente da API pública (`createContyApi`, `packages/node/src/api/`) espelha `GET /public/v1/openapi.json` da conty-api. A cópia fica em `test/fixtures/openapi.json` e os tipos são gerados dela (`npm run openapi:types -w @conty/node`, saída em `src/api/generated/openapi.ts`, não edite à mão). Mudou a API pública, mudam no mesmo ciclo o fixture, os tipos, o método e o teste: o `api/__tests__/coverage.test.ts` falha quando uma operação do fixture não tem método nem está em `PENDING`. A chave é `ck_live_`; criação manda `Idempotency-Key` (gerada se faltar) e só GET ou requisição com `Idempotency-Key` é retentada. Lista tem `list` (página) e `listAll` (`AsyncIterable` pelo `next_cursor`, único lugar que lança).
- Importar um pacote não tem efeito colateral. O único arquivo com efeito é o bundle `packages/web/dist/sdk.js`.
- Sem dependência de runtime nos pacotes publicados. O react-native tem `react-native` e `@react-native-async-storage/async-storage` como peer dependencies.
- O `sdk.js` da script tag sai com terser e alvo ES2018. Hoje pesa ~1,8 KB gzip: confira o tamanho no PR.
- Código, mensagens de erro e nomes de teste em inglês, sem comentários. Documentação para o cliente em pt-BR.

## Pacote novo

1. Crie `packages/<nome>` com `package.json` (`@conty/<nome>`, `license: MIT`, scripts `build`, `test`, `typecheck`, `@conty/core` em `devDependencies`), `tsconfig.json` estendendo `../../tsconfig.base.json`, `tsup.config.ts` com `noExternal: ["@conty/core"]` e `dts: { resolve: ["@conty/core"] }`, e `README.md`. Não crie pacote vazio: ele entra com código, teste e exemplo.
2. Exponha `createConty(options)` como fábrica, com as portas da plataforma como padrão, e use o core para chave, atribuição, evento e requisição.
3. Cliente da API pública: entra no `@conty/node`, não num pacote novo, ao lado de `createConty`, com o mesmo retry e `ContyError`.
4. Adicione o pacote nas tabelas do `README.md` da raiz e use o mesmo cabeçalho dos READMEs de pacote. O banner aponta para `../../.github/assets/banner.png` (nos exemplos, `../../../../.github/assets/banner.png`).
5. O banner é uma imagem só, `.github/assets/banner.png`, gerada como imagem (não é SVG). Para mudar o texto, gere a imagem de novo e substitua o arquivo.

## Release

Ainda não é automatizado. Não há job de publish na CI. A publicação no npm (`@conty/*`) é manual, feita por quem tem acesso ao escopo `@conty`, depois de bump de versão no `package.json` do pacote.
