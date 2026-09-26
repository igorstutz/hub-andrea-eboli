import { groq } from "next-sanity";

/*
  Conteúdo é bilíngue no nível do campo (pt/en). Resolvemos o idioma na query
  com coalesce(campo[$locale], campo.pt) — padrão oficial de i18n do Sanity.
*/

// ---------- Perguntas ----------
/**
 * ⚠️ REFERÊNCIA DE ARRAY SEMPRE COM `[defined(@->)]->`, NUNCA `[]->`.
 *
 * Quando o documento apontado deixa de existir — alguém despublicou ou apagou
 * no Studio — o GROQ devolve `null` DENTRO do array, e a página quebra ao ler
 * um campo desse null. Não é erro de página: é erro de PRERENDER, então o
 * `npm run build` inteiro falha e o site para de poder ser republicado.
 *
 * Aconteceu de verdade em 15/09/2026: uma pergunta apagada deixou o vídeo
 * "vulnerabilidade-e-fraqueza..." com uma referência solta e o build morreu em
 * `Cannot read properties of null (reading 'answer')` — com 4 das 5 referências
 * daquele vídeo perfeitamente válidas.
 *
 * `[defined(@->)]` descarta o que não resolve antes de dereferenciar. O
 * conteúdo some da página (que é o certo: ele não existe mais), o build passa,
 * e quem edita no Studio não derruba a publicação sem saber.
 */
export const questionsListQuery = groq`
*[_type == "question" && defined(slug.current)] | order(_createdAt desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "answer": coalesce(answer[$locale], answer.pt),
  "topic": topic->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current }
}`;

export const questionBySlugQuery = groq`
*[_type == "question" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "experience": coalesce(experience[$locale], experience.pt),
  "answer": coalesce(answer[$locale], answer.pt),
  "body": coalesce(body[$locale], body.pt),
  "topic": topic->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedConcepts": relatedConcepts[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "metaTitle": coalesce(seo.metaTitle[$locale], seo.metaTitle.pt),
  "metaDescription": coalesce(seo.metaDescription[$locale], seo.metaDescription.pt)
}`;

// ---------- Conceitos ----------
// `order` posiciona o verbete dentro do grupo (dimensão da ECP / vocabulário);
// sem número, cai no fim em ordem alfabética.
export const conceptsListQuery = groq`
*[_type == "concept" && defined(slug.current)] | order(coalesce(order, 999) asc, title.pt asc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "group": group,
  "order": order,
  "shortDefinition": coalesce(shortDefinition[$locale], shortDefinition.pt)
}`;

export const conceptBySlugQuery = groq`
*[_type == "concept" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "shortDefinition": coalesce(shortDefinition[$locale], shortDefinition.pt),
  "fullDefinition": coalesce(fullDefinition[$locale], fullDefinition.pt),
  "relatedConcepts": relatedConcepts[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  // O conceito é o pilar: tudo no hub que referencia este conceito, por tipo.
  "referencedByConcepts": *[_type == "concept" && references(^._id) && defined(slug.current)]{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": *[_type == "question" && references(^._id) && defined(slug.current)] | order(_createdAt desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedCases": *[_type == "caseStudy" && references(^._id) && defined(slug.current)] | order(_createdAt desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedArticles": *[_type == "article" && references(^._id) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedVideos": *[_type == "video" && references(^._id) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current }
}`;

// ---------- Sobre (singleton) ----------
// Só a galeria da página Sobre — os textos vêm de `pageTextQuery`.
// Entradas sem imagem são descartadas (slot vazio no Studio não quebra o build).
// `w`/`h` são as dimensões originais do arquivo: a galeria mostra cada foto na
// proporção em que foi tirada, então precisa delas para reservar a altura certa
// (sem isso a página pula enquanto as 40 imagens carregam).
export const aboutGalleryQuery = groq`
*[_type == "aboutPage"][0].gallery[defined(asset)]{
  "key": _key,
  "alt": coalesce(alt[$locale], alt.pt),
  "caption": coalesce(caption[$locale], caption.pt),
  "image": { "_type": "image", asset, hotspot, crop },
  "lqip": asset->metadata.lqip,
  "w": asset->metadata.dimensions.width,
  "h": asset->metadata.dimensions.height
}`;

// ---------- Casos ----------
export const casesListQuery = groq`
*[_type == "caseStudy" && defined(slug.current)] | order(_createdAt desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "description": coalesce(description[$locale], description.pt)
}`;

export const caseBySlugQuery = groq`
*[_type == "caseStudy" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "description": coalesce(description[$locale], description.pt),
  "pattern": coalesce(pattern[$locale], pattern.pt),
  "relatedConcepts": relatedConcepts[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "metaTitle": coalesce(seo.metaTitle[$locale], seo.metaTitle.pt),
  "metaDescription": coalesce(seo.metaDescription[$locale], seo.metaDescription.pt)
}`;

// ---------- Artigos ----------
export const articlesListQuery = groq`
*[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "kind": kind,
  "source": source,
  "excerpt": coalesce(excerpt[$locale], excerpt.pt),
  "publishedAt": publishedAt
}`;

// ---------- Na mídia ----------
// Aparições em veículos de FORA: só artigos cuja fonte é uma publicação
// externa e que têm o link de origem. `youtube` e `original` ficam fora de
// propósito: o canal e os textos originais são dela, não imprensa.
// Reaproveita o campo `source` do artigo, então a Andrea alimenta a /na-midia
// pelo mesmo lugar onde já publica ("Importar de link" ou o campo Fonte).
// Na mídia (26/09/2026): artigos com "Aparecer em Na mídia" ligado + as
// menções avulsas (pesquisa que a cita, matéria em que foi mencionada…).
// Antes era todo artigo da Forbes/LinkedIn, sem escolha.
// `url` é o original no veículo; artigo sem link da fonte leva à página no hub.
// A ordem usa a data do veículo quando existe (menções); a do artigo é a da
// importação, então ele só entra na ordem, sem data na tela.
export const pressListQuery = groq`
*[(_type == "article" && showInMedia == true && defined(slug.current))
  || (_type == "mediaMention" && defined(url))]{
  "type": _type,
  "key": _id,
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  source,
  outlet,
  kind,
  "url": select(_type == "mediaMention" => url, sourceUrl),
  "excerpt": coalesce(excerpt[$locale], excerpt.pt),
  date,
  "sort": coalesce(date, publishedAt, _createdAt)
} | order(sort desc)`;

export const articleBySlugQuery = groq`
*[_type == "article" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "kind": kind,
  "excerpt": coalesce(excerpt[$locale], excerpt.pt),
  "body": coalesce(body[$locale], body.pt),
  "publishedAt": publishedAt,
  "pdfUrl": pdf.asset->url,
  "relatedConcepts": relatedConcepts[defined(@->)]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "metaTitle": coalesce(seo.metaTitle[$locale], seo.metaTitle.pt),
  "metaDescription": coalesce(seo.metaDescription[$locale], seo.metaDescription.pt)
}`;

// ---------- Vídeos ----------
export const videosListQuery = groq`
*[_type == "video" && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "summary": coalesce(summary[$locale], summary.pt),
  "youtubeUrl": youtubeUrl,
  "durationSeconds": durationSeconds,
  isShort,
  "publishedAt": publishedAt
}`;

export const videoBySlugQuery = groq`
*[_type == "video" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "youtubeUrl": youtubeUrl,
  "publishedAt": publishedAt,
  "durationSeconds": durationSeconds,
  isShort,
  "directAnswer": coalesce(directAnswer[$locale], directAnswer.pt),
  "summary": coalesce(summary[$locale], summary.pt),
  "keyTakeaways": coalesce(keyTakeaways[$locale], keyTakeaways.pt),
  "chapters": chapters[]{ startTime, title },
  "transcript": coalesce(transcript[$locale], transcript.pt),
  "topic": topic->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[defined(@->)]->{
    "title": coalesce(title[$locale], title.pt),
    "slug": slug.current,
    "answer": coalesce(answer[$locale], answer.pt)
  },
  "relatedConcepts": relatedConcepts[defined(@->)]->{
    "title": coalesce(title[$locale], title.pt),
    "slug": slug.current,
    "shortDefinition": coalesce(shortDefinition[$locale], shortDefinition.pt)
  },
  "metaTitle": coalesce(seo.metaTitle[$locale], seo.metaTitle.pt),
  "metaDescription": coalesce(seo.metaDescription[$locale], seo.metaDescription.pt)
}`;

// ---------- Busca ----------
export const searchQuery = groq`
*[_type in ["question", "concept", "caseStudy", "article", "video"] && (
  title.pt match $q || title.en match $q || title.es match $q
)]{
  "type": _type,
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "excerpt": coalesce(answer[$locale], answer.pt, shortDefinition[$locale], shortDefinition.pt, description[$locale], description.pt, excerpt[$locale], excerpt.pt, summary[$locale], summary.pt)
}[0...30]`;

// ---------- Sitemap ----------
export const sitemapQuery = groq`
*[_type in ["question", "concept", "caseStudy", "article", "video"] && defined(slug.current)]{
  _type,
  "slug": slug.current,
  _updatedAt
}`;

// ---------------------------------------------------------------------------
// As páginas fixas (singletons de `src/sanity/pageTextDefs.ts`)
// ---------------------------------------------------------------------------
// Criado em 22/09/2026 para a home e estendido em 25/09 para todas as páginas
// fixas. O que ficar vazio no painel cai no arquivo de tradução (ver
// src/lib/pageText.ts).
//
// 📌 A projeção é `...` de propósito: o documento é um saco de textos e os
// nomes dos campos são IGUAIS às chaves de tradução. Listar campo por campo
// significaria editar esta query a cada campo novo no schema — e o sintoma de
// esquecer seria silencioso (o painel salva, o site ignora).
//
// `$id` é o tipo do singleton, que também é o _id (homePage, aboutPage…).
export const pageTextQuery = groq`*[_id == $id][0]{...}`;

// Uma galeria de página (campo tipo "imgs" de pageTextDefs), com as dimensões
// originais para o mosaico reservar a altura sem pular.
export const pagePhotosQuery = groq`
*[_id == $id][0][$field][defined(asset)]{
  "key": _key,
  "alt": coalesce(alt[$locale], alt.pt),
  "image": { "_type": "image", asset },
  "lqip": asset->metadata.lqip,
  "w": asset->metadata.dimensions.width,
  "h": asset->metadata.dimensions.height
}`;

// Uma imagem avulsa de página (campo tipo "img"): retrato, capa do livro.
// `image` vem null quando o campo existe sem arquivo (imagem removida no painel).
export const pageImageQuery = groq`
*[_id == $id][0][$field]{
  "image": select(defined(asset) => { "_type": "image", asset, hotspot, crop }),
  "lqip": asset->metadata.lqip
}`;
