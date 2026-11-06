# Contribuir

Obrigado por ajudar. Este guia cobre o essencial para abrir um PR que passa na primeira revisão.

## Pré-requisitos

- Node 22 (a versão está em `.nvmrc`: `nvm use`).
- npm, que já vem com o Node.

## Setup

```bash
git clone https://github.com/Conty-App/conty-sdk.git
cd conty-sdk
npm install
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run lint` | Biome em todo o repositório. `npm run format` corrige formatação e imports. |
| `npm run typecheck` | `tsc` em cada pacote. |
| `npm test` | Vitest em cada pacote. |
| `npm run build` | tsup em cada pacote publicado. |

Para um pacote só, use `-w`: `npm test -w @conty/web`, `npm run build -w @conty/node`.

## Estrutura

- `packages/core`: lógica comum, privada, embutida no build de cada pacote. Não é publicada.
- `packages/web`, `packages/node`, `packages/react-native`: os pacotes publicados, só com os adaptadores de cada plataforma.
- Dentro de `src`, uma pasta por domínio (`client/`, `attribution/`, `event/`, `transport/`, ...), com o mesmo nome do core quando o conceito é o mesmo. Cada pasta tem o seu `__tests__`.
- `packages/*/examples/`: exemplos mínimos por pacote, fora dos workspaces da raiz, do build, do typecheck e do npm. Cada um instala o pacote local por `file:../..`: rode `npm run build` na raiz e `npm install` na pasta do exemplo.
- `test/fixtures/event-schema.ts`: cópia do schema de `POST /v1/events` da API.

## Regras de código

- Código, mensagens de erro e nomes de teste em inglês. Documentação em pt-BR.
- Sem comentários no código.
- Zero dependência de runtime nos pacotes publicados.
- Importar um pacote não tem efeito colateral. Só o `sdk.js` da script tag se instala sozinho.
- Ambiente entra por portas injetáveis (`fetch`, `clock`, `randomId`, `storage`, `location`, `linking`, `platform`), com padrão sensato. Nada de global escondido na lógica.
- No `@conty/node`, chamadas públicas devolvem `{ data, error }` e nunca lançam erro de API ou de rede. Só erro de programação lança.
- Chave pública (`cpk_`) no web e no react-native, secreta (`cev_`) no node. Exemplo e README de site e app nunca mandam compra com valor: isso é do servidor.
- Constantes agrupadas em objetos `as const` em `packages/core/src/config/constants.ts`.
- Sem `any`, sem `as` evitável, sem `!` de não nulo, sem `@ts-ignore`.
- O schema do evento acompanha a API: mudou na conty-api (`src/features/events/schemas.ts`), mude as constantes, a fixture e os SDKs no mesmo PR.

## Pacote novo

Siga a seção "Pacote novo" do [AGENTS.md](AGENTS.md): `package.json` com `@conty/core` em `devDependencies`, `tsup` com `noExternal` e `dts.resolve` para o core, fábrica `createConty`, teste, exemplo e README com o mesmo cabeçalho.

## Testes

- Injete fakes pelas portas (`fetch`, `storage`, `clock`, `randomId`, ...). Evite `vi.stubGlobal`, timer falso e espiar global.
- Todo teste que manda evento valida o corpo enviado contra `BrandEventBatchSchema` da fixture.
- Teste o comportamento público, não detalhe de implementação.

## Branches e commits

- Branches: `feat/assunto`, `fix/assunto`, `refactor/assunto`, `hotfix/assunto`.
- Commits em inglês, [Conventional Commits](https://www.conventionalcommits.org): `feat(web): add location port`, `fix(node): honor Retry-After date`.

## Checklist do PR

- [ ] Biome sem erro: `npm run lint` (`biome check .`). Para corrigir: `npm run format` (`biome check --write .`).
- [ ] `npm run typecheck`, `npm test` e `npm run build` passam.
- [ ] README do pacote (e o da raiz, se mudou a API pública) atualizado.
- [ ] Exemplo atualizado, se a API pública mudou.
- [ ] Tamanho do `packages/web/dist/sdk.js` com gzip informado no PR (`gzip -9 -c packages/web/dist/sdk.js | wc -c`), sem crescer sem motivo.
- [ ] Schema da fixture igual ao da API.

## Release

A publicação no npm é manual, feita por quem mantém o escopo `@conty`: bump de versão no `package.json` do pacote, `npm run build` e `npm publish -w @conty/<pacote>`.

## Bugs e segurança

- Bug: abra uma issue com versão do pacote, plataforma e um exemplo mínimo.
- Falha de segurança: não abra issue pública. Reporte em privado pelo [GitHub Security Advisories](https://github.com/Conty-App/conty-sdk/security/advisories/new).
