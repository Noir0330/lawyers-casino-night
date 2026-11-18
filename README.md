# Leaders of Mongolia — Casino Night

`leadersmongolia` event site-ийн structure болон interaction-ууд дээр тулгуурласан, тусдаа хөгжүүлэгдэх Casino Night хувилбар.

Одоогийн эхний хувилбар нь Envato asset-аас хамааралгүй CSS placeholder art ашиглана. Финал 3D PNG, background болон loop video ирэхэд layout өөрчлөхгүйгээр `assets/casino/` дотор холбоно.

## Local preview

```bash
pnpm dev
```

Дараа нь <http://127.0.0.1:4173> нээнэ.

## Validation

```bash
pnpm check
```

## Casino asset integration

Asset-ийн нэр, формат болон зориулалтыг [`assets/casino/README.md`](assets/casino/README.md)-д тэмдэглэсэн. Transparent PNG/WebP болон богино MP4/WebM loop-ийг илүүд үзнэ.

## Pages

- `/` — урилга, hero, countdown, мэндчилгээ, хөтөлбөр, байршил
- `/artists/` — уран бүтээлчид
- `/menu/` — үдшийн зоог
- `/tickets/` — тасалбар ба суудлын зураг
- `/lottery/` — азын шагнал
- `/awards/` — шагналын төрлүүд
- `/history-2025/` — өмнөх жилийн түүх
- `/physical-invitation/` — хэвлэмэл урилгын artwork slot

## Deployment

Build process шаардлагагүй static site. Vercel дээр Framework Preset-ийг `Other` байлгаж root directory-г шууд serve хийнэ.
