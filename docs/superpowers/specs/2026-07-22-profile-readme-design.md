# GitHub Profile README — neofetch-style card

## Goal
หน้า profile `github.com/onlyakr` แสดง card สไตล์ neofetch (แบบ BroKarim):
แมว pixel-art GIF ฝั่งซ้าย + info card SVG มีสี (key ส้ม/แดง, dotted leaders) ฝั่งขวา
พร้อม GitHub stats ที่อัปเดตอัตโนมัติทุกวัน

## Architecture
- Repo `onlyakr/onlyakr` (public) — README แสดงบนหน้า profile อัตโนมัติ
- `README.md` — layout: `cat.gif` ซ้าย + `<picture>` สลับ `card-dark.svg`/`card-light.svg` ขวา
- `cat.gif` — pixel art จาก `~/Downloads/pixilart-1784735086065.gif`
- `generate.mjs` — Node script เดียว ไม่มี dependency (fetch built-in)
  - config object บนหัวไฟล์ = เนื้อหา card ทั้งหมด (แก้ที่เดียว)
  - ยิง GitHub GraphQL API (`GITHUB_TOKEN`) ดึง repos / stars / commit contributions / followers
  - render SVG 2 theme จาก template literal
- `.github/workflows/update.yml` — cron รายวัน + on push → รัน script → commit ถ้า SVG เปลี่ยน

## Card content (draft — แก้ทีหลังใน config)
- `onlyakr@github` — OS macOS · Expertise Full Stack (Intern) · Projects ez-fleet, Yuen · IDE VS Code
- Languages: Programming = TypeScript, JavaScript, SQL · Real = Thai, English
- Contact: onlyakr2477@gmail.com · github.com/onlyakr
- GitHub Stats (auto): Repos | Stars | Commits | Followers

## Error handling
API fail → script throw → workflow แดง ไม่ commit ของเสีย

## Verify
- `node generate.mjs` local (ใช้ PAT) → เปิด SVG ดูใน browser ทั้ง 2 theme
- push แล้วเช็คหน้า profile จริง + กด Run workflow ดูว่าเขียวและ commit stats ได้
