const Database = require('better-sqlite3');
const db = new Database('./data/corporate-portal.db');
const count = db.prepare('SELECT COUNT(*) as c FROM library_categories').get();
if (count.c > 0) { console.log('Already seeded:', count.c, 'categories'); process.exit(0); }
const ins = db.prepare("INSERT INTO library_categories (name, icon, order_index) VALUES (?, ?, ?)");
const cats = [
  ['Документы', '\u{1F4C4}', 0],
  ['Приказы', '\u{1F4CB}', 1],
  ['Договоры', '\u{1F4DD}', 2],
  ['Протоколы', '\u{1F4D1}', 3],
  ['Шаблоны', '\u{1F4C3}', 4],
  ['Инструкции', '\u{1F4D6}', 5],
  ['Отчёты', '\u{1F4CA}', 6],
  ['Презентации', '\u{1F4D1}', 7],
];
cats.forEach(c => ins.run(...c));
console.log('Seeded', cats.length, 'library categories');
