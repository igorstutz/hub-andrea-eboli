import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL, OG_IMAGE_PATH, ogLocaleFor } from "@/lib/seo";
import "../../globals.css";

// Fraunces — serifada variável, de alto contraste e com pesos fortes:
// dá a "autoridade" que a Andrea pediu (a Cormorant anterior era leve demais).
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Metadata base de TODAS as páginas, por idioma: título, descrição e o cartão
// que aparece quando alguém compartilha um link (Open Graph / Twitter).
// O metadataBase vem de SITE_URL para valer também na homologação do Pages, que
// mora num subcaminho; caminhos "/algo" nos campos de metadata são resolvidos a
// partir do fim dele, então preservam o basePath.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("siteTitle");
  const description = t("siteDescription");
  const images = [
    { url: OG_IMAGE_PATH, width: 1200, height: 630, alt: t("ogImageAlt") },
  ];

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · Andrea Eboli" },
    description,
    openGraph: {
      type: "website",
      siteName: "Andrea Eboli",
      locale: ogLocaleFor(locale),
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Habilita renderização estática por idioma (sem getLocale dinâmico).
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
