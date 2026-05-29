# PohaRana

PohaRana is a Next.js MVP for a bilingual Afghan ed-tech platform. It uses structured course data, English/Pashto translations, RTL layout switching, and YouTube embeds for low-bandwidth video delivery.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Structure

- `data/data.json`: mock curriculum data with courses, modules, lessons, and YouTube IDs.
- `lib/i18n.ts`: English/Pashto dictionary and direction helpers.
- `components/LanguageProvider.tsx`: language state and document `dir` switching.
- `components/VideoPlayer.tsx`: responsive YouTube embed component.
- `components/CourseDashboard.tsx`: desktop-first course grid.
- `components/LessonView.tsx`: video lesson layout with persistent course navigation.
