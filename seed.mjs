/*
  Seed de conteúdo de EXEMPLO (trilíngue) para o hub.

  Dois modos de uso:
    A) Via sessão do Sanity CLI (recomendado — escreve com sua conta de dono):
         npx sanity login            (uma vez)
         npx sanity exec seed.mjs --with-user-token
    B) Via token de escrita no ambiente:
         $env:SANITY_WRITE_TOKEN="<token Editor>"; node seed.mjs

  Os documentos têm _id fixo (createOrReplace = idempotente; pode rodar de novo).
  Tudo é editável/substituível no Studio pela Andrea.
*/

const projectId = "52ssivbg";
const dataset = "production";
const apiVersion = "2024-10-01";
const token = process.env.SANITY_WRITE_TOKEN;

let client;
if (token) {
  // Modo B: token explícito no ambiente.
  const { createClient } = await import("@sanity/client");
  client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
} else {
  // Modo A: usa o token da sessão do CLI (rodar com: sanity exec seed.mjs --with-user-token).
  const { getCliClient } = await import("sanity/cli");
  client = getCliClient({ apiVersion });
}

let k = 0;
const key = () => `k${k++}`;
const tri = (pt, en, es) => ({ pt, en, es });
const block = (text) => ({
  _type: "block",
  _key: key(),
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});
const triBlock = (pt, en, es) => ({
  pt: [block(pt)],
  en: [block(en)],
  es: [block(es)],
});
const slug = (current) => ({ _type: "slug", current });
const refKeyed = (id) => ({ _type: "reference", _ref: id, _key: key() });

const docs = [
  // ---------- Temas ----------
  { _id: "topic-identidade", _type: "topic", title: tri("Identidade", "Identity", "Identidad"), slug: slug("identidade"), description: tri("Quem você é quando ninguém está olhando.", "Who you are when no one is watching.", "Quién eres cuando nadie está mirando.") },
  { _id: "topic-validacao", _type: "topic", title: tri("Validação", "Validation", "Validación"), slug: slug("validacao"), description: tri("A busca por aprovação e seu custo.", "The search for approval and its cost.", "La búsqueda de aprobación y su costo.") },
  { _id: "topic-lideranca", _type: "topic", title: tri("Liderança", "Leadership", "Liderazgo"), slug: slug("lideranca"), description: tri("Liderar a partir da coerência, não do controle.", "Leading from coherence, not control.", "Liderar desde la coherencia, no el control.") },
  { _id: "topic-poder", _type: "topic", title: tri("Poder", "Power", "Poder"), slug: slug("poder"), description: tri("A diferença entre ter poder e ser poder.", "The difference between having power and being power.", "La diferencia entre tener poder y ser poder.") },

  // ---------- Conceitos ----------
  {
    _id: "concept-ser-poder", _type: "concept",
    title: tri("Ser Poder", "Ser Poder", "Ser Poder"),
    slug: slug("ser-poder"),
    shortDefinition: tri(
      "Capacidade de agir a partir da própria coerência interna, sem depender de validação externa.",
      "The capacity to act from one's own inner coherence, without depending on external validation.",
      "La capacidad de actuar desde la propia coherencia interna, sin depender de validación externa.",
    ),
    fullDefinition: triBlock(
      "Ser Poder é o estado em que suas escolhas nascem de dentro — da sua coerência — e não da necessidade de aprovação. (Conteúdo de exemplo: ajuste no Studio.)",
      "Ser Poder is the state in which your choices come from within — from your coherence — not from the need for approval. (Sample content: edit in the Studio.)",
      "Ser Poder es el estado en que tus decisiones nacen desde dentro — de tu coherencia — y no de la necesidad de aprobación. (Contenido de ejemplo: edítalo en el Studio.)",
    ),
  },
  {
    _id: "concept-ter-poder", _type: "concept",
    title: tri("Ter Poder", "Ter Poder", "Ter Poder"),
    slug: slug("ter-poder"),
    shortDefinition: tri(
      "Deter cargo, recursos ou influência externa — o que não garante coerência interna.",
      "Holding position, resources or external influence — which does not guarantee inner coherence.",
      "Tener cargo, recursos o influencia externa — lo que no garantiza coherencia interna.",
    ),
    fullDefinition: triBlock(
      "Ter Poder é externo e pode ser perdido. Ser Poder é interno e te pertence. (Conteúdo de exemplo.)",
      "Having power is external and can be lost. Being power is internal and belongs to you. (Sample content.)",
      "Tener poder es externo y puede perderse. Ser poder es interno y te pertenece. (Contenido de ejemplo.)",
    ),
    relatedConcepts: [refKeyed("concept-ser-poder")],
  },
  {
    _id: "concept-soberania", _type: "concept",
    title: tri("Soberania", "Sovereignty", "Soberanía"),
    slug: slug("soberania"),
    shortDefinition: tri(
      "A autoridade sobre as próprias escolhas, mesmo sob pressão externa.",
      "Authority over one's own choices, even under external pressure.",
      "La autoridad sobre las propias decisiones, incluso bajo presión externa.",
    ),
    fullDefinition: triBlock(
      "Soberania é decidir a partir de si, não a partir do medo do que os outros vão pensar. (Conteúdo de exemplo.)",
      "Sovereignty is deciding from yourself, not from the fear of what others will think. (Sample content.)",
      "Soberanía es decidir desde uno mismo, no desde el miedo a lo que los demás pensarán. (Contenido de ejemplo.)",
    ),
  },
  {
    _id: "concept-sobrevivencia-que-funciona", _type: "concept",
    title: tri("Sobrevivência que Funciona", "Survival That Works", "Supervivencia que Funciona"),
    slug: slug("sobrevivencia-que-funciona"),
    shortDefinition: tri(
      "Padrões que te protegeram no passado e hoje te limitam — funcionam até deixarem de funcionar.",
      "Patterns that protected you in the past and limit you today — they work until they stop working.",
      "Patrones que te protegieron en el pasado y hoy te limitan — funcionan hasta que dejan de funcionar.",
    ),
    fullDefinition: triBlock(
      "Buscar aprovação já te manteve segura um dia. O problema é quando isso vira o piloto automático da sua vida. (Conteúdo de exemplo.)",
      "Seeking approval once kept you safe. The problem is when it becomes the autopilot of your life. (Sample content.)",
      "Buscar aprobación alguna vez te mantuvo a salvo. El problema es cuando se vuelve el piloto automático de tu vida. (Contenido de ejemplo.)",
    ),
  },

  // ---------- Perguntas ----------
  {
    _id: "question-parar-de-buscar-validacao", _type: "question",
    title: tri("Como parar de buscar validação?", "How do I stop seeking validation?", "¿Cómo dejar de buscar validación?"),
    slug: slug("como-parar-de-buscar-validacao"),
    topic: { _type: "reference", _ref: "topic-validacao" },
    experience: tri(
      "Se você sente que só descansa quando os outros aprovam o que você faz, talvez já tenha duvidado se o problema é você.",
      "If you only feel at ease when others approve of what you do, you may have wondered whether the problem is you.",
      "Si solo te sientes en paz cuando los demás aprueban lo que haces, quizás te has preguntado si el problema eres tú.",
    ),
    answer: tri(
      "Buscar validação é uma sobrevivência que funciona — até deixar de funcionar. O caminho não é parar de querer aprovação, e sim deslocar a fonte do poder para dentro.",
      "Seeking validation is a survival that works — until it stops working. The path is not to stop wanting approval, but to move the source of power inward.",
      "Buscar validación es una supervivencia que funciona — hasta que deja de funcionar. El camino no es dejar de querer aprobación, sino mover la fuente del poder hacia dentro.",
    ),
    body: triBlock(
      "Comece percebendo em quais momentos você se trai para agradar. Nomear o padrão é o primeiro passo da Soberania. (Conteúdo de exemplo.)",
      "Start by noticing the moments when you betray yourself to please others. Naming the pattern is the first step toward Sovereignty. (Sample content.)",
      "Empieza por notar en qué momentos te traicionas para agradar. Nombrar el patrón es el primer paso hacia la Soberanía. (Contenido de ejemplo.)",
    ),
    relatedConcepts: [refKeyed("concept-ser-poder"), refKeyed("concept-soberania"), refKeyed("concept-sobrevivencia-que-funciona")],
    relatedQuestions: [refKeyed("question-recuperar-confianca")],
  },
  {
    _id: "question-vazia-apesar-do-sucesso", _type: "question",
    title: tri("Por que me sinto vazia apesar do sucesso?", "Why do I feel empty despite success?", "¿Por qué me siento vacía a pesar del éxito?"),
    slug: slug("por-que-me-sinto-vazia-apesar-do-sucesso"),
    topic: { _type: "reference", _ref: "topic-identidade" },
    experience: tri(
      "Você alcançou o que parecia ser tudo — e ainda assim há um vazio que o sucesso não preenche.",
      "You reached what looked like everything — and yet there is an emptiness success doesn't fill.",
      "Lograste lo que parecía ser todo — y aun así hay un vacío que el éxito no llena.",
    ),
    answer: tri(
      "O vazio costuma aparecer quando o sucesso externo (Ter Poder) cresce mais rápido do que a coerência interna (Ser Poder).",
      "Emptiness tends to appear when external success (Having Power) grows faster than inner coherence (Being Power).",
      "El vacío suele aparecer cuando el éxito externo (Tener Poder) crece más rápido que la coherencia interna (Ser Poder).",
    ),
    body: triBlock(
      "Não é sobre conquistar menos. É sobre alinhar o que você entrega ao mundo com quem você é. (Conteúdo de exemplo.)",
      "It's not about achieving less. It's about aligning what you give the world with who you are. (Sample content.)",
      "No se trata de lograr menos. Se trata de alinear lo que entregas al mundo con quien eres. (Contenido de ejemplo.)",
    ),
    relatedConcepts: [refKeyed("concept-ser-poder"), refKeyed("concept-ter-poder")],
  },
  {
    _id: "question-chefe-que-me-diminui", _type: "question",
    title: tri("Como lidar com um chefe que me diminui?", "How do I deal with a boss who belittles me?", "¿Cómo lidiar con un jefe que me menosprecia?"),
    slug: slug("como-lidar-com-um-chefe-que-me-diminui"),
    topic: { _type: "reference", _ref: "topic-lideranca" },
    experience: tri(
      "Se o seu chefe te diminui todos os dias, é fácil começar a acreditar que o problema é você.",
      "If your boss belittles you every day, it's easy to start believing the problem is you.",
      "Si tu jefe te menosprecia cada día, es fácil empezar a creer que el problema eres tú.",
    ),
    answer: tri(
      "Para lidar com um chefe que diminui, o primeiro passo é separar o fato (o comportamento dele) da narrativa (o que você passa a crer sobre si).",
      "To deal with a belittling boss, the first step is to separate the fact (his behavior) from the narrative (what you start to believe about yourself).",
      "Para lidiar con un jefe que menosprecia, el primer paso es separar el hecho (su comportamiento) de la narrativa (lo que empiezas a creer sobre ti).",
    ),
    body: triBlock(
      "Sua Soberania não pode ficar refém da régua de outra pessoa. (Conteúdo de exemplo.)",
      "Your Sovereignty cannot be hostage to someone else's ruler. (Sample content.)",
      "Tu Soberanía no puede ser rehén de la vara de otra persona. (Contenido de ejemplo.)",
    ),
    relatedConcepts: [refKeyed("concept-soberania"), refKeyed("concept-ser-poder")],
  },
  {
    _id: "question-recuperar-confianca", _type: "question",
    title: tri("Como recuperar a minha confiança?", "How do I rebuild my confidence?", "¿Cómo recuperar mi confianza?"),
    slug: slug("como-recuperar-minha-confianca"),
    topic: { _type: "reference", _ref: "topic-identidade" },
    experience: tri(
      "Houve um tempo em que você confiava em si. Em algum ponto, essa confiança foi ficando pequena.",
      "There was a time when you trusted yourself. At some point, that trust grew small.",
      "Hubo un tiempo en que confiabas en ti. En algún punto, esa confianza se fue achicando.",
    ),
    answer: tri(
      "Confiança não se recupera convencendo a mente — se recupera com pequenas provas de coerência: fazer o que você disse que faria, para si mesma.",
      "Confidence isn't rebuilt by convincing the mind — it's rebuilt with small proofs of coherence: doing what you said you would do, for yourself.",
      "La confianza no se recupera convenciendo a la mente — se recupera con pequeñas pruebas de coherencia: hacer lo que dijiste que harías, para ti misma.",
    ),
    body: triBlock(
      "Cada promessa cumprida a si mesma reconstrói o chão da Soberania. (Conteúdo de exemplo.)",
      "Every promise kept to yourself rebuilds the ground of Sovereignty. (Sample content.)",
      "Cada promesa cumplida contigo misma reconstruye el suelo de la Soberanía. (Contenido de ejemplo.)",
    ),
    relatedConcepts: [refKeyed("concept-ser-poder")],
  },

  // ---------- Casos ----------
  {
    _id: "case-chefe-que-nunca-reconhece", _type: "caseStudy",
    title: tri("O chefe que nunca reconhece ninguém", "The boss who never recognizes anyone", "El jefe que nunca reconoce a nadie"),
    slug: slug("o-chefe-que-nunca-reconhece-ninguem"),
    description: tri(
      "Aquele que recebe todo resultado como esperado e nunca devolve reconhecimento.",
      "The one who takes every result as expected and never gives recognition back.",
      "Aquel que recibe todo resultado como esperado y nunca devuelve reconocimiento.",
    ),
    pattern: triBlock(
      "O não-reconhecimento vira combustível para você buscar ainda mais validação — e o ciclo se fecha. (Conteúdo de exemplo.)",
      "The lack of recognition becomes fuel for you to seek even more validation — and the cycle closes. (Sample content.)",
      "La falta de reconocimiento se vuelve combustible para buscar aún más validación — y el ciclo se cierra. (Contenido de ejemplo.)",
    ),
    relatedQuestions: [refKeyed("question-parar-de-buscar-validacao"), refKeyed("question-chefe-que-me-diminui")],
  },
  {
    _id: "case-controlador-que-chama-controle-de-ajuda", _type: "caseStudy",
    title: tri("O controlador que chama controle de ajuda", "The controller who calls control help", "El controlador que llama ayuda al control"),
    slug: slug("o-controlador-que-chama-controle-de-ajuda"),
    description: tri(
      "Aquele que invade suas decisões dizendo que é para o seu bem.",
      "The one who invades your decisions saying it's for your own good.",
      "Aquel que invade tus decisiones diciendo que es por tu bien.",
    ),
    pattern: triBlock(
      "Quando controle é rotulado de cuidado, questionar parece ingratidão — e a Soberania é a primeira a ceder. (Conteúdo de exemplo.)",
      "When control is labeled as care, questioning feels like ingratitude — and Sovereignty is the first to give in. (Sample content.)",
      "Cuando el control se etiqueta como cuidado, cuestionar parece ingratitud — y la Soberanía es la primera en ceder. (Contenido de ejemplo.)",
    ),
    relatedQuestions: [refKeyed("question-chefe-que-me-diminui")],
  },

  // ---------- Pesquisa / Artigo ----------
  {
    _id: "article-neurociencia-da-validacao", _type: "article",
    title: tri("A neurociência da validação", "The neuroscience of validation", "La neurociencia de la validación"),
    slug: slug("a-neurociencia-da-validacao"),
    kind: "article",
    publishedAt: "2026-01-15T12:00:00.000Z",
    excerpt: tri(
      "Por que o cérebro trata aprovação social como recompensa — e o que isso custa.",
      "Why the brain treats social approval as a reward — and what it costs.",
      "Por qué el cerebro trata la aprobación social como recompensa — y qué cuesta.",
    ),
    body: triBlock(
      "A aprovação ativa circuitos de recompensa semelhantes aos de outros estímulos. Entender isso ajuda a sair do piloto automático. (Conteúdo de exemplo.)",
      "Approval activates reward circuits similar to other stimuli. Understanding this helps to step out of autopilot. (Sample content.)",
      "La aprobación activa circuitos de recompensa similares a otros estímulos. Entenderlo ayuda a salir del piloto automático. (Contenido de ejemplo.)",
    ),
  },

  // ---------- Sobre (singleton) ----------
  {
    _id: "aboutPage", _type: "aboutPage",
    name: "Andrea Eboli",
    headline: tri(
      "Pesquisadora da distância entre o sucesso externo e a coerência interna.",
      "Researcher of the distance between outer success and inner coherence.",
      "Investigadora de la distancia entre el éxito externo y la coherencia interna.",
    ),
    bio: triBlock(
      "Andrea Eboli é estrategista, executiva e pesquisadora, com mais de 25 anos de experiência. Desenvolveu a tese Ser Poder. (Bio de exemplo — substituir.)",
      "Andrea Eboli is a strategist, executive and researcher with over 25 years of experience. She developed the Ser Poder thesis. (Sample bio — replace.)",
      "Andrea Eboli es estratega, ejecutiva e investigadora con más de 25 años de experiencia. Desarrolló la tesis Ser Poder. (Bio de ejemplo — reemplazar.)",
    ),
    credentials: [
      tri("Forbes Councils", "Forbes Councils", "Forbes Councils"),
      tri("Palestrante TED", "TED Speaker", "Conferencista TED"),
      tri("Professora na ESPM", "Professor at ESPM", "Profesora en ESPM"),
      tri("Doutora — Swiss Business School", "Doctorate — Swiss Business School", "Doctora — Swiss Business School"),
      tri("17 anos na Natura &Co", "17 years at Natura &Co", "17 años en Natura &Co"),
    ],
  },

  // ---------- Configurações (singleton) ----------
  {
    _id: "siteSettings", _type: "siteSettings",
    socialLinks: [
      { _key: key(), platform: "LinkedIn", url: "https://www.linkedin.com/in/andrea-eboli/" },
      { _key: key(), platform: "Instagram", url: "https://www.instagram.com/andrea_eboli_/" },
      { _key: key(), platform: "YouTube", url: "https://www.youtube.com/channel/UCunzYS55MNLr8zbo5K5UG0Q" },
    ],
    newsletterTitle: tri("Notas sobre Poder", "Notes on Power", "Notas sobre el Poder"),
    newsletterText: tri(
      "Observações sobre comportamento humano, identidade e poder consciente.",
      "Observations on human behavior, identity and conscious power.",
      "Observaciones sobre el comportamiento humano, la identidad y el poder consciente.",
    ),
  },
];

console.log(`Semeando ${docs.length} documentos em uma transação...`);
const tx = client.transaction();
for (const doc of docs) {
  tx.createOrReplace(doc);
}
// Commit único: o Sanity considera todos os documentos existindo juntos,
// então referências entre eles (mesmo "para frente") são aceitas.
await tx.commit({ visibility: "async" });
for (const doc of docs) {
  console.log("  ✓", doc._id);
}
console.log("Concluído.");
