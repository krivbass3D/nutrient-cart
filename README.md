# 🥗 NutriCheck — Анализ питания по чекам

Семейное приложение: загружай фото чека → получай анализ БЖУ и рекомендации ИИ.

## Стек
- **Next.js 14** (App Router) — фронтенд + API routes
- **Claude API** (claude-opus-4-5) — OCR чеков + рекомендации по питанию
- **Open Food Facts** — бесплатная база данных БЖУ (600k+ продуктов)
- **Supabase** — хранение истории покупок + профили семьи
- **Recharts** — диаграммы БЖУ
- **Vercel** — деплой

## Запуск за 5 минут

### 1. Клонировать и установить зависимости
```bash
git clone ...
cd nutrition-app
npm install
```

### 2. Настроить переменные окружения
```bash
cp .env.example .env.local
# Заполнить ANTHROPIC_API_KEY и Supabase ключи
```

### 3. Создать таблицы в Supabase
Открыть https://supabase.com → SQL Editor → выполнить:
`supabase/migrations/001_initial.sql`

### 4. Запустить локально
```bash
npm run dev
```
Открыть http://localhost:3000

### 5. Деплой на Vercel
```bash
npx vercel --prod
```
Добавить environment variables в Vercel dashboard.

## Архитектура агентов

```
Фото чека
    │
    ▼
[Агент 1: Claude Vision OCR]
    Распознаёт магазин, товары, количество, цены
    │
    ▼
[Агент 2: Open Food Facts API + Claude fallback]
    Для каждого товара ищет БЖУ на 100г
    Если нет в базе → Claude оценивает по названию
    │
    ▼
[Расчёт макросов]
    Вес × (БЖУ / 100) = итого на покупку
    Сравнение с нормой ВОЗ (Б20% / Ж25% / У55%)
    │
    ▼
[Агент 3: Claude Recommendations]
    Генерирует персональный совет на русском
    │
    ▼
[Dashboard + Supabase]
    Диаграммы, таблица товаров, история
```

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `app/upload/page.tsx` | Главная страница загрузки и результатов |
| `app/api/analyze-receipt/route.ts` | Claude Vision → JSON с товарами |
| `app/api/nutrition/route.ts` | Open Food Facts + Claude fallback |
| `app/api/recommendations/route.ts` | Генерация советов |
| `app/history/page.tsx` | История покупок |
| `components/MacroPieChart.tsx` | Диаграммы сравнения БЖУ |
| `lib/nutrition.ts` | Расчёт калорий и макросов |
| `lib/types.ts` | TypeScript типы |
| `supabase/migrations/001_initial.sql` | Схема БД |

## Расширение функциональности

- **Семейные профили**: страница `/setup` с возрастом, весом, целями
- **Недельные отчёты**: агрегация чеков за неделю → тренды
- **Сравнение магазинов**: Lidl vs Rewe по соотношению БЖУ
- **Список покупок**: на основе недостающих нутриентов
- **PWA**: иконка на телефоне, оффлайн-режим
