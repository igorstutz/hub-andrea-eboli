import type { BarGroup, GapRow, Tone } from "@/lib/researchData";

/* ------------------------------------------------------------------
   GRÁFICOS DA PESQUISA ECP

   Desenhados NA PÁGINA (HTML + CSS), não como imagem. Antes eram .webp
   gerados por script e o resultado não parecia da casa: o desenho usava
   Georgia e Helvetica, enquanto o site é Fraunces + Inter. Como texto na
   página, o gráfico herda a tipografia, a paleta e o espaçamento reais da
   marca, acompanha os 3 idiomas sem gerar 3 arquivos e não precisa mais do
   truque de rolagem horizontal no celular.

   ESCALA: toda barra é lida sobre 100% da base (403 respondentes). Nenhuma
   barra é esticada para preencher o gráfico. Uma opção citada por 7,9% ocupa
   7,9% da pista, e é justamente esse o argumento: as ideias de poder interno
   são um traço fino na cabeça das pessoas.

   COR: vinho = poder externo, verde = poder interno, `muted` = uma dimensão
   só (nem uma coisa nem outra). O verde é o `green-soft` (#2c5a49) e não o
   `green-deep` (#14312c) por legibilidade: contra o vinho, o verde-deep tem
   separação de 2,6 em deuteranopia (as duas barras viram a mesma), e o
   verde-soft, 15,1. Os três juntos ficam em 12,1 no pior par.

   LEITURA DE TELA: rótulo e valor são texto de verdade, sempre visíveis, então
   a barra é decorativa (`aria-hidden`). Por isso também não há tooltip: ele só
   repetiria o que já está escrito ao lado.

   MARCA D'ÁGUA: a assinatura no pé de cada gráfico entra em qualquer captura
   de tela, que é o único caminho para tirar o gráfico daqui — não existe mais
   um arquivo de imagem para salvar com o botão direito.
------------------------------------------------------------------- */

type Labeler = (key: string) => string;

/** Vírgula decimal em pt/es, ponto em en. */
function pct(value: number, locale: string): string {
  const s = value.toFixed(1);
  return `${locale === "en" ? s : s.replace(".", ",")}%`;
}

const FILL: Record<Tone, string> = {
  external: "bg-wine",
  internal: "bg-green-soft",
  neutral: "bg-muted",
};

const RULE: Record<Tone, string> = {
  external: "border-wine/25",
  internal: "border-green-soft/30",
  neutral: "border-muted/30",
};

/** Chave de legenda: a cor vive na marquinha, o texto fica em tinta neutra.
 *  Cor em texto é o primeiro lugar onde um gráfico perde legibilidade. */
function Swatch({ tone }: { tone: Tone }) {
  return (
    <span aria-hidden className={`h-2.5 w-5 shrink-0 rounded-r-[3px] ${FILL[tone]}`} />
  );
}

export type LegendKey = { tone: Tone; label: string };

/** Legenda. Obrigatória sempre que o gráfico usa mais de uma cor sem cabeçalho
 *  de grupo dizendo o que cada uma significa. */
function Legend({ keys }: { keys: LegendKey[] }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
      {keys.map(({ tone, label }) => (
        <span
          key={label}
          className="flex items-center gap-2 text-xs text-ink-soft"
        >
          <Swatch tone={tone} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Uma linha: rótulo e valor na mesma linha, barra embaixo em largura cheia.
 *  O rótulo ganha a largura inteira em vez de uma coluna fixa — é o que faz o
 *  gráfico caber no celular sem encolher texto nem rolar de lado. */
function BarRow({
  label,
  value,
  tone,
  locale,
}: {
  label: string;
  value: number;
  tone: Tone;
  locale: string;
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[0.9rem] leading-snug text-ink-soft">{label}</span>
        <span className="shrink-0 text-[0.95rem] font-semibold tabular-nums text-ink">
          {pct(value, locale)}
        </span>
      </div>
      {/* Pista = 100% da base; o preenchimento é o percentual real. */}
      <div
        aria-hidden
        className="mt-2 h-3 w-full overflow-hidden rounded-r-[4px] bg-ink/[0.07]"
      >
        <div
          className={`h-full rounded-r-[4px] ${FILL[tone]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/** Moldura comum: título, subtítulo, corpo e nota de rodapé com a assinatura. */
function ChartFrame({
  title,
  subtitle,
  note,
  children,
}: {
  title: string;
  subtitle?: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-2xl border border-ink/10 bg-bone p-6 sm:p-8">
      <figcaption>
        <h3 className="text-xl text-wine sm:text-2xl">{title}</h3>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        )}
      </figcaption>

      <div className="mt-7">{children}</div>

      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink/10 pt-4">
        <span className="text-xs text-muted">{note}</span>
        <span className="wordmark text-sm text-wine-soft/80">Andrea Eboli</span>
      </div>
    </figure>
  );
}

/** Barras em ranking. Duas formas de dizer o que a cor significa, e o gráfico
 *  usa uma OU outra: cabeçalho por família (quando as famílias são blocos
 *  contíguos, como em "O que as pessoas chamam de poder") ou `legend` (quando
 *  as cores se misturam no meio do ranking e o cabeçalho quebraria a ordem,
 *  que é o caso da escolha forçada). */
export function RankedBars({
  groups,
  t,
  locale,
  title,
  subtitle,
  note,
  legend,
}: {
  groups: BarGroup[];
  t: Labeler;
  locale: string;
  title: string;
  subtitle?: string;
  note: string;
  legend?: LegendKey[];
}) {
  return (
    <ChartFrame title={title} subtitle={subtitle} note={note}>
      {legend && <Legend keys={legend} />}
      {groups.map((group, gi) => (
        <div key={group.titleKey ?? gi} className={gi > 0 ? "mt-8" : undefined}>
          {group.titleKey && (
            <p
              className={`flex items-center gap-2.5 border-b pb-2 ${RULE[group.tone]}`}
            >
              <Swatch tone={group.tone} />
              <span className="kicker text-ink-soft">{t(group.titleKey)}</span>
            </p>
          )}
          <div className={group.titleKey ? "mt-2" : undefined}>
            {group.bars.map((bar) => (
              <BarRow
                key={bar.labelKey}
                label={t(bar.labelKey)}
                value={bar.value}
                tone={bar.tone}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}
    </ChartFrame>
  );
}

/** Duas séries por linha: o que as pessoas declaram (verde) e o que a mesma
 *  pessoa relata viver (vinho). Duas séries pedem legenda — o rótulo de cada
 *  barra é diferente em cada linha, então a cor é o que amarra a leitura. */
export function GapBars({
  rows,
  t,
  locale,
  title,
  subtitle,
  note,
  declaredLegend,
  livedLegend,
}: {
  rows: GapRow[];
  t: Labeler;
  locale: string;
  title: string;
  subtitle?: string;
  note: string;
  declaredLegend: string;
  livedLegend: string;
}) {
  return (
    <ChartFrame title={title} subtitle={subtitle} note={note}>
      <Legend
        keys={[
          { tone: "internal", label: declaredLegend },
          { tone: "external", label: livedLegend },
        ]}
      />

      <div className="space-y-7">
        {rows.map((row) => (
          <div key={row.titleKey}>
            <p className="kicker text-muted">{t(row.titleKey)}</p>
            <div className="mt-1">
              <BarRow
                label={t(row.declared.labelKey)}
                value={row.declared.value}
                tone="internal"
                locale={locale}
              />
              <BarRow
                label={t(row.lived.labelKey)}
                value={row.lived.value}
                tone="external"
                locale={locale}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
