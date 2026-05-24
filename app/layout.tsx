import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NutriCheck — анализ питания по чекам',
  description: 'Загрузи чек из магазина — получи анализ БЖУ и рекомендации по питанию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
