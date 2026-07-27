export const LEVELS = [
  { id: 0, title: 'Чёрный ящик', meta: 'Chat completion · токены · контекстное окно',
    pitch: 'Снаружи агента нет ничего, кроме одного запроса и одного ответа. LEVEL 0 — ты внутри.',
    status: 'ready', href: 'level.html' },
  { id: 1, title: 'Цикл агента', meta: 'Observe → think → act',
    pitch: 'Чат — это вдох. Агент — это дыхание.',
    status: 'ready', href: 'level.html' },
  { id: 2, title: 'Инструменты', meta: 'Function calling · внешние API',
    pitch: 'Коробка учится дёргать внешний мир.', status: 'locked' },
  { id: 3, title: 'Память', meta: 'RAG · контекстное окно · долгая память',
    pitch: 'Что не влезло — не существует. Пока.', status: 'locked' },
  { id: 4, title: 'Конструктор', meta: 'Сборка агента',
    pitch: 'Собери своего агента из деталей и запусти.', status: 'locked' },
];
