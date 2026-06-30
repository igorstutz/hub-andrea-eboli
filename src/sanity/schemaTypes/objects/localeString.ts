import { defineType, defineField } from "sanity";

// Texto curto bilíngue (PT/EN) no nível do campo.
export const localeString = defineType({
  name: "localeString",
  title: "Texto (PT/EN)",
  type: "object",
  fields: [
    defineField({ name: "pt", title: "Português", type: "string" }),
    defineField({ name: "en", title: "English", type: "string" }),
    defineField({ name: "es", title: "Español", type: "string" }),
  ],
});
