import { ArticleSection, Prose, RamhalArticleLayout, SourceCitation, type ContentsItem } from './RamhalArticleLayout'

const CONTENTS = [
  { href: '#biography', label: 'חייו בקצרה' },
  { href: '#teaching', label: 'תורת הרמח״ל' },
  { href: '#faith', label: 'אמונה' },
  { href: '#governance', label: 'הנהגה' },
  { href: '#unity', label: 'גילוי יחודו' },
  { href: '#conclusion', label: 'מסקנה' },
] as const satisfies readonly ContentsItem[]

export function HebrewRamhalArticle() {
  return (
    <RamhalArticleLayout
      contents={CONTENTS}
      contentsLabel="בעמוד זה"
      eyebrow="תס״ז–תק״ז · 1707–1746"
      introduction="מקובל, פילוסוף, איש מוסר ומחזאי — מן המוחות השיטתיים והמשפיעים ביותר במחשבת ישראל. תורתו מעניקה שפה בהירה לשאלות הגדולות של אמונה, הנהגה ותכלית הבריאה."
      quote={<>״כל חכמת האמת אינה אלא חכמה מראה אמיתת האמונה, להבין כל מה שנברא או שנעשה בעולם, איך יוצא מן הרצון העליון, ואיך מתנהג הכל בדרך נכון מן האל האחד ברוך הוא, לגלגל הכל, להביאו אל השלמות הגמור באחרונה.״</>}
      quoteSource="קל״ח פתחי חכמה, פתח א׳"
      title="הרמח״ל — רבי משה חיים לוצאטו"
    >
      <ArticleSection id="biography" title="חייו בקצרה" first>
        <Prose>
          <p>רבי משה חיים לוצאטו, המוכר בראשי התיבות רמח״ל, נולד בגטו היהודי של פדובה שבאיטליה. מקובל, פילוסוף, איש מוסר ומחזאי, הוא נחשב לאחד המוחות השיטתיים ביותר במחשבת ישראל.</p>
          <p>בגיל כעשרים דיווח על גילוי מגיד — קול פנימי — שעורר התנגדות עזה מצד הרבנות בת זמנו. חלק גדול מכתביו נאסר, הוסתר או אבד בימי חייו. הוא עלה לארץ ישראל בשנת 1743 ונפטר בעכו שלוש שנים לאחר מכן, בגיל 39 בלבד.</p>
          <p>כתביו — <strong>מסילת ישרים</strong>, <strong>דעת תבונות</strong>, <strong>דרך ה׳</strong>, <strong>קל״ח פתחי חכמה</strong>, <strong>אדיר במרום</strong>, <strong>מאמר הגאולה</strong> ועוד — הם מיסודות עולם התורה עד ימינו. הכרתו כגאון באה ברובה לאחר מותו, ועבודת מכון רמח״ל בהוצאת כתביו נתפסת כתיקון אותו עוול.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="teaching" kicker="מפת מחשבה" title="תורת הרמח״ל">
        <Prose>
          <p>תורת הרמח״ל יסודה בקבלה בכלל ובקבלת האר״י בפרט. אצל רבים מן המקובלים מתארת הקבלה את הספירות, הפרצופים והעולמות — את השתלשלות הבריאה ואת תיקונה. הרמח״ל מעניק למושגים האלה מבנה מחשבתי בהיר: חכמת הקבלה היא ידיעת הנהגת הבורא, חוקיה ומסיבותיה, והדרך שבה הכול מתקדם אל תכלית אחת.</p>
          <p>בהגדרתו הקולעת בפתח הראשון של <strong>קל״ח פתחי חכמה</strong> ניכרים שלושה יסודות. הם אינם נושאים נפרדים, אלא מהלך אחד: מן האמונה, דרך ההנהגה, אל התכלית.</p>
        </Prose>

        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          <li className="border-t-[3px] border-gold pt-5"><span className="font-serif text-4xl leading-none text-gold-ink" aria-hidden>א</span><h3 className="mt-3 font-serif text-xl font-semibold text-teal-deep">אמונה</h3><p className="mt-2 leading-7 text-muted-foreground">הכרת מציאות ה׳ ויחוד שליטתו על כל הרצונות.</p></li>
          <li className="border-t-[3px] border-gold pt-5"><span className="font-serif text-4xl leading-none text-gold-ink" aria-hidden>ב</span><h3 className="mt-3 font-serif text-xl font-semibold text-teal-deep">הנהגה</h3><p className="mt-2 leading-7 text-muted-foreground">הבנת הדרך המדויקת שבה המציאות מתנהלת.</p></li>
          <li className="border-t-[3px] border-gold pt-5"><span className="font-serif text-4xl leading-none text-gold-ink" aria-hidden>ג</span><h3 className="mt-3 font-serif text-xl font-semibold text-teal-deep">התכלית</h3><p className="mt-2 leading-7 text-muted-foreground">גילוי יחודו יתברך והבאת הבריאה לשלמותה.</p></li>
        </ol>
      </ArticleSection>

      <ArticleSection id="faith" ornament="א" title="אמונה — לא רק לדעת, אלא להבין">
        <Prose>
          <p>האמונה היא נושא מרכזי שהרמח״ל הקדיש לו חיבורים שלמים, ובהם <strong>דרך ה׳</strong> ו<strong>דעת תבונות</strong>, לצד מאמרים קצרים ופרקים בתוך ספריו הגדולים. אצלו אין האמונה מסתכמת בידיעה שיש מצוי אחד, מוכרח המציאות, שממנו נמצאים כל הנמצאים. היא מבקשת להבין גם את <strong>יחוד השליטה</strong>: ה׳ הוא הרצון היחיד השולט בכל הרצונות.</p>
        </Prose>
        <figure className="my-8 bg-paper-deep px-5 py-6 sm:px-8">
          <blockquote className="font-serif text-lg leading-[1.9] sm:text-xl">״ואולם נתחייבנו אנחנו בני ישראל להעיד על אמיתת יחודו יתברך בכל הבחינות... בין בבחינת המציאות... בין בבחינת השליטה... בין בבחינת ההנהגה... שאין המסבב אלא אחד ואין התכלית אלא אחת... ואע״פ שאין דבר זה גלוי עתה באמת, הנה אמיתת הדבר כך היא, וכן יגלה ויודע בסוף הכל.״</blockquote>
          <SourceCitation>דרך ה׳, חלק ד׳, פרק ד׳, סימן י״א</SourceCitation>
        </figure>
        <p className="text-lg leading-[1.9]">גילוי היחוד יושלם רק בסוף, אך גם עכשיו פועל הרצון האחד בכל המעשים — בדרך של הסתר. דווקא ההסתר הזה יוצר את מקומה של האמונה: להכיר שגם כאשר המהלך אינו גלוי לעינינו, המציאות אינה נטולת כיוון ואינה מופקרת למקרה.</p>
      </ArticleSection>

      <ArticleSection id="governance" ornament="ב" title="הנהגה — לפענח את לשון הקבלה">
        <Prose>
          <p>הרמח״ל פתח דרך חדשה להבנת לשון הקבלה. במקום להשאיר את מושגי הספירות, האורות, הפרצופים והעולמות חתומים בשפת הסוד, הוא תרגם אותם לשפה שכלית של הנהגה. כל ספירה וכל פרצוף מבטאים מדרגה אלוקית הפועלת במציאות ובהיסטוריה האנושית.</p>
          <p>אין פירוש הדבר שהאורות והספירות הם משל בלבד. הם מצביעים על מציאות רוחנית דקה, שאין השכל האנושי יכול לתפוס ישירות, אלא באמצעות לבוש וצורה. בדומה לכך, הנביא אינו משיג את הכבוד העליון כשלעצמו; הוא משיג צורה רוחנית, ובכוח תכונותיו וסגולותיו מפענח אותה ומצייר את משמעותה בשכלו.</p>
          <p>בכך הסיר הרמח״ל את סכנת ההגשמה ממאמרי הזוהר והאר״י, ובו בזמן גילה בהם מפת הנהגה: כיצד מתנהל העולם הזה, כיצד הוא קשור לעולם הבא, ואיך ריבוי האירועים והרצונות מתכנס אל פעולתו של אל אחד, יחיד ומיוחד.</p>
        </Prose>
      </ArticleSection>

      <ArticleSection id="unity" ornament="ג" title="גילוי יחודו — תכלית אחת, שתי נקודות מבט">
        <Prose>
          <p>״תכלית הבריאה היא להיטיב לנבראיו״ — מן היסודות החוזרים בכתבי הרמח״ל. במקומות אחרים הוא מנסח תכלית עמוקה יותר: גילוי יחודו. שתי התכליות אינן סותרות; הן מתארות אותו מהלך משתי נקודות מבט.</p>
          <p>מנקודת מבטו של האדם, התכלית היא ההטבה — העונג והדבקות בה׳ שעליהם מדבר <strong>מסילת ישרים</strong>. מנקודת המבט שבה האלוקים במרכז, התכלית היא גילוי היחוד: ההכרה שאין כוח עצמאי כנגד רצונו, ושכל פרטי ההנהגה מצטרפים לבסוף אל השלמות האמיתית.</p>
        </Prose>
        <figure className="my-8 border-y border-gold/60 py-7">
          <blockquote className="font-serif text-lg leading-[1.9] text-teal-deep sm:text-xl">״שהוא לבדו משגיח על כל בריותיו השגחה פרטית, ואין שום דבר נולד בעולמו אלא מרצונו ומידו, ולא במקרה, ולא בטבע, ולא במזל... וכל סדרי המשפט וכל החוקים אשר חקק — כולם תלויים ברצונו.״</blockquote>
          <SourceCitation>דעת תבונות, סימן ל״ו</SourceCitation>
        </figure>
        <Prose>
          <p>מכאן שגם מה שנראה כרע או כרצון נגדי עתיד להתברר כחלק מן המהלך שהביא את הכול אל השלמות. האמת הזאת אינה גלויה במלואה בתוך ההיסטוריה; לפי הרמח״ל, היא תיפרש לעיני כל רק ביום הדין הגדול, כאשר יתגלה היושר שבכל מעשה ומעשה.</p>
          <blockquote className="border-s border-gold ps-5 font-serif text-xl leading-[1.8] text-teal-deep">״והנה ביום הדין הגדול יפרוש האדון ברוך הוא את השמלה לעיני כל היצור... ויראה יושר משפטו בכל מעשה ומעשה, קטון וגדול...״<SourceCitation>דעת תבונות, סימן ק״ע</SourceCitation></blockquote>
        </Prose>
      </ArticleSection>

      <section id="conclusion" className="scroll-mt-8 mt-12 bg-teal-deep px-6 py-8 text-primary-foreground sm:px-9 sm:py-10">
        <p className="mb-2 text-sm font-semibold text-gold">מסקנה</p>
        <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">אדריכל האדם השלם ומפרש ההנהגה</h2>
        <p className="mt-5 text-lg leading-[1.9] text-primary-foreground/90">ב<strong className="text-primary-foreground">מסילת ישרים</strong> נעשה הרמח״ל לאדריכל של האדם השלם; ב<strong className="text-primary-foreground">דעת תבונות</strong> וב<strong className="text-primary-foreground">דרך ה׳</strong> הוא מדריך אל אמונה ודאית; וב<strong className="text-primary-foreground">קל״ח פתחי חכמה</strong>, <strong className="text-primary-foreground">אדיר במרום</strong> וחיבוריו האחרים הוא פותח שער להבנת ההנהגה האלוקית. זהו החוט המקשר בין כתביו: להפוך את הסוד למבנה שאפשר ללמוד, להבין ולחיות לאורו.</p>
      </section>
    </RamhalArticleLayout>
  )
}
