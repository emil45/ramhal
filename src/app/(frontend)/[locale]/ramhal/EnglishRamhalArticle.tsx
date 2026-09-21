import { ArticleSection, Prose, RamhalArticleLayout, SourceCitation, type ContentsItem } from './RamhalArticleLayout'

const CONTENTS = [
  { href: '#beginnings', label: 'A remarkable beginning' },
  { href: '#revelation', label: 'Revelation and study' },
  { href: '#controversy', label: 'Years of controversy' },
  { href: '#amsterdam', label: 'Amsterdam and his books' },
  { href: '#israel', label: 'The Land of Israel' },
  { href: '#legacy', label: 'A lasting legacy' },
] as const satisfies readonly ContentsItem[]

export function EnglishRamhalArticle() {
  return (
    <RamhalArticleLayout
      contents={CONTENTS}
      contentsLabel="On this page"
      eyebrow="1707–1746 · Padua to Acre"
      introduction="Kabbalist, philosopher, ethicist, grammarian, poet and playwright — Rabbi Moshe Chaim Luzzatto was one of the most original and systematic minds in Jewish thought."
      quote={<>“I do not want to create conflicts with anybody. It is peace that we need.”</>}
      quoteSource="Ramhal, in a letter to his teacher Rabbi Isaiah Bassan"
      title="The Ramhal — Rabbi Moshe Chaim Luzzatto"
    >
      <ArticleSection id="beginnings" title="A remarkable beginning" first>
        <Prose>
          <p>Ramhal — also written Ramchal, the initials of Rabbi Moshe Chaim Luzzatto — was born in 1707 in the Jewish ghetto of Padua, Italy. His parents, Jacob Vita and Diamente Luzzatto, placed him in the yeshiva of Padua, where his gifts became apparent at an unusually early age.</p>
          <p>The institute’s biography records that, according to his friend and student Rabbi Yekutiel Gordon, by fourteen he knew the Kabbalah of the Ari by heart, without even his parents knowing the extent of his study. It places his first Kabbalistic work at fifteen. At seventeen he composed <i>Leshon Limmudim</i>, a study of Hebrew grammar, style, rhetoric and verse.</p>
          <p>His command of Hebrew extended well beyond religious exposition. His poetry and dramatic writing later led literary historians to regard him as an important precursor of modern Hebrew literature.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="revelation" title="The Maggid and the circle of study">
        <Prose>
          <p>At about twenty, Ramhal reported hearing a <i>Maggid</i>, an inner revelatory voice. He described the experience in a 1729 letter: while meditating on a <i>yihud</i>, he awoke to a voice that said it had come to reveal hidden wisdom. He subsequently wrote many pages of mystical teaching under what he understood to be the Maggid’s direction.</p>
          <p>A small circle formed around him for sustained study of the Zohar and for <i>Tikkun HaShechinah</i> — the spiritual repair associated with the Divine Presence. Its members accepted demanding rules of discipline, purity and devotion.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="controversy" title="Nine years of controversy">
        <Prose>
          <p>News of the Maggid and the study circle triggered fierce opposition. The trauma left by the false messiah Sabbatai Zevi was still close; for some leading rabbis, a young mystic writing about redemption appeared not merely unconventional but dangerous. Rabbi Moshe Hagiz became one of Ramhal’s most determined opponents.</p>
          <p>Ramhal denied claiming to be the Messiah, a saviour or a wonder-worker. His letters repeatedly asked that the dispute be examined on its substance and brought to a peaceful end. Nevertheless, under pressure he signed a declaration agreeing to stop writing revelations in the language of the Zohar. Earlier manuscripts were sealed and placed in safekeeping; much of that material was later lost.</p>
          <p>Between 1730 and 1734 he continued to write extensively, but in a more restrained and rational form. In 1735, exhausted by the conflict, he left Italy with his young family. During a stop in Frankfurt he was compelled to accept a further restriction on writing and teaching Kabbalah. One poignant condition allowed him to resume study at forty; he would die before reaching that age.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="amsterdam" title="Amsterdam and the masterworks">
        <Prose>
          <p>Amsterdam gave Ramhal a measure of stability. Rather than present Kabbalah in its most overt symbolic language, he wrote works of ethics and faith with extraordinary order and clarity. The result included three books that remain central to Jewish learning.</p>
        </Prose>
        <dl className="mt-8 divide-y divide-border border-y border-border">
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Mesillat Yesharim</dt><dd className="leading-7 text-muted-foreground"><i>The Path of the Just</i> — a disciplined path of ethical and spiritual growth, still studied across the Jewish world.</dd></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Daat Tevunot</dt><dd className="leading-7 text-muted-foreground">A dialogue on faith, divine governance and the ultimate revelation of God’s unity.</dd></div>
          <div className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"><dt className="font-serif text-lg font-semibold text-teal-deep">Derech Hashem</dt><dd className="leading-7 text-muted-foreground"><i>The Way of God</i> — a systematic account of creation, providence, prophecy and religious life.</dd></div>
        </dl>
      </ArticleSection>

      <ArticleSection id="israel" title="The Land of Israel">
        <Prose>
          <p>In 1743 Ramhal fulfilled his long-held wish to settle in the Land of Israel. The surviving record of these final years is sparse. He lived in or near Acre, and tradition also connects him with Tiberias.</p>
          <p>His life there was tragically short. In 1746, during an epidemic, Ramhal died at only thirty-nine, together with members of his family. No work securely known to have been written during these final years has yet been identified.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="legacy" kicker="Recognition after his death" title="A lasting legacy">
        <Prose>
          <p>Like many innovators, Ramhal received the recognition denied him in life only after his death. Traditions associated with the Vilna Gaon and the Maggid of Mezeritch speak of him with exceptional admiration. More enduring than any single tribute is the place his books now hold: works once viewed with suspicion have become foundations of ethics, faith and Kabbalistic thought.</p>
        </Prose>
        <figure className="mt-8 border-y border-gold/60 py-7">
          <blockquote className="font-serif text-xl leading-[1.8] text-teal-deep">“This book bears witness to the greatness of its author and his extraordinary vision of human heights.”</blockquote>
          <SourceCitation>A traditional attribution to the Vilna Gaon, concerning <i>Mesillat Yesharim</i></SourceCitation>
        </figure>
        <p className="mt-8 bg-teal-deep px-6 py-7 text-lg leading-[1.85] text-primary-foreground/90 sm:px-9">Ramhal’s achievement was to unite worlds often kept apart: rigorous logic and mystical vision, ethical practice and metaphysics, Hebrew literary art and systematic theology. His short life produced a body of work that continues to teach readers how inner growth, history and divine purpose belong to one coherent picture.</p>
      </ArticleSection>
    </RamhalArticleLayout>
  )
}
