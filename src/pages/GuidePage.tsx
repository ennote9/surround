import type { LucideIcon } from "lucide-react"
import { MobileGuideWorkspace } from "@/features/guide/components/MobileGuideWorkspace"
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Clock3,
  CheckCircle2,
  CircleUserRound,
  Flag,
  FolderKanban,
  Gauge,
  Hash,
  Layers3,
  Lightbulb,
  ListChecks,
  PauseCircle,
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
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
          <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-[15px]">
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
    title: "Настройте повторяющиеся действия",
    text: "То, что нужно делать регулярно, оформляйте как привычку: выберите способ измерения, расписание, минимум и при необходимости связь с проектом или статом.",
  },
  {
    title: "Проверяйте прогресс",
    text: "Главная показывает текущий фокус, а Аналитика — текущий прогресс, портфель, ритм привычек, вехи, просрочки и качество планирования.",
  },
]

const entityRows = [
  {
    name: "Цель",
    example: "Стать физически активнее",
    purpose: "Большое направление, которое объединяет связанные проекты.",
  },
  {
    name: "Проект",
    example: "Подготовиться к забегу на 5 км",
    purpose: "Конкретная инициатива с результатом, этапами и задачами.",
  },
  {
    name: "Группа задач",
    example: "План тренировок",
    purpose: "Логический блок внутри проекта.",
  },
  {
    name: "Задача",
    example: "Выбрать маршрут для пробежки",
    purpose: "Конкретное действие, которое можно выполнить и отметить.",
  },
  {
    name: "Привычка",
    example: "Прогулка 30 минут по Пн / Ср / Пт",
    purpose: "Повторяющееся действие. Может считаться галочкой, временем или количеством и иметь собственное расписание.",
  },
  {
    name: "Веха",
    example: "Пробежать первые 3 км",
    purpose: "Контрольная точка или значимый достигнутый результат.",
  },
]

const sections = [
  {
    icon: Gauge,
    title: "Главная",
    text: "Рабочий экран на каждый день: текущий прогресс, ритм недели, пульс, проекты и статы. Контекст цели можно переключать прямо на Главной.",
  },
  {
    icon: Target,
    title: "Цели",
    text: "Здесь создаются крупные направления. Для цели можно задать описание, срок, статус и решить, показывать ли её на Главной.",
  },
  {
    icon: FolderKanban,
    title: "Проекты",
    text: "Основное рабочее пространство. Проект можно связать с целью и статом, задать фазу и срок; внутри — группы и задачи с приоритетом, заметками и дедлайнами.",
  },
  {
    icon: CalendarCheck,
    title: "Рутина",
    text: "Трекер привычек с тремя типами выполнения: галочка, время и количество. Есть недельная норма, конкретные дни или ежедневный режим, минимум и цель, период, пауза, проект, стат и фактические значения по дням.",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    text: "Сводка состояния: текущий прогресс только по проектам «Сейчас», весь портфель, фазы, ритм привычек, вехи, просроченные задачи и покрытие задач/проектов сроками.",
  },
  {
    icon: Settings,
    title: "Настройки",
    text: "Тема интерфейса, состав Главной и отображаемые статы, поведение групп проектов, экспорт/импорт и операции с данными.",
  },
  {
    icon: CircleUserRound,
    title: "Профиль",
    text: "Отображаемое имя, email и провайдер входа, статус облачной синхронизации, сброс пароля, безопасность и выход из аккаунта.",
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto min-w-0 w-full max-w-5xl">
      <MobileGuideWorkspace />

      <div className="hidden space-y-7 md:block">
      <header className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-indigo-500/10 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <BookOpen className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-700">Life Progress OS</p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
              Справочник
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
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
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="start" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Быстрый старт
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Базовый сценарий, с которого стоит начинать новому пользователю.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickStart.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-slate-100">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="system" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Как устроена система
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Основная иерархия: Цель → Проект → Группа → Задача. Привычки и вехи
            дополняют эту структуру, а проекты и привычки могут быть связаны со статами.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="hidden grid-cols-[150px_1fr_1.35fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Элемент</span>
            <span>Пример</span>
            <span>Для чего нужен</span>
          </div>
          {entityRows.map((row) => (
            <div
              key={row.name}
              className="grid gap-1 border-b border-slate-100 dark:border-slate-800 px-5 py-4 last:border-b-0 sm:grid-cols-[150px_1fr_1.35fr] sm:gap-4"
            >
              <p className="font-semibold text-slate-950 dark:text-slate-100">{row.name}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{row.example}</p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{row.purpose}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          <strong>Простой ориентир:</strong> если действие выполняется один раз —
          это задача. Если оно повторяется по расписанию — это привычка. Если результат
          слишком большой для одной задачи — оформите его как проект. Несколько проектов,
          ведущих к одному крупному результату, объединяйте целью.
        </div>
      </section>

      <section id="sections" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Разделы приложения
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
          Конкретную цель или режим «Все цели» можно выбрать в интерфейсе приложения,
          в том числе прямо на Главной. Выбранная цель задаёт контекст для Главной,
          Проектов и Аналитики, чтобы не смешивать между собой разные направления жизни.
        </p>
        <p className="mt-2">
          Привычка может быть глобальной или связанной с проектом. Связанная привычка
          попадает в контекст цели этого проекта, а глобальная участвует только в общем
          контексте «Все цели». Отдельно привычке можно назначить стат персонажа.
        </p>
      </GuideCard>

      <section className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Настройка привычек
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Рутина поддерживает как простые отметки, так и измеримые привычки.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard icon={CheckCircle2} title="Галочка">
            <p>
              Для бинарных действий: сделал или не сделал. Например, «принять витамины»
              или «сделать разминку».
            </p>
          </GuideCard>
          <GuideCard icon={Clock3} title="Время">
            <p>
              Сохраняет фактические минуты. Можно задать минимум, после которого день
              считается выполненным, и более высокую целевую длительность.
            </p>
          </GuideCard>
          <GuideCard icon={Hash} title="Количество">
            <p>
              Для шагов, страниц, стаканов воды и других измеримых результатов.
              Единицу измерения задаёт пользователь.
            </p>
          </GuideCard>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <GuideCard icon={CalendarCheck} title="Расписание и compliance">
            <p>
              Доступны три режима: N раз в неделю, конкретные дни недели и каждый день.
              Compliance рассчитывается по фактическому расписанию и активному периоду
              привычки, а не автоматически из семи дней.
            </p>
            <p className="mt-2">
              Для привычки с конкретными днями в недельную норму входят только эти дни.
              Для режима N раз в неделю важен сам недельный целевой объём.
            </p>
          </GuideCard>

          <GuideCard icon={PauseCircle} title="Период, пауза и история">
            <p>
              Можно задать дату начала и окончания или поставить привычку на паузу.
              Пауза исключает её из текущих расчётов, но не удаляет историю.
            </p>
            <p className="mt-2">
              Для времени и количества сохраняется фактическое значение дня, заметка
              и при необходимости пропуск. Пропуск остаётся в истории, но не считается
              выполнением.
            </p>
          </GuideCard>
        </div>

        <GuideCard icon={Layers3} title="Связи, Главная и статы">
          <p>
            Связь с проектом помещает привычку в контекст соответствующей цели.
            Опция «Показывать на Главной» управляет её участием в блоках Главной.
          </p>
          <p className="mt-2">
            Стат можно назначить и проекту, и привычке. Прогресс стата объединяет
            выполненные задачи связанных проектов и недельное выполнение связанных
            привычек.
          </p>
          <p className="mt-2">
            Предпочтительное время (утро, день, вечер или собственное окно) сейчас
            хранится как настройка привычки; push-напоминания в приложении пока не реализованы.
          </p>
        </GuideCard>
      </section>

      <section id="statuses" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Статусы и приоритеты
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Используйте статусы, чтобы отделять текущий фокус от будущих идей.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <GuideCard icon={Target} title="Статусы целей">
            <div className="space-y-2">
              <p><strong className="text-slate-900 dark:text-slate-200">Сейчас</strong> — цель находится в активном фокусе.</p>
              <p><strong className="text-slate-900 dark:text-slate-200">Позже</strong> — важная цель, но не на текущем этапе.</p>
              <p><strong className="text-slate-900 dark:text-slate-200">Архив</strong> — завершённая или больше не актуальная цель.</p>
            </div>
          </GuideCard>

          <GuideCard icon={FolderKanban} title="Этапы проектов">
            <div className="space-y-2">
              <p><strong className="text-slate-900 dark:text-slate-200">Сейчас</strong> — проект в текущем фокусе.</p>
              <p><strong className="text-slate-900 dark:text-slate-200">Позже</strong> — проект запланирован, но пока не активен.</p>
              <p><strong className="text-slate-900 dark:text-slate-200">Стратегия</strong> — дальний стратегический этап.</p>
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
          Прогресс проекта строится по выполненным задачам. Текущий прогресс на Главной
          и в Аналитике учитывает только проекты фазы «Сейчас», а «Позже» и «Стратегия»
          показываются отдельно как будущий портфель.
        </p>
        <p className="mt-2">
          Поэтому большие задачи лучше дробить на сопоставимые конкретные действия:
          одна гигантская задача и десять мелких могут искажать ощущение реального
          продвижения.
        </p>
        <p className="mt-2">
          Ритм привычек считается отдельно от прогресса задач и учитывает их расписание,
          активный период и паузу. Привычки также могут влиять на назначенные им статы.
        </p>
      </GuideCard>

      <section id="workflow" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Рекомендуемый рабочий цикл
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Система полезнее всего, когда её используют регулярно, но без лишней бюрократии.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <GuideCard icon={ListChecks} title="Каждый день">
            <p>
              Откройте Главную, выберите контекст цели, выполните текущие задачи
              и внесите фактические результаты привычек в Рутине.
            </p>
          </GuideCard>
          <GuideCard icon={CalendarCheck} title="Раз в неделю">
            <p>
              Просмотрите Аналитику: текущий прогресс, портфель, ритм недели, вехи,
              просрочки и покрытие сроками. Уточните следующие задачи и уберите из
              текущего фокуса лишнее.
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
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100 sm:text-2xl">
            Правила хорошей структуры
          </h2>
        </div>

        <GuideCard icon={Lightbulb} title="Чтобы система не превратилась в склад задач">
          <ul className="list-disc space-y-2 pl-5">
            <li>Не создавайте отдельную цель для каждой мелочи — цель должна объединять направление.</li>
            <li>Не держите слишком много проектов в статусе «Сейчас» одновременно.</li>
            <li>Формулируйте задачи как конкретное действие: «сделать», «проверить», «выбрать», «отправить».</li>
            <li>Регулярные действия переносите в Рутину и выбирайте подходящий тип измерения: галочка, время или количество.</li>
            <li>Используйте группы задач как этапы проекта, а не как случайные папки.</li>
            <li>Ставьте дедлайн только там, где дата действительно что-то меняет.</li>
            <li>Если привычка временно не актуальна, используйте паузу вместо удаления истории.</li>
            <li>Регулярно архивируйте то, что больше не требует внимания.</li>
          </ul>
        </GuideCard>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm dark:border-slate-800 sm:p-6">
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
    </div>
  )
}
