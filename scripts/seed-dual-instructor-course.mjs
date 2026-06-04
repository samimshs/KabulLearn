/**
 * Creates a sample published course with TWO instructors to test the multi-author CourseCard.
 * Run with: node scripts/seed-dual-instructor-course.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const educator = await db.user.findFirst({
    where: { role: "EDUCATOR" },
    select: { id: true }
  });
  if (!educator) throw new Error("No educator found — run db:seed first.");

  // Delete existing test course if re-running
  await db.course.deleteMany({ where: { slug: "data-science-team-course" } });

  // Create two distinct creator profiles
  const profile1 = await db.creatorProfile.upsert({
    where: { username: "sami-samim" },
    update: {
      name: "Sami Samim",
      professionalTitle: "Senior Data Scientist",
      bio: "Sami leads data science education at KabulLearn. He has 10+ years of experience building ML systems for healthcare and finance.",
      avatarUrl: null,
      linkedinUrl: "https://www.linkedin.com/in/sami-samim",
      youtubeUrl: null,
    },
    create: {
      username: "sami-samim",
      name: "Sami Samim",
      professionalTitle: "Senior Data Scientist",
      bio: "Sami leads data science education at KabulLearn. He has 10+ years of experience building ML systems for healthcare and finance.",
      avatarUrl: null,
      linkedinUrl: "https://www.linkedin.com/in/sami-samim",
      youtubeUrl: null,
      createdById: educator.id,
    },
    select: { id: true }
  });

  const profile2 = await db.creatorProfile.upsert({
    where: { username: "laila-rahimi" },
    update: {
      name: "Laila Rahimi",
      professionalTitle: "Machine Learning Engineer",
      bio: "Laila specialises in applied ML and natural language processing. She holds an MSc from Kabul University and has taught Python to 2,000+ students.",
      avatarUrl: null,
      linkedinUrl: null,
      youtubeUrl: null,
    },
    create: {
      username: "laila-rahimi",
      name: "Laila Rahimi",
      professionalTitle: "Machine Learning Engineer",
      bio: "Laila specialises in applied ML and natural language processing. She holds an MSc from Kabul University and has taught Python to 2,000+ students.",
      avatarUrl: null,
      linkedinUrl: null,
      youtubeUrl: null,
      createdById: educator.id,
    },
    select: { id: true }
  });

  // Create the course
  const course = await db.course.create({
    data: {
      slug: "data-science-team-course",
      status: "PUBLISHED",
      publishedAt: new Date(),
      level: "intermediate",
      titleEn: "Applied Data Science: A Team Approach",
      titlePs: "عملي ډاټا ساینس: د ډلې لاره",
      titleDa: "علم داده کاربردی: رویکرد تیمی",
      descriptionEn: "Learn data science the way real teams do it — from exploratory analysis to model deployment. Two expert instructors bring complementary perspectives.",
      descriptionPs: "د ډاټا ساینس زده کړه هماغسې کوئ لکه ریښتیني ډلې چې کوي — له سپړنې شننې تر ماډل پلي کولو. دوه کارپوه استادان مکمل لیدلوری وړاندې کوي.",
      descriptionDa: "علم داده را آنطور که تیم‌های واقعی آن را انجام می‌دهند بیاموزید — از تحلیل اکتشافی تا استقرار مدل. دو استاد متخصص دیدگاه‌های مکمل ارائه می‌دهند.",
      authorId: educator.id,
      authorProfileId: profile1.id,
    },
    select: { id: true }
  });

  // Link both instructors via the junction table
  await db.courseInstructor.createMany({
    data: [
      { courseId: course.id, profileId: profile1.id, order: 0 },
      { courseId: course.id, profileId: profile2.id, order: 1 },
    ]
  });

  // Add one module and one lesson so the course is structurally complete
  const module = await db.module.create({
    data: {
      courseId: course.id,
      order: 1,
      titleEn: "Foundations of Team-Based Data Science",
      titlePs: "د ډلیز ډاټا ساینس بنسټونه",
      titleDa: "مبانی علم داده تیمی",
    },
    select: { id: true }
  });

  await db.lesson.create({
    data: {
      moduleId: module.id,
      order: 1,
      type: "VIDEO",
      titleEn: "Welcome & Course Overview",
      titlePs: "ښه راغلاست او د کورس کتنه",
      titleDa: "خوش‌آمدید و مرور کورس",
      descriptionEn: "Meet your instructors and get a roadmap for the course.",
      descriptionPs: "خپل استادان وپېژنئ او د کورس لارښود ترلاسه کړئ.",
      descriptionDa: "با استادان خود آشنا شوید و نقشه راه کورس را دریافت کنید.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }
  });

  console.log(`✓ Course created: ${course.id}`);
  console.log(`  Instructors: Sami Samim (primary) + Laila Rahimi`);
  console.log(`  Visit: http://localhost:3002 to see it on the homepage`);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => db.$disconnect());
