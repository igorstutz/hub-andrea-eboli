/**
 * DADOS DA PESQUISA ECP — base: 403 respondentes.
 *
 * ── De onde vêm os números ────────────────────────────────────────────────
 * Deck `Pesquisa IGB - (QExpress) (415_2026).pptx` e o documento
 * `Analise de Hipoteses vs Pesquisa - ECP.docx`, ambos enviados pela Andrea e
 * mantidos FORA do repositório (material não publicado).
 *
 * Os percentuais foram lidos dos XML de gráfico do próprio deck
 * (`ppt/charts/chartN.xml`), não digitados à mão. O número do gráfico está
 * anotado em cada bloco abaixo. Nos blocos de concordância (escala de 5
 * pontos) o valor é a soma de "concordo parcialmente" + "concordo totalmente",
 * que é exatamente como o documento de análise reporta — conferido item por
 * item contra ele.
 *
 * ── Duas leituras de "citaram a si mesmas" ────────────────────────────────
 * Existem dois números, e eles medem coisas diferentes:
 *   • 8,9% escolheram "Você mesmo(a)" na pergunta FECHADA (chart11). É o que
 *     esta página publica, e é o número que a Andrea usa no material dela.
 *   • 1,0% (4 de 403) escreveram o próprio nome na pergunta ABERTA P17, onde
 *     era preciso digitar um nome. Vive no subtítulo do gráfico de referência,
 *     porque o contraste entre os dois é o achado, não um erro.
 *
 * ── Recorte etário ────────────────────────────────────────────────────────
 * A amostra pretendida era 35-55, mas 39,7% da base tem 25-34. Por isso a
 * metodologia no site fala "de 25 a 55 anos": é a amostra realizada.
 */

/** Base da pesquisa. Todo percentual desta página é sobre ela. */
export const RESEARCH_BASE = 403;

/** Tom da barra:
 *   external = poder externo (vinho #41181e)
 *   internal = poder interno, ou a própria pessoa (verde-soft #2c5a49)
 *   neutral  = uma dimensão só da ECP, nem externo nem completo (muted #8b756a)
 *  Os três saem da paleta da marca e foram escolhidos por separação de leitura:
 *  o pior par dá ΔE 12,1 em protanopia. Vinho com verde-DEEP (#14312c), que
 *  seria o verde óbvio da marca, dava 2,6: as duas barras viravam a mesma. */
export type Tone = "external" | "internal" | "neutral";

export type Bar = {
  /** Sufixo da chave i18n dentro de `researchPage`. */
  labelKey: string;
  value: number;
  tone: Tone;
};

export type BarGroup = {
  /** Cabeçalho do grupo (chave i18n). Sem ele o grupo não recebe título. */
  titleKey?: string;
  tone: Tone;
  bars: Bar[];
};

/* ------------------------------------------------------------------ *
 * 1. O que as pessoas chamam de poder — P20, chart12.
 *    Até 3 respostas por pessoa, então a soma passa de 100%.
 *    Das 13 opções ficaram as 4 externas do topo e as 4 internas que a ECP
 *    nomeia; as intermediárias ("ser reconhecido" 19,9%, "ter liberdade"
 *    15,9%, "expressar-se" 7,7%, "ter tempo" 5,5%, "outras" 1,0%) ficaram de
 *    fora para o gráfico dizer uma coisa só.
 * ------------------------------------------------------------------ */
export const POWER_IDEAS: BarGroup[] = [
  {
    titleKey: "chartIdeasExternal",
    tone: "external",
    bars: [
      { labelKey: "ideaControl", value: 54.8, tone: "external" },
      { labelKey: "ideaInfluence", value: 46.9, tone: "external" },
      { labelKey: "ideaMoney", value: 42.9, tone: "external" },
      { labelKey: "ideaStatus", value: 34.5, tone: "external" },
    ],
  },
  {
    titleKey: "chartIdeasInternal",
    tone: "internal",
    bars: [
      { labelKey: "ideaClarity", value: 15.4, tone: "internal" },
      { labelKey: "ideaChoices", value: 14.9, tone: "internal" },
      { labelKey: "ideaReading", value: 8.9, tone: "internal" },
      { labelKey: "ideaEmotional", value: 7.9, tone: "internal" },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 2. Em quem pensam ao imaginar alguém poderoso — chart11 (P fechada).
 *    Resposta única. "Você mesmo(a)" é o destaque: é a origem do 8,9%.
 *    Aqui `external` quer dizer "alguém de fora" e `internal`, "a própria
 *    pessoa". "Outras respostas" é caixa-preta, não uma categoria de poder
 *    externo, então vai em `neutral` para não inflar o argumento.
 * ------------------------------------------------------------------ */
export const POWER_REFERENCE: BarGroup[] = [
  {
    tone: "external",
    bars: [
      { labelKey: "refPublic", value: 58.8, tone: "external" },
      { labelKey: "refExecutive", value: 13.9, tone: "external" },
      { labelKey: "refClose", value: 9.4, tone: "external" },
      { labelKey: "refYourself", value: 8.9, tone: "internal" },
      { labelKey: "refOther", value: 8.9, tone: "neutral" },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 3. O que declaram × o que vivem — o achado central da análise.
 *    Cada linha põe lado a lado uma capacidade declarada (verde) e o que a
 *    mesma pessoa relata viver (vinho). Fontes por linha:
 *      Identidade  chart17: 24,6+65,5=90,1 · 35,0+18,6=53,6
 *      Contexto    chart18: 33,8+50,9=84,6 · 37,2+26,8=64,0
 *      Movimento   chart19: 39,2+31,0=70,2 · 35,5+24,1=59,6
 *      Realização  chart13: 35,5+40,0=75,4 · chart14: 38,7+26,8=65,5
 * ------------------------------------------------------------------ */
export type GapRow = {
  titleKey: string;
  declared: { labelKey: string; value: number };
  lived: { labelKey: string; value: number };
};

export const DECLARED_VS_LIVED: GapRow[] = [
  {
    titleKey: "gapIdentityTitle",
    declared: { labelKey: "gapIdentityDeclared", value: 90.1 },
    lived: { labelKey: "gapIdentityLived", value: 53.6 },
  },
  {
    titleKey: "gapContextTitle",
    declared: { labelKey: "gapContextDeclared", value: 84.6 },
    lived: { labelKey: "gapContextLived", value: 64.0 },
  },
  {
    titleKey: "gapMovementTitle",
    declared: { labelKey: "gapMovementDeclared", value: 70.2 },
    lived: { labelKey: "gapMovementLived", value: 59.6 },
  },
  {
    titleKey: "gapFulfilmentTitle",
    declared: { labelKey: "gapFulfilmentDeclared", value: 75.4 },
    lived: { labelKey: "gapFulfilmentLived", value: 65.5 },
  },
];

/* ------------------------------------------------------------------ *
 * 4. Escolha forçada: qual destas pessoas é a mais poderosa — chart21.
 *    Resposta única entre 4 perfis. O perfil da tríade da ECP (clareza sobre
 *    si + leitura de contexto + ação coerente) é o destaque em verde: ele
 *    supera a identidade isolada, mas perde do reconhecimento externo.
 *
 *    ⚠️ Os três tons aqui são semânticos, não decorativos. "Inteligência
 *    social" é a dimensão Contexto sozinha e "clareza profunda sobre quem é" é
 *    a dimensão Identidade sozinha: as duas são poder interno PARCIAL, então
 *    pintá-las de vinho diria ao leitor que são poder externo, contradizendo
 *    os três gráficos anteriores. Vão em `neutral`. Como as cores se alternam
 *    no meio do ranking, este é o gráfico que usa legenda em vez de cabeçalho
 *    de família (a ordem do ranking é o achado e não pode ser quebrada).
 * ------------------------------------------------------------------ */
export const FORCED_CHOICE: BarGroup[] = [
  {
    tone: "external",
    bars: [
      { labelKey: "choiceRecognition", value: 36.5, tone: "external" },
      { labelKey: "choiceSocial", value: 22.8, tone: "neutral" },
      { labelKey: "choiceTriad", value: 22.3, tone: "internal" },
      { labelKey: "choiceIdentity", value: 18.4, tone: "neutral" },
    ],
  },
];
