import { defineType, defineField } from "sanity";

// Texto longo bilíngue (PT/EN).
export const localeText = defineType({
  name: "localeText",
  title: "Texto longo (PT/EN)",
  type: "object",
  fields: [
    defineField({ name: "pt", title: "Português", type: "text", rows: 4 }),
    defineField({ name: "en", title: "English", type: "text", rows: 4 }),
    defineField({ name: "es", title: "Español", type: "text", rows: 4 }),
  ],
});
