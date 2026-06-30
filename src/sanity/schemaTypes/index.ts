import type { SchemaTypeDefinition } from "sanity";

import { localeString } from "./objects/localeString";
import { localeText } from "./objects/localeText";
import { localeBlock } from "./objects/localeBlock";
import { seo } from "./objects/seo";

import { topic } from "./documents/topic";
import { question } from "./documents/question";
import { concept } from "./documents/concept";
import { caseStudy } from "./documents/caseStudy";
import { article } from "./documents/article";
import { video } from "./documents/video";
import { aboutPage } from "./documents/aboutPage";
import { siteSettings } from "./documents/siteSettings";
import { aiSettings } from "./documents/aiSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // objetos
    localeString,
    localeText,
    localeBlock,
    seo,
    // documentos
    topic,
    question,
    concept,
    caseStudy,
    article,
    video,
    aboutPage,
    siteSettings,
    aiSettings,
  ],
};
