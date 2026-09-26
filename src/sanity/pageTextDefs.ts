/**
 * AS PÁGINAS DO SITE QUE A ANDREA EDITA NO PAINEL — a lista única.
 *
 * 🔴 POR QUE UMA LISTA SÓ (25/09/2026): o Igor pediu "todo conteúdo dessas
 * páginas deve poder ser editado pelo painel sem usar códigos". A home já tinha
 * ido para o painel em 23/09, com o schema escrito à mão e um script de
 * semeadura com a MESMA lista de campos copiada. Com 9 páginas, duas listas
 * copiadas saem de sincronia no primeiro campo novo. Daqui saem as duas coisas:
 *   • o schema do painel   → `schemaTypes/documents/pageTexts.ts`
 *   • a semeadura inicial  → `semeia-textos-paginas.mjs` (lê este arquivo)
 *
 * ⚠️ ESTE ARQUIVO NÃO PODE IMPORTAR NADA. O script de semeadura o carrega com o
 * Node puro (que entende TypeScript só removendo os tipos), sem o Next nem o
 * alias `@/`. Só dados e `export type`.
 *
 * 📌 A REGRA DO NOME: o nome do campo no Sanity é a chave de tradução, e a
 * chave aninhada vira camelCase (`questions.name` → `questionsName`). A página
 * lê com `tx("q1")` e, se o campo estiver vazio, cai no `messages/<locale>.json`
 * (ver `src/lib/pageText.ts`). Por isso todo campo é opcional.
 *
 * Formato de cada campo: [nome, título no painel, tipo?, ajuda?]
 *   s    texto curto (localeString)      — padrão
 *   t    texto longo (localeText)
 *   str  texto curto IGUAL nos 3 idiomas (e-mail, nome de pessoa)
 *   ls   lista de textos curtos
 *   lt   lista de textos longos (cada item vira um parágrafo)
 *   url  endereço (um só, igual nos 3 idiomas)
 *   num  número (os percentuais dos gráficos)
 *   img  uma imagem
 *   imgs galeria de imagens, cada uma com descrição (alt) nos 3 idiomas
 */

export type FieldKind = "s" | "t" | "str" | "ls" | "lt" | "url" | "num" | "img" | "imgs";
export type FieldDef = [name: string, title: string, kind?: FieldKind, help?: string];
export type GroupDef = { name: string; title: string; fields: FieldDef[] };
export type PageDef = {
  /** Tipo E id do documento no Sanity (singleton). */
  type: string;
  title: string;
  subtitle: string;
  /**
   * De onde vêm os textos de reserva. Uma página pode ler mais de um
   * namespace: `evidence` (a abertura comum de Pesquisa e Confraria) mora no
   * documento da Pesquisa com o prefixo `evidence`.
   */
  sources: { namespace: string; prefix?: string }[];
  groups: GroupDef[];
};

// Ajuda repetida em todo campo de lista.
const LISTA = "Cada item é uma linha. Arraste para reordenar.";
const PCT = "Número de 0 a 100, com ponto como separador decimal (ex.: 54.8).";

export const PAGE_DEFS: PageDef[] = [
  // ======================================================== PÁGINA INICIAL
  {
    type: "homePage",
    title: "Página inicial",
    subtitle: "Textos da home e as 3 perguntas da investigação",
    sources: [{ namespace: "home" }],
    groups: [
      {
        name: "topo",
        title: "Topo",
        fields: [
          ["rotatingLabel", "Chamada acima das perguntas que giram", "s", 'Hoje: "Você já se perguntou…"'],
          ["rotatingQuestions", "Perguntas que giram no topo", "ls", `As perguntas curtas que se alternam no alto da página. ${LISTA}`],
          ["answerLabel", "Frase de virada", "s", 'Hoje: "Existe um nome para tudo isso"'],
          ["title", "Título principal", "s", 'Hoje: "Ser Poder"'],
          ["leadStrong", "Primeira linha em destaque", "t"],
          ["lead", "Parágrafo de abertura", "t"],
          ["ctaPrimary", "Botão principal"],
          ["ctaSecondary", "Botão secundário"],
        ],
      },
      {
        name: "audiencia",
        title: "Para quem é",
        fields: [
          ["audienceBadge", "Etiqueta da seção"],
          ["audienceTitle", "Título da seção"],
          ["audienceDenial", "Bloco 1: para quem NÃO é", "lt", `⚠️ Cada linha vira um parágrafo, sem marcador. A quebra de linha é parte do texto: a repetição do "Para quem…" só funciona uma linha por vez. ${LISTA}`],
          ["audienceAffirmation", "Bloco 2: para quem é", "lt", LISTA],
          ["audiencePivot", "Bloco 3: a virada", "lt", LISTA],
          ["audienceTurn", "Bloco 4: o convite", "lt", LISTA],
          ["audienceClose", "Bloco 5: o fecho", "lt", LISTA],
        ],
      },
      {
        name: "tese",
        title: "A tese",
        fields: [
          ["thesisBadge", "Etiqueta da seção"],
          ["thesisTitle", "Título da seção"],
          ["thesisP1", "Parágrafo 1", "t"],
          ["thesisP2", "Parágrafo 2", "t"],
          ["thesisP3", "Parágrafo 3", "t"],
          ["thesisP4", "Parágrafo 4", "t"],
        ],
      },
      {
        name: "perguntas",
        title: "As 3 perguntas",
        fields: [
          ["questionsTitle", "Título da seção", "s", 'Hoje: "Três perguntas movem esta investigação"'],
          ["q1", "Pergunta 01", "t", "⚠️ As três perguntas aparecem na página inicial E no quadro da página Sobre. Editar aqui muda os dois lugares."],
          ["q2", "Pergunta 02", "t"],
          ["q3", "Pergunta 03", "t"],
        ],
      },
      {
        name: "ecp",
        title: "A ECP",
        fields: [
          ["ecpBadge", "Etiqueta da seção"],
          ["ecpTitle", "Título da seção"],
          ["ecpP1", "Parágrafo 1", "t"],
          ["ecpP2", "Parágrafo 2", "t"],
          ["ecpP3", "Parágrafo 3", "t"],
          ["ecpQuote", "Frase de fecho (em destaque)", "t"],
        ],
      },
      {
        name: "secoes",
        title: "Seções",
        fields: [
          ["dimensionsLabel", "Dimensões: etiqueta"],
          ["dimensionsTitle", "Dimensões: título"],
          ["vocabularyLabel", "Vocabulário: etiqueta"],
          ["vocabularyTitle", "Vocabulário: título"],
          ["vocabularyLead", "Vocabulário: linha de apoio", "t"],
          ["sectionCta", "Botão das bibliotecas", "s", 'Hoje: "Explorar a biblioteca"'],
        ],
      },
      {
        name: "newsletter",
        title: "Newsletter",
        fields: [
          ["newsletterBadge", "Etiqueta"],
          ["newsletterTitle", "Título"],
          ["newsletterLead", "Texto de apoio", "t"],
          ["newsletterCta", "Botão"],
          ["newsletterPlaceholder", "Exemplo dentro do campo de e-mail"],
          ["newsletterOk", "Mensagem de sucesso"],
          ["newsletterError", "Mensagem de erro"],
        ],
      },
    ],
  },

  // ================================================================= SOBRE
  {
    type: "aboutPage",
    title: "Sobre Andrea",
    subtitle: "Biografia, experiências, retrato e galeria",
    sources: [{ namespace: "aboutPage" }],
    groups: [
      {
        name: "topo",
        title: "Topo",
        fields: [
          ["role", "Etiqueta do topo", "s", 'Hoje: "Pesquisadora · Escritora · Professora". Também vira o cargo dela no Google (dados estruturados).'],
          ["headline", "Frase de apresentação", "t", "Aparece abaixo do nome e é a descrição da página no Google."],
        ],
      },
      {
        name: "bio",
        title: "Biografia",
        fields: [
          ["p1", "Parágrafo de abertura", "t"],
          ["questionsLabel", "Título do quadro das 3 perguntas", "s", "As perguntas em si são editadas em Página inicial → As 3 perguntas (é o mesmo texto nas duas páginas)."],
          ["p2", "Parágrafo 2", "t"],
          ["p3", "Parágrafo 3", "t"],
          ["quote", "Frase de fecho (em destaque)", "t"],
        ],
      },
      {
        name: "lateral",
        title: "Coluna lateral",
        fields: [
          ["photo", "Retrato", "img", "O retrato da coluna lateral E do topo da página inicial. Vazio = o retrato de 2026 que já está no site. Use foto em pé (é recortada em 3:4; clique na foto para marcar o ponto de foco)."],
          ["experiencesLabel", "Título da lista de experiências"],
          ["experiences", "Experiências", "ls", LISTA],
          ["methodCta", "Botão principal"],
          ["contactCta", "Botão de contato"],
        ],
      },
      {
        name: "galeria",
        title: "Galeria",
        fields: [
          ["galleryLabel", "Etiqueta da galeria"],
          ["galleryTitle", "Título da galeria"],
          ["gallerySoon", "Aviso enquanto não há fotos"],
          ["galleryFallbackAlt", "Descrição padrão das fotos sem descrição", "t"],
          // `gallery` é declarada à parte no schema (já existia, com legenda).
        ],
      },
    ],
  },

  // ============================================================== PESQUISA
  {
    type: "researchPage",
    title: "Pesquisa ECP",
    subtitle: "Números, dimensões, gráficos e metodologia",
    sources: [{ namespace: "researchPage" }, { namespace: "evidence", prefix: "evidence" }],
    groups: [
      {
        name: "topo",
        title: "Topo",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["title", "Título da página"],
          ["headline", "Frase de apresentação", "t", "Também é a descrição da página no Google."],
        ],
      },
      {
        name: "abertura",
        title: "Abertura",
        fields: [
          ["evidenceLabel", "Etiqueta", "s", "⚠️ Este bloco abre a Pesquisa E a Confraria. Editar aqui muda as duas páginas."],
          ["evidenceIntro", "Texto", "t"],
          ["evidenceQuote", "Frase em destaque", "t"],
        ],
      },
      {
        name: "numeros",
        title: "Números",
        fields: [
          ["findingsLabel", "Título da seção"],
          ["stat1Value", "Número 1", "s", 'Como aparece na tela, com o %: "82,9%".'],
          ["stat1Label", "Número 1: o que ele diz", "t"],
          ["stat2Value", "Número 2"],
          ["stat2Label", "Número 2: o que ele diz", "t"],
          ["stat3Value", "Número 3"],
          ["stat3Label", "Número 3: o que ele diz", "t"],
        ],
      },
      {
        name: "dimensoes",
        title: "Dimensões",
        fields: [
          ["dimensionsLabel", "Título da seção"],
          ["dimensionsLead", "Texto de apoio", "t"],
          ["dimIdentityName", "Dimensão 01: nome"],
          ["dimIdentityFact1", "Dimensão 01: dado 1", "t"],
          ["dimIdentityFact2", "Dimensão 01: dado 2", "t"],
          ["dimContextName", "Dimensão 02: nome"],
          ["dimContextFact1", "Dimensão 02: dado 1", "t"],
          ["dimContextFact2", "Dimensão 02: dado 2", "t"],
          ["dimMovementName", "Dimensão 03: nome"],
          ["dimMovementFact1", "Dimensão 03: dado 1", "t"],
          ["dimMovementFact2", "Dimensão 03: dado 2", "t"],
          ["dimensionsClose", "Frase de fecho", "t"],
        ],
      },
      {
        name: "graficos",
        title: "Gráficos",
        fields: [
          ["chartLabel", "Etiqueta da seção"],
          ["chartsTitle", "Título da seção"],
          ["chartsLead", "Texto de apoio", "t"],
          ["chartNote", "Rodapé de todos os gráficos", "s", 'Hoje: "Base: 403 respondentes · Pesquisa ECP, 2026"'],

          ["chartIdeasTitle", "Gráfico 1: título"],
          ["chartIdeasSubtitle", "Gráfico 1: explicação", "t"],
          ["chartIdeasExternal", "Gráfico 1: nome do grupo de cima (vinho)"],
          ["ideaControl", "Gráfico 1 · barra 1"],
          ["ideaControlPct", "Gráfico 1 · barra 1 (%)", "num", PCT],
          ["ideaInfluence", "Gráfico 1 · barra 2"],
          ["ideaInfluencePct", "Gráfico 1 · barra 2 (%)", "num", PCT],
          ["ideaMoney", "Gráfico 1 · barra 3"],
          ["ideaMoneyPct", "Gráfico 1 · barra 3 (%)", "num", PCT],
          ["ideaStatus", "Gráfico 1 · barra 4"],
          ["ideaStatusPct", "Gráfico 1 · barra 4 (%)", "num", PCT],
          ["chartIdeasInternal", "Gráfico 1: nome do grupo de baixo (verde)"],
          ["ideaClarity", "Gráfico 1 · barra 5"],
          ["ideaClarityPct", "Gráfico 1 · barra 5 (%)", "num", PCT],
          ["ideaChoices", "Gráfico 1 · barra 6"],
          ["ideaChoicesPct", "Gráfico 1 · barra 6 (%)", "num", PCT],
          ["ideaReading", "Gráfico 1 · barra 7"],
          ["ideaReadingPct", "Gráfico 1 · barra 7 (%)", "num", PCT],
          ["ideaEmotional", "Gráfico 1 · barra 8"],
          ["ideaEmotionalPct", "Gráfico 1 · barra 8 (%)", "num", PCT],

          ["chartRefTitle", "Gráfico 2: título"],
          ["chartRefSubtitle", "Gráfico 2: explicação", "t"],
          ["refLegendOutside", "Gráfico 2: legenda vinho"],
          ["refLegendSelf", "Gráfico 2: legenda verde"],
          ["refPublic", "Gráfico 2 · barra 1"],
          ["refPublicPct", "Gráfico 2 · barra 1 (%)", "num", PCT],
          ["refExecutive", "Gráfico 2 · barra 2"],
          ["refExecutivePct", "Gráfico 2 · barra 2 (%)", "num", PCT],
          ["refClose", "Gráfico 2 · barra 3"],
          ["refClosePct", "Gráfico 2 · barra 3 (%)", "num", PCT],
          ["refYourself", "Gráfico 2 · barra 4 (verde)"],
          ["refYourselfPct", "Gráfico 2 · barra 4 (%)", "num", PCT],
          ["refOther", "Gráfico 2 · barra 5"],
          ["refOtherPct", "Gráfico 2 · barra 5 (%)", "num", PCT],

          ["chartGapTitle", "Gráfico 3: título"],
          ["chartGapSubtitle", "Gráfico 3: explicação", "t"],
          ["chartGapDeclared", "Gráfico 3: legenda verde"],
          ["chartGapLived", "Gráfico 3: legenda vinho"],
          ["gapIdentityTitle", "Gráfico 3 · linha 1: nome"],
          ["gapIdentityDeclared", "Gráfico 3 · linha 1: o que declaram"],
          ["gapIdentityDeclaredPct", "Gráfico 3 · linha 1: o que declaram (%)", "num", PCT],
          ["gapIdentityLived", "Gráfico 3 · linha 1: o que vivem"],
          ["gapIdentityLivedPct", "Gráfico 3 · linha 1: o que vivem (%)", "num", PCT],
          ["gapContextTitle", "Gráfico 3 · linha 2: nome"],
          ["gapContextDeclared", "Gráfico 3 · linha 2: o que declaram"],
          ["gapContextDeclaredPct", "Gráfico 3 · linha 2: o que declaram (%)", "num", PCT],
          ["gapContextLived", "Gráfico 3 · linha 2: o que vivem"],
          ["gapContextLivedPct", "Gráfico 3 · linha 2: o que vivem (%)", "num", PCT],
          ["gapMovementTitle", "Gráfico 3 · linha 3: nome"],
          ["gapMovementDeclared", "Gráfico 3 · linha 3: o que declaram"],
          ["gapMovementDeclaredPct", "Gráfico 3 · linha 3: o que declaram (%)", "num", PCT],
          ["gapMovementLived", "Gráfico 3 · linha 3: o que vivem"],
          ["gapMovementLivedPct", "Gráfico 3 · linha 3: o que vivem (%)", "num", PCT],
          ["gapFulfilmentTitle", "Gráfico 3 · linha 4: nome"],
          ["gapFulfilmentDeclared", "Gráfico 3 · linha 4: o que declaram"],
          ["gapFulfilmentDeclaredPct", "Gráfico 3 · linha 4: o que declaram (%)", "num", PCT],
          ["gapFulfilmentLived", "Gráfico 3 · linha 4: o que vivem"],
          ["gapFulfilmentLivedPct", "Gráfico 3 · linha 4: o que vivem (%)", "num", PCT],

          ["chartChoiceTitle", "Gráfico 4: título"],
          ["chartChoiceSubtitle", "Gráfico 4: explicação", "t"],
          ["choiceLegendExternal", "Gráfico 4: legenda vinho"],
          ["choiceLegendPartial", "Gráfico 4: legenda cinza"],
          ["choiceLegendTriad", "Gráfico 4: legenda verde"],
          ["choiceRecognition", "Gráfico 4 · barra 1 (vinho)"],
          ["choiceRecognitionPct", "Gráfico 4 · barra 1 (%)", "num", PCT],
          ["choiceSocial", "Gráfico 4 · barra 2 (cinza)"],
          ["choiceSocialPct", "Gráfico 4 · barra 2 (%)", "num", PCT],
          ["choiceTriad", "Gráfico 4 · barra 3 (verde)"],
          ["choiceTriadPct", "Gráfico 4 · barra 3 (%)", "num", PCT],
          ["choiceIdentity", "Gráfico 4 · barra 4 (cinza)"],
          ["choiceIdentityPct", "Gráfico 4 · barra 4 (%)", "num", PCT],
        ],
      },
      {
        name: "metodologia",
        title: "Metodologia",
        fields: [
          ["methodologyLabel", "Título"],
          ["method", "Texto da metodologia", "t"],
          ["researchUrl", "Link do botão \"Conheça a pesquisa\"", "url", "Deck público, PDF ou página. Vazio = o botão não aparece."],
          ["cta", "Texto do botão"],
        ],
      },
      {
        name: "ponte",
        title: "Ponte para a Confraria",
        fields: [
          ["crossTitle", "Título"],
          ["crossBody", "Texto", "t"],
          ["crossCta", "Botão"],
        ],
      },
    ],
  },

  // ============================================================= CONFRARIA
  {
    type: "confrariaPage",
    title: "Confraria Let's Be",
    subtitle: "Fotos, depoimento e link da Confraria",
    sources: [{ namespace: "confrariaPage" }],
    groups: [
      {
        name: "topo",
        title: "Topo",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["title", "Título da página"],
          ["headline", "Frase de apresentação", "t", "Também é a descrição da página no Google. O bloco de abertura logo abaixo é editado em Pesquisa ECP → Abertura (é o mesmo nas duas páginas)."],
        ],
      },
      {
        name: "fotos",
        title: "Fotos",
        fields: [
          ["photosLabel", "Título da seção"],
          ["photos", "Fotos", "imgs", "A PRIMEIRA é o destaque, em largura inteira; as demais formam o mosaico, cada uma na proporção original (nada é cortado). O mosaico é lido por colunas: com 9 fotos, a coluna 1 recebe as fotos 2 a 4, a 2 recebe 5 a 7 e a 3 recebe 8 a 10. Separe fotos parecidas."],
        ],
      },
      {
        name: "depoimento",
        title: "Depoimento e link",
        fields: [
          ["testimonialLabel", "Etiqueta do depoimento"],
          ["testimonialQuote", "Depoimento", "t", "Vazio = a seção do depoimento não aparece."],
          ["testimonialAuthor", "Quem disse", "str"],
          ["confrariaUrl", "Link do botão \"Conheça a Confraria\"", "url", "Vazio = o botão não aparece."],
          ["cta", "Texto do botão"],
        ],
      },
      {
        name: "ponte",
        title: "Ponte para a Pesquisa",
        fields: [
          ["crossTitle", "Título"],
          ["crossBody", "Texto", "t"],
          ["crossCta", "Botão"],
        ],
      },
    ],
  },

  // ================================================== ARTIGOS E PERGUNTAS
  {
    type: "articlesQuestionsPage",
    title: "Artigos e Perguntas",
    subtitle: "Apresentação dos blocos e o botão \"Envie sua pergunta\"",
    sources: [{ namespace: "articlesQuestionsPage" }],
    groups: [
      {
        name: "topo",
        title: "Topo",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["headline", "Frase de apresentação", "t", "Também é a descrição da página no Google."],
          ["orderLabel", "Rótulo do seletor \"Ver primeiro\""],
        ],
      },
      {
        name: "perguntas",
        title: "Perguntas Humanas",
        fields: [
          ["questionsTitle", "Título do bloco"],
          ["questionsP1", "Parágrafo 1", "t"],
          ["questionsP2", "Parágrafo 2", "t"],
          ["questionsCta", "Link para a lista completa"],
          ["askPrompt", "Convite para enviar pergunta", "t"],
          ["askCta", "Botão \"Envie sua pergunta\""],
          ["askFormUrl", "Link do formulário de perguntas", "url", "Tally, Google Forms ou similar. Vazio = o botão abre o WhatsApp com a mensagem já iniciada."],
        ],
      },
      {
        name: "artigos",
        title: "Artigos",
        fields: [
          ["articlesTitle", "Título do bloco"],
          ["articlesP1", "Parágrafo 1", "t"],
          ["articlesP2", "Parágrafo 2", "t"],
          ["articlesCta", "Link para a lista completa"],
        ],
      },
    ],
  },

  // ============================================================= NA MÍDIA
  {
    type: "mediaPage",
    title: "Na mídia",
    subtitle: "Textos da página de imprensa",
    sources: [{ namespace: "mediaPage" }],
    groups: [
      {
        name: "textos",
        title: "Textos",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["headline", "Frase de apresentação", "t", "Também é a descrição da página no Google. A lista em si vem dos Artigos com fonte Forbes ou LinkedIn e link do original."],
          ["pressTitle", "Título da lista"],
          ["empty", "Aviso quando a lista está vazia"],
          ["readAtSource", "Link para o original"],
          ["readAtHub", "Link para a versão no hub"],
          ["pressKitTitle", "Bloco de imprensa: título"],
          ["pressKitBody", "Bloco de imprensa: texto", "t"],
          ["pressKitCta", "Bloco de imprensa: botão"],
        ],
      },
    ],
  },

  // ================================================================ LIVRO
  {
    type: "bookPage",
    title: "Livro",
    subtitle: "Capa e textos da página do livro",
    sources: [{ namespace: "bookPage" }],
    groups: [
      {
        name: "textos",
        title: "Textos",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["status", "Situação", "s", 'Hoje: "Em preparação"'],
          ["headline", "Título", "t", "Também é a descrição da página no Google."],
          ["body", "Texto", "t"],
          ["cover", "Capa do livro", "img", "Vazio = a capa desenhada provisória. Use a imagem da capa em pé (3:4)."],
        ],
      },
    ],
  },

  // ============================================================== CONTATO
  {
    type: "contactPage",
    title: "Contato",
    subtitle: "E-mail e textos da página de contato",
    sources: [{ namespace: "contactPage" }],
    groups: [
      {
        name: "textos",
        title: "Textos",
        fields: [
          ["badge", "Etiqueta do topo"],
          ["headline", "Título"],
          ["lead", "Frase de apoio", "t", "Também é a descrição da página no Google."],
          ["emailLabel", "Rótulo do e-mail"],
          ["email", "E-mail de contato", "str", "O mesmo nos 3 idiomas."],
          ["socialLabel", "Rótulo das redes"],
          ["newsletterTitle", "Título do quadro da newsletter"],
        ],
      },
    ],
  },

  // =========================================================== BIBLIOTECAS
  {
    type: "librariesText",
    title: "Bibliotecas (nomes e descrições)",
    subtitle: "Vídeos, Perguntas, Conceitos, Casos e Artigos",
    sources: [{ namespace: "libraries" }],
    groups: [
      {
        name: "textos",
        title: "Textos",
        fields: [
          ["videosName", "Vídeos: nome", "s", "O nome aparece no topo da listagem, na página inicial e no caminho (breadcrumb) das páginas de cada item."],
          ["videosBadge", "Vídeos: etiqueta na página inicial"],
          ["videosDesc", "Vídeos: descrição", "t"],
          ["questionsName", "Perguntas: nome"],
          ["questionsBadge", "Perguntas: etiqueta na página inicial"],
          ["questionsDesc", "Perguntas: descrição", "t"],
          ["conceptsName", "Conceitos: nome"],
          ["conceptsBadge", "Conceitos: etiqueta"],
          ["conceptsDesc", "Conceitos: descrição", "t"],
          ["casesName", "Casos: nome"],
          ["casesBadge", "Casos: etiqueta"],
          ["casesDesc", "Casos: descrição", "t"],
          ["articlesName", "Artigos: nome"],
          ["articlesBadge", "Artigos: etiqueta na página inicial"],
          ["articlesDesc", "Artigos: descrição", "t"],
        ],
      },
    ],
  },
];

/** `questions.name` → `questionsName`. A mesma regra na página e na semeadura. */
export function fieldNameFor(key: string, prefix?: string): string {
  const camel = key.replace(/\.(\w)/g, (_, c: string) => c.toUpperCase());
  return prefix ? prefix + camel[0].toUpperCase() + camel.slice(1) : camel;
}
