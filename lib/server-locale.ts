import { cookies } from "next/headers";
import { usesPashtoContent, type Locale } from "@/lib/i18n";

export function normalizeLocale(value: string | undefined): Locale {
  return value === "ps" || value === "fa" ? value : "en";
}

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get("poharana-locale")?.value);
}

export function localizedCourseSelect(locale: Locale) {
  if (locale === "fa") return { titleEn: true, titleDa: true, descriptionEn: true, descriptionDa: true, level: true };
  if (locale === "ps") return { titleEn: true, titlePs: true, descriptionEn: true, descriptionPs: true, level: true };
  return { titleEn: true, descriptionEn: true, level: true };
}

export function localizedModuleSelect(locale: Locale) {
  if (locale === "fa") return { titleEn: true, titleDa: true, descriptionEn: true, descriptionDa: true };
  if (locale === "ps") return { titleEn: true, titlePs: true, descriptionEn: true, descriptionPs: true };
  return { titleEn: true, descriptionEn: true };
}

export function localizedLessonSelect(locale: Locale) {
  if (locale === "fa") return { titleEn: true, titleDa: true, descriptionEn: true, descriptionDa: true, readingEn: true, readingDa: true };
  if (locale === "ps") return { titleEn: true, titlePs: true, descriptionEn: true, descriptionPs: true, readingEn: true, readingPs: true };
  return { titleEn: true, descriptionEn: true, readingEn: true };
}
