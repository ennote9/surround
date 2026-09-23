import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gauge,
  Layers3,
  Lightbulb,
  ListChecks,
  Settings,
  Sparkles,
  Target,
} from "lucide-react"

type GuideCardProps = {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}

function GuideCard({ icon: Icon, title, children }: GuideCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <div className="mt-2 text-sm leading-6 text-slate-600 sm:text-[15px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

const quickStart = [
  {
    title: "Создайте цель",
    text: "Цель — крупное направление или результат, который объединяет несколько проектов.",
  },
  {
    title: "Добавьте проекты",
    text: "Проект — конкретная работа с понятным результатом. Один проект можно привязать к одной цели.",
  },
  {
    title: "Разбейте проект на группы и задачи",
    text: "Группы помогают разделить проект на логические этапы, а задачи превращают план в конкретные действия.",
  },
  {
    title: "Добавьте повторяющиеся действия в рутину",
    text: "То, что нужно делать регулярно, лучше вести как привычку, а не создавать одинаковые задачи снова и снова.",
  },
  {
    title: "Проверяйте прогресс",
    text: "Главная показывает текущий фокус, а Аналитика помогает увидеть прогресс, дедлайны и соблюдение привычек.",
  },
]

const entityRows = [
  {
    name: "Цель",
    example: "Повысить профессиональный уровень",
    purpose: "Большое направление, которое объединяет связанные проекты.",
  },
  {
    name: "Проект",
    example: "Освоить Power BI",
    purpose: "Конкретная инициатива с результатом, этапами и задачами.",
  },
  {
    name: "Группа задач",
    example: "Основы DAX",
    purpose: "Логический блок внутри проекта.",
  },
  {
    name: "Задача",
    example: "Разобрать CALCULATE",
    purpose: "Конкретное действие, которое можно выполнить и отметить.",
  },
  {
    name: "Привычка",
    example: "Учиться 30 минут",
    purpose: "Повторяющееся действие, которое отслеживается по дням.",
  },
  {
    name: "Веха",
    example: "Собран первый дашборд",
    purpose: "Контрольная точка или значимый достигнутый результат.",
  },
]

const sections = [
  {
    icon: Gauge,
    title: "Главная",
    text: "Рабочий экран на каждый день. Здесь удобно смотреть текущий фокус, прогресс выбранной цели и проектов, ближайшие действия и сводные показатели.",
  },
  {
    icon: Target,
    title: "Цели",
    text: "Здесь создаются крупные направления. Для цели можно задать описание, срок, статус и решить, показывать ли её на Главной.",
  },
  {
    icon: FolderKanban,
    title: "Проекты",
    text: "Основное рабочее пространство. Проект разбивается на группы, внутри групп создаются задачи с приоритетом, заметками и дедлайнами.",
  },
  {
    icon: CalendarCheck,
    title: "Рутина",
    text: "Трекер повторяющихся действий. Используйте его для занятий, тренировок, чтения, планирования и любых регулярных действий.",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    text: "Сводка прогресса: выполнение задач, прогресс проектов, соблюдение привычек, ближайшие дедлайны и сроки проектов.",
  },
  {
    icon: Settings,
    title: "Настройки",
    text: "Персонализация интерфейса и служебные настройки приложения.",
  },
  {
    icon: CircleUserRound,
    title: "Аккаунт",
    text: "Профиль пользователя и параметры, связанные с учётной записью и безопасностью.",
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto min-w-0 w-full max-w-5xl space-y-5 sm:space-y-7">
      <header className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <BookOpen className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-700">Life Progress OS</p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Справочник
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-sm leading-6 text-slate-600 sm:text-base">
              Полное руководство по логике приложения. Если вы открыли Life Progress OS
              впервые, начните с раздела «Быстрый старт», а затем используйте эту страницу
              как памятку.
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label="Содержание справочника"
        className="flex gap-2 overflow-x-auto pb-1 text-sm"
      >
        {[
          ["start", "Быстрый старт"],
          ["system", "Как устроено"],
          ["sections", "Разделы"],
          ["statuses", "Статусы"],
          ["workflow", "Рабочий цикл"],
          ["rules", "Правила"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="start" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Быстрый старт
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Базовый сценарий, с которого стоит начинать новому пользователю.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickStart.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="system" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Как устроена система
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Основная иерархия: Цель → Проект → Группа → Задача. Привычки и вехи
            дополняют эту структуру.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[150px_1fr_1.35fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Элемент</span>
            <span>Пример</span>
            <span>Для чего нужен</span>
          </div>
          {entityRows.map((row) => (
            <div
              key={row.name}
              className="grid gap-1 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-[150px_1fr_1.35fr] sm:gap-4"
            >
              <p className="font-semibold text-slate-950">{row.name}</p>
              <p className="text-sm text-slate-700">{row.example}</p>
              <p className="text-sm leading-6 text-slate-600">{row.purpose}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          <strong>Простой ориентир:</strong> если действие выполняется один раз —
          это задача. Если оно должно повторяться каждую неделю или каждый день —
          это привычка. Если результат слишком большой для одной задачи — оформите
          его как проект.
        </div>
      </section>

      <section id="sections" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Разделы приложения
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Что находится в каждой вкладке и когда её использовать.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, text }) => (
            <GuideCard key={title} icon={Icon} title={title}>
              <p>{text}</p>
            </GuideCard>
          ))}
        </div>
      </section>

      <GuideCard icon={Layers3} title="Выбор цели и контекст">
        <p>
          В боковой панели можно выбрать конкретную цель или режим «Все цели».
          Выбранная цель задаёт контекст для Главной, Проектов и Аналитики, чтобы
          не смешивать между собой разные направления жизни.
        </p>
        <p className="mt-2">
          Рутина остаётся общим трекером повторяющихся действий. Это удобно для
          привычек, которые могут поддерживать сразу несколько целей.
        </p>
      </GuideCard>

      <section id="statuses" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Статусы и приоритеты
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Используйте статусы, чтобы отделять текущий фокус от будущих идей.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <GuideCard icon={Target} title="Статусы целей">
            <div className="space-y-2">
              <p><strong className="text-slate-900">Сейчас</strong> — цель находится в активном фокусе.</p>
              <p><strong className="text-slate-900">Позже</strong> — важная цель, но не на текущем этапе.</p>
              <p><strong className="text-slate-900">Архив</strong> — завершённая или больше не актуальная цель.</p>
            </div>
          </GuideCard>

          <GuideCard icon={FolderKanban} title="Этапы проектов">
            <div className="space-y-2">
              <p><strong className="text-slate-900">Сейчас</strong> — проект в текущем фокусе.</p>
              <p><strong className="text-slate-900">Позже</strong> — проект запланирован, но пока не активен.</p>
              <p><strong className="text-slate-900">Стратегия</strong> — дальний стратегический этап.</p>
            </div>
          </GuideCard>
        </div>

        <GuideCard icon={Flag} title="Приоритет задачи">
          <p>
            Приоритет помогает понимать относительную важность задач внутри проекта:
            низкий, средний или высокий. Приоритет не заменяет дедлайн — срочность и
            важность лучше оценивать отдельно.
          </p>
        </GuideCard>
      </section>

      <GuideCard icon={CheckCircle2} title="Как считается прогресс">
        <p>
          Прогресс проекта строится по выполненным задачам: чем больше задач отмечено
          как выполненные, тем выше процент проекта. Прогресс цели агрегирует работу
          связанных с ней проектов.
        </p>
        <p className="mt-2">
          Поэтому большие задачи лучше дробить на сопоставимые конкретные действия:
          одна гигантская задача и десять мелких могут искажать ощущение реального
          продвижения.
        </p>
      </GuideCard>

      <section id="workflow" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Рекомендуемый рабочий цикл
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Система полезнее всего, когда её используют регулярно, но без лишней бюрократии.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard icon={ListChecks} title="Каждый день">
            <p>
              Откройте Главную, выберите несколько действительно важных задач,
              выполните их и отметьте привычки в Рутине.
            </p>
          </GuideCard>
          <GuideCard icon={CalendarCheck} title="Раз в неделю">
            <p>
              Просмотрите Аналитику, дедлайны и прогресс. Закройте выполненное,
              уточните следующие задачи и уберите из текущего фокуса лишнее.
            </p>
          </GuideCard>
          <GuideCard icon={Sparkles} title="Раз в месяц">
            <p>
              Проверьте сами цели: что остаётся актуальным, что стоит перенести
              на потом, а что пора архивировать или превратить в новый проект.
            </p>
          </GuideCard>
        </div>
      </section>

      <section id="rules" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Правила хорошей структуры
          </h2>
        </div>

        <GuideCard icon={Lightbulb} title="Чтобы система не превратилась в склад задач">
          <ul className="list-disc space-y-2 pl-5">
            <li>Не создавайте отдельную цель для каждой мелочи — цель должна объединять направление.</li>
            <li>Не держите слишком много проектов в статусе «Сейчас» одновременно.</li>
            <li>Формулируйте задачи как конкретное действие: «сделать», «проверить», «выбрать», «отправить».</li>
            <li>Регулярные действия переносите в Рутину, а не дублируйте задачами.</li>
            <li>Используйте группы задач как этапы проекта, а не как случайные папки.</li>
            <li>Ставьте дедлайн только там, где дата действительно что-то меняет.</li>
            <li>Регулярно архивируйте то, что больше не требует внимания.</li>
          </ul>
        </GuideCard>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 size-5 shrink-0 text-blue-300" aria-hidden />
          <div>
            <h2 className="font-semibold">Главный принцип Life Progress OS</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Приложение должно помогать принимать решения о следующем действии,
              а не заставлять обслуживать сам трекер. Создавайте только ту структуру,
              которая делает ваш фокус понятнее.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
