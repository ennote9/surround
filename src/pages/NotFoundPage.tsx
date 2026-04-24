export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Страница не найдена
        </h1>
        <p className="mt-3 text-slate-600">
          Такого раздела в приложении нет.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
    </div>
  )
}
