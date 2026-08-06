import { getTranslations } from "next-intl/server";
import { SOCIAL_LINKS } from "@/lib/social";
import SocialIcon from "./SocialIcon";

// Fileira de ícones das redes (rodapé — fundo escuro). Cada botão é uma pastilha
// que se inverte no hover: creme cheio com o glifo em vinho.
export default async function SocialLinks({
  showLabel = true,
}: {
  showLabel?: boolean;
}) {
  const t = await getTranslations("social");

  return (
    <div>
      {showLabel && <p className="kicker text-cream/40">{t("follow")}</p>}
      <ul className="mt-3 flex flex-wrap items-center gap-2.5">
        {SOCIAL_LINKS.map((s) => (
          <li key={s.id}>
            <a
              href={s.href}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label={t("label", { network: s.name })}
              title={s.handle ? `${s.name} · ${s.handle}` : s.name}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-cream hover:bg-cream hover:text-wine"
            >
              <SocialIcon name={s.id} className="h-[1.15rem] w-[1.15rem]" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
