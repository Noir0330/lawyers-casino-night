import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPaths = ["index.html", "artists/index.html", "menu/index.html", "tickets/index.html", "history-2025/index.html", "lottery/index.html", "awards/index.html", "physical-invitation/index.html"];
const pages = await Promise.all(htmlPaths.map((file) => readFile(path.join(root, file), "utf8")));
const failures = [];
const references = pages.flatMap((page) => [...page.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1])).filter((reference) => reference.startsWith("/"));

for (const reference of references) {
  let relative = decodeURIComponent(reference.split(/[?#]/, 1)[0]).replace(/^\/+/, "");
  if (!relative) relative = "index.html";
  if (relative.endsWith("/")) relative += "index.html";
  try { await access(path.join(root, relative)); } catch { failures.push(`Missing local reference: ${reference}`); }
}
for (const [index, page] of pages.entries()) {
  if (!page.includes('lang="mn"')) failures.push(`${htmlPaths[index]}: missing Mongolian language declaration`);
  if (!page.includes('/assets/css/casino.css')) failures.push(`${htmlPaths[index]}: missing casino stylesheet`);
  if (!page.includes('casino-theme')) failures.push(`${htmlPaths[index]}: missing casino theme class`);
  if (page.includes("Leaders of Mongolia")) failures.push(`${htmlPaths[index]}: old event content remains`);
}
const requiredByPage = [
  [0, ["Алтан Дэнс - 2026 Special Casino Night", "Монголын өмгөөлөгчдийн холбоо · Шинэ жил 2027", "ONE NIGHT. ONE FORTUNE", "18:00–19:00", "00:00–01:00", "Roulette", "Рулет", "Texas", "Техас", "Darts", "Дартс", "Question and Answer", "Асуулт хариулт", "Tested One&apos;s Resourcefulness and Quick-Wittedness", "Авхаалж самбаа сорьсон тоглоом", "жетон болон коктейлийн ваучер", "Үдшийн шилдэг"]],
  [1, ["Серёжа", "Гангаа", "Х. Лхагвасүрэн", "С.Наран", "Magnet brain", "Г.Энэрэл", "Л.Болдбаатар"]],
  [2, ["Fruit garden salad", "Жимстэй шинэ ногооны", "Roasted chicken thigh", "Үхрийн махан филей", "Гүзээлзгэнэтэй бялуу", "Шингэн хүнс", "VVIP ширээ"]],
  [3, ["Roulette", "Рулет", "Texas", "Техас", "Darts", "Дартс", "Question and Answer", "Асуулт хариулт", "Tested One&apos;s Resourcefulness and Quick-Wittedness", "Авхаалж самбаа сорьсон тоглоом"]],
  [4, ["жетон болон коктейлийн ваучер", "хамгийн олон жетон", "Үдшийн шилдэг", "5 төрлийн тоглоом", "Хожигдвол өгсөн жетоноо алдаж", "хожвол жетоны тоогоо нэмнэ"]],
  [5, ["Roulette", "Рулет", "Texas", "Техас", "Darts", "Дартс", "Question and Answer", "Асуулт хариулт", "Tested One&apos;s Resourcefulness and Quick-Wittedness", "Авхаалж самбаа сорьсон тоглоом"]],
  [6, ["Casino King 2027", "Casino Queen 2027", "Best James Bond", "Best Casino Glamour", "Best Couple"]]
];
for (const [pageIndex, copies] of requiredByPage) for (const copy of copies) if (!pages[pageIndex].toLowerCase().includes(copy.toLowerCase())) failures.push(`${htmlPaths[pageIndex]}: missing copy: ${copy}`);
const musicByPage = [
  [0, "/assets/audio/happy-new-year-abba.mp3"],
  [1, "/assets/audio/last-christmas-wham.mp3"],
  [2, "/assets/audio/all-i-want-for-christmas-is-you.mp3"],
  [6, "/assets/audio/jingle-joy.mp3"]
];
for (const [pageIndex, musicPath] of musicByPage) {
  if (!pages[pageIndex].includes(`<audio id="bgm" src="${musicPath}"`)) failures.push(`${htmlPaths[pageIndex]}: missing music track: ${musicPath}`);
  if (!pages[pageIndex].includes('id="musicBtn"')) failures.push(`${htmlPaths[pageIndex]}: missing music toggle`);
}
for (const [index, page] of pages.slice(0, 7).entries()) {
  const desktopNav = page.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const mobileNav = page.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const mobileNavMain = mobileNav.match(/<div class="mobile-nav-main">[\s\S]*?<\/div>/)?.[0] ?? "";
  const primaryLabels = ["Урилга", "Уран бүтээлчид", "Зоог", "Шалгаруулалт"];
  for (const label of primaryLabels) {
    if (!desktopNav.includes(label) || !mobileNav.includes(label)) failures.push(`${htmlPaths[index]}: missing primary navigation item: ${label}`);
  }
  const desktopOrder = primaryLabels.map((label) => desktopNav.indexOf(label));
  const mobileOrder = primaryLabels.map((label) => mobileNavMain.indexOf(label));
  if (desktopOrder.some((position, itemIndex) => itemIndex && position < desktopOrder[itemIndex - 1])) failures.push(`${htmlPaths[index]}: incorrect desktop navigation order`);
  if (mobileOrder.some((position, itemIndex) => itemIndex && position < mobileOrder[itemIndex - 1])) failures.push(`${htmlPaths[index]}: incorrect mobile navigation order`);
  for (const duplicateRoute of ['/lottery/', '/tickets/', '/history-2025/']) {
    if (desktopNav.includes(duplicateRoute) || mobileNav.includes(duplicateRoute)) failures.push(`${htmlPaths[index]}: duplicate route remains in primary navigation: ${duplicateRoute}`);
  }
  if ((desktopNav.match(/<a class="desktop-nav-link/g) ?? []).length !== 4) failures.push(`${htmlPaths[index]}: desktop navigation must contain exactly four links`);
  if ((mobileNavMain.match(/<a /g) ?? []).length !== 4) failures.push(`${htmlPaths[index]}: mobile primary navigation must contain exactly four links`);
  if (!mobileNavMain.includes('class="mobile-menu-toggle"')) failures.push(`${htmlPaths[index]}: missing fifth burger menu item`);
  for (const label of ["Тоглоомын төрөл", "Тоглоомын дүрэм", "Даалгавар", "Dress code", "Хөтөлбөр", "Байршил"]) {
    if (!mobileNav.includes(label)) failures.push(`${htmlPaths[index]}: missing burger menu item: ${label}`);
  }
}
const casinoAssets = ["roulette.avif", "cards.avif", "chips.avif", "poker-chip-red.avif", "poker-chip-black.avif", "poker-chip-blue.avif", "poker-chip-green.avif", "dice.avif", "prize-wheel.avif", "crown.avif", "mystery-box.avif"];
for (const asset of casinoAssets) {
  try { await access(path.join(root, "assets/casino/3d", asset)); } catch { failures.push(`Missing optimized 3D asset: ${asset}`); }
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Static checks passed (${references.length} local references, 8 routes, ${casinoAssets.length} optimized 3D assets).`);
