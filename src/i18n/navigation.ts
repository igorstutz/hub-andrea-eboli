import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrappers de navegação cientes do idioma (Link, redirect, etc.).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
