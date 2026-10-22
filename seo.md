# Transuniverso: checagem de SEO

Lista completa do que falta, do que pode melhorar e do que já foi resolvido. Inclui até os itens que valem 1%, porque a soma deles faz diferença.

Só entra aqui o que afeta indexação, ranking ou a forma como o site aparece no Google, no Bing, nas respostas de IA e nos links compartilhados. Acessibilidade, conversão, aspectos jurídicos e design ficam de fora.

Prioridade: **[Crítico]** bloqueia o resto · **[Alto]** · **[Médio]** · **[Baixo]** (ganho pequeno).

---

## Checagem 2 · 22/10/2026 (estrutura nova)

Arquivos revisados: `index.html`, `src/App.jsx`, `src/Scene.jsx`, `src/styles.css`, `vercel.json`, `public/` e `dist/`.

### Lighthouse no build atual

Rodei o Lighthouse 13.5 em modo celular (4G simulado) contra `npm run preview`, que serve o `dist/` de 22/10 às 14:28.

| Categoria | Nota |
|---|---|
| SEO | 92 |
| Performance | 38 |

As métricas de performance contam porque os Core Web Vitals (LCP, CLS e INP) entram no ranking do Google.

| Métrica | Agora | Linha de base em `perf/baseline` |
|---|---|---|
| FCP | 2,9 s | 4,8 s |
| LCP | 14,0 s | 20,8 s |
| TBT | 1.970 ms | 11.313 ms |
| CLS | 0 | 0 |
| Speed Index | 5,7 s | 14,1 s |
| Peso total | 2.332 KiB | 4.682 KiB |

Ressalvas:

- O `vite preview` não comprime as respostas e a Vercel comprime, então em produção os números tendem a ser melhores.
- A linha de base foi medida em outras condições, então a comparação mostra a tendência, não um ganho exato.
- **O elemento do LCP é o texto "TRANSUNIVERSO" da cortina vermelha.** O Lighthouse mede a cortina, e o conteúdo real chega depois dela.
- O SEO 92 engana: o Lighthouse executa o JS. Um robô que não executa JS continua vendo a página vazia (item 1).

Erros de SEO que o Lighthouse apontou:

- `robots.txt` inválido, com 14 erros. Ele não existe, e o servidor devolve o `index.html` no lugar.
- O `/favicon.ico` não existe e dá 404 (item 13).

### O que mudou desde a checagem 1

**Resolvido** (todos melhoram os Core Web Vitals)

- ✅ O JS de 1,5 MB num arquivo só foi separado em `index` (389 KB) e `Scene` (1 MB, carregado com `lazy()`).
- ✅ A cortina não espera mais o 3D: só as fontes, com limite de 2,5 s.
- ✅ As fontes do Google Fonts saíram: agora estão no próprio site em `public/fonts/`, com subset latino.
- ✅ O `truck-old.glb` (3,3 MB) saiu do `dist/`, e o `truck.glb` caiu de 1,7 MB para 760 KB.
- ✅ As texturas da Terra passaram de 4K para 3K no desktop e 2K no celular.
- ✅ As fotos ganharam `srcSet` e `sizes`. O `aspect-[4/3]` reserva o espaço da `estrada.webp`, e o CLS medido é 0.
- ✅ O `vercel.json` define cache longo para `/assets` e cache de 7 dias para modelos, texturas, fontes e imagens. Brotli, HTTP/2 e HTTP/3 e CDN a Vercel já entrega.

**Parcial**

- 🟡 A cortina continua escondendo o conteúdo. Ficou mais rápida, mas ainda é o LCP, e o H1 só aparece de 0,5 a 2,7 s depois que ela sobe (itens 3 e 4).

**Ainda pendente**: tudo o que está na lista abaixo.

---

## Execução da seção 1 · 22/10/2026

Lighthouse no celular depois das mudanças, rodado contra `npm run preview`: **SEO 100** (antes 92), Performance 61, LCP 3,0 s, CLS 0,004. O `robots.txt` passou a ser válido. O LCP ainda é a cortina (item 3, adiado). Parte da melhora de performance veio de outra mudança feita em paralelo no `App.jsx`, que atrasa o download do 3D.

Conferido no navegador com o build: a página hidrata sem erros no console, o canvas 3D monta normalmente e os contadores começam do 0 e contam quando entram na tela.

| Item | Status |
|---|---|
| 1 · HTML pré-renderizado | ✅ Feito |
| 2 · Contadores no HTML | ✅ Feito |
| 3 · Cortina é o LCP | ⏸️ Adiado a pedido |
| 4 · H1 invisível | ⏸️ Aguardando decisão |
| 5 · `robots.txt` (+ `llms.txt`) | ✅ Feito |
| 6 · `sitemap.xml` | ✅ Feito |
| 7 · Migração do site atual | ✅ Verificado: não há URLs antigas para redirecionar |
| 8 · Search Console e Bing | 👤 Depende de você |
| 9 · URL canônica `www` | ✅ Feito (falta um ajuste no painel da Vercel) |
| 10 · `*.vercel.app` duplicado | ✅ Feito |
| 11 · IndexNow | ✅ Feito (rodar depois do deploy) |
| 12 · `<noscript>` | ➖ Dispensado pelo item 1 |

---

## Lista atual (checagem 2)

### 1. Indexação e renderização

1. ✅ **[Crítico] HTML pré-renderizado.** O `npm run build` agora roda `vite build` e depois o [prerender.mjs](prerender.mjs), que renderiza o `App` com `renderToString` e grava o HTML dentro do `#root` do `dist/index.html` (cerca de 64 KB, 686 palavras). O [main.jsx](src/main.jsx) hidrata esse HTML em vez de montar a página do zero. No `npm run dev` o `#root` continua vazio e a página monta como antes. O canvas 3D não é renderizado no servidor: ele monta logo depois da hidratação.
2. ✅ **[Crítico] Contadores com o valor final no HTML** ([App.jsx](src/App.jsx), `Counter`). O HTML traz "15", "99", "50", "13.500" e "100". No navegador, o número vai para 0 logo depois da hidratação e conta quando entra na tela, como antes. Robôs (user-agent com bot, crawl, spider ou lighthouse) ficam sempre com o valor final, para que um print do render não pegue a contagem pela metade.
3. ⏸️ **[Alto] A cortina vermelha é o LCP** ([App.jsx:642](src/App.jsx:642)). O que o Google mede como "maior elemento" é o "TRANSUNIVERSO" da cortina, e o H1 real fica coberto. Opções: tirar a cortina, ou limitá-la a algo como 600 ms e deixar o hero visível por baixo.
4. ⏸️ **[Alto] O H1 nasce invisível** ([App.jsx:171](src/App.jsx:171)). O bloco começa com `opacity: 0` e o H1 com `text-transparent` (efeito sweep), e os dois só aparecem depois da cortina, com atraso de 0,5 a 0,9 s mais 1,8 s de animação. O Chrome não conta texto invisível para o LCP. **Por que ficou parado:** enquanto a cortina (item 3) cobrir o hero, ela continua sendo o LCP, então mudar o H1 agora alteraria a animação sem nenhum ganho medido. O texto já está no HTML, então a indexação não depende disso. Vale fazer junto com o item 3.
5. ✅ **[Crítico] [robots.txt](public/robots.txt)** liberando todo o site e apontando para o sitemap. Como `User-agent: *` com `Allow: /` já vale para todos os robôs, os de IA estão listados num comentário só para registrar a decisão: busca com IA (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User), treino de IA (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, meta-externalagent, CCBot) e previews de link. Para bloquear algum, basta criar um grupo próprio com `Disallow: /`.
   - **[llms.txt](public/llms.txt):** resumo da empresa no formato do llmstxt.org, com serviços, seguros, credenciais, números e contato, usando só dados que já estão no site.
   - **`agents.txt`: não foi criado.** Há pelo menos quatro propostas diferentes com esse nome (uma em rascunho na IETF), nenhuma adotada, e nenhum robô de IA lê esse arquivo hoje. Uma delas até mudou de nome por conflito. Vale rever quando uma delas for adotada.
6. ✅ **[Crítico] [sitemap.xml](public/sitemap.xml)** com `https://www.transuniverso.com.br/`. Atualizar o `<lastmod>` quando o conteúdo mudar e incluir cada página nova.
7. ✅ **[Crítico] Migração do site atual.** O site no ar hoje também é uma SPA na Vercel, com uma só rota (`/`) e uma página 404 para o resto, sem sitemap. Não existem URLs antigas para redirecionar: o deploy novo substitui a mesma URL. Pontos encontrados:
   - O domínio sem `www` redireciona para o `www` com **307 (temporário)**. O certo é 308 ou 301 (permanente). Ver item 9.
   - O site atual tem a tag do **Google Ads `AW-17990074896`** com a conversão "Solicitar cotação". O site novo não tem essa tag. Não afeta SEO, mas se a empresa anuncia no Google Ads, as conversões param de ser contadas no deploy.
8. 🟡 **[Alto] Google Search Console: cadastrado em 22/10/2026** como propriedade de domínio (`transuniverso.com.br`), que cobre `www`, sem `www`, `http` e `https`. **Não apague o registro TXT do DNS:** ele mantém a verificação. Passos seguintes:
    - **22/10, Inspeção de URL da home:**
      - O teste ao vivo diz "URL disponível para o Google". "Não tem melhorias" é normal: o Search Console não tem relatório para `LocalBusiness`, e o FAQ não gera mais resultado enriquecido para empresas.
      - O índice diz "Cópia sem página canônica selecionada pelo usuário". Isso vem do rastreamento das 10:45, ainda no site antigo, que não tinha canonical. Somado ao redirect temporário (307) do domínio sem `www`, o Google provavelmente escolheu `https://transuniverso.com.br/` como canônica.
      - **Correção:** redirect trocado para 308 em 22/10 (item 9). Falta pedir a indexação da URL com `www` de novo.
    - [x] Sitemaps: `https://www.transuniverso.com.br/sitemap.xml` já foi lido pelo Google (aparece como origem na inspeção).
    - [ ] Inspeção de URL na home → "Testar URL ativa" → conferir o HTML renderizado e os dados estruturados → "Solicitar indexação" (uma vez só).
    - [ ] Bing Webmaster Tools: "Importar do Google Search Console" e depois `npm run indexnow`.
    - [ ] Configurações → Associações: vincular o GA4 quando ele existir (item 58).
    - [ ] Depois de 3 a 7 dias, conferir o relatório Páginas.
    - [ ] Depois de 2 a 4 semanas, conferir Desempenho → Consultas.
9. ✅ **[Alto] URL canônica `https://www.transuniverso.com.br/`.** O `index.html` tem `<link rel="canonical">`, e o [vercel.json](vercel.json) redireciona `transuniverso.com.br` para o `www` com 308 (permanente), mantendo o caminho. A Vercel já força HTTPS. **Painel da Vercel ajustado em 22/10:** conferido no site no ar, todas as variantes respondem 308 (permanente). `https://transuniverso.com.br/` vai direto para o `www`, mantendo o caminho. `http://transuniverso.com.br/` passa antes pelo `https` sem `www` (dois saltos, o padrão da Vercel, sem problema para o Google). `http://www…` vai direto para o `https://www…`.
10. ✅ **[Médio] `*.vercel.app` com `noindex`.** O `vercel.json` envia `X-Robots-Tag: noindex` em qualquer endereço `*.vercel.app`, além do canonical. O domínio próprio não é afetado. Não dá para testar localmente: conferir com `curl -I` no endereço `.vercel.app` depois do deploy.
11. ✅ **[Médio] IndexNow.** A chave está em [public/3d469584e95406a52d84b9b7fea6edd1.txt](public/3d469584e95406a52d84b9b7fea6edd1.txt). Depois de cada deploy com mudança de conteúdo, rodar `npm run indexnow`, que avisa Bing, Yandex, Seznam e Naver. Rodar só depois que o site novo estiver no ar no domínio, porque o serviço busca a chave nele.
12. ➖ **[Baixo] `<noscript>`:** dispensado. Com o item 1, robôs que não executam JS já leem a página inteira.

### 2. Metadados no `<head>`

**Feito em 22/10/2026.** Lighthouse no build: SEO 100 e Boas práticas 100, sem erros no console (o 404 do `/favicon.ico` sumiu).

13. ✅ **[Alto] Favicon "TU":** T branco e U vermelho lado a lado, na Syne ExtraBold (a fonte da logo), sobre fundo preto. Como a Syne é muito larga, as letras ocupam quase toda a largura do ícone, com 3 de 64 unidades de margem, para ficarem o mais altas possível. As letras foram convertidas em contornos a partir de `public/fonts/syne-latin.woff2`, com peso 800. Arquivos: [favicon.svg](public/favicon.svg), [favicon.ico](public/favicon.ico) (16, 32 e 48px) e [apple-touch-icon.png](public/apple-touch-icon.png) (180px, quadrado sem cantos e com mais margem, porque o iOS arredonda os cantos sozinho). O Google mostra o favicon ao lado do resultado da busca no celular.
14. ✅ **[Alto] Open Graph:** `og:type`, `og:locale=pt_BR`, `og:site_name`, `og:url`, `og:title`, `og:description` e `og:image` com URL absoluta, mais tipo, largura, altura e texto alternativo da imagem. Não muda o ranking, mas define como o link aparece no WhatsApp, LinkedIn e Facebook, e o Bing também lê essas tags.
15. ✅ **[Alto] [og-image.jpg](public/og-image.jpg):** 1200×630 e 99 KB. Tem o caminhão com a marca na estrada (foto da Lotação), o wordmark TRANSUNIVERSO, o H1 do site ("Sua carga no prazo e segurada.", com "e segurada." em vermelho) e três benefícios. Foi montada em HTML com as fontes do site e renderizada no Chrome. O WhatsApp guarda o preview em cache: links compartilhados antes do deploy podem continuar mostrando a versão antiga por um tempo.
16. ✅ **[Médio] Twitter Card:** `summary_large_image`, com título, descrição, imagem e texto alternativo.
17. ✅ **[Médio] Title:** `Transportadora de Lotação e Fracionada | Transuniverso`, com 54 caracteres e a palavra-chave no começo.
18. ✅ **[Médio] Description:** "Transportadora em Mogi das Cruzes/SP: frete lotação e fracionado para todo o Brasil, frota própria e seguro de 100% da carga. Cotação em 15 min no WhatsApp." Tem 155 caracteres e inclui o local e a ação. O Open Graph usa uma versão mais curta, sem a cidade.
19. ✅ **[Médio] `<meta name="robots" content="index, follow, max-image-preview:large">`**, que libera imagens grandes nos resultados e no Discover.

Depois do deploy, vale testar o preview no [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (que também limpa o cache usado pelo WhatsApp) e no [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

### 3. Dados estruturados (JSON-LD)

**Feito em 22/10/2026.** O JSON-LD fica no próprio [App.jsx](src/App.jsx) (constante `schema`) e é montado com os mesmos dados que a página mostra: `roadFeatures` gera os serviços, `credentials` as credenciais e `faqs` as perguntas. Assim, mudar o texto da página atualiza o JSON-LD junto. Ele vai no HTML pré-renderizado, num único `<script type="application/ld+json">` com um `@graph` de 6 nós ligados por `@id`. A hidratação no build roda sem erros no console.

Endereço e categoria batem com o Google Meu Negócio: "R. Dr. Laércio da Silva, 99 - Chácara Cruzeiro do Sul, Mogi das Cruzes - SP, 08740-650". O endereço no rodapé do site ainda não tem bairro nem CEP (item 38).

20. 🟡 **[Alto] `LocalBusiness`** (`#empresa`): `name`, `legalName`, `description`, `url`, `logo` ([logo.png](public/logo.png), 512px, com o TU do favicon), `image`, `telephone`, `email`, endereço com bairro e CEP, `areaServed: Brasil`, `taxID: 15.721.580/0001-83`, `foundingDate: 2012-05-25` e `alternateName: Transuniverso Transportes` (nome fantasia), conforme a Receita Federal. Também `hasMap`, com um link de busca no Google Maps, e `sameAs` com o Instagram e a entrada do perfil no Knowledge Graph do Google (`kgmid=/g/11m5hxvbg2`, tirado do link de compartilhamento do Google Meu Negócio).
    - **Ainda falta:** `openingHoursSpecification`, o horário de cada dia. No Google Meu Negócio aparece só "fecha às 18h".
    - **Ainda falta:** a página do LinkedIn no `sameAs`. O link do site ainda é placeholder (item 45).
    - **`geo` ficou de fora de propósito.** O OpenStreetMap só localiza o centro da rua, e num bairro e CEP diferentes dos do Google Meu Negócio. O Google posiciona a empresa pelo pin do próprio perfil.
    - **Achados no registro da Receita Federal:**
      - Data de abertura em 25/05/2012: em outubro de 2026 a empresa tem 14 anos, não 15. O "+15 anos" do site, do rodapé e do `llms.txt` só fica certo em maio de 2027.
      - Endereço cadastrado: R. Santa Perpétua, 295, Vila Sagrado Coração de Maria, CEP 08742-110. É diferente do endereço do site e do Google Meu Negócio. Não precisa ser igual, mas sites de consulta de CNPJ mostram esse endereço, e isso conta como citação divergente para o SEO local.
      - O transporte de produtos perigosos consta como CNAE secundário (4930-2/03), o que confirma o que o site promete.
21. ✅ **[Alto] `Service`** para Lotação, Fracionada e Produtos especiais, com `provider`, `areaServed: Brasil`, `serviceType: "Transporte rodoviário de cargas"` e a descrição da página.
22. ✅ **[Médio] `WebSite`** com `name: "Transuniverso"`, `inLanguage: pt-BR` e `publisher`, que define o nome do site no resultado do Google.
23. ✅ **[Médio] `FAQPage`** com as 7 perguntas e respostas da página.
24. ✅ **[Médio] `ContactPoint`** de vendas, com o telefone, o link do WhatsApp e `availableLanguage: Portuguese`.
25. ✅ **[Baixo] `hasCredential`** para AFE da ANVISA e RNTRC da ANTT. O MOPP ficou de fora: é um curso dos motoristas, não uma credencial da empresa.
26. 👤 **Validar depois do deploy** no [Rich Results Test](https://search.google.com/test/rich-results) e no [Schema Validator](https://validator.schema.org/), com a URL do site. Os dois precisam do site no ar. **Não foi usado `AggregateRating`:** as 4 avaliações do Google Meu Negócio já aparecem no painel do Google, e estrelas marcadas pela própria empresa no site não são exibidas e podem ser tratadas como spam.

### 4. Conteúdo e palavras-chave

27. ✅ **[Crítico] H1 com palavra-chave, sem mudar o visual.** O H1 agora começa com um trecho `sr-only` (invisível na tela, lido por buscadores e leitores de tela): "Transuniverso, transportadora rodoviária para todo o Brasil: Sua carga no prazo e segurada." O "15 anos" ficou de fora porque a Receita registra abertura em 25/05/2012, ou seja, 14 anos hoje.
    - **Risco:** o Google trata texto escondido como spam quando é usado para empilhar palavras-chave. Por isso o trecho é curto, verdadeiro, repete o que a página já diz e funciona como rótulo para leitores de tela. Não acrescente mais termos nele.
28. ✅ **[Alto] O subtítulo do hero virou `<p>`** (era `<h2>`). O visual não mudou, e a hierarquia de títulos agora começa certa.
29. **[Alto] Faltam páginas por serviço:** `/frete-lotacao`, `/carga-fracionada`, `/transporte-produtos-perigosos` e `/transporte-medicamentos-cosmeticos`, cada uma com cerca de 600 a 1.000 palavras e FAQ próprio. Uma página só ranqueia para poucas buscas.
30. ✅ **[Alto] Palavras-chave no texto.** Ajustes pequenos no texto que já existia, sem mudar o layout:

    | Onde | Agora diz | Palavra-chave |
    |---|---|---|
    | Lotação | "No frete lotação, o caminhão inteiro é seu…" | frete lotação |
    | Fracionada | "Pouca carga? No frete fracionado, você divide…" | frete fracionado |
    | Produtos especiais | "Transporte de medicamentos, cosméticos e produtos perigosos…" | transporte de medicamentos, cosméticos, produtos perigosos |
    | Intro de Serviços | "Frete lotação, carga fracionada ou carga que exige licença…" | frete lotação, carga fracionada |
    | Garantia | "…viaja com seguro de carga." | seguro de carga |
    | FAQ "Vocês atendem minha cidade?" | "Sim. Saímos de Mogi das Cruzes, no Alto Tietê (SP), atendemos todo o Brasil…" | Mogi das Cruzes, Alto Tietê, SP |
    | FAQ "Quanto tempo leva a cotação?" | "A cotação de frete sai em menos de 15 minutos, em horário comercial, pelo WhatsApp." | cotação de frete |
    | Alt da foto da Lotação | "…fazendo frete lotação na estrada" | frete lotação |
    | Alt da foto da estrada | "Caminhão vermelho da transportadora Transuniverso…" | transportadora |

    As respostas do FAQ também atualizam o JSON-LD, que é montado a partir delas. "Transportadora com AFE ANVISA" já estava coberta pela seção de credenciais.
    - **Não coube nesta página:** "frete São Paulo para [estado]". Isso pede páginas de rota (item 34).
31. **[Alto] Página "Sobre"** com história, fundação, frota (quantidade e tipos) e fotos reais. É o sinal de E-E-A-T (experiência e confiabilidade) que o Google avalia.
32. **[Médio] Página "Trabalhe conosco"** ([App.jsx:632](src/App.jsx:632)). Uma página própria ranqueia para "vaga motorista carreteiro Mogi das Cruzes", uma busca local com volume.
33. **[Médio] Blog ou guias:** lotação x fracionada, o que é RCTR-C, RC-DC e RC-V, o que é MOPP, como calcular cubagem, o que é AFE, documentos do frete (CT-e, MDF-e). Atraem buscas informacionais e links.
34. **[Médio] Páginas de rota** ("frete de SP para MG" e afins), só com conteúdo real, para não virarem doorway pages, que o Google penaliza.
35. **[Médio] Texto curto:** a página tem cerca de 650 palavras. As seções "Problema → Solução" e "Como funciona", previstas no copy, ainda não entraram.

### 5. SEO local

**Conferido em 22/10/2026**, a partir do print do perfil e do registro da Receita.

36. 🟡 **[Crítico] Google Business Profile: existe**, com o nome "Transuniverso Transportadora", a categoria "Trucking company" (empresa de transporte rodoviário), endereço completo, telefone, horário e botão de site. **O que melhorar no painel:**
    - Acrescentar categorias secundárias, como "Serviço de transporte de cargas" ou "Transportadora".
    - Preencher o horário de cada dia.
    - Publicar fotos reais da frota e do pátio. Hoje as fotos são do portão e da fachada.
    - Definir a área atendida.
    - Fazer publicações periódicas.
    - Conferir se o botão "Website" aponta para `https://www.transuniverso.com.br/`.
37. 🟡 **[Alto] Avaliações no Google:** são só 4, com nota 4,0. Concorrentes locais costumam ter dezenas. Pedir avaliação junto com o comprovante de entrega e responder todas, inclusive as negativas.
38. **[Alto] Endereço do rodapé incompleto** ([App.jsx](src/App.jsx), `Footer`): mostra "R. Dr. Laércio da Silva, 99 · Mogi das Cruzes/SP", sem bairro (Chácara Cruzeiro do Sul) e sem CEP (08740-650), que constam no Google Meu Negócio e no JSON-LD. Usar a tag `<address>` e o NAP idêntico ao do perfil.
    - **NAP divergente na Receita:** o CNPJ está cadastrado na R. Santa Perpétua, 295, CEP 08742-110. Sites de consulta de CNPJ, como Econodata, CNPJ.biz e Casa dos Dados, replicam esse endereço. Se a empresa mudou de endereço, atualizar o cadastro na Receita (Redesim/Junta Comercial).
39. **[Médio] Citações locais** com NAP idêntico: Apontador, TeleListas, Guia Mais, Econodata, Reclame Aqui, Associação Comercial de Mogi das Cruzes, NTC&Logística e SETCESP.
40. **[Baixo] Mapa incorporado** com carregamento lazy.

### 6. Performance (Core Web Vitals)

**Conferido em 22/10/2026**, depois do trabalho de performance feito em outra conversa. O site novo já está no ar.

| Medição (Lighthouse 13.5, celular, 4G simulado) | Perf. | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| Site no ar (www, com Brotli), 2 rodadas | 64–68 | 100 | 2,1 s | 2,2–2,3 s | 1.160–1.610 ms | 0,004–0,007 |
| Build local (`vite preview`, sem compressão), 3 rodadas | 60–79 | 100 | 2,3 s | 2,8–3,0 s | 440–1.630 ms | 0,004–0,007 |
| Build local, desktop | 96 | – | 0,5 s | 0,6 s | 70 ms | 0,009 |

O PageSpeed Insights ficou sem cota no dia da checagem, então o site no ar foi medido com o Lighthouse local contra a URL de produção.

41. ✅ **[Alto] LCP: 2,2–2,3 s no site no ar**, abaixo da meta de 2,5 s. Era 14 s antes. O LCP continua sendo o texto da cortina, que agora aparece no primeiro paint.
42. ✅ **CLS:** abaixo de 0,01, bem dentro da meta de 0,1.
43. 🟡 **[Médio] TBT de 0,4 a 1,6 s no laboratório.** É o 3D renderizado na CPU, porque o Chrome do Lighthouse não tem GPU. Sem o 3D, a nota ficaria perto de 88. Num celular real com GPU, esse custo é bem menor. O dono do site aceitou essa nota, e um fallback estático foi descartado (ver `CLAUDE.md`). O TBT é só um indicador de laboratório para o INP: o que conta no ranking é o INP medido em usuários reais.
44. 👤 **Dados de campo (CrUX):** o Google só ranqueia por Core Web Vitals medidos em usuários reais do Chrome. Um site com pouco tráfego costuma não ter dados de campo. Acompanhar em Search Console → Core Web Vitals (item 8) e, quando houver tráfego, no [PageSpeed Insights](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.transuniverso.com.br%2F).

### 7. Links

45. **[Alto] LinkedIn ainda é placeholder** ([App.jsx:562](src/App.jsx:562)), apontando para `linkedin.com/`. É um link de saída sem relação com a empresa e não serve para o `sameAs` do JSON-LD. Trocar pela página real ou remover.
46. **[Médio] O header não tem navegação.** Links para Serviços, Garantia, Dúvidas e Cotação ajudam o Google a mostrar links "pular para" e a entender as seções.

### 8. Imagens

47. **[Médio] Fotos reais da frota,** com alt contextual e local, como "Caminhão da Transuniverso no pátio em Mogi das Cruzes". Ajudam no Google Imagens e na busca local.
48. **[Baixo] Alt dos logos:** "Logo Amsted Rail" em vez de só "Amsted Rail".
49. **[Baixo] Sitemap de imagens,** ou as imagens incluídas no sitemap principal.

### 9. Off-page (autoridade)

50. **[Alto] Backlinks de clientes e parceiros:** página de fornecedores ou cases.
51. **[Médio] Associações:** NTC&Logística, SETCESP, ABTC e a associação comercial local, muitas com diretório de associados.
52. **[Médio] Imprensa local** do Alto Tietê.
53. **[Baixo] Vídeo no YouTube** da frota e da operação, que pode aparecer na busca de vídeos.

### 10. IA e buscadores generativos (GEO)

**Conferido em 22/10/2026 no site no ar.**

54. ✅ **[Alto] HTML pronto:** a página de produção já chega pré-renderizada, com o texto, o H1 com palavra-chave e o JSON-LD (com o CNPJ). Robôs de IA que não executam JS leem tudo.
55. ✅ **[Médio] `robots.txt` no ar** liberando todos os robôs, inclusive os de busca e de treino de IA, com o sitemap.
56. 🟡 **[Médio] Frases factuais autocontidas:** a definição completa da empresa está no JSON-LD (`description`), no `llms.txt`, no trecho invisível do H1 e na resposta "Saímos de Mogi das Cruzes, no Alto Tietê (SP)…" do FAQ. **Falta uma frase visível** do tipo "A Transuniverso é uma transportadora rodoviária de Mogi das Cruzes/SP que faz frete lotação e fracionado para todo o Brasil desde 2012." O melhor lugar é uma futura página "Sobre" (item 31) ou o rodapé.
57. 🟡 **[Baixo] [llms.txt](public/llms.txt) no ar.** Ainda diz "15 anos de operação", o mesmo dado desatualizado do site (a empresa tem 14 anos). Corrigir junto com os números da página quando for decidido entre "14 anos" e "desde 2012".

### 11. Medição

58. 🟡 **[Alto] GA4 instalado em 22/10/2026** (`G-46WQCRHKHX`, no [index.html](index.html)). Ainda falta o deploy.
    - Só mede no domínio de produção. Dev e `*.vercel.app` ficam fora dos relatórios.
    - O `gtag.js` só baixa depois que a página carrega e fica ociosa. Os eventos anteriores ficam na fila e são enviados quando ele chega.
    - **Eventos** (testados no Chrome com o domínio de produção apontado para o build local e os servidores do Google bloqueados):

      | Ação | Evento | Parâmetros |
      |---|---|---|
      | Clique em qualquer botão de WhatsApp de cotação | `generate_lead` | `method: whatsapp`, `cta_location`: header, top, numeros, rota, garantia, faq ou rodape |
      | Envio do formulário | `generate_lead` | `method: form`, `cta_location: contato`, `freight_type` (Lotação, Fracionada…) |
      | Clique no telefone ou e-mail do rodapé | `generate_lead` | `method: phone` ou `email` |
      | "Trabalhe conosco" | `trabalhe_conosco` | separado de propósito, para candidatos não contarem como clientes |

    **Falta você fazer, depois do deploy:**
    - [ ] GA4 → Relatórios → Tempo real: abrir o site e conferir a visita. Os eventos aparecem em até 1 minuto.
    - [ ] Administrador → Eventos: marcar `generate_lead` como **evento-chave**. Ele aparece na lista até 24 h depois do primeiro clique.
    - [ ] Administrador → Definições personalizadas: criar as dimensões `method`, `cta_location` e `freight_type` (escopo: evento), para usar nos relatórios.
    - [ ] Administrador → Vinculações de produtos → Search Console: vincular a propriedade `transuniverso.com.br`.
    - [ ] Administrador → Coleta e retenção de dados: subir a retenção para 14 meses (o padrão é 2).
    - [ ] Para ver o SEO funcionando: Relatórios → Aquisição → Aquisição de tráfego, filtrar "Organic Search" e olhar os eventos-chave.
    - **Urgente:** o site antigo tinha a tag do Google Ads `AW-17990074896`, com a conversão "Solicitar cotação". O site novo já está no ar sem ela. Se a empresa anuncia, o Google Ads parou de contar conversões e de alimentar o lance automático.

    **Plano**

    | # | Quem | Passo |
    |---|---|---|
    | 1 | Você | Criar a propriedade GA4 em analytics.google.com, com a conta Google da empresa: fuso de Brasília, moeda BRL e fluxo de dados "Web" para `https://www.transuniverso.com.br`. Me passar o ID de medição (`G-XXXXXXXXXX`). |
    | 2 | Você | No Google Ads, em Metas → Conversões → "Solicitar cotação" → Configuração da tag, copiar o rótulo da conversão (o trecho depois de `AW-17990074896/`). |
    | 3 | Eu | Carregar o `gtag.js` com o GA4 e o Google Ads depois do primeiro paint, para não piorar o LCP. |
    | 4 | Eu | Disparar um evento `generate_lead` em cada clique de WhatsApp, com a seção de origem (hero, números, serviços, garantia, FAQ, rodapé), e em cada envio do formulário. Disparar também cliques em telefone e e-mail. |
    | 5 | Eu | Enviar a mesma ação como conversão do Google Ads. |
    | 6 | Você | No GA4, marcar `generate_lead` como evento-chave e vincular o Search Console (Administrador → Vinculações de produtos) e o Google Ads. |
    | 7 | Você | Ver o resultado em Relatórios → Aquisição → Aquisição de tráfego, filtrando "Organic Search" e o evento `generate_lead`. |

    **LGPD:** o GA4 usa cookies. O mínimo é citar o GA4 numa política de privacidade. O ideal é o Consent Mode v2 com um aviso de cookies, que mantém medição anônima para quem recusar.

---

### Ordem recomendada

1. HTML pronto no build (1), contadores (2), cortina e H1 visíveis (3 e 4).
2. `<head>` completo (13 a 19), JSON-LD (20 a 24), `robots.txt` e `sitemap.xml` (5 e 6).
3. H1 com palavra-chave (27) e subtítulo como `<p>` (28).
4. Migração com 301 (7), Search Console e Bing (8), domínio canônico (9).
5. Google Business Profile (36), analytics (58) e LinkedIn real (45).
6. Depois: páginas por serviço, "Sobre", conteúdo e backlinks.

---

## Checagem 1 · 22/10/2026 (histórico)

A primeira checagem levantou 82 itens com a estrutura anterior: SPA vazia, cortina esperando o 3D, JS único de 1,5 MB, Google Fonts, `truck-old.glb` no build e texturas 4K. Os itens resolvidos desde então estão em "O que mudou desde a checagem 1". Os que continuam valendo foram renumerados na lista atual.
