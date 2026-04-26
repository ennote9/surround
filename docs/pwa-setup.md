# PWA (базовая подготовка)

## Что добавлено

- `public/manifest.webmanifest` — имя, `short_name`, `start_url`, `display: standalone`, цвета, `orientation`, иконки PNG.
- `public/icons/` — `icon-192.png`, `icon-512.png`, `maskable-192.png`, `maskable-512.png` (простая графика, см. `scripts/generate-pwa-icons.py`).
- В `index.html`: ссылка на manifest, `theme-color`, Apple Web App meta, `apple-touch-icon`, дополнительные `rel="icon"` PNG.

## Что не добавлено

- Service worker и кэш для offline.
- `vite-plugin-pwa` и новые npm-зависимости.

Данные и вход по-прежнему требуют сеть (Supabase).

## Как проверить

1. **Chrome DevTools → Application → Manifest** — нет критичных ошибок, иконки подгружаются.
2. **Lighthouse → PWA** — базовые пункты по manifest/icons (полный offline не ожидается).
3. **Android Chrome** — «Добавить на главный экран».
4. **iOS Safari** — «На экран „Домой“».

После изменений: закоммитить и запушить; Vercel подхватит статические файлы из `public/`.
