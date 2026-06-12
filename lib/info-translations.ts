import type { Locale } from "@/lib/i18n";

type LinkCard = { title: string; description: string; href: string; cta?: string };
type Faq = { question: string; answer: string };
type TextSection = { title: string; paragraphs?: string[]; bullets?: string[] };

export type PublicInfoContent = {
  footer: {
    tagline: string;
    support: string;
    location: string;
    operatedBy: string;
    groups: Array<{ title: string; links: Array<{ key: string; label: string; href: string; studentOnly?: boolean; educatorOnly?: boolean }> }>;
  };
  catalog: {
    eyebrow: string;
    title: string;
    description: string;
    openAll: string;
    learnerSupport: string;
    categoriesTitle: string;
    walkthroughTitle: string;
    videoTitle: string;
    videoDescription: string;
    categories: LinkCard[];
  };
  certificate: {
    eyebrow: string;
    title: string;
    description: string;
    exploreCourses: string;
    reportIssue: string;
    verifyTitle: string;
    verifyDescription: string;
    lookupLabel: string;
    lookupPlaceholder: string;
    lookupError: string;
    lookupButton: string;
    meaningTitle: string;
    meaningParagraphs: string[];
    walkthroughTitle: string;
    videoTitle: string;
    videoDescription: string;
  };
  support: {
    eyebrow: string;
    title: string;
    description: string;
    goCourses: string;
    contactSupport: string;
    walkthroughTitle: string;
    videoTitle: string;
    videoDescription: string;
    faqTitle: string;
    faqs: Faq[];
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    emailSupport: string;
    learnerFaq: string;
    emailTitle: string;
    emailParagraphs: string[];
    areasTitle: string;
    areas: string[];
    ticketTitle: string;
    ticketText: string;
    ticketFormTitle: string;
    ticketFormDescription: string;
  };
  donate: {
    eyebrow: string;
    title: string;
    description: string;
    longDescription: string;
    ctaButton: string;
    ctaComingSoon: string;
    purposes: Array<{ title: string; description: string }>;
    disclosure: string;
    questions: string;
    browseCourses: string;
  };
  educators: {
    eyebrow: string;
    title: string;
    description: string;
    goPortal: string;
    requestAccess: string;
    register: string;
    resources: string;
    pipelineTitle: string;
    beforeTitle: string;
    steps: TextSection[];
    before: string[];
  };
  educatorResources: {
    eyebrow: string;
    title: string;
    description: string;
    instructionsEyebrow: string;
    workflowTitle: string;
    checklistTitle: string;
    guidelinesTitle: string;
    guidelinesDescription: string;
    openGuidelines: string;
    becomeEducatorLink: string;
    videoTitle: string;
    videoDescription: string;
    steps: TextSection[];
    checklist: string[];
  };
  educatorGuidelines: {
    eyebrow: string;
    title: string;
    description: string;
    goPortal: string;
    teach: string;
    walkthroughTitle: string;
    videoTitle: string;
    videoDescription: string;
    structureTitle: string;
    structureItems: string[];
    recordingTitle: string;
    recordingItems: string[];
    trilingualTitle: string;
    trilingualItems: string[];
    quizTitle: string;
    quizItems: string[];
    ownershipTitle: string;
    ownershipParagraphs: string[];
    checklistTitle: string;
    checklistItems: string[];
  };
  terms: {
    eyebrow: string;
    title: string;
    description: string;
    privacy: string;
    contact: string;
    sections: TextSection[];
  };
  privacy: {
    eyebrow: string;
    title: string;
    description: string;
    terms: string;
    help: string;
    sections: TextSection[];
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    missionTitle: string;
    missionParagraphs: string[];
    offersTitle: string;
    offers: Array<{ title: string; description: string }>;
    orgTitle: string;
    orgText: string;
    startLearning: string;
    teach: string;
  };
};

const commonFooterLinks = {
  en: {
    learner: "Learner Navigation",
    catalog: "Course Catalog",
    allCourses: "All Courses",
    cert: "Certificate Verification",
    support: "Learner Support",
    learning: "My Learning",
    educator: "Educator Resources",
    teach: "Teach on KabulLearn",
    portal: "Educator Portal",
    resources: "Resources",
    company: "Company",
    about: "About KabulLearn",
    legal: "Legal & Trust",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    contact: "Contact",
    supportDonate: "Support KabulLearn"
  },
  ps: {
    learner: "د زده‌کوونکو لارښود",
    catalog: "د کورسونو کتلاګ",
    allCourses: "ټول کورسونه",
    cert: "د سند تصدیق",
    support: "د زده‌کوونکي ملاتړ",
    learning: "زما زده کړه",
    educator: "د استادانو سرچینې",
    teach: "په کابل‌لرن کې تدریس",
    portal: "د استاد پورټل",
    resources: "سرچینې",
    company: "شرکت",
    about: "د کابل‌لرن په اړه",
    legal: "قانوني او باور",
    terms: "د خدمت شرایط",
    privacy: "د محرمیت تګلاره",
    contact: "اړیکه",
    supportDonate: "د کابل‌لرن ملاتړ"
  },
  fa: {
    learner: "رهنمای شاگرد",
    catalog: "فهرست کورس‌ها",
    allCourses: "همه کورس‌ها",
    cert: "تصدیق گواهی",
    support: "پشتیبانی شاگرد",
    learning: "یادگیری من",
    educator: "منابع استادان",
    teach: "تدریس در کابل‌لرن",
    portal: "درگاه استاد",
    resources: "منابع",
    company: "شرکت",
    about: "درباره کابل‌لرن",
    legal: "قانونی و اعتماد",
    terms: "شرایط خدمات",
    privacy: "خط‌مشی رازداری",
    contact: "تماس",
    supportDonate: "حمایت از کابل‌لرن"
  }
} as const;

function footer(locale: Locale): PublicInfoContent["footer"] {
  const f = commonFooterLinks[locale];
  return {
    tagline:
      locale === "ps"
        ? "درې ژبي زده کړه، لارښود تمرین، او د افغان زده‌کوونکو لپاره د تصدیق وړ سندونه."
        : locale === "fa"
          ? "یادگیری سه‌زبانه، تمرین راهنما، و گواهی‌های قابل تصدیق برای شاگردان افغان."
          : "Trilingual learning, guided validation, and verifiable credentials for Afghan learners worldwide.",
    support: locale === "ps" ? "ملاتړ" : locale === "fa" ? "پشتیبانی" : "Support",
    location: locale === "ps" ? "شیکاګو، الینوی، امریکا" : locale === "fa" ? "شیکاگو، ایلینوی، امریکا" : "Chicago, Illinois, USA",
    operatedBy:
      locale === "ps"
        ? "کابل‌لرن د KabulHub LLC له خوا پرمخ وړل کېږي."
        : locale === "fa"
          ? "کابل‌لرن توسط KabulHub LLC اداره می‌شود."
          : "KabulLearn is operated by KabulHub LLC.",
    groups: [
      {
        title: f.learner,
        links: [
          { key: "catalog", label: f.catalog, href: "/catalog" },
          { key: "courses", label: f.allCourses, href: "/courses" },
          { key: "certificate", label: f.cert, href: "/certificate-verification" },
          { key: "learner-support", label: f.support, href: "/learner-support" },
          { key: "my-learning", label: f.learning, href: "/dashboard", studentOnly: true }
        ]
      },
      {
        title: f.educator,
        links: [
          { key: "teach", label: f.teach, href: "/for-educators" },
          { key: "educator-portal", label: f.portal, href: "/educator", educatorOnly: true },
          { key: "educator-resources", label: f.resources, href: "/educator-resources" }
        ]
      },
      {
        title: f.company,
        links: [
          { key: "about", label: f.about, href: "/about" },
          { key: "terms", label: f.terms, href: "/terms" },
          { key: "privacy", label: f.privacy, href: "/privacy" },
          { key: "contact", label: f.contact, href: "/contact" },
          { key: "donate", label: f.supportDonate, href: "/support" }
        ]
      }
    ]
  };
}

const en: Omit<PublicInfoContent, "footer"> = {
  catalog: {
    eyebrow: "Learner Navigation",
    title: "Course Catalog",
    description: "Explore KabulLearn courses by category, then continue to the full course marketplace to enroll, learn, complete quizzes, and earn eligible certificates.",
    openAll: "Open all courses",
    learnerSupport: "Learner support",
    categoriesTitle: "Top-level categories",
    walkthroughTitle: "Catalog walkthrough",
    videoTitle: "Learner catalog video placeholder",
    videoDescription: "Add a short video explaining how to browse categories, enroll in a course, and continue learning.",
    categories: [
      { title: "Mathematics", description: "Foundations for quantitative reasoning, problem solving, and technical learning.", href: "/courses?category=Mathematics", cta: "Browse mathematics" },
      { title: "Statistics", description: "Probability, variation, inference, and applied statistical thinking with practical examples.", href: "/courses?category=Statistics", cta: "Browse statistics" },
      { title: "Data Science", description: "Data analysis, modeling workflows, applied projects, and decision-focused interpretation.", href: "/courses?category=Data%20Science", cta: "Browse data science" },
      { title: "Machine Learning & AI", description: "Applied machine learning, AI tools, responsible use, and intelligent-system concepts.", href: "/courses?category=Machine%20Learning", cta: "Browse AI courses" },
      { title: "Computer Basics", description: "Digital literacy, browser-first workflows, and practical technology foundations.", href: "/courses?category=Computer%20Basics", cta: "Browse basics" },
      { title: "Software & Web Development", description: "HTML, CSS, JavaScript, web tools, and practical software-building foundations.", href: "/courses?category=Software", cta: "Browse software" }
    ]
  },
  certificate: {
    eyebrow: "Legal & Trust",
    title: "Certificate Verification",
    description: "Employers, institutions, and third parties can verify whether a KabulLearn certificate was issued by our platform and still appears as valid in our records.",
    exploreCourses: "Explore courses",
    reportIssue: "Report an issue",
    verifyTitle: "Verify a certificate",
    verifyDescription: "Enter the certificate ID, verification code, or the URL from a certificate QR code. The result page will show limited certificate details needed to confirm authenticity.",
    lookupLabel: "Certificate ID or verification link",
    lookupPlaceholder: "Paste certificate ID, verification code, or QR URL",
    lookupError: "Enter a certificate ID, verification code, or QR verification link.",
    lookupButton: "Verify certificate",
    meaningTitle: "What verification means",
    meaningParagraphs: [
      "Verification confirms that a certificate record exists in KabulLearn systems and has not been invalidated. It does not guarantee employment, licensing, admissions, or third-party acceptance.",
      "If a certificate appears incorrect or suspicious, contact support with the certificate code and a screenshot."
    ],
    walkthroughTitle: "Verification walkthrough",
    videoTitle: "Certificate verification video placeholder",
    videoDescription: "Add a short walkthrough for employers and learners explaining QR codes, certificate IDs, and verification results."
  },
  support: {
    eyebrow: "Learner Navigation",
    title: "Learner Support",
    description: "Get help with course access, video modules, interactive quizzes, account access, and verifiable certificates.",
    goCourses: "Go to courses",
    contactSupport: "Contact support",
    walkthroughTitle: "Learner walkthrough",
    videoTitle: "Learner instruction video placeholder",
    videoDescription: "Add a video explaining how to register, enroll, watch lessons, complete quizzes, and download certificates.",
    faqTitle: "Frequently asked questions",
    faqs: [
      { question: "I cannot access a course lesson. What should I check?", answer: "Make sure you are signed in, enrolled in the course, and have completed any required quiz or previous locked section. If the issue continues, send the course name, lesson title, browser, and screenshot to support." },
      { question: "A video module is not loading.", answer: "Refresh the page, check your internet connection, try another browser, and confirm that embedded video services are not blocked on your network. KabulLearn keeps lessons browser-first, but some videos may depend on external hosting." },
      { question: "My quiz answer or score looks wrong.", answer: "Retake the quiz if attempts are available. If you believe there is an error in the question, send support the course name, module, question text, and screenshot." },
      { question: "How do I earn a certificate?", answer: "Complete the required lessons, quizzes, and course milestones. Eligible certificates become available after course requirements are met and can be verified with a QR code or certificate ID." },
      { question: "Can I learn in English, Pashto, and Dari?", answer: "KabulLearn is designed for trilingual learning. Course availability may vary by instructor and course, but the platform supports English, Pashto, and Dari learning workflows." }
    ]
  },
  contact: {
    eyebrow: "Contact / Support",
    title: "Start with support.",
    description: "Tell us what happened, which account or course is affected, and what you expected to happen. The more specific the report, the faster we can help.",
    emailSupport: "Email support",
    learnerFaq: "Learner FAQ",
    emailTitle: "Support email",
    emailParagraphs: [
      "Email: info@kabulhub.com",
      "Include your name, account email, course name, screenshots, device/browser, and any certificate code or quiz details related to the issue.",
      "We aim to respond within 1-2 business days. Urgent security, privacy, or certificate integrity reports should include \"Urgent\" in the subject line."
    ],
    areasTitle: "What we can help with",
    areas: [
      "Account login, registration, or email access",
      "Course enrollment, lesson access, or video playback",
      "Quiz scoring, locked sections, or progress tracking",
      "Certificate download, QR code, or verification issues",
      "Educator access, course review, or publishing questions",
      "Privacy, data deletion, copyright, abuse, or security reports"
    ],
    ticketTitle: "Ticketing placeholder",
    ticketText: "TODO: Add a support ticket form or help desk integration here when a ticketing system is configured. Until then, support requests should be sent by email.",
    ticketFormTitle: "Submit a support ticket",
    ticketFormDescription: "Fill in the form below and we'll get back to you within 1–2 business days. You'll receive a confirmation email with your ticket number right away."
  },
  donate: {
    eyebrow: "KabulHub LLC",
    title: "Support KabulLearn",
    description: "Help us expand access to practical education in English, Pashto, and Dari.",
    longDescription: "KabulLearn creates structured courses, guided quizzes, educator support, and verifiable certificates for Afghan learners worldwide. Your contribution helps us create new courses, improve the platform, and keep learning accessible.",
    ctaButton: "Support with Stripe",
    ctaComingSoon: "Donation link coming soon.",
    purposes: [
      { title: "Create new courses", description: "Fund new course development across mathematics, data science, AI, and more practical subjects." },
      { title: "Maintain the platform", description: "Keep infrastructure, hosting, and technical systems running reliably for learners around the world." },
      { title: "Expand learner access", description: "Reach more Afghan learners in the diaspora and at home with structured, practical learning paths." },
      { title: "Support certificates", description: "Maintain the certificate and verification system so learners can earn and share credible credentials." }
    ],
    disclosure: "KabulLearn is operated by KabulHub LLC. Contributions support educational content, platform development, and learner access initiatives. Contributions are voluntary and are not tax-deductible charitable donations.",
    questions: "Questions? Contact us at",
    browseCourses: "Browse courses →"
  },
  educators: {
    eyebrow: "Educator Resources",
    title: "Teach on KabulLearn",
    description: "Share practical knowledge with Afghan learners in English, Pashto, and Dari through structured courses, guided quizzes, and certificate-ready learning paths.",
    goPortal: "Go to educator portal",
    requestAccess: "Request educator access",
    register: "Register free account",
    resources: "Teaching tools",
    pipelineTitle: "Four-step onboarding pipeline",
    beforeTitle: "Before requesting access",
    steps: [
      { title: "1. Register", paragraphs: ["Create a free KabulLearn account with your real name and reachable email address."] },
      { title: "2. Request Access", paragraphs: ["Submit a request explaining what you'd like to teach. Admin will upgrade your existing account."] },
      { title: "3. Create", paragraphs: ["Build course modules, lessons, readings, videos, quizzes, and certificate-ready milestones."] },
      { title: "4. Publish", paragraphs: ["Submit the course for review, complete requested revisions, and publish after approval."] }
    ],
    before: [
      "Prepare a short description of the course you want to teach.",
      "List the language versions you can support: English, Pashto, Dari, or a combination.",
      "Confirm that you own or have permission to use all course materials.",
      "Plan quizzes or validation checkpoints that prove learner understanding.",
      "Review the instructor guidelines before uploading videos, readings, datasets, or slides."
    ]
  },
  educatorResources: {
    eyebrow: "Educator Resources",
    title: "Educator resources",
    description: "Practical guidance for creating, recording, translating, and submitting KabulLearn courses.",
    instructionsEyebrow: "Creator instructions",
    workflowTitle: "Four-step publishing workflow",
    checklistTitle: "Course readiness checklist",
    guidelinesTitle: "Instructor guidelines",
    guidelinesDescription: "Review standards for lesson structure, trilingual content, quizzes, media quality, copyright, and submission readiness.",
    openGuidelines: "Open guidelines",
    becomeEducatorLink: "Teach on KabulLearn",
    videoTitle: "Educator onboarding video",
    videoDescription: "Add a short walkthrough showing how approved instructors create drafts, add lessons, and submit for review.",
    steps: [
      { title: "1. Register", paragraphs: ["Create a free KabulLearn account with your real name and reachable email address."] },
      { title: "2. Request Access", paragraphs: ["Submit a request explaining what you would like to teach. Admin will upgrade your existing account."] },
      { title: "3. Create", paragraphs: ["Build course modules, lessons, readings, videos, quizzes, and certificate-ready milestones."] },
      { title: "4. Publish", paragraphs: ["Submit the course for review, complete requested revisions, and publish after approval."] }
    ],
    checklist: [
      "Prepare a short description of the course you want to teach.",
      "List the language versions you can support: English, Pashto, Dari, or a combination.",
      "Confirm that you own or have permission to use all course materials.",
      "Plan quizzes or validation checkpoints that prove learner understanding.",
      "Review the instructor guidelines before uploading videos, readings, datasets, or slides."
    ]
  },
  educatorGuidelines: {
    eyebrow: "Educator Resources",
    title: "Instructor Guidelines",
    description: "Use these guidelines to prepare course videos, readings, quizzes, translations, and uploads that meet KabulLearn quality and trust standards.",
    goPortal: "Go to educator portal",
    teach: "Teach on KabulLearn",
    walkthroughTitle: "Instructor walkthrough",
    videoTitle: "Instructor guidelines video placeholder",
    videoDescription: "Add a training video for recording lessons, formatting trilingual content, uploading materials, and submitting for review.",
    structureTitle: "Course structure",
    structureItems: [
      "Start with clear learner outcomes and prerequisites.",
      "Organize courses into modules with focused lessons.",
      "Keep each lesson tied to one concept, skill, or applied milestone.",
      "Add readings or summaries for learners with limited video bandwidth.",
      "Use quizzes to validate understanding before learners advance."
    ],
    recordingTitle: "Recording standards",
    recordingItems: [
      "Record in a quiet environment with clear audio.",
      "Use readable slides, large fonts, and high-contrast visuals.",
      "Avoid copyrighted music, images, datasets, or clips unless licensed.",
      "Explain technical vocabulary slowly and define key terms.",
      "Keep videos concise and aligned with the lesson objective."
    ],
    trilingualTitle: "Trilingual formatting",
    trilingualItems: [
      "Provide English, Pashto, and Dari titles or summaries when possible.",
      "Use consistent terminology across language versions.",
      "Do not rely on machine translation without instructor review.",
      "Keep examples culturally respectful and accessible to Afghan learners worldwide.",
      "Mark any missing translation clearly before submitting for review."
    ],
    quizTitle: "Quiz and validation rules",
    quizItems: [
      "Questions should test the lesson objective, not trivia.",
      "Write unambiguous answer choices and avoid misleading wording.",
      "Include practical checks where learners interpret, calculate, build, or explain.",
      "Do not include private learner data, confidential datasets, or unsafe instructions.",
      "Review quiz scoring before submitting the course for publication."
    ],
    ownershipTitle: "Content ownership, privacy, and safety",
    ownershipParagraphs: [
      "Instructors must only upload materials they own, created, licensed, or have written permission to use. Do not upload private student information, copyrighted resources without permission, confidential employer materials, or content that could harm learners.",
      "KabulLearn may request revisions, restrict access, unpublish content, or remove materials that create legal, privacy, safety, quality, or trust concerns."
    ],
    checklistTitle: "Upload and review checklist",
    checklistItems: [
      "Course title, summary, level, and category are complete.",
      "Modules and lessons are ordered logically.",
      "Each lesson has a video, reading, or clear learning activity.",
      "Required quizzes are complete and aligned with lessons.",
      "Trilingual fields are complete where promised.",
      "All uploaded content is owned, licensed, or permissioned.",
      "The course is submitted for review before publication."
    ]
  },
  terms: {
    eyebrow: "Legal & Trust",
    title: "Terms of Service",
    description: "These terms explain the rules for using KabulLearn, including learner accounts, educator tools, interactive validation, course content, and certificate verification.",
    privacy: "Privacy Policy",
    contact: "Contact Support",
    sections: [
      { title: "1. Acceptance of these terms", paragraphs: ["By accessing KabulLearn, creating an account, enrolling in a course, submitting educator content, completing quizzes, or using certificate verification, you agree to these Terms of Service and linked policies.", "KabulLearn is operated by KabulHub LLC. We may update these terms as the platform, laws, or operations change."] },
      { title: "2. Accounts and eligibility", paragraphs: ["You are responsible for your login credentials and all activity under your account. You must provide accurate information and may not impersonate others or misuse accounts.", "Educator accounts may require approval, identity review, sample content, or compliance checks before publishing privileges are granted."] },
      { title: "3. Learning content and validation", paragraphs: ["KabulLearn provides educational content, readings, videos, quizzes, milestones, and learning workflows. Courses do not guarantee employment, admission, licensing, income, or third-party certification.", "Quizzes and validation features may include pass thresholds, locked lessons, progress tracking, and completion requirements."] },
      { title: "4. Certificates and verification", paragraphs: ["Eligible learners may receive certificates after completing required activities. Certificates may include learner name, course information, grade, issue date, QR code, UUID, and verification code.", "Verification confirms a certificate record exists and has not been invalidated. It does not guarantee government accreditation or third-party acceptance."] },
      { title: "5. Educator content", paragraphs: ["Educators are responsible for the accuracy, legality, quality, originality, and safety of materials they upload. They must own or have permission to use all content.", "KabulLearn may review, request changes, reject, unpublish, or remove educator content that creates quality, safety, privacy, copyright, or legal concerns."] },
      { title: "6. User conduct", paragraphs: ["Users may not cheat, forge certificates, attempt unauthorized access, harass others, upload harmful content, scrape protected areas, or interfere with platform security.", "We may investigate suspicious activity and restrict access when needed to protect learners, educators, certificates, and platform integrity."] },
      { title: "7. Intellectual property", paragraphs: ["KabulLearn and KabulHub LLC retain rights in platform design, software, branding, and original materials. Educators retain rights in materials they own, while granting KabulLearn a license to host and display submitted content.", "Users may not copy, redistribute, sell, or misuse platform content except where explicitly allowed."] },
      { title: "8. Payments and payouts", paragraphs: ["If paid courses, educator payouts, sponsorships, grants, or transactions are introduced, additional payment, refund, tax, identity, and compliance terms may apply.", "Third-party payment providers may process payment or payout information under their own terms and privacy practices."] },
      { title: "9. Privacy and data use", paragraphs: ["Our Privacy Policy explains how we collect, use, retain, protect, and share data related to accounts, progress, quizzes, educator workflows, certificates, support requests, and technical logs.", "By using KabulLearn, you acknowledge that platform functionality depends on processing learning records, account data, and verification data."] },
      { title: "10. Third-party services", paragraphs: ["KabulLearn may rely on third-party services for hosting, authentication, email, video, file storage, analytics, and security. We are not responsible for third-party outages or policies."] },
      { title: "11. Suspension and termination", paragraphs: ["We may suspend or terminate access, remove content, restrict certificates, or disable educator privileges if a user violates these terms or creates legal, security, safety, or operational risk.", "Account deletion requests can be sent through support, subject to retention needed for security, legal compliance, fraud prevention, certificate integrity, and business records."] },
      { title: "12. Disclaimers and limitation of liability", paragraphs: ["KabulLearn is provided on an \"as is\" and \"as available\" basis. We do not guarantee uninterrupted access, error-free content, compatibility with every device, or permanent availability of every course.", "To the maximum extent permitted by law, KabulLearn and KabulHub LLC are not liable for indirect, incidental, special, consequential, punitive, or lost-profit damages."] },
      { title: "13. Governing law and disputes", paragraphs: ["These terms are governed by the laws of Illinois, United States, unless another law is required to apply. Before filing a formal claim, you agree to contact support so we can try to resolve the issue informally."] },
      { title: "14. Contact", paragraphs: ["For questions about these terms, account access, certificates, educator content, or policy concerns, contact info@kabulhub.com."] }
    ]
  },
  privacy: {
    eyebrow: "Legal & Trust",
    title: "Privacy Policy",
    description: "This policy explains what data KabulLearn collects, why we use it, how we share it, how long we keep it, and what choices learners and educators have.",
    terms: "Terms of Service",
    help: "Request help",
    sections: [
      { title: "1. Who operates KabulLearn", paragraphs: ["KabulLearn is a learning platform operated by KabulHub LLC. References to KabulLearn, we, us, and our mean the platform and team operating it.", "Privacy questions, account requests, security reports, and data-rights requests can be sent to info@kabulhub.com."] },
      { title: "2. Information we collect", paragraphs: ["Account data includes name, email, password authentication records, OAuth profile data, language preference, role, status, and profile settings.", "Learning data includes enrollments, course progress, lesson completion, quiz answers, attempts, scores, timestamps, certificates, and learning activity.", "Educator data includes profiles, course drafts, lesson materials, review history, uploaded assets, publishing status, analytics, and approval communications.", "Technical data includes IP address, device/browser data, logs, security events, cookies or local storage identifiers, error reports, and usage data."] },
      { title: "3. How we use information", paragraphs: ["We use data to create and secure accounts, authenticate users, personalize language settings, provide courses, track progress, run quizzes, issue certificates, verify credentials, support educators, review content, and respond to support requests.", "We also use data to prevent fraud, cheating, forged certificates, spam, abuse, unauthorized access, and misuse of educator tools."] },
      { title: "4. How information is shared", paragraphs: ["We do not sell personal information. We may share data with service providers that help host the platform, store data, send email, authenticate users, process payments, deliver assets, monitor security, and analyze reliability.", "Educators may receive limited learner progress and course activity data for courses they teach where needed for instruction, support, assessment, and improvement.", "Certificate verification may disclose limited certificate information to someone who submits a valid certificate ID, verification code, or QR link."] },
      { title: "5. Cookies and similar technology", paragraphs: ["KabulLearn may use cookies, local storage, session tokens, and similar technologies to keep users signed in, remember language preferences, protect accounts, measure usage, and maintain security."] },
      { title: "6. Data retention", paragraphs: ["We keep information as long as needed to provide the platform, maintain records, preserve progress, verify certificates, support educators, comply with law, resolve disputes, prevent fraud, and protect security.", "Certificate records may be retained longer to preserve verification integrity."] },
      { title: "7. Security", paragraphs: ["We use administrative, technical, and organizational safeguards designed to protect accounts, learning records, certificates, and systems. No online service is perfectly secure."] },
      { title: "8. Your choices and rights", paragraphs: ["You may request access, correction, deletion, or export of personal information by contacting support. We may need to verify your identity before acting.", "Some requests may be limited by certificate integrity, fraud prevention, legal obligations, security, educator records, or operational needs."] },
      { title: "9. International users", paragraphs: ["KabulLearn is designed for Afghan learners worldwide and may process data in the United States and other locations where service providers operate."] },
      { title: "10. Children and students", paragraphs: ["KabulLearn is not intended to collect personal information from children without required consent. Parents, guardians, schools, or institutions may contact support for review."] },
      { title: "11. Changes to this policy", paragraphs: ["We may update this Privacy Policy as KabulLearn grows, adds features, changes providers, or responds to legal requirements. Updated versions will be posted on this page."] }
    ]
  },
  about: {
    eyebrow: "About KabulLearn",
    title: "Education for Afghans, wherever they are",
    description: "KabulLearn is an online learning platform with structured courses in English, Pashto, and Dari.",
    missionTitle: "What we are",
    missionParagraphs: [
      "We build online courses for Afghan learners who do not have reliable access to education, or who face poor education quality where learning opportunities exist. That includes people in rural areas with limited schools, Afghans who have moved abroad, and girls and women inside Afghanistan who have been banned from secondary school and university since 2021.",
      "Creating an account is free. You need a device and an internet connection. That is all."
    ],
    offersTitle: "What KabulLearn offers",
    offers: [
      { title: "Free account", description: "Joining KabulLearn is free. Some courses are free, others are priced by their instructors." },
      { title: "Three languages", description: "Courses are available in English, Pashto, and Dari." },
      { title: "Certificates", description: "Complete a course and earn a certificate you can verify online." }
    ],
    orgTitle: "Who runs KabulLearn",
    orgText: "KabulLearn is operated by KabulHub LLC, based in Chicago, Illinois. Contact us at info@kabulhub.com.",
    startLearning: "Start learning",
    teach: "Teach on KabulLearn"
  }
};

const ps: Omit<PublicInfoContent, "footer"> = {
  catalog: {
    eyebrow: "د زده‌کوونکو لارښود",
    title: "د کورسونو کتلاګ",
    description: "د کابل‌لرن کورسونه د موضوع له مخې وپلټئ، د کورس بشپړ بازار ته لاړ شئ، نوم‌لیکنه وکړئ، زده کړه پیل کړئ، ازموینې بشپړې کړئ او وړ سندونه ترلاسه کړئ.",
    openAll: "ټول کورسونه پرانیزئ",
    learnerSupport: "د زده‌کوونکي ملاتړ",
    categoriesTitle: "اصلي برخې",
    walkthroughTitle: "د کتلاګ لارښود",
    videoTitle: "د زده‌کوونکي د کتلاګ ویډیو ځای",
    videoDescription: "دلته لنډه ویډیو زیاته کړئ چې د برخو پلټنه، په کورس کې نوم‌لیکنه، او د زده کړې دوام تشریح کړي.",
    categories: [
      { title: "ریاضیات", description: "د شمېرني فکر، مسئلو حل، او تخنیکي زده کړې بنسټونه.", href: "/courses?category=Mathematics", cta: "ریاضیات وپلټئ" },
      { title: "احصایه", description: "احتمال، بدلون، استنباط، او عملي احصایوي فکر.", href: "/courses?category=Statistics", cta: "احصایه وپلټئ" },
      { title: "د معلوماتو ساینس", description: "د معلوماتو تحلیل، ماډل جوړونه، عملي پروژې، او د پرېکړو تشریح.", href: "/courses?category=Data%20Science", cta: "د معلوماتو ساینس وپلټئ" },
      { title: "ماشین زده کړه او مصنوعي ځیرکتیا", description: "عملي ماشین زده کړه، د مصنوعي ځیرکتیا وسایل، مسؤول کارول، او هوښیار سیستمونه.", href: "/courses?category=Machine%20Learning", cta: "د مصنوعي ځیرکتیا کورسونه وپلټئ" },
      { title: "د کمپیوټر بنسټونه", description: "ډیجیټل سواد، براوزر-محوره کارونه، او عملي ټکنالوژي.", href: "/courses?category=Computer%20Basics", cta: "بنسټونه وپلټئ" },
      { title: "سافټویر او ویب جوړونه", description: "د ویب پاڼو ژبې او وسایل، عملي ویب کارونه، او د سافټویر جوړونې بنسټونه.", href: "/courses?category=Software", cta: "سافټویر وپلټئ" }
    ]
  },
  certificate: {
    eyebrow: "قانوني او باور",
    title: "د سند تصدیق",
    description: "کار ورکوونکي، ادارې، او درېیم اړخونه کولای شي وګوري چې د کابل‌لرن سند زموږ له سیستم څخه صادر شوی او لا هم د اعتبار وړ دی.",
    exploreCourses: "کورسونه وپلټئ",
    reportIssue: "ستونزه راپور کړئ",
    verifyTitle: "سند تصدیق کړئ",
    verifyDescription: "د سند پېژند، د تصدیق کوډ، یا د سند د QR کوډ لینک دننه کړئ. پایله یوازې هغه محدود معلومات ښيي چې د اصالت د تایید لپاره اړین دي.",
    lookupLabel: "د سند پېژند یا د تصدیق لینک",
    lookupPlaceholder: "د سند پېژند، د تصدیق کوډ، یا د QR کوډ لینک دننه کړئ",
    lookupError: "د سند پېژند، د تصدیق کوډ، یا د QR تصدیق لینک دننه کړئ.",
    lookupButton: "سند تصدیق کړئ",
    meaningTitle: "تصدیق څه معنا لري",
    meaningParagraphs: [
      "تصدیق دا ښيي چې د سند ریکارډ د کابل‌لرن په سیستم کې شته او باطل شوی نه دی. دا د کار، جواز، داخلې، یا د درېیم اړخ د منلو ضمانت نه کوي.",
      "که سند ناسم یا مشکوک ښکاري، د سند کوډ او سکرین‌شاټ له ملاتړ سره شریک کړئ."
    ],
    walkthroughTitle: "د تصدیق لارښود",
    videoTitle: "د سند تصدیق ویډیو ځای",
    videoDescription: "د کار ورکوونکو او زده‌کوونکو لپاره لنډه ویډیو زیاته کړئ چې QR کوډونه، د سند پېژند، او د تصدیق پایلې تشریح کړي."
  },
  support: {
    eyebrow: "د زده‌کوونکو لارښود",
    title: "د زده‌کوونکي ملاتړ",
    description: "د کورس لاسرسي، ویډیو درسونو، تعاملي ازموینو، حساب، او د تصدیق وړ سندونو لپاره مرسته ترلاسه کړئ.",
    goCourses: "کورسونو ته لاړ شئ",
    contactSupport: "له ملاتړ سره اړیکه",
    walkthroughTitle: "د زده‌کوونکي لارښود",
    videoTitle: "د زده‌کوونکي لارښود ویډیو ځای",
    videoDescription: "د نوم‌لیکنې، په کورس کې شاملېدو، درس کتلو، ازموینو بشپړولو، او سند ډاونلوډولو په اړه ویډیو زیاته کړئ.",
    faqTitle: "ډېرې پوښتل شوې پوښتنې",
    faqs: [
      { question: "درس ته لاسرسی نه لرم. څه باید وګورم؟", answer: "ډاډ ترلاسه کړئ چې ننوتي یاست، په کورس کې مو نوم‌لیکنه کړې، او اړینه ازموینه یا پخوانۍ تړلې برخه مو بشپړه کړې ده. که ستونزه پاتې وي، د کورس نوم، د درس نوم، براوزر، او سکرین‌شاټ ملاتړ ته واستوئ." },
      { question: "ویډیو نه پورته کېږي.", answer: "پاڼه تازه کړئ، انټرنېټ وګورئ، بل براوزر وازمویئ، او ډاډ ترلاسه کړئ چې ویډیويي خدمتونه ستاسو په شبکه کې نه دي بند." },
      { question: "د ازموینې نمره یا ځواب ناسم ښکاري.", answer: "که هڅې پاتې وي، ازموینه بیا وکړئ. که د پوښتنې تېروتنه وي، د کورس نوم، برخه، د پوښتنې متن، او سکرین‌شاټ واستوئ." },
      { question: "څنګه سند ترلاسه کړم؟", answer: "اړین درسونه، ازموینې، او د کورس پړاوونه بشپړ کړئ. وړ سندونه د اړتیاوو له بشپړېدو وروسته د QR کوډ یا د سند پېژند له لارې تصدیقېدای شي." },
      { question: "ایا په انګلیسي، پښتو او دري زده کړه کولی شم؟", answer: "کابل‌لرن د درې ژبې زده کړې لپاره جوړ شوی. د هر کورس ژبې د استاد او کورس له مخې توپیر کولی شي." }
    ]
  },
  contact: {
    eyebrow: "اړیکه / ملاتړ",
    title: "له ملاتړ څخه پیل کړئ.",
    description: "موږ ته ووایئ څه پېښ شول، کوم حساب یا کورس اغېزمن دی، او تاسو څه تمه لرله. څومره چې معلومات روښانه وي، هماغومره ژر مرسته کولای شو.",
    emailSupport: "ملاتړ ته برېښنالیک",
    learnerFaq: "د زده‌کوونکي پوښتنې",
    emailTitle: "د ملاتړ برېښنالیک",
    emailParagraphs: [
      "برېښنالیک: info@kabulhub.com",
      "خپل نوم، د حساب برېښنالیک، د کورس نوم، سکرین‌شاټونه، وسیله/براوزر، او د سند یا ازموینې اړوند معلومات ولیکئ.",
      "موږ هڅه کوو په ۱-۲ کاري ورځو کې ځواب ووایو. بیړني امنیتي یا محرمیتي راپورونه دې په سرلیک کې «بیړنی» ولري."
    ],
    areasTitle: "موږ په څه کې مرسته کوو",
    areas: [
      "ننوتل، نوم‌لیکنه، یا برېښنالیک ته لاسرسی",
      "په کورس کې نوم‌لیکنه، درس ته لاسرسی، یا ویډیو",
      "د ازموینې نمرې، تړلې برخې، یا پرمختګ",
      "د سند ډاونلوډ، QR کوډ، یا تصدیق",
      "د استاد لاسرسی، بیاکتنه، یا خپرول",
      "محرمیت، د معلوماتو ړنګول، کاپي‌رایټ، ناوړه کارونه، یا امنیت"
    ],
    ticketTitle: "د ټکټ سیستم ځای",
    ticketText: "یادونه: کله چې د ملاتړ غوښتنو سیستم چمتو شي، دلته فورم یا د ملاتړ مرکز زیاتېږي. تر هغه وخته ملاتړ د برېښنالیک له لارې کېږي.",
    ticketFormTitle: "د ملاتړ ټکټ وسپارئ",
    ticketFormDescription: "لاندې فورم ډک کړئ؛ موږ به په ۱-۲ کاري ورځو کې درسره اړیکه ونیسو. د ټکټ له شمېرې سره تاییدي برېښنالیک به سمدستي واستول شي."
  },
  donate: {
    eyebrow: "KabulHub LLC",
    title: "د کابل‌لرن ملاتړ",
    description: "له موږ سره مرسته وکړئ چې په انګلیسي، پښتو او دري کې عملي زده کړو ته لاسرسی پراخ کړو.",
    longDescription: "کابل‌لرن د نړۍ د افغان زده‌کوونکو لپاره منظم کورسونه، لارښود ازموینې، د استادانو ملاتړ، او د تصدیق وړ سندونه جوړوي. ستاسو مرسته له موږ سره د نوو کورسونو په جوړولو، د پلېټفارم په ښه کولو، او د زده کړې د لاسرسي په ساتلو کې مرسته کوي.",
    ctaButton: "د Stripe له لارې ملاتړ وکړئ",
    ctaComingSoon: "د مرستې لینک ژر راځي.",
    purposes: [
      { title: "نوي کورسونه جوړول", description: "په ریاضیاتو، معلوماتو ساینس، مصنوعي ځیرکتیا، او نورو عملي موضوعاتو کې د نوو کورسونو پراختیا ملاتړ کړئ." },
      { title: "پلېټفارم ساتل", description: "زیربنا، کوربه‌توب، او تخنیکي سیستمونه د نړۍ د زده‌کوونکو لپاره د باور وړ وساتئ." },
      { title: "د زده‌کوونکو لاسرسی پراخول", description: "له منظمې او عملي زده کړې سره بهر مېشتو افغانانو او په هېواد کې نورو زده‌کوونکو ته ورسېږئ." },
      { title: "د سندونو ملاتړ", description: "د سند او تصدیق سیستم وساتئ، څو زده‌کوونکي د باور وړ اسناد ترلاسه او شریک کړي." }
    ],
    disclosure: "کابل‌لرن د KabulHub LLC له خوا پرمخ وړل کېږي. مرستې د زده کړې منځپانګې، د پلېټفارم پراختیا، او د زده‌کوونکو د لاسرسي نوښتونه ملاتړ کوي. مرستې رضاکارانه دي او د مالیاتو د کمولو خیریه بسپنې نه دي.",
    questions: "پوښتنې لرئ؟ له موږ سره اړیکه ونیسئ",
    browseCourses: "کورسونه وپلټئ ←"
  },
  educators: {
    eyebrow: "د استادانو سرچینې",
    title: "په کابل‌لرن کې تدریس",
    description: "خپله عملي پوهه له افغان زده‌کوونکو سره په انګلیسي، پښتو او دري کې د منظمو کورسونو، لارښود ازموینو، او د سند لپاره چمتو زده‌کړې لارو له لارې شریکه کړئ.",
    goPortal: "د استاد پورټل ته لاړ شئ",
    requestAccess: "د استاد لاسرسی وغواړئ",
    register: "وړیا حساب جوړ کړئ",
    resources: "د تدریس وسایل",
    pipelineTitle: "د یوځای کېدو څلور پړاوه لاره",
    beforeTitle: "د لاسرسي له غوښتنې مخکې",
    steps: [
      { title: "۱. نوم‌لیکنه", paragraphs: ["د خپل اصلي نوم او فعال برېښنالیک په کارولو سره وړیا کابل‌لرن حساب جوړ کړئ."] },
      { title: "۲. د لاسرسي غوښتنه", paragraphs: ["تشریح کړئ چې څه تدریسول غواړئ. مدیر به ستاسو شته حساب لوړ کړي."] },
      { title: "۳. جوړول", paragraphs: ["برخې، درسونه، لوستنې، ویډیوګانې، ازموینې، او د سند لپاره اړین پړاوونه جوړ کړئ."] },
      { title: "۴. خپرول", paragraphs: ["کورس د بیاکتنې لپاره واستوئ، غوښتل شوې سمونې بشپړې کړئ، او له تایید وروسته یې خپور کړئ."] }
    ],
    before: [
      "د هغه کورس لنډه تشریح چمتو کړئ چې تدریسول یې غواړئ.",
      "هغه ژبې ولیکئ چې ملاتړ یې کولی شئ: انګلیسي، پښتو، دري، یا ګډه بڼه.",
      "ډاډ ترلاسه کړئ چې د ټولو موادو د کارولو حق یا اجازه لرئ.",
      "ازموینې یا د پوهې د تایید پړاوونه پلان کړئ.",
      "د ویډیوګانو، لوستنو، معلوماتي ټولګو، یا سلایډونو له پورته کولو مخکې لارښوونې وګورئ."
    ]
  },
  educatorResources: {
    eyebrow: "د استادانو سرچینې",
    title: "د استادانو سرچینې",
    description: "د کابل‌لرن کورسونو د جوړولو، ثبتولو، ژباړلو، او سپارلو لپاره عملي لارښود.",
    instructionsEyebrow: "د کورس جوړوونکي لارښوونې",
    workflowTitle: "د خپرولو څلور پړاوه بهیر",
    checklistTitle: "د کورس د چمتوالي نوملړ",
    guidelinesTitle: "د استاد لارښوونې",
    guidelinesDescription: "د درس جوړښت، درې ژبي منځپانګې، ازموینې، د رسنیو کیفیت، کاپي‌رایټ، او د سپارلو معیارونه وګورئ.",
    openGuidelines: "لارښوونې پرانیزئ",
    becomeEducatorLink: "په کابل‌لرن کې تدریس وکړئ",
    videoTitle: "د استاد د پیل ویډیو",
    videoDescription: "لنډه ویډیو زیاته کړئ چې استادان څنګه مسودې جوړوي، درسونه زیاتوي، او بیاکتنې ته یې سپاري.",
    steps: [
      { title: "۱. نوم‌لیکنه", paragraphs: ["د خپل اصلي نوم او فعال برېښنالیک په کارولو سره وړیا حساب جوړ کړئ."] },
      { title: "۲. لاسرسی وغواړئ", paragraphs: ["تشریح کړئ چې څه تدریسول غواړئ. مدیر به ستاسو حساب لوړ کړي."] },
      { title: "۳. جوړ کړئ", paragraphs: ["برخې، درسونه، لوستنې، ویډیوګانې، ازموینې، او د سند پړاوونه جوړ کړئ."] },
      { title: "۴. خپور کړئ", paragraphs: ["کورس بیاکتنې ته واستوئ، سمونې بشپړې کړئ، او له تایید وروسته یې خپور کړئ."] }
    ],
    checklist: [
      "د کورس لنډه تشریح چمتو کړئ.",
      "د ملاتړ ژبې ولیکئ.",
      "د موادو د کارولو اجازه تایید کړئ.",
      "د پوهې د تایید ازموینې پلان کړئ.",
      "له پورته کولو مخکې لارښوونې وګورئ."
    ]
  },
  educatorGuidelines: {
    eyebrow: "د استادانو سرچینې",
    title: "د استاد لارښوونې",
    description: "دا لارښوونې وکاروئ، څو د کورس ویډیوګانې، لوستنې، ازموینې، ژباړې، او پورته کېدونکي مواد د کابل‌لرن د کیفیت او باور له معیارونو سره برابر چمتو کړئ.",
    goPortal: "د استاد پورټل ته لاړ شئ",
    teach: "په کابل‌لرن کې تدریس وکړئ",
    walkthroughTitle: "د استاد لارښوونې",
    videoTitle: "د استاد لارښوونو ویډیو ځای",
    videoDescription: "د درسونو ثبت، درې ژبي منځپانګه، د موادو پورته کول، او د بیاکتنې لپاره سپارلو په اړه روزنیزه ویډیو زیاته کړئ.",
    structureTitle: "د کورس جوړښت",
    structureItems: [
      "له روښانه زده‌کړیزو موخو او مخکینیو اړتیاوو سره پیل وکړئ.",
      "کورسونه په داسې برخو ووېشئ چې هره برخه متمرکز درسونه ولري.",
      "هر درس له یوې مفکورې، مهارت، یا عملي پړاو سره وتړئ.",
      "د کم انټرنېټ لرونکو زده‌کوونکو لپاره لوستنې یا لنډیزونه هم زیات کړئ.",
      "د زده‌کوونکو له مخکې تګ مخکې د پوهاوي د تایید لپاره ازموینې وکاروئ."
    ],
    recordingTitle: "د ثبت معیارونه",
    recordingItems: [
      "په ارام چاپېریال کې د روښانه غږ سره ثبت وکړئ.",
      "لوستل کېدونکي سلایډونه، لوی فونټونه، او لوړ کانټراست لرونکي انځورونه وکاروئ.",
      "له اجازې پرته د کاپي‌رایټ لرونکې موسیقۍ، انځورونو، معلوماتي ټولګو، یا کلیپونو له کارولو ډډه وکړئ.",
      "تخنیکي اصطلاحات ورو او روښانه تشریح کړئ او مهمې اصطلاحګانې تعریف کړئ.",
      "ویډیوګانې لنډې وساتئ او د درس له موخو سره یې برابرې کړئ."
    ],
    trilingualTitle: "درې ژبي بڼه",
    trilingualItems: [
      "که ممکنه وي، د انګلیسي، پښتو او دري سرلیکونه یا لنډیزونه وړاندې کړئ.",
      "په ټولو ژبنیو نسخو کې یو شان اصطلاحات وکاروئ.",
      "له انساني بیاکتنې پرته یوازې پر ماشيني ژباړه تکیه مه کوئ.",
      "بېلګې د افغان زده‌کوونکو لپاره درنې، روښانه، او د لاسرسي وړ وساتئ.",
      "د بیاکتنې لپاره له سپارلو مخکې هره نیمګړې ژباړه په ښکاره ډول وښایئ."
    ],
    quizTitle: "د ازموینې او تایید اصول",
    quizItems: [
      "پوښتنې باید د درس موخه وازموي، نه بې‌ارزښته جزئیات.",
      "د ځوابونو روښانه انتخابونه ولیکئ او له ګمراه کوونکو کلیمو ډډه وکړئ.",
      "عملي ازموینې شاملې کړئ چې زده‌کوونکي پکې تفسیر، حساب، جوړول، یا تشریح وکړي.",
      "د زده‌کوونکو شخصي معلومات، محرمانه معلوماتي ټولګې، یا خطرناکې لارښوونې مه شاملوئ.",
      "د کورس له سپارلو مخکې د ازموینې نمرې او اړتیاوې بیا وګورئ."
    ],
    ownershipTitle: "د منځپانګې مالکیت، محرمیت، او خوندیتوب",
    ownershipParagraphs: [
      "استادان باید یوازې هغه مواد پورته کړي چې خپله یې لري، جوړ کړي یې وي، جواز یې ولري، یا یې لیکلې اجازه ترلاسه کړې وي. د زده‌کوونکو شخصي معلومات، له اجازې پرته کاپي‌رایټ لرونکې سرچینې، د کار ورکوونکي محرمانه مواد، یا هغه منځپانګه چې زده‌کوونکو ته زیان رسولی شي مه پورته کوئ.",
      "کابل‌لرن کولای شي د قانوني، محرمیتي، خوندیتوبي، کیفیتي، یا د باور د اندېښنو له امله د سمون غوښتنه وکړي، لاسرسی محدود کړي، منځپانګه نا خپره کړي، یا مواد لرې کړي."
    ],
    checklistTitle: "د پورته کولو او بیاکتنې نوملړ",
    checklistItems: [
      "د کورس سرلیک، لنډیز، کچه، او کټګوري بشپړ دي.",
      "برخې او درسونه منطقي ترتیب لري.",
      "هر درس ویډیو، لوستنه، یا روښانه زده‌کړیز فعالیت لري.",
      "اړینې ازموینې بشپړې او له درسونو سره برابرې دي.",
      "درې ژبي برخې، چې ژمنه یې شوې، بشپړې دي.",
      "ټول پورته شوي مواد مالکیت، جواز، یا اجازه لري.",
      "کورس د خپرولو مخکې د بیاکتنې لپاره سپارل شوی."
    ]
  },
  terms: {
    eyebrow: "قانوني او باور",
    title: "د خدمت شرایط",
    description: "دا شرایط د کابل‌لرن د کارولو اصول تشریح کوي، لکه د زده‌کوونکو حسابونه، د استادانو وسایل، تعاملي تایید، د کورس منځپانګه، او د سند تصدیق.",
    privacy: "د محرمیت تګلاره",
    contact: "له ملاتړ سره اړیکه",
    sections: [
      { title: "۱. د دې شرایطو منل", paragraphs: ["د کابل‌لرن په کارولو، حساب جوړولو، په کورس کې نوم‌لیکنې، د استاد منځپانګې سپارلو، ازموینو بشپړولو، یا د سند تصدیق کارولو سره تاسو د دې خدمت شرایط او تړلو تګلارو سره موافقه کوئ.", "کابل‌لرن د KabulHub LLC له خوا پرمخ وړل کېږي. موږ کولای شو دا شرایط د پلېټفارم، قانون، یا عملیاتي اړتیاوو له بدلون سره سم تازه کړو."] },
      { title: "۲. حسابونه او وړتیا", paragraphs: ["تاسو باید د خپل حساب دقیق معلومات وساتئ، خپل پټنوم خوندي کړئ، او د خپل حساب د کارولو مسؤولیت ومنئ.", "که تاسو د یوې ادارې، ښوونځي، یا بل چا په استازیتوب کابل‌لرن کاروئ، باید د دې کار اجازه ولرئ."] },
      { title: "۳. زده‌کړیزه منځپانګه او تایید", paragraphs: ["کابل‌لرن زده‌کړیزه منځپانګه، لوستنې، ویډیوګانې، ازموینې، پړاوونه، او زده‌کړیز بهیرونه وړاندې کوي. کورسونه د کار، داخلې، جواز، عاید، یا د درېیم اړخ د سند ضمانت نه کوي.", "ازموینې او د تایید ځانګړنې کېدای شي د تېرېدو حدونه، تړلي درسونه، د پرمختګ تعقیب، او د بشپړولو اړتیاوې ولري."] },
      { title: "۴. سندونه او تصدیق", paragraphs: ["وړ زده‌کوونکي کېدای شي د اړتیا وړ فعالیتونو له بشپړولو وروسته سندونه ترلاسه کړي. سندونه کېدای شي د زده‌کوونکي نوم، د کورس معلومات، نمره، د صادرېدو نېټه، QR کوډ، UUID، او د تصدیق کوډ ولري.", "تصدیق دا ښيي چې د سند ریکارډ شته او باطل شوی نه دی. دا د دولتي اعتبار یا د درېیم اړخ د منلو ضمانت نه کوي."] },
      { title: "۵. د استاد منځپانګه", paragraphs: ["استادان د خپلو پورته کړیو موادو د دقت، قانونيتوب، کیفیت، اصالت، او خوندیتوب مسؤول دي. هغوی باید د ټولو موادو مالکیت یا د کارولو اجازه ولري.", "کابل‌لرن کولای شي هغه استاد منځپانګه وګوري، د بدلون غوښتنه وکړي، رد یې کړي، نا خپره یې کړي، یا لرې یې کړي چې د کیفیت، خوندیتوب، محرمیت، کاپي‌رایټ، یا قانوني اندېښنې رامنځته کوي."] },
      { title: "۶. د کاروونکي چلند", paragraphs: ["کاروونکي نه شي کولای درغلي وکړي، جعلي سندونه جوړ کړي، بې‌اجازې لاسرسی وازمويي، نور وځوروي، زیانمنه منځپانګه پورته کړي، خوندي برخې راټولې کړي، یا د پلېټفارم امنیت ګډوډ کړي.", "موږ کولای شو شکمن فعالیت وڅېړو او د زده‌کوونکو، استادانو، سندونو، او پلېټفارم د خوندیتوب لپاره لاسرسی محدود کړو."] },
      { title: "۷. فکري ملکیت", paragraphs: ["کابل‌لرن او KabulHub LLC د پلېټفارم په ډیزاین، سافټویر، نښې، او اصلي موادو کې خپل حقوق ساتي. استادان د خپلو موادو حقوق ساتي، خو کابل‌لرن ته د سپارل شوې منځپانګې د کوربه‌توب او ښودلو اجازه ورکوي.", "کاروونکي نشي کولای د پلېټفارم منځپانګه کاپي، بیا خپره، وپلوري، یا ناوړه وکاروي، مګر هغه ځای چې ښکاره اجازه ورکړل شوې وي."] },
      { title: "۸. تادیات او ورکړې", paragraphs: ["که په راتلونکي کې پیسې لرونکي کورسونه، د استادانو ورکړې، سپانسرۍ، مرستې، یا راکړې ورکړې معرفي شي، ښايي اضافي د تادیې، بېرته ورکولو، مالیې، هویت، او قانوني مطابقت شرایط پلي شي.", "درېیم اړخ تادیاتي خدمتونه کېدای شي د خپلو شرایطو او محرمیت تګلارو له مخې د تادیې یا ورکړې معلومات پروسس کړي."] },
      { title: "۹. محرمیت او د معلوماتو کارول", paragraphs: ["زموږ د محرمیت تګلاره تشریح کوي چې موږ د حسابونو، پرمختګ، ازموینو، د استاد بهیرونو، سندونو، ملاتړ غوښتنو، او تخنیکي لاګونو اړوند معلومات څنګه راټولوو، کاروو، ساتو، خوندي کوو، او شریکوو.", "د کابل‌لرن په کارولو سره تاسو منئ چې د پلېټفارم فعالیت د زده‌کړې ریکارډونو، د حساب معلوماتو، او د تصدیق معلوماتو په پروسس پورې تړلی دی."] },
      { title: "۱۰. د درېیم اړخ خدمتونه", paragraphs: ["کابل‌لرن کېدای شي د کوربه‌توب، ننوتلو، برېښنالیک، ویډیو، فایل ساتلو، تحلیل، او امنیت لپاره د درېیم اړخ خدمتونه وکاروي. موږ د درېیم اړخ د بندښتونو یا تګلارو مسؤول نه یو."] },
      { title: "۱۱. ځنډول او پای ته رسول", paragraphs: ["که یو کاروونکی دا شرایط مات کړي یا قانوني، امنیتي، خوندیتوبي، یا عملیاتي خطر جوړ کړي، موږ کولای شو لاسرسی وځنډوو یا پای ته ورسوو، منځپانګه لرې کړو، سندونه محدود کړو، یا د استاد امتیازات بند کړو.", "د حساب د ړنګولو غوښتنې د ملاتړ له لارې استول کېدای شي، خو د امنیت، قانوني اړتیاوو، د درغلۍ مخنیوي، د سند د اعتبار، او سوداګریزو ریکارډونو له امله ځینې معلومات ساتل کېدای شي."] },
      { title: "۱۲. مسؤلیت نه منل او د مسؤلیت محدودیت", paragraphs: ["کابل‌لرن په هماغه بڼه وړاندې کېږي چې شته او شتون لري. موږ د نه پرې کېدونکي لاسرسي، بې‌تېروتنې منځپانګې، له هر وسیله سره د مطابقت، یا د هر کورس دایمي شتون ضمانت نه کوو.", "تر هغه حده چې قانون اجازه ورکوي، کابل‌لرن او KabulHub LLC د غیر مستقیم، تصادفي، ځانګړو، پایله لرونکو، جزايي، یا د ګټې د له لاسه ورکولو زیانونو مسؤول نه دي."] },
      { title: "۱۳. حاکم قانون او شخړې", paragraphs: ["دا شرایط د امریکا د الینوی ایالت د قوانینو تابع دي، پرته له هغه ځایه چې بل قانون لازماً پلي کېږي. د رسمي دعوې له ثبت مخکې، تاسو موافق یاست چې له ملاتړ سره اړیکه ونیسئ، څو ستونزه په غیر رسمي ډول حل کړو."] },
      { title: "۱۴. اړیکه", paragraphs: ["د دې شرایطو، حساب لاسرسي، سندونو، د استاد منځپانګې، یا تګلارو په اړه پوښتنې info@kabulhub.com ته واستوئ."] }
    ]
  },
  privacy: {
    eyebrow: "قانوني او باور",
    title: "د محرمیت تګلاره",
    description: "دا تګلاره تشریح کوي چې کابل‌لرن کوم معلومات راټولوي، ولې یې کاروي، څنګه یې شریکوي، څومره یې ساتي، او زده‌کوونکي او استادان کوم انتخابونه لري.",
    terms: "د خدمت شرایط",
    help: "مرسته وغواړئ",
    sections: [
      { title: "۱. کابل‌لرن څوک چلوي", paragraphs: ["کابل‌لرن د زده‌کړې پلېټفارم دی چې KabulHub LLC یې پرمخ وړي. په دې تګلاره کې کابل‌لرن، موږ، زموږ، او موږ ته اشارې د همدې پلېټفارم او ټیم معنا لري.", "د محرمیت پوښتنې، د حساب غوښتنې، امنیتي راپورونه، او د معلوماتو د حقونو غوښتنې info@kabulhub.com ته استول کېدای شي."] },
      { title: "۲. کوم معلومات راټولوو", paragraphs: ["د حساب معلومات کې نوم، برېښنالیک، د پټنوم د تصدیق ریکارډونه، د OAuth پروفایل معلومات، د ژبې خوښه، رول، حالت، او د پروفایل تنظیمات شاملېږي.", "د زده کړې معلومات کې نوم‌لیکنې، د کورس پرمختګ، د درس بشپړول، د ازموینې ځوابونه، هڅې، نمرې، وختونه، سندونه، او زده‌کړیز فعالیت شاملېږي.", "د استاد معلومات کې پروفایلونه، د کورس مسودې، د درس مواد، د بیاکتنې تاریخچه، پورته شوي فایلونه، د خپرېدو حالت، تحلیلونه، او د تایید اړیکې شاملېږي.", "تخنیکي معلومات کې IP پته، د وسیلې/براوزر معلومات، لاګونه، امنیتي پېښې، کوکیز یا ځايي زېرمه پېژندونکي، د تېروتنې راپورونه، او د کارونې معلومات شاملېږي."] },
      { title: "۳. معلومات څنګه کاروو", paragraphs: ["موږ معلومات د حسابونو جوړولو او خوندي کولو، کاروونکو د پېژندلو، د ژبې تنظیماتو شخصي کولو، کورسونو وړاندې کولو، پرمختګ تعقیبولو، ازموینو چلولو، سندونو صادرولو، سندونو تصدیقولو، د استادانو ملاتړ، منځپانګې بیاکتنې، او د ملاتړ غوښتنو ځوابولو لپاره کاروو.", "موږ معلومات د درغلۍ، نقل، جعلي سندونو، سپام، ناوړه کارونې، بې‌اجازې لاسرسي، او د استاد وسایلو د ناوړه کارولو د مخنیوي لپاره هم کاروو."] },
      { title: "۴. معلومات څنګه شریکېږي", paragraphs: ["موږ شخصي معلومات نه پلورو. کېدای شي معلومات له هغو خدمت‌چمتو کوونکو سره شریک کړو چې د پلېټفارم کوربه‌توب، معلوماتو ساتلو، برېښنالیک، ننوتلو، تادیاتو، فایلونو، امنیت څارنې، او اعتبار ښه کولو کې مرسته کوي.", "استادان کېدای شي د خپلو کورسونو د زده‌کوونکو محدود پرمختګ او فعالیت معلومات ترلاسه کړي، هلته چې د تدریس، ملاتړ، ارزونې، او ښه کولو لپاره اړین وي.", "د سند تصدیق کېدای شي هغه چا ته محدود سندي معلومات ښکاره کړي چې معتبر سند پېژند، تصدیق کوډ، یا QR لینک وړاندې کړي."] },
      { title: "۵. کوکیز او ورته ټکنالوژي", paragraphs: ["کابل‌لرن کېدای شي کوکیز، ځايي زېرمه، د ناستې ټوکنونه، او ورته ټکنالوژي وکاروي، څو کاروونکي ننوتي وساتي، د ژبې خوښه په یاد وساتي، حسابونه خوندي کړي، کارونه اندازه کړي، او امنیت وساتي."] },
      { title: "۶. د معلوماتو ساتل", paragraphs: ["موږ معلومات تر هغه وخته ساتو چې د پلېټفارم وړاندې کولو، ریکارډونو ساتلو، پرمختګ خوندي کولو، سندونو تصدیق، د استادانو ملاتړ، قانوني اړتیاوو، شخړو حل، د درغلۍ مخنیوي، او امنیت لپاره اړین وي.", "د سند ریکارډونه کېدای شي د تصدیق د اعتبار ساتلو لپاره اوږد وخت وساتل شي."] },
      { title: "۷. امنیت", paragraphs: ["موږ اداري، تخنیکي، او سازماني تدابیر کاروو چې د حسابونو، زده‌کړې ریکارډونو، سندونو، او سیستمونو ساتنه وکړي. هېڅ آنلاین خدمت سل سلنه خوندي نه دی."] },
      { title: "۸. ستاسو انتخابونه او حقونه", paragraphs: ["تاسو کولای شئ له ملاتړ سره په اړیکه کې د خپلو شخصي معلوماتو د لاسرسي، سمون، ړنګولو، یا صادرولو غوښتنه وکړئ. ښايي د اقدام مخکې ستاسو هویت تایید کړو.", "ځینې غوښتنې کېدای شي د سند د اعتبار، د درغلۍ مخنیوي، قانوني مکلفیتونو، امنیت، د استاد ریکارډونو، یا عملیاتي اړتیاوو له امله محدودې شي."] },
      { title: "۹. نړیوال کاروونکي", paragraphs: ["کابل‌لرن د نړۍ د افغان زده‌کوونکو لپاره جوړ شوی او کېدای شي معلومات په امریکا او نورو هغو ځایونو کې پروسس کړي چې خدمت‌چمتو کوونکي پکې فعالیت کوي."] },
      { title: "۱۰. ماشومان او زده‌کوونکي", paragraphs: ["کابل‌لرن د دې لپاره نه دی جوړ شوی چې له اړینې اجازې پرته د ماشومانو شخصي معلومات راټول کړي. مور او پلار، سرپرستان، ښوونځي، یا ادارې کولای شي د بیاکتنې لپاره له ملاتړ سره اړیکه ونیسي."] },
      { title: "۱۱. د دې تګلارې بدلونونه", paragraphs: ["موږ کېدای شي دا د محرمیت تګلاره تازه کړو، کله چې کابل‌لرن وده کوي، ځانګړنې زیاتوي، خدمت‌چمتو کوونکي بدلوي، یا قانوني اړتیاوو ته ځواب ورکوي. نوې بڼه به په همدې پاڼه کې خپرېږي."] }
    ]
  },
  about: {
    eyebrow: "د کابل‌لرن په اړه",
    title: "د افغانانو لپاره زده کړه، هر ځای چې وي",
    description: "کابل‌لرن یو آنلاین زده‌کړیز پلېټفارم دی چې په انګلیسي، پښتو او دري کې منظم کورسونه وړاندې کوي.",
    missionTitle: "موږ څوک یو",
    missionParagraphs: [
      "موږ د هغو افغان زده‌کوونکو لپاره آنلاین کورسونه جوړوو چې باوري زده کړې ته لاسرسی نه لري، یا هلته چې زده کړې شته خو کیفیت یې کمزوری دی. په دې کې هغه خلک شامل دي چې په محدودو ښوونیزو سیمو کې اوسي، هغه افغانان چې بهر مېشت دي، او هغه نجونې او ښځې چې له ۲۰۲۱ وروسته د منځني ښوونځي او پوهنتون له حضوري زده کړو منع شوي دي.",
      "د حساب جوړول وړیا دي. تاسو یوازې یوې وسیلې او انټرنېټ ته اړتیا لرئ. همدومره."
    ],
    offersTitle: "کابل‌لرن څه وړاندې کوي",
    offers: [
      { title: "وړیا حساب", description: "کابل‌لرن ته یوځای کېدل وړیا دي. ځینې کورسونه وړیا دي، د نورو قیمت د استادانو له خوا ټاکل کېږي." },
      { title: "درې ژبې", description: "کورسونه په انګلیسي، پښتو او دري کې شتون لري." },
      { title: "سندونه", description: "کورس بشپړ کړئ او آنلاین د تصدیق وړ سند ترلاسه کړئ." }
    ],
    orgTitle: "کابل‌لرن څوک پرمخ وړي",
    orgText: "کابل‌لرن د KabulHub LLC له خوا پرمخ وړل کېږي، چې په شیکاګو، الینوی کې مېشته ده. له موږ سره په info@kabulhub.com اړیکه ونیسئ.",
    startLearning: "زده کړه پیل کړئ",
    teach: "په کابل‌لرن کې تدریس وکړئ"
  }
};

const fa: Omit<PublicInfoContent, "footer"> = {
  ...ps,
  catalog: {
    ...ps.catalog,
    eyebrow: "رهنمای شاگرد",
    title: "فهرست کورس‌ها",
    description: "کورس‌های کابل‌لرن را بر اساس دسته‌بندی مرور کنید، سپس وارد فهرست کامل کورس‌ها شوید، ثبت‌نام کنید، بیاموزید، آزمون‌ها را تکمیل کنید و گواهی‌های واجد شرایط دریافت کنید.",
    openAll: "همه کورس‌ها را باز کنید",
    learnerSupport: "پشتیبانی شاگرد",
    categoriesTitle: "دسته‌بندی‌های اصلی",
    walkthroughTitle: "راهنمای فهرست",
    videoTitle: "جای ویدیوی راهنمای فهرست",
    videoDescription: "یک ویدیوی کوتاه درباره مرور دسته‌ها، ثبت‌نام در کورس و ادامه یادگیری اضافه کنید.",
    categories: [
      { title: "ریاضیات", description: "بنیادهای استدلال کمی، حل مسئله، و یادگیری فنی.", href: "/courses?category=Mathematics", cta: "مرور ریاضیات" },
      { title: "احصائیه", description: "احتمال، تغییر، استنباط، و تفکر آماری کاربردی.", href: "/courses?category=Statistics", cta: "مرور احصائیه" },
      { title: "علم داده", description: "تحلیل داده، جریان‌های مدل‌سازی، پروژه‌های کاربردی، و تفسیر تصمیم‌محور.", href: "/courses?category=Data%20Science", cta: "مرور علم داده" },
      { title: "یادگیری ماشین و هوش مصنوعی", description: "یادگیری ماشین کاربردی، ابزارهای هوش مصنوعی، استفاده مسئولانه، و سیستم‌های هوشمند.", href: "/courses?category=Machine%20Learning", cta: "مرور کورس‌های هوش مصنوعی" },
      { title: "مبانی کمپیوتر", description: "سواد دیجیتال، کارهای مرورگرمحور، و بنیادهای عملی فناوری.", href: "/courses?category=Computer%20Basics", cta: "مرور مبانی" },
      { title: "نرم‌افزار و توسعه وب", description: "زبان‌ها و ابزارهای ساخت وب، کارهای عملی وب، و بنیادهای ساخت نرم‌افزار.", href: "/courses?category=Software", cta: "مرور نرم‌افزار" }
    ]
  },
  certificate: {
    ...ps.certificate,
    eyebrow: "قانونی و اعتماد",
    title: "تصدیق گواهی",
    description: "کارفرمایان، نهادها، و طرف‌های سوم می‌توانند بررسی کنند که آیا گواهی کابل‌لرن از سیستم ما صادر شده و هنوز معتبر است.",
    exploreCourses: "مرور کورس‌ها",
    reportIssue: "گزارش مشکل",
    verifyTitle: "گواهی را تصدیق کنید",
    verifyDescription: "شناسه گواهی، کد تصدیق یا لینک QR گواهی را وارد کنید. صفحه نتیجه فقط معلومات محدودی را نشان می‌دهد که برای تصدیق اصالت لازم است.",
    lookupLabel: "شناسه گواهی یا لینک تصدیق",
    lookupPlaceholder: "شناسه گواهی، کد تصدیق یا لینک QR را وارد کنید",
    lookupError: "شناسه گواهی، کد تصدیق یا لینک تصدیق QR را وارد کنید.",
    lookupButton: "تصدیق گواهی",
    meaningTitle: "تصدیق چه معنی دارد",
    meaningParagraphs: ["تصدیق نشان می‌دهد که رکورد گواهی در سیستم کابل‌لرن وجود دارد و باطل نشده است. این به معنای ضمانت استخدام، جواز، پذیرش یا قبول از سوی طرف سوم نیست.", "اگر گواهی نادرست یا مشکوک به نظر می‌رسد، کد گواهی و تصویر صفحه را به پشتیبانی بفرستید."],
    walkthroughTitle: "راهنمای تصدیق",
    videoTitle: "جای ویدیوی تصدیق گواهی",
    videoDescription: "برای کارفرمایان و شاگردان ویدیوی کوتاهی درباره QR، شناسه گواهی و نتایج تصدیق اضافه کنید."
  },
  support: {
    ...ps.support,
    eyebrow: "رهنمای شاگرد",
    title: "پشتیبانی شاگرد",
    description: "برای دسترسی به کورس، ویدیوها، آزمون‌های تعاملی، حساب و گواهی‌های قابل تصدیق کمک بگیرید.",
    goCourses: "رفتن به کورس‌ها",
    contactSupport: "تماس با پشتیبانی",
    walkthroughTitle: "رهنمای شاگرد",
    videoTitle: "جای ویدیوی رهنمای شاگرد",
    videoDescription: "ویدیویی درباره ثبت‌نام، شامل شدن در کورس، دیدن درس‌ها، تکمیل آزمون‌ها و دریافت گواهی اضافه کنید.",
    faqTitle: "پرسش‌های متداول",
    faqs: [
      { question: "به درس کورس دسترسی ندارم. چه چیز را بررسی کنم؟", answer: "مطمئن شوید وارد حساب شده‌اید، در کورس ثبت‌نام دارید و آزمون یا بخش قفل‌شده قبلی را تکمیل کرده‌اید. اگر مشکل ادامه داشت، نام کورس، درس، مرورگر و تصویر صفحه را به پشتیبانی بفرستید." },
      { question: "ویدیو بارگذاری نمی‌شود.", answer: "صفحه را تازه کنید، اینترنت را بررسی کنید، مرورگر دیگری امتحان کنید، و مطمئن شوید خدمات ویدیویی در شبکه شما مسدود نیست." },
      { question: "پاسخ یا نمره آزمون اشتباه به نظر می‌رسد.", answer: "اگر تلاش باقی مانده است، آزمون را دوباره انجام دهید. اگر در پرسش خطا می‌بینید، نام کورس، بخش، متن پرسش و تصویر صفحه را بفرستید." },
      { question: "چگونه گواهی بگیرم؟", answer: "درس‌ها، آزمون‌ها و مراحل لازم کورس را کامل کنید. گواهی‌های واجد شرایط پس از تکمیل نیازمندی‌ها با QR یا شناسه گواهی قابل تصدیق می‌شوند." },
      { question: "آیا می‌توانم به انگلیسی، پشتو و دری یاد بگیرم؟", answer: "کابل‌لرن برای یادگیری سه‌زبانه ساخته شده است. زبان‌های هر کورس ممکن است بر اساس استاد و کورس فرق کند." }
    ]
  },
  contact: {
    ...ps.contact,
    eyebrow: "تماس / پشتیبانی",
    title: "از پشتیبانی شروع کنید.",
    description: "بگویید چه اتفاق افتاد، کدام حساب یا کورس متأثر است و انتظار شما چه بود. هرچه گزارش دقیق‌تر باشد، سریع‌تر کمک می‌کنیم.",
    emailSupport: "ایمیل به پشتیبانی",
    learnerFaq: "پرسش‌های شاگرد",
    emailTitle: "ایمیل پشتیبانی",
    emailParagraphs: ["ایمیل: info@kabulhub.com", "نام، ایمیل حساب، نام کورس، تصاویر صفحه، دستگاه/مرورگر و جزئیات گواهی یا آزمون را شامل کنید.", "ما معمولاً در ۱-۲ روز کاری پاسخ می‌دهیم. گزارش‌های فوری امنیتی یا رازداری باید در عنوان «فوری» داشته باشند."],
    areasTitle: "در چه مواردی کمک می‌کنیم",
    areas: ["ورود، ثبت‌نام یا دسترسی ایمیل", "ثبت‌نام کورس، دسترسی درس یا پخش ویدیو", "نمره آزمون، بخش‌های قفل‌شده یا پیشرفت", "دانلود گواهی، QR یا تصدیق", "دسترسی استاد، بررسی کورس یا نشر", "رازداری، حذف معلومات، حق مؤلف، سوءاستفاده یا امنیت"],
    ticketTitle: "جای سیستم تکت",
    ticketText: "یادداشت: وقتی سیستم تکت آماده شد، اینجا فورم یا مرکز پشتیبانی اضافه شود. تا آن زمان درخواست‌ها از طریق ایمیل فرستاده شوند.",
    ticketFormTitle: "ارسال تکت پشتیبانی",
    ticketFormDescription: "فورم زیر را پر کنید، ما در ۱-۲ روز کاری با شما تماس می‌گیریم. ایمیل تأیید با شماره تکت بلافاصله فرستاده می‌شود."
  },
  donate: {
    eyebrow: "KabulHub LLC",
    title: "حمایت از کابل‌لرن",
    description: "به ما کمک کنید دسترسی به آموزش عملی به زبان‌های انگلیسی، پشتو، و دری را گسترش دهیم.",
    longDescription: "کابل‌لرن کورس‌های ساختاریافته، آزمون‌های راهنما، پشتیبانی از استادان و گواهی‌های قابل تصدیق را برای شاگردان افغان در سراسر جهان فراهم می‌کند. کمک شما به ساخت کورس‌های جدید، بهبود پلتفرم و دسترس‌پذیر ماندن آموزش کمک می‌کند.",
    ctaButton: "حمایت با Stripe",
    ctaComingSoon: "لینک اهدا به زودی.",
    purposes: [
      { title: "ایجاد کورس‌های جدید", description: "توسعه کورس‌های جدید در ریاضیات، علم داده، هوش مصنوعی و سایر موضوعات عملی را پشتیبانی کنید." },
      { title: "نگهداری پلتفرم", description: "زیرساخت، میزبانی و سیستم‌های تخنیکی را برای شاگردان سراسر جهان قابل اعتماد نگه دارید." },
      { title: "گسترش دسترسی شاگردان", description: "به شاگردان بیشتر افغان در داخل کشور و بیرون از افغانستان مسیرهای یادگیری ساختاریافته و عملی برسانید." },
      { title: "پشتیبانی از گواهی‌ها", description: "سیستم گواهی و تصدیق را نگه دارید تا شاگردان بتوانند اعتبارنامه‌های معتبر کسب و شریک کنند." }
    ],
    disclosure: "کابل‌لرن توسط KabulHub LLC اداره می‌شود. کمک‌ها از محتوای آموزشی، توسعه پلتفرم و برنامه‌های دسترسی شاگردان پشتیبانی می‌کنند. کمک‌ها داوطلبانه هستند و به عنوان کمک خیریه قابل کسر مالیه محسوب نمی‌شوند.",
    questions: "سؤال دارید؟ با ما تماس بگیرید",
    browseCourses: "مرور کورس‌ها ←"
  },
  educators: {
    ...ps.educators,
    eyebrow: "منابع استادان",
    title: "تدریس در کابل‌لرن",
    description: "دانش عملی خود را با شاگردان افغان به انگلیسی، پشتو و دری از طریق کورس‌های ساختاریافته، آزمون‌های راهنما و مسیرهای گواهی‌دار شریک کنید.",
    goPortal: "رفتن به درگاه استاد",
    requestAccess: "درخواست دسترسی استاد",
    register: "ثبت حساب رایگان",
    resources: "ابزارهای تدریس",
    pipelineTitle: "مسیر چهار مرحله‌ای پیوستن",
    beforeTitle: "پیش از درخواست دسترسی",
    steps: [
      { title: "۱. ثبت‌نام", paragraphs: ["با نام واقعی و ایمیل قابل دسترس، حساب رایگان کابل‌لرن بسازید."] },
      { title: "۲. درخواست دسترسی", paragraphs: ["توضیح دهید چه چیزی می‌خواهید تدریس کنید. مدیر حساب موجود شما را ارتقا می‌دهد."] },
      { title: "۳. ساخت", paragraphs: ["بخش‌ها، درس‌ها، خواندنی‌ها، ویدیوها، آزمون‌ها و مراحل لازم برای گواهی را بسازید."] },
      { title: "۴. نشر", paragraphs: ["کورس را برای بررسی بفرستید، اصلاحات خواسته‌شده را انجام دهید و پس از تأیید نشر کنید."] }
    ],
    before: ["توضیح کوتاهی از کورس آماده کنید.", "زبان‌هایی را که پشتیبانی می‌کنید مشخص کنید: انگلیسی، پشتو، دری یا ترکیب آن‌ها.", "مطمئن شوید حق استفاده از همه مواد را دارید.", "آزمون‌ها یا مراحل سنجش فهم را برنامه‌ریزی کنید.", "پیش از بارگذاری ویدیو، متن خواندنی، مجموعه‌داده یا اسلاید، رهنمودها را مرور کنید."]
  },
  educatorResources: {
    ...ps.educatorResources,
    eyebrow: "منابع استادان",
    title: "منابع استادان",
    description: "رهنمود عملی برای ساخت، ضبط، ترجمه و ارسال کورس‌های کابل‌لرن.",
    instructionsEyebrow: "رهنمود سازنده",
    workflowTitle: "جریان چهار مرحله‌ای نشر",
    checklistTitle: "فهرست آمادگی کورس",
    guidelinesTitle: "رهنمودهای استاد",
    guidelinesDescription: "معیارهای ساختار درس، محتوای سه‌زبانه، آزمون‌ها، کیفیت رسانه، حق مؤلف و آمادگی ارسال را بررسی کنید.",
    openGuidelines: "باز کردن رهنمودها",
    becomeEducatorLink: "در کابل‌لرن تدریس کنید",
    videoTitle: "ویدیوی آغاز استاد",
    videoDescription: "ویدیوی کوتاهی اضافه کنید که نشان دهد استادان تأییدشده چگونه پیش‌نویس می‌سازند، درس اضافه می‌کنند و برای بررسی می‌فرستند.",
    steps: [
      { title: "۱. ثبت‌نام", paragraphs: ["با نام واقعی و ایمیل قابل دسترس حساب رایگان بسازید."] },
      { title: "۲. درخواست دسترسی", paragraphs: ["توضیح دهید چه چیزی می‌خواهید تدریس کنید. مدیر حساب شما را ارتقا می‌دهد."] },
      { title: "۳. بسازید", paragraphs: ["بخش‌ها، درس‌ها، خواندنی‌ها، ویدیوها، آزمون‌ها و مراحل گواهی را بسازید."] },
      { title: "۴. نشر کنید", paragraphs: ["کورس را برای بررسی بفرستید، اصلاحات را انجام دهید و پس از تأیید نشر کنید."] }
    ],
    checklist: ["توضیح کوتاه کورس را آماده کنید.", "زبان‌های پشتیبانی را مشخص کنید.", "اجازه استفاده از مواد را تأیید کنید.", "آزمون‌های سنجش فهم را برنامه‌ریزی کنید.", "پیش از بارگذاری، رهنمودها را بخوانید."]
  },
  educatorGuidelines: {
    eyebrow: "منابع استادان",
    title: "رهنمودهای استاد",
    description: "از این رهنمودها برای آماده‌سازی ویدیوها، خواندنی‌ها، آزمون‌ها، ترجمه‌ها، و بارگذاری‌های کورس استفاده کنید که با معیارهای کیفیت و اعتماد کابل‌لرن مطابقت دارند.",
    goPortal: "به پورتال استادان بروید",
    teach: "در کابل‌لرن تدریس کنید",
    walkthroughTitle: "راهنمایی استاد",
    videoTitle: "جای ویدیوی رهنمودهای استاد",
    videoDescription: "یک ویدیوی آموزشی برای ثبت درس‌ها، قالب‌بندی محتوای سه‌زبانه، بارگذاری مواد، و ارسال برای بررسی اضافه کنید.",
    structureTitle: "ساختار کورس",
    structureItems: [
      "با هدف‌های روشن شاگرد و پیش‌نیازها شروع کنید.",
      "کورس‌ها را به بخش‌هایی با درس‌های متمرکز تنظیم کنید.",
      "هر درس را به یک مفهوم، مهارت، یا نقطه عطف کاربردی مرتبط نگه دارید.",
      "برای شاگردانی که اینترنت محدود دارند، متن خواندنی یا خلاصه هم اضافه کنید.",
      "از آزمون‌ها برای سنجش فهم پیش از پیشرفت شاگردان استفاده کنید."
    ],
    recordingTitle: "معیارهای ضبط",
    recordingItems: [
      "در محیطی آرام با صدای واضح ضبط کنید.",
      "از اسلایدهای خوانا، فونت‌های بزرگ، و تصاویر با کنتراست بالا استفاده کنید.",
      "از موسیقی، تصاویر، مجموعه داده‌ها، یا کلیپ‌های دارای حق چاپ بدون مجوز خودداری کنید.",
      "واژگان فنی را آهسته توضیح دهید و اصطلاحات کلیدی را تعریف کنید.",
      "ویدیوها را مختصر نگه دارید و با هدف درس همسو کنید."
    ],
    trilingualTitle: "قالب‌بندی سه‌زبانه",
    trilingualItems: [
      "در صورت امکان عنوان‌ها یا خلاصه‌های انگلیسی، پشتو، و دری ارائه دهید.",
      "در نسخه‌های زبانی از اصطلاحات یکسان استفاده کنید.",
      "بدون بررسی استاد به ترجمه ماشینی تکیه نکنید.",
      "مثال‌ها را از نظر فرهنگی محترمانه و برای شاگردان افغان در سراسر جهان قابل دسترس نگه دارید.",
      "هر ترجمه ناقص را قبل از ارسال برای بررسی به وضوح مشخص کنید."
    ],
    quizTitle: "قوانین آزمون و اعتبارسنجی",
    quizItems: [
      "سؤال‌ها باید هدف درس را بسنجند، نه معلومات بی‌ربط.",
      "گزینه‌های پاسخ واضح بنویسید و از الفاظ گمراه‌کننده خودداری کنید.",
      "تمرین‌های عملی شامل کنید که شاگردان در آن تفسیر، محاسبه، ساخت یا توضیح بدهند.",
      "معلومات خصوصی شاگردان، مجموعه‌داده‌های محرمانه یا دستورهای ناامن وارد نکنید.",
      "قبل از ارسال کورس برای انتشار، نمره‌دهی آزمون را بررسی کنید."
    ],
    ownershipTitle: "مالکیت محتوا، حریم خصوصی، و ایمنی",
    ownershipParagraphs: [
      "استادان باید فقط موادی را بارگذاری کنند که مالک آن هستند، خودشان ساخته‌اند، جواز دارند یا اجازه کتبی برای استفاده از آن دارند. معلومات خصوصی شاگردان، منابع دارای حق مؤلف بدون اجازه، مواد محرمانه کارفرما یا محتوایی را که می‌تواند به شاگردان آسیب برساند بارگذاری نکنید.",
      "کابل‌لرن می‌تواند تجدیدنظر درخواست کند، دسترسی را محدود کند، محتوا را از انتشار خارج کند، یا موادی را که نگرانی‌های قانونی، حریم خصوصی، ایمنی، کیفیت، یا اعتماد ایجاد می‌کنند حذف کند."
    ],
    checklistTitle: "چک‌لیست بارگذاری و بررسی",
    checklistItems: [
      "عنوان، خلاصه، سطح، و دسته‌بندی کورس کامل است.",
      "بخش‌ها و درس‌ها به صورت منطقی مرتب شده‌اند.",
      "هر درس یک ویدیو، خواندنی، یا فعالیت یادگیری واضح دارد.",
      "آزمون‌های مورد نیاز کامل و با درس‌ها همسو هستند.",
      "فیلدهای سه‌زبانه در جاهایی که وعده داده شده کامل هستند.",
      "همه محتوای بارگذاری‌شده مالک، دارای مجوز، یا دارای اجازه است.",
      "کورس قبل از انتشار برای بررسی ارسال شده است."
    ]
  },
  terms: {
    ...ps.terms,
    eyebrow: "قانونی و اعتماد",
    title: "شرایط خدمات",
    description: "این شرایط قواعد استفاده از کابل‌لرن را توضیح می‌دهد، از جمله حساب‌ها، ابزار استادان، آزمون‌ها، محتوای کورس و تصدیق گواهی.",
    privacy: "خط‌مشی رازداری",
    contact: "تماس با پشتیبانی",
    sections: [
      { title: "۱. پذیرش این شرایط", paragraphs: ["با دسترسی به کابل‌لرن، ساخت حساب، ثبت‌نام در کورس، ارسال محتوای استادی، تکمیل آزمون‌ها یا استفاده از تصدیق گواهی، شما با این شرایط خدمات و پالیسی‌های مرتبط موافقت می‌کنید.", "کابل‌لرن توسط KabulHub LLC اداره می‌شود. ممکن است این شرایط با رشد پلتفرم، تغییر قوانین یا تغییر نیازهای عملیاتی به‌روزرسانی شود."] },
      { title: "۲. حساب‌ها و واجد شرایط بودن", paragraphs: ["شما مسئول معلومات ورود و همه فعالیت‌هایی هستید که از حساب شما انجام می‌شود. باید معلومات درست بدهید و از جعل هویت، سوءاستفاده از حساب یا دسترسی غیرمجاز خودداری کنید.", "حساب‌های استاد ممکن است پیش از دریافت صلاحیت نشر، به تأیید مدیر، بررسی هویت، نمونه محتوا یا بررسی‌های اعتماد و کیفیت نیاز داشته باشند."] },
      { title: "۳. محتوای آموزشی و سنجش", paragraphs: ["کابل‌لرن محتوای آموزشی، متن‌های خواندنی، ویدیوها، آزمون‌ها، مراحل کورس و روندهای یادگیری فراهم می‌کند. کورس‌ها ضمانت کار، پذیرش تحصیلی، جواز، درآمد یا اعتباردهی از سوی طرف سوم نیستند.", "آزمون‌ها و قابلیت‌های سنجش ممکن است شامل نمره قبولی، درس‌های قفل‌شده، پیگیری پیشرفت و نیازمندی‌های تکمیل کورس باشند."] },
      { title: "۴. گواهی‌ها و تصدیق", paragraphs: ["شاگردان واجد شرایط پس از تکمیل فعالیت‌های لازم می‌توانند گواهی دریافت کنند. گواهی ممکن است شامل نام شاگرد، معلومات کورس، نمره، تاریخ صدور، QR، شناسه و کد تصدیق باشد.", "تصدیق فقط نشان می‌دهد که رکورد گواهی وجود دارد و باطل نشده است. این به معنای اعتباردهی دولتی یا قبول حتمی از سوی طرف سوم نیست."] },
      { title: "۵. محتوای استاد", paragraphs: ["استادان مسئول دقت، قانونمندی، کیفیت، اصالت و ایمنی موادی هستند که بارگذاری می‌کنند. استاد باید مالک محتوا باشد یا اجازه استفاده از آن را داشته باشد.", "کابل‌لرن می‌تواند محتوای استاد را بررسی کند، اصلاح بخواهد، رد کند، از نشر بردارد یا در صورت نگرانی‌های کیفیت، ایمنی، رازداری، حق مؤلف یا قانون حذف کند."] },
      { title: "۶. رفتار کاربر", paragraphs: ["کاربران نباید تقلب کنند، گواهی جعل کنند، برای دسترسی غیرمجاز تلاش کنند، دیگران را آزار دهند، محتوای زیان‌آور بارگذاری کنند، بخش‌های محافظت‌شده را استخراج کنند یا امنیت پلتفرم را مختل سازند.", "ما می‌توانیم فعالیت مشکوک را بررسی کنیم و برای حفاظت از شاگردان، استادان، گواهی‌ها و اعتبار پلتفرم، دسترسی را محدود کنیم."] },
      { title: "۷. مالکیت فکری", paragraphs: ["کابل‌لرن و KabulHub LLC حقوق مربوط به طراحی پلتفرم، نرم‌افزار، نام تجاری و مواد اصلی خود را نگه می‌دارند. استادان حقوق موادی را که مالک آن هستند نگه می‌دارند، اما به کابل‌لرن اجازه می‌دهند محتوای ارسال‌شده را میزبانی و نمایش دهد.", "کاربران نمی‌توانند محتوای پلتفرم را بدون اجازه کاپی، بازنشر، فروش یا سوءاستفاده کنند؛ مگر در مواردی که به‌صورت روشن اجازه داده شده باشد."] },
      { title: "۸. پرداخت‌ها و پرداختی‌ها", paragraphs: ["اگر کورس‌های پولی، پرداخت به استادان، حمایت مالی، کمک‌هزینه یا تراکنش‌ها اضافه شود، ممکن است شرایط اضافی درباره پرداخت، بازپرداخت، مالیه، هویت و رعایت قانون اعمال شود.", "ارائه‌دهندگان پرداخت طرف سوم ممکن است معلومات پرداخت یا پرداختی را بر اساس شرایط و پالیسی رازداری خود پردازش کنند."] },
      { title: "۹. رازداری و استفاده از معلومات", paragraphs: ["خط‌مشی رازداری ما توضیح می‌دهد که معلومات مربوط به حساب‌ها، پیشرفت، آزمون‌ها، روند استادان، گواهی‌ها، درخواست‌های پشتیبانی و لاگ‌های تخنیکی چگونه جمع‌آوری، استفاده، نگهداری، محافظت و شریک می‌شود.", "با استفاده از کابل‌لرن می‌پذیرید که کارکرد پلتفرم به پردازش رکوردهای یادگیری، معلومات حساب و معلومات تصدیق وابسته است."] },
      { title: "۱۰. خدمات طرف سوم", paragraphs: ["کابل‌لرن ممکن است برای میزبانی، ورود، ایمیل، ویدیو، ذخیره فایل، تحلیل و امنیت از خدمات طرف سوم استفاده کند. ما مسئول قطعی، شرایط یا پالیسی‌های آن خدمات نیستیم."] },
      { title: "۱۱. تعلیق و پایان", paragraphs: ["اگر کاربری این شرایط را نقض کند یا خطر قانونی، امنیتی، ایمنی یا عملیاتی ایجاد کند، ممکن است دسترسی را تعلیق یا پایان دهیم، محتوا را حذف کنیم، گواهی‌ها را محدود کنیم یا صلاحیت استادی را غیرفعال سازیم.", "درخواست حذف حساب را می‌توانید از طریق پشتیبانی بفرستید؛ اما نگهداری برخی معلومات برای امنیت، رعایت قانون، جلوگیری از تقلب، اعتبار گواهی و سوابق کاری ممکن است لازم باشد."] },
      { title: "۱۲. سلب مسئولیت و محدودیت مسئولیت", paragraphs: ["کابل‌لرن به همان شکلی که موجود است و در دسترس است ارائه می‌شود. ما دسترسی بدون وقفه، محتوای بدون خطا، سازگاری با هر دستگاه یا موجود ماندن دایمی هر کورس را تضمین نمی‌کنیم.", "تا جایی که قانون اجازه می‌دهد، کابل‌لرن و KabulHub LLC مسئول خسارت‌های غیرمستقیم، اتفاقی، ویژه، تبعی، تنبیهی یا از دست رفتن سود نیستند."] },
      { title: "۱۳. قانون حاکم و اختلافات", paragraphs: ["این شرایط بر اساس قوانین ایالت ایلینوی، ایالات متحده، اداره می‌شود، مگر این‌که قانون دیگری به‌طور الزامی قابل اجرا باشد. پیش از ثبت ادعای رسمی، موافقت می‌کنید با پشتیبانی تماس بگیرید تا برای حل غیررسمی موضوع تلاش کنیم."] },
      { title: "۱۴. تماس", paragraphs: ["برای پرسش درباره این شرایط، دسترسی حساب، گواهی‌ها، محتوای استاد یا نگرانی‌های پالیسی، با info@kabulhub.com تماس بگیرید."] }
    ]
  },
  privacy: {
    ...ps.privacy,
    eyebrow: "قانونی و اعتماد",
    title: "خط‌مشی رازداری",
    description: "این خط‌مشی توضیح می‌دهد کابل‌لرن چه معلوماتی جمع می‌کند، چرا از آن استفاده می‌کند، چگونه آن را شریک می‌سازد، چه مدت نگه می‌دارد و کاربران چه انتخاب‌هایی دارند.",
    terms: "شرایط خدمات",
    help: "درخواست کمک",
    sections: [
      { title: "۱. کابل‌لرن را چه کسی اداره می‌کند", paragraphs: ["کابل‌لرن یک پلتفرم آموزشی است که توسط KabulHub LLC اداره می‌شود. هر جا از کابل‌لرن، ما یا ماها یاد می‌شود، منظور همین پلتفرم و تیم اداره‌کننده آن است.", "پرسش‌های رازداری، درخواست‌های حساب، گزارش‌های امنیتی و درخواست‌های مربوط به حقوق معلومات را به info@kabulhub.com بفرستید."] },
      { title: "۲. چه معلوماتی جمع می‌کنیم", paragraphs: ["معلومات حساب شامل نام، ایمیل، رکوردهای احراز هویت رمز عبور، معلومات پروفایل OAuth، زبان ترجیحی، نقش، وضعیت و تنظیمات پروفایل است.", "معلومات یادگیری شامل ثبت‌نام‌ها، پیشرفت کورس، تکمیل درس، پاسخ‌های آزمون، تلاش‌ها، نمره‌ها، زمان‌ها، گواهی‌ها و فعالیت یادگیری است.", "معلومات استاد شامل پروفایل‌ها، پیش‌نویس کورس‌ها، مواد درس، تاریخچه بررسی، فایل‌های بارگذاری‌شده، وضعیت نشر، تحلیل‌ها و پیام‌های مربوط به تأیید است.", "معلومات تخنیکی شامل آدرس IP، معلومات دستگاه/مرورگر، لاگ‌ها، رویدادهای امنیتی، کوکی‌ها یا شناسه‌های ذخیره محلی، گزارش خطا و معلومات استفاده است."] },
      { title: "۳. معلومات را چگونه استفاده می‌کنیم", paragraphs: ["ما از معلومات برای ساخت و محافظت حساب‌ها، شناسایی کاربران، شخصی‌سازی زبان، ارائه کورس‌ها، پیگیری پیشرفت، اجرای آزمون‌ها، صدور گواهی، تصدیق اعتبارنامه‌ها، پشتیبانی استادان، بررسی محتوا و پاسخ به درخواست‌های پشتیبانی استفاده می‌کنیم.", "همچنان از معلومات برای جلوگیری از تقلب، جعل گواهی، سپم، سوءاستفاده، دسترسی غیرمجاز و سوءاستفاده از ابزارهای استاد استفاده می‌کنیم."] },
      { title: "۴. معلومات چگونه شریک می‌شود", paragraphs: ["ما معلومات شخصی را نمی‌فروشیم. ممکن است معلومات را با خدمت‌دهندگانی شریک کنیم که در میزبانی پلتفرم، ذخیره معلومات، ارسال ایمیل، احراز هویت، پرداخت، رساندن فایل‌ها، نظارت امنیتی و تحلیل قابل اعتماد بودن کمک می‌کنند.", "استادان ممکن است برای کورس‌هایی که تدریس می‌کنند، معلومات محدود پیشرفت و فعالیت شاگردان را در حد نیاز برای تدریس، پشتیبانی، ارزیابی و بهبود دریافت کنند.", "تصدیق گواهی ممکن است به کسی که شناسه گواهی، کد تصدیق یا لینک QR معتبر ارائه می‌کند، معلومات محدود گواهی را نشان دهد."] },
      { title: "۵. کوکی‌ها و فناوری مشابه", paragraphs: ["کابل‌لرن ممکن است از کوکی‌ها، ذخیره محلی، توکن نشست و فناوری‌های مشابه برای نگه داشتن ورود کاربر، حفظ ترجیح زبان، حفاظت حساب، اندازه‌گیری استفاده و حفظ امنیت استفاده کند."] },
      { title: "۶. نگهداری معلومات", paragraphs: ["ما معلومات را تا زمانی نگه می‌داریم که برای ارائه پلتفرم، نگهداری سوابق، حفظ پیشرفت، تصدیق گواهی، پشتیبانی استادان، رعایت قانون، حل اختلاف، جلوگیری از تقلب و حفاظت امنیت لازم باشد.", "رکوردهای گواهی ممکن است برای حفظ اعتبار تصدیق، مدت طولانی‌تری نگه‌داری شوند."] },
      { title: "۷. امنیت", paragraphs: ["ما از تدابیر اداری، تخنیکی و سازمانی برای حفاظت حساب‌ها، رکوردهای یادگیری، گواهی‌ها و سیستم‌ها استفاده می‌کنیم. هیچ خدمت آنلاین صد درصد مصون نیست."] },
      { title: "۸. انتخاب‌ها و حقوق شما", paragraphs: ["شما می‌توانید با تماس با پشتیبانی درخواست دسترسی، اصلاح، حذف یا صدور معلومات شخصی خود را بفرستید. پیش از اقدام، ممکن است نیاز باشد هویت شما را تأیید کنیم.", "برخی درخواست‌ها ممکن است به دلیل اعتبار گواهی، جلوگیری از تقلب، مکلفیت‌های قانونی، امنیت، سوابق استاد یا نیازهای عملیاتی محدود شوند."] },
      { title: "۹. کاربران بین‌المللی", paragraphs: ["کابل‌لرن برای شاگردان افغان در سراسر جهان طراحی شده است و ممکن است معلومات را در ایالات متحده و جاهای دیگری که خدمت‌دهندگان فعالیت می‌کنند پردازش کند."] },
      { title: "۱۰. کودکان و شاگردان", paragraphs: ["کابل‌لرن قصد ندارد بدون رضایت لازم، معلومات شخصی کودکان را جمع‌آوری کند. والدین، سرپرستان، مکاتب یا نهادها می‌توانند برای بررسی با پشتیبانی تماس بگیرند."] },
      { title: "۱۱. تغییرات این خط‌مشی", paragraphs: ["ممکن است این خط‌مشی رازداری را با رشد کابل‌لرن، اضافه شدن قابلیت‌ها، تغییر خدمت‌دهندگان یا نیازهای قانونی به‌روزرسانی کنیم. نسخه‌های تازه در همین صفحه نشر می‌شود."] }
    ]
  },
  about: {
    eyebrow: "درباره کابل‌لرن",
    title: "آموزش برای افغان‌ها، هر کجا که باشند",
    description: "کابل‌لرن یک پلتفرم آموزش آنلاین با کورس‌های منظم به زبان‌های انگلیسی، پشتو و دری است.",
    missionTitle: "ما چه هستیم",
    missionParagraphs: [
      "ما کورس‌های آنلاین برای شاگردان افغان می‌سازیم که به آموزش قابل اعتماد دسترسی ندارند، یا در جاهایی درس می‌خوانند که کیفیت آموزش ضعیف است. این شامل افرادی می‌شود که در مناطق با مکاتب محدود زندگی می‌کنند، افغان‌هایی که به خارج رفته‌اند، و دختران و زنانی که از سال ۲۰۲۱ از مکتب متوسطه و دانشگاه محروم شده‌اند.",
      "ساختن حساب رایگان است. تنها به یک دستگاه و اتصال به اینترنت نیاز دارید. همین."
    ],
    offersTitle: "کابل‌لرن چه ارائه می‌دهد",
    offers: [
      { title: "حساب رایگان", description: "پیوستن به کابل‌لرن رایگان است. برخی کورس‌ها رایگان‌اند، قیمت دیگران توسط استادان تعیین می‌شود." },
      { title: "سه زبان", description: "کورس‌ها به زبان‌های انگلیسی، پشتو و دری موجود هستند." },
      { title: "گواهی", description: "کورس را تکمیل کنید و گواهی‌ای دریافت کنید که آنلاین قابل تصدیق است." }
    ],
    orgTitle: "چه کسی کابل‌لرن را اداره می‌کند",
    orgText: "کابل‌لرن توسط KabulHub LLC، مستقر در شیکاگو، ایلینوی اداره می‌شود. با ما از طریق info@kabulhub.com تماس بگیرید.",
    startLearning: "شروع یادگیری",
    teach: "تدریس در کابل‌لرن"
  }
};

export function getPublicInfoContent(locale: Locale): PublicInfoContent {
  const body = locale === "ps" ? ps : locale === "fa" ? fa : en;
  return { ...body, footer: footer(locale) };
}
