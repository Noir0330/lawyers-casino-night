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
  if (page.includes("Leaders of Mongolia") || page.includes("Angel Ina Ica")) failures.push(`${htmlPaths[index]}: old event content remains`);
}
const requiredByPage = [
  [0, ["THE LAWYERS&apos; CASINO NIGHT", "Монголын өмгөөлөгчдийн холбоо · Шинэ жил 2027", "ONE NIGHT. ONE FORTUNE", "18:00–19:00", "00:00–01:00"]],
  [1, ["Серёжа", "Гангаа", "Х. Лхагвасүрэн", "С.Наран", "Magnet brain", "Г.Энэрэл", "Л.Болдбаатар"]],
  [2, ["Black tuxedo", "Улаан, хар, алтлаг урт даашинз"]],
  [3, ["Roulette тоглоомын ширээ", "Poker ширээ", "Blackjack ширээ", "Casino lounge болон VIP суудал", "мэргэжлийн дилер"]],
  [4, ["ижил хэмжээний эхний жетон", "зөвхөн тоглоомоор олно", "мөнгөөр худалдаж авах", "тусгай шагналын эзэд"]],
  [5, ["Roulette", "Blackjack", "Poker", "Lucky Dice", "Wheel of Fortune", "Mystery Box"]],
  [6, ["Casino King 2027", "Casino Queen 2027", "Best James Bond", "Best Casino Glamour", "Best Couple"]]
];
for (const [pageIndex, copies] of requiredByPage) for (const copy of copies) if (!pages[pageIndex].toLowerCase().includes(copy.toLowerCase())) failures.push(`${htmlPaths[pageIndex]}: missing copy: ${copy}`);
for (const [index, page] of pages.slice(0, 7).entries()) {
  const desktopNav = page.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const mobileNav = page.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  for (const label of ["Урилга", "Тоглоомын дүрэм", "Онцгой шалгаруулалт", "Уран бүтээлчид"]) {
    if (!desktopNav.includes(label) || !mobileNav.includes(label)) failures.push(`${htmlPaths[index]}: missing primary navigation item: ${label}`);
  }
  for (const duplicateRoute of ['/lottery/', '/tickets/', '/menu/']) {
    if (desktopNav.includes(duplicateRoute) || mobileNav.includes(duplicateRoute)) failures.push(`${htmlPaths[index]}: duplicate route remains in primary navigation: ${duplicateRoute}`);
  }
  if ((desktopNav.match(/<a class="desktop-nav-link/g) ?? []).length !== 4) failures.push(`${htmlPaths[index]}: desktop navigation must contain exactly four links`);
  if ((mobileNav.match(/<a /g) ?? []).length !== 4) failures.push(`${htmlPaths[index]}: mobile navigation must contain exactly four links`);
}
const casinoAssets = ["roulette.png", "cards.png", "chips.png", "dice.png", "prize-wheel.png", "crown.png", "mystery-box.png"];
for (const asset of casinoAssets) {
  try { await access(path.join(root, "assets/casino/3d", asset)); } catch { failures.push(`Missing optimized 3D asset: ${asset}`); }
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Static checks passed (${references.length} local references, 8 routes, ${casinoAssets.length} optimized 3D assets).`);
