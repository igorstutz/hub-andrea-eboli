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
export const conceptsListQuery = groq`
*[_type == "concept" && defined(slug.current)] | order(title.pt asc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "shortDefinition": coalesce(shortDefinition[$locale], shortDefinition.pt)
}`;

export const conceptBySlugQuery = groq`
*[_type == "concept" && slug.current == $slug][0]{
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "shortDefinition": coalesce(shortDefinition[$locale], shortDefinition.pt),
  "fullDefinition": coalesce(fullDefinition[$locale], fullDefinition.pt),
  "relatedConcepts": relatedConcepts[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current }
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
  "relatedQuestions": relatedQuestions[]->{ "title": coalesce(title[$locale], title.pt), "slug": slug.current },
  "metaTitle": coalesce(seo.metaTitle[$locale], seo.metaTitle.pt),
  "metaDescription": coalesce(seo.metaDescription[$locale], seo.metaDescription.pt)
}`;

// ---------- Pesquisas / Artigos ----------
export const articlesListQuery = groq`
*[_type == "article" && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc){
  "title": coalesce(title[$locale], title.pt),
  "slug": slug.current,
  "kind": kind,
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
