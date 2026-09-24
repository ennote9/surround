import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronDown,
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

const quickStart = [
  {
    title: "Создайте цель",
    text: "Определите крупное направление, которое объединит несколько проектов.",
  },
  {
    title: "Добавьте проекты",
    text: "Переведите направление в конкретные результаты. Текущие проекты держите в фазе «Сейчас».",
  },
  {
    title: "Разбейте на группы и задачи",
    text: "Группы — этапы проекта, задачи — конкретные действия, которые можно закрыть.",
  },
  {
    title: "Добавьте рутину",
    text: "Повторяющиеся действия оформляйте как привычки и задавайте им недельную норму.",
  },
  {
    title: "Проверяйте состояние",
    text: "Главная показывает текущий фокус, Аналитика — текущий прогресс, портфель и регулярность.",
  },
]

const entities = [
  {
    title: "Цель",
    example: "Построить самостоятельную траекторию",
    text: "Большое направление. Объединяет несколько проектов.",
  },
  {
    title: "Проект",
    example: "E-commerce: первый запуск",
    text: "Конкретный результат, над которым можно работать и измерять прогресс.",
  },
  {
    title: "Группа",
    example: "Исследование рынка",
    text: "Логический этап внутри проекта.",
  },
  {
    title: "Задача",
    example: "Сравнить 20 товарных идей",
    text: "Одно конкретное действие, которое можно выполнить.",
  },
  {
    title: "Привычка",
    example: "Китайский — 3 раза в неделю",
    text: "Регулярное действие. Может быть глобальным или привязанным к проекту.",
  },
  {
    title: "Веха",
    example: "Первая тестовая продажа",
    text: "Значимый промежуточный результат, важнее обычной задачи.",
  },
]

const appSections = [
  {
    icon: Gauge,
    title: "Главная",
    caption: "Что происходит сейчас",
    text: "Текущий прогресс, ритм недели, проекты и статы. Цель можно переключить прямо на Главной — показатели пересчитаются в её контексте.",
  },
  {
    icon: Target,
    title: "Цели",
    caption: "Куда вы движетесь",
    text: "Крупные жизненные направления. Статус «Сейчас» — активный фокус, «Позже» — следующий горизонт, «Архив» — завершённое или неактуальное.",
  },
  {
    icon: FolderKanban,
    title: "Проекты",
    caption: "Над чем вы работаете",
    text: "Рабочее пространство с группами и задачами. Фаза проекта определяет, относится ли он к текущей работе, будущему или стратегии.",
  },
  {
    icon: CalendarCheck,
    title: "Рутина",
    caption: "Что нужно повторять",
    text: "Привычки с недельной нормой. Связанная с проектом привычка учитывается в аналитике соответствующей цели; глобальная — в общем контексте.",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    caption: "Как меняется состояние",
    text: "Текущий прогресс считается только по проектам «Сейчас». Будущие проекты показываются отдельно как портфель. Здесь же ритм привычек, вехи и качество планирования.",
  },
  {
    icon: Settings,
    title: "Настройки",
    caption: "Как выглядит и ведёт себя приложение",
    text: "Тема, блоки Главной, отображаемые статы, поведение групп проектов и управление данными.",
  },
  {
    icon: CircleUserRound,
    title: "Профиль",
    caption: "Аккаунт и синхронизация",
    text: "Имя, email, состояние облачного сохранения, безопасность и техническая информация аккаунта.",
  },
]

const navItems = [
  ["start", "Старт", Sparkles],
  ["system", "Система", Layers3],
  ["sections", "Разделы", BookOpen],
  ["statuses", "Статусы", Flag],
  ["workflow", "Ритм", CalendarCheck],
  ["rules", "Правила", Lightbulb],
] as const

const workCycles = [
  {
    title: "Каждый день",
    text: "Откройте Главную, выберите контекст цели, выполните текущие задачи и отметьте привычки.",
    icon: ListChecks,
  },
  {
    title: "Раз в неделю",
    text: "Посмотрите Аналитику: текущий прогресс, ритм привычек, вехи и качество планирования.",
    icon: CalendarCheck,
  },
  {
    title: "Раз в месяц",
    text: "Пересмотрите цели и портфель: что оставить «Сейчас», что перенести «Позже», что архивировать.",
    icon: Sparkles,
  },
]

export function MobileGuideWorkspace() {
  return (
    <div className="space-y-7 md:hidden">
      <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-blue-950/10 dark:from-blue-600 dark:via-indigo-700 dark:to-slate-900 dark:shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              <BookOpen className="size-3.5" aria-hidden />
              Life Progress OS
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Справочник
            </h1>
            <p className="mt-2 max-w-[300px] text-sm leading-6 text-blue-100">
              Быстрая памятка по логике приложения — от первой цели до аналитики.
            </p>
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white/12 ring-1 ring-white/15">
            <BookOpen className="size-6" aria-hidden />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] uppercase tracking-wide text-blue-100">
              Если впервые
            </p>
            <p className="mt-1 text-sm font-semibold">Начните со старта</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] uppercase tracking-wide text-blue-100">
              Если забыли
            </p>
            <p className="mt-1 text-sm font-semibold">Откройте нужный раздел</p>
          </div>
        </div>
      </header>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Навигация
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Что хотите понять?
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {navItems.map(([id, label, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex min-h-20 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {label}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="start" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            5 шагов
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Быстрый старт
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Минимальный сценарий, которого достаточно, чтобы начать пользоваться системой.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {quickStart.map((item, index) => (
            <div
              key={item.title}
              className={
                index === quickStart.length - 1
                  ? "flex gap-3 px-4 py-4"
                  : "flex gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800"
              }
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="system" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Архитектура
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Как всё связано
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">Цель</span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">Проект</span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">Группа</span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800">Задача</span>
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            Привычки поддерживают регулярную работу, а вехи фиксируют значимые результаты.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {entities.map((item) => (
            <div
              key={item.title}
              className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                {item.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-blue-600 dark:text-blue-400">
                {item.example}
              </p>
              <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[20px] border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            Как выбрать тип?
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-700/80 dark:text-blue-200/80">
            Один раз → задача. Повторяется → привычка. Слишком большое для одной задачи → проект. Несколько проектов ведут к одному результату → цель.
          </p>
        </div>
      </section>

      <section id="sections" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Интерфейс
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Разделы приложения
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Нажмите на раздел, чтобы быстро вспомнить его назначение.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {appSections.map(({ icon: Icon, title, caption, text }, index) => (
            <details
              key={title}
              className={
                index === appSections.length - 1
                  ? "group"
                  : "group border-b border-slate-100 dark:border-slate-800"
              }
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {caption}
                  </p>
                </div>
                <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {text}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="statuses" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Фокус
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Статусы и фазы
          </h2>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Цели</h3>
            </div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <p><strong className="text-blue-600 dark:text-blue-400">Сейчас</strong> — активное жизненное направление.</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Позже</strong> — важное, но не в текущем фокусе.</p>
              <p><strong className="text-slate-600 dark:text-slate-300">Архив</strong> — завершённое или неактуальное.</p>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Проекты</h3>
            </div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <p><strong className="text-blue-600 dark:text-blue-400">Сейчас</strong> — участвует в текущем прогрессе.</p>
              <p><strong className="text-amber-600 dark:text-amber-400">Позже</strong> — будущая работа, видна в портфеле.</p>
              <p><strong className="text-indigo-600 dark:text-indigo-400">Стратегия</strong> — дальний горизонт.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-950 dark:text-slate-100">
            Текущий прогресс ≠ весь портфель
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Главная и верх Аналитики считают только проекты «Сейчас». «Позже» и «Стратегия» остаются видимыми отдельно и не занижают текущий показатель.
          </p>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Использование
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Рабочий ритм
          </h2>
        </div>

        <div className="grid gap-2.5">
          {workCycles.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="flex gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="rules" className="scroll-mt-24 space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Гигиена системы
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Правила хорошей структуры
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ul className="space-y-3">
            {[
              "Не создавайте отдельную цель для каждой мелочи.",
              "Не держите слишком много проектов в фазе «Сейчас».",
              "Формулируйте задачи как конкретные действия.",
              "Повторяющиеся действия переносите в Рутину.",
              "Используйте группы как этапы проекта, а не случайные папки.",
              "Ставьте дедлайн только там, где дата действительно важна.",
              "Регулярно архивируйте то, что больше не требует внимания.",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Check className="size-3" aria-hidden />
                </span>
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {rule}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[24px] bg-slate-950 p-5 text-white ring-1 ring-slate-800">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <Lightbulb className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Главный принцип</h2>
            <p className="mt-1.5 text-xs leading-5 text-slate-300">
              Life Progress OS должен помогать принимать решение о следующем действии, а не заставлять обслуживать сам трекер. Создавайте только ту структуру, которая делает фокус понятнее.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
