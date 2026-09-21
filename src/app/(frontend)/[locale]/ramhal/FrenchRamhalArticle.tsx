import { ArticleSection, Prose, RamhalArticleLayout, type ContentsItem } from './RamhalArticleLayout'

const CONTENTS = [
  { href: '#life', label: 'Une vie brève' },
  { href: '#controversy', label: 'La controverse' },
  { href: '#works', label: 'Les œuvres majeures' },
  { href: '#hanhaga', label: 'La Hanhaga' },
  { href: '#unity', label: 'De la dualité à l’Unité' },
  { href: '#legacy', label: 'Un héritage vivant' },
] as const satisfies readonly ContentsItem[]

export function FrenchRamhalArticle() {
  return (
    <RamhalArticleLayout
      contents={CONTENTS}
      contentsLabel="Dans cette page"
      eyebrow="1707–1746 · De Padoue à Acre"
      introduction="Cabaliste et logicien, talmudiste et poète, moraliste, grammairien, théologien et dramaturge — le Ramhal réunit des facultés que l’on oppose trop souvent."
      quote={<>« Avec le Ramhal, le caché devient révélé. La réalité cachée devient signifiante. »</>}
      quoteSource="Présentation de l’œuvre du Ramhal par l’Institut"
      title="Ramhal — la lumière éclatante"
    >
      <ArticleSection id="life" title="Une vie brève, une œuvre immense" first>
        <Prose>
          <p>Ramhal est l’acronyme de Rabbi Moché Haïm Luzzatto, né en 1707 dans le ghetto juif de Padoue, en Italie. Très jeune, il se distingue par l’étendue de son savoir et par une rare capacité à unir l’étude talmudique, la poésie, la langue hébraïque, la logique et la Cabale.</p>
          <p>À vingt ans, il rapporte la révélation d’un <i>Maguid</i>, une voix intérieure qui lui transmet des enseignements mystiques. Autour de lui se forme un cercle voué à l’étude continue du Zohar et au <i>Tikkun HaShechinah</i>. Cette activité, autant que le langage messianique de certains écrits, provoque une opposition violente.</p>
          <p>Contraint de quitter l’Italie, il gagne Amsterdam en 1735. Il y trouve quelques années de sérénité et publie ses œuvres les plus connues. En 1743, il part pour la Terre d’Israël et s’établit à Acre. Il meurt pendant une épidémie en 1746, à seulement trente-neuf ans.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="controversy" title="Écrire sous la pression de la controverse">
        <Prose>
          <p>Les polémiques qui entourent Ramhal doivent être comprises dans le traumatisme laissé par Sabbataï Tsevi. Pour plusieurs autorités rabbiniques, la combinaison d’un jeune maître, de révélations privées et d’un discours sur la rédemption évoque le danger encore récent du faux messianisme.</p>
          <p>En 1730, sur le conseil de son maître Rabbi Isaïe Bassan, Ramhal signe un engagement qui lui interdit d’écrire ses révélations dans la forme araméenne du Zohar. Cela ne suffit pas à calmer ses adversaires. Lors de son passage à Francfort en 1735, la menace du <i>hérèm</i> le conduit à accepter une nouvelle limitation portant sur l’écriture, l’enseignement et même l’étude de la Cabale.</p>
          <p>Cette contrainte transforme aussi son expression. Sans renoncer à la profondeur de la Cabale, Ramhal adopte une langue plus rationnelle, ordonnée et accessible. La persécution n’éteint donc pas sa pensée : elle contribue, paradoxalement, à lui donner la forme qui marquera durablement le judaïsme.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="works" kicker="Amsterdam, 1735–1743" title="Les œuvres majeures">
        <Prose>
          <p>À Amsterdam, Ramhal compose des livres qui traitent directement de l’éthique et de la foi, tout en portant la structure profonde de sa pensée cabalistique.</p>
        </Prose>
        <dl className="mt-8 divide-y divide-border border-y border-border">
          <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Messilat Yécharim</dt><dd className="leading-7 text-muted-foreground"><i>La Voie des justes</i> expose une progression exigeante vers la perfection morale, la piété et la proximité de Dieu.</dd></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Derekh Hachem</dt><dd className="leading-7 text-muted-foreground"><i>La Voie de Dieu</i> ordonne les fondements de la foi juive en un ensemble clair et systématique.</dd></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Daat Tévounot</dt><dd className="leading-7 text-muted-foreground">Un dialogue consacré à la Providence, au sens de l’histoire et à la révélation finale de l’Unité.</dd></div>
        </dl>
      </ArticleSection>

      <ArticleSection id="hanhaga" ornament="א" title="La Hanhaga — penser la direction de l’histoire">
        <Prose>
          <p>Le projet intellectuel du Ramhal n’est pas de saisir l’Essence divine, inaccessible à l’entendement, mais de comprendre la Volonté telle qu’elle se manifeste dans la création et dans l’histoire. L’histoire n’est donc pas une suite d’événements sans lien : elle est le champ de la <i>Hanhaga</i>, la direction divine du monde.</p>
          <p>Dans cette lecture, les <i>Partsoufim</i> — les « visages » ou configurations de la Cabale — ne décrivent pas seulement les principes de la création. Ils expriment aussi les modes selon lesquels l’histoire est conduite. Le langage symbolique devient ainsi une carte de sens.</p>
          <p>Ramhal donne au lecteur des clefs pour passer de l’allégorie à une pensée métaphysique intelligible. Le caché n’est ni banalisé ni supprimé : il devient signifiant. C’est l’une des raisons pour lesquelles son œuvre parle aussi bien au lecteur en quête de rigueur qu’à celui qui cherche la profondeur spirituelle.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="unity" ornament="ב" title="De la dualité à la révélation de l’Unité">
        <Prose>
          <p>L’Institut résume la visée de l’œuvre par deux termes : <i>Hanhaga</i>, la direction divine, et <i>Guilouy Yihoudo</i>, la révélation de l’Unité. Les oppositions qui structurent notre perception — sacré et profane, âme et corps, particulier et universel, mystique et rationnel — ne constituent pas le dernier mot du réel.</p>
          <p>Dans <i>Daat Tévounot</i>, la connaissance humaine ordinaire est décrite comme une pensée par contrastes : nous comprenons la lumière par les ténèbres, la vie par la mort, le bien par le mal. Ramhal cherche au-delà de cette perception fragmentée une voie de l’Unité, dans laquelle les contraires trouvent leur place dans un dessein unique.</p>
        </Prose>
        <aside className="my-8 border-y border-gold/60 py-7">
          <p className="mb-2 text-sm font-semibold text-gold-ink">En une phrase</p>
          <p className="font-serif text-xl leading-[1.8] text-teal-deep">Dieu ne désigne pas seulement le Créateur qui donne l’existence, mais la Volonté unique qui conduit toute l’histoire.</p>
        </aside>
        <Prose>
          <p>Le gouvernement de l’Unité n’efface pourtant ni l’homme ni sa responsabilité. Il lui donne une place dans le <i>Tikkoun hakelali</i>, la réparation universelle. La liberté humaine est réelle mais située : elle trouve son accomplissement dans la connaissance de Dieu, l’action juste et la participation consciente au projet divin.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="legacy" kicker="Une pensée toujours actuelle" title="Un héritage vivant">
        <Prose>
          <p>La force singulière du Ramhal tient à l’unité de son œuvre. Le moraliste de <i>Messilat Yécharim</i>, le théologien de <i>Derekh Hachem</i>, le penseur de l’histoire de <i>Daat Tévounot</i> et le cabaliste des grands commentaires ne sont pas quatre auteurs différents.</p>
          <p>Tous cherchent à montrer comment l’existence humaine, le devenir du monde et la vie intérieure s’inscrivent dans une seule direction. Chez Ramhal, la logique ne réduit pas le mystère : elle en rend l’étude possible.</p>
        </Prose>
        <p className="mt-8 bg-teal-deep px-6 py-7 text-lg leading-[1.85] text-primary-foreground/90 sm:px-9">Son œuvre libère la pensée des oppositions faciles et invite à découvrir, derrière la multiplicité du monde, la cohérence d’une Volonté unique. C’est cette alliance de clarté et de profondeur qui conserve aujourd’hui toute son actualité.</p>
      </ArticleSection>
    </RamhalArticleLayout>
  )
}
