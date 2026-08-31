import { groq } from "next-sanity";

/*
  Conteúdo é bilíngue no nível do campo (pt/en). Resolvemos o idioma na query
  com coalesce(campo[$locale], campo.pt) — padrão oficial de i18n do Sanity.
*/

// ---------- Perguntas ----------
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
  "relatedConcepts": relatedConcepts[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
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
  "relatedConcepts": relatedConcepts[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  // O conceito é o pilar: tudo no hub que referencia este conceito, por tipo.
  "referencedByConcepts": *[_type == "concept" && references(^._id) && defined(slug.current)]{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": *[_type == "question" && references(^._id) && defined(slug.current)] | order(_createdAt desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedCases": *[_type == "caseStudy" && references(^._id) && defined(slug.current)] | order(_createdAt desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedArticles": *[_type == "article" && references(^._id) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedVideos": *[_type == "video" && references(^._id) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){ "title": coalesce(title[$locale], title.pt), "slug": slug.current }
}`;

// ---------- Sobre (singleton) ----------
export const aboutQuery = groq`
*[_type == "aboutPage"][0]{
  name,
  "headline": coalesce(headline[$locale], headline.pt),
  "bio": coalesce(bio[$locale], bio.pt),
  "credentials": credentials[]{ "text": coalesce(@[$locale], @.pt) },
  photo,
  "sameAs": *[_type == "siteSettings"][0].socialLinks[].url
}`;

// Só a galeria da página Sobre — os textos dela vivem nos messages/*.json.
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
  "relatedConcepts": relatedConcepts[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
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
export const pressListQuery = groq`
*[_type == "article" && source in ["forbes", "linkedin"] && defined(sourceUrl)]
  | order(coalesce(publishedAt, _createdAt) desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "source": source,
  "sourceUrl": sourceUrl,
  "excerpt": coalesce(excerpt[$locale], excerpt.pt),
  "publishedAt": publishedAt
}`;

export const articleBySlugQuery = groq`
*[_type == "article" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "kind": kind,
  "excerpt": coalesce(excerpt[$locale], excerpt.pt),
  "body": coalesce(body[$locale], body.pt),
  "publishedAt": publishedAt,
  "pdfUrl": pdf.asset->url,
  "relatedConcepts": relatedConcepts[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
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
  "publishedAt": publishedAt
}`;

export const videoBySlugQuery = groq`
*[_type == "video" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "youtubeUrl": youtubeUrl,
  "publishedAt": publishedAt,
  "durationSeconds": durationSeconds,
  "directAnswer": coalesce(directAnswer[$locale], directAnswer.pt),
  "summary": coalesce(summary[$locale], summary.pt),
  "keyTakeaways": coalesce(keyTakeaways[$locale], keyTakeaways.pt),
  "chapters": chapters[]{ startTime, title },
  "transcript": coalesce(transcript[$locale], transcript.pt),
  "topic": topic->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "relatedQuestions": relatedQuestions[]->{
    "title": coalesce(title[$locale], title.pt),
    "slug": slug.current,
    "answer": coalesce(answer[$locale], answer.pt)
  },
  "relatedConcepts": relatedConcepts[]->{
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
