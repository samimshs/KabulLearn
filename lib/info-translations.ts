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
    note: string;
    sections: TextSection[];
  };
  privacy: {
    eyebrow: string;
    title: string;
    description: string;
    terms: string;
    help: string;
    note: string;
    sections: TextSection[];
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
    legal: "Legal & Trust",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    contact: "Contact",
    supportDonate: "Support KabulLearn"
  },
  ps: {
    learner: "د زده کوونکو لارښود",
    catalog: "د کورسونو کتلاګ",
    allCourses: "ټول کورسونه",
    cert: "د سند تصدیق",
    support: "د زده کوونکي ملاتړ",
    learning: "زما زده کړه",
    educator: "د ښوونکو سرچینې",
    teach: "په کابل لرن کې تدریس",
    portal: "د ښوونکي پورټل",
    resources: "سرچینې",
    legal: "قانوني او باور",
    terms: "د خدمت شرایط",
    privacy: "د محرمیت تګلاره",
    contact: "اړیکه",
    supportDonate: "د کابل‌لرن ملاتړ"
  },
  fa: {
    learner: "راهنمای فراگیر",
    catalog: "فهرست دوره‌ها",
    allCourses: "همه دوره‌ها",
    cert: "تصدیق گواهی",
    support: "پشتیبانی فراگیر",
    learning: "یادگیری من",
    educator: "منابع استادان",
    teach: "تدریس در کابل‌لرن",
    portal: "درگاه استاد",
    resources: "منابع",
    legal: "قانونی و اعتماد",
    terms: "شرایط خدمات",
    privacy: "خط مشی رازداری",
    contact: "تماس",
    supportDonate: "حمایت از کابل‌لرن"
  }
} as const;

function footer(locale: Locale): PublicInfoContent["footer"] {
  const f = commonFooterLinks[locale];
  return {
    tagline:
      locale === "ps"
        ? "درې ژبې زده کړه، لارښود تمرین، او د افغان زده کوونکو لپاره د تصدیق وړ سندونه."
        : locale === "fa"
          ? "یادگیری سه‌زبانه، تمرین راهنما، و گواهی‌های قابل تصدیق برای فراگیران افغان."
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
        title: f.legal,
        links: [
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
    note: "These pages are drafted as operational policy templates for KabulLearn. They should be reviewed by a qualified attorney before you rely on them as final legal terms.",
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
    note: "These pages are drafted as operational policy templates for KabulLearn. They should be reviewed by a qualified attorney before you rely on them as final legal terms.",
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
  }
};

const ps: Omit<PublicInfoContent, "footer"> = {
  catalog: {
    eyebrow: "د زده کوونکو لارښود",
    title: "د کورسونو کتلاګ",
    description: "د کابل‌لرن کورسونه د موضوع له مخې وپلټئ، بیا د بشپړ کورس بازار ته لاړ شئ، نوم لیکنه وکړئ، زده کړه وکړئ، ازموینې بشپړې کړئ، او وړ سندونه ترلاسه کړئ.",
    openAll: "ټول کورسونه پرانیزئ",
    learnerSupport: "د زده کوونکي ملاتړ",
    categoriesTitle: "اصلي برخې",
    walkthroughTitle: "د کتلاګ لارښود",
    videoTitle: "د زده کوونکي د کتلاګ ویډیو ځای",
    videoDescription: "دلته لنډه ویډیو اضافه کړئ چې د برخو لټون، په کورس کې نوم لیکنه، او زده کړې دوام تشریح کړي.",
    categories: [
      { title: "ریاضیات", description: "د کمي فکر، مسئلو حل، او تخنیکي زده کړې بنسټونه.", href: "/courses?category=Mathematics", cta: "ریاضیات وپلټئ" },
      { title: "احصایه", description: "احتمال، بدلون، استنباط، او عملي احصایوي فکر.", href: "/courses?category=Statistics", cta: "احصایه وپلټئ" },
      { title: "ډیټا ساینس", description: "د معلوماتو تحلیل، ماډل جوړول، عملي پروژې، او د پرېکړو تشریح.", href: "/courses?category=Data%20Science", cta: "ډیټا ساینس وپلټئ" },
      { title: "ماشین زده کړه او مصنوعي ځیرکتیا", description: "عملي ماشین زده کړه، د مصنوعي ځیرکتیا وسایل، مسؤل کارول، او هوښیار سیستمونه.", href: "/courses?category=Machine%20Learning", cta: "د مصنوعي ځیرکتیا کورسونه وپلټئ" },
      { title: "د کمپیوټر بنسټونه", description: "ډیجیټل سواد، د براوزر لومړی کارونه، او عملي ټکنالوژي.", href: "/courses?category=Computer%20Basics", cta: "بنسټونه وپلټئ" },
      { title: "سافټویر او ویب جوړونه", description: "د ویب پاڼو ژبې او وسایل، عملي ویب کارونه، او د سافټویر جوړونې بنسټونه.", href: "/courses?category=Software", cta: "سافټویر وپلټئ" }
    ]
  },
  certificate: {
    eyebrow: "قانوني او باور",
    title: "د سند تصدیق",
    description: "کار ورکوونکي، ادارې، او درېیم اړخونه کولای شي وګوري چې د کابل‌لرن سند زموږ له سیستم څخه صادر شوی او لا هم معتبر دی.",
    exploreCourses: "کورسونه وپلټئ",
    reportIssue: "ستونزه راپور کړئ",
    verifyTitle: "سند تایید کړئ",
    verifyDescription: "د سند پېژند، د تایید کوډ، یا د چټک-کوډ لینک دننه کړئ. پایله یوازې هغه محدود معلومات ښيي چې د اصالت لپاره اړین دي.",
    lookupLabel: "د سند پېژند یا د تایید لینک",
    lookupPlaceholder: "د سند پېژند، د تایید کوډ، یا د چټک-کوډ پته دننه کړئ",
    lookupError: "د سند پېژند، د تایید کوډ، یا د چټک-کوډ تایید لینک دننه کړئ.",
    lookupButton: "سند تایید کړئ",
    meaningTitle: "تصدیق څه معنی لري",
    meaningParagraphs: ["تصدیق دا ښيي چې د سند ریکارډ په کابل‌لرن کې شته او باطل شوی نه دی. دا د کار، جواز، داخلې، یا درېیم اړخ منلو ضمانت نه کوي.", "که سند غلط یا مشکوک ښکاري، د سند کوډ او سکرین‌شاټ سره ملاتړ ته پیغام واستوئ."],
    walkthroughTitle: "د تصدیق لارښود",
    videoTitle: "د سند تصدیق ویډیو ځای",
    videoDescription: "د کار ورکوونکو او زده کوونکو لپاره لنډه ویډیو اضافه کړئ چې چټک-کوډ، د سند پېژند، او پایلې تشریح کړي."
  },
  support: {
    eyebrow: "د زده کوونکو لارښود",
    title: "د زده کوونکي ملاتړ",
    description: "د کورس لاسرسي، ویډیو درسونو، تعاملي ازموینو، حساب، او تصدیق وړ سندونو لپاره مرسته ترلاسه کړئ.",
    goCourses: "کورسونو ته لاړ شئ",
    contactSupport: "ملاتړ سره اړیکه",
    walkthroughTitle: "د زده کوونکي لارښود",
    videoTitle: "د زده کوونکي لارښود ویډیو ځای",
    videoDescription: "د ثبت، نوم لیکنې، درس کتلو، ازموینو بشپړولو، او سند ښکته کولو لپاره ویډیو اضافه کړئ.",
    faqTitle: "ډېرې پوښتل شوې پوښتنې",
    faqs: [
      { question: "درس ته لاسرسی نه لرم. څه وګورم؟", answer: "ډاډ ترلاسه کړئ چې ننوتي یاست، په کورس کې نوم لیکنه لرئ، او اړینه ازموینه یا مخکینۍ تړلې برخه مو بشپړه کړې ده. که ستونزه پاتې وي، د کورس نوم، درس نوم، براوزر، او سکرین‌شاټ ملاتړ ته واستوئ." },
      { question: "ویډیو نه پورته کېږي.", answer: "پاڼه تازه کړئ، انټرنېټ وګورئ، بل براوزر وکاروئ، او وګورئ چې ویډیو خدمتونه ستاسو په شبکه کې بند نه وي." },
      { question: "د ازموینې نمره یا ځواب غلط ښکاري.", answer: "که هڅې پاتې وي، ازموینه بیا وکړئ. که د پوښتنې تېروتنه وي، د کورس نوم، ماډیول، پوښتنه، او سکرین‌شاټ واستوئ." },
      { question: "څنګه سند ترلاسه کړم؟", answer: "اړین درسونه، ازموینې، او د کورس مرحلې بشپړې کړئ. وړ سندونه د اړتیاوو له بشپړېدو وروسته د چټک-کوډ یا د سند پېژند له لارې تاییدېدای شي." },
      { question: "ایا په انګلیسي، پښتو او دري زده کړه کولی شم؟", answer: "کابل‌لرن د درې ژبو زده کړې لپاره جوړ شوی. د کورس ژبې د ښوونکي او کورس له مخې توپیر کولی شي." }
    ]
  },
  contact: {
    eyebrow: "اړیکه / ملاتړ",
    title: "له ملاتړ څخه پیل کړئ.",
    description: "موږ ته ووایئ څه پېښ شول، کوم حساب یا کورس اغېزمن دی، او تاسو څه تمه لرله. هر څومره معلومات روښانه وي، مرسته چټکېږي.",
    emailSupport: "ملاتړ ته ایمیل",
    learnerFaq: "د زده کوونکي پوښتنې",
    emailTitle: "د ملاتړ ایمیل",
    emailParagraphs: ["ایمیل: info@kabulhub.com", "خپل نوم، د حساب ایمیل، د کورس نوم، سکرین‌شاټونه، وسیله/براوزر، او د سند یا ازموینې اړوند معلومات شامل کړئ.", "موږ هڅه کوو په ۱-۲ کاري ورځو کې ځواب ووایو. بیړني امنیتي یا محرمیتي راپورونه باید په سرلیک کې «بیړنی» ولري."],
    areasTitle: "موږ په څه کې مرسته کوو",
    areas: ["ننوتل، ثبت، یا ایمیل لاسرسی", "نوم لیکنه، درس لاسرسی، یا ویډیو", "د ازموینې نمرې، تړلې برخې، یا پرمختګ", "سند ښکته کول، چټک-کوډ، یا تصدیق", "د ښوونکي لاسرسی، بیاکتنه، یا خپرول", "محرمیت، ډاټا ړنګول، کاپي‌رایټ، ناوړه کارونه، یا امنیت"],
    ticketTitle: "د ټکټ سیستم ځای",
    ticketText: "یادونه: کله چې د ملاتړ غوښتنې سیستم برابر شي، دلته فورم یا د ملاتړ مرکز اضافه کړئ. تر هغه وخته ملاتړ د ایمیل له لارې کېږي.",
    ticketFormTitle: "د ملاتړ ټکټ وسپارئ",
    ticketFormDescription: "لاندې فورم ډک کړئ، موږ به ۱-۲ کاري ورځو کې ستاسو سره اړیکه ونیسو. د ټکټ شمیرې سره تاییدي ایمیل به سمدلاسه واستول شي."
  },
  donate: {
    eyebrow: "KabulHub LLC",
    title: "د کابل‌لرن ملاتړ",
    description: "موږ سره مرسته وکړئ چې انګلیسي، پښتو، او دري کې عملي زده کړو ته لاسرسی پراخ کړو.",
    longDescription: "کابل‌لرن د افغاني زده کوونکو لپاره جوړ شوي کورسونه، لارښود ازموینې، د ښوونکو ملاتړ، او تصدیق وړ سندونه جوړوي. ستاسو مرسته موږ سره د نوو کورسونو جوړولو، پلیټفارم ښه کولو، او د زده کړې لاسرسي ساتلو کې مرسته کوي.",
    ctaButton: "د سټرایپ له لارې ملاتړ وکړئ",
    ctaComingSoon: "د مرستې لینک ژر راشي.",
    purposes: [
      { title: "نوي کورسونه جوړ کړئ", description: "د ریاضیاتو، ډیټا ساینس، مصنوعي ذکاء، او نورو عملي موضوعاتو کې د نوو کورسونو پراختیا ملاتړ وکړئ." },
      { title: "پلیټفارم وساتئ", description: "د ټول نړۍ زده کوونکو لپاره زیربنا، هوسټینګ، او تخنیکي سیستمونه د اعتماد وړ وساتئ." },
      { title: "د زده کوونکو لاسرسی پراخ کړئ", description: "د جوړو، عملي د زده کړې لارو سره د بهرنیو افغانانو او کور کې زیات افغان زده کوونکو ته ورسیږئ." },
      { title: "سندونه ملاتړ وکړئ", description: "د سند او تصدیق سیستم وساتئ ترڅو زده کوونکي د باور وړ اسناد ترلاسه کړي او شریک یې کړي." }
    ],
    disclosure: "کابل‌لرن د KabulHub LLC له خوا پرمخ وړل کېږي. مرستې د زده کړې منځپانګې، د پلیټفارم پراختیا، او د زده کوونکو د لاسرسي ابتکارونو ملاتړ کوي. مرستې خپلسري دي او د مالیاتو کمولو لپاره صدقه نه ده.",
    questions: "پوښتنې؟ موږ سره اړیکه ونیسئ",
    browseCourses: "کورسونه وپلټئ ←"
  },
  educators: {
    eyebrow: "د ښوونکو سرچینې",
    title: "په کابل‌لرن کې تدریس",
    description: "خپله عملي پوهه د افغان زده کوونکو سره په انګلیسي، پښتو او دري کې د جوړو کورسونو، لارښود ازموینو، او سند لرونکو لارو له لارې شریکه کړئ.",
    goPortal: "د ښوونکي پورټل ته لاړ شئ",
    requestAccess: "د ښوونکي لاسرسی وغواړئ",
    register: "وړیا حساب جوړ کړئ",
    resources: "د تدریس وسایل",
    pipelineTitle: "څلور پړاوه د شاملېدو لاره",
    beforeTitle: "د لاسرسي غوښتنې مخکې",
    steps: [
      { title: "۱. ثبت", paragraphs: ["د خپل اصلي نوم او فعال ایمیل سره وړیا کابل‌لرن حساب جوړ کړئ."] },
      { title: "۲. د لاسرسي غوښتنه", paragraphs: ["تشریح کړئ چې څه تدریس کول غواړئ. اډمین به ستاسو موجود حساب لوړ کړي."] },
      { title: "۳. جوړول", paragraphs: ["ماډیولونه، درسونه، لوستنې، ویډیوګانې، ازموینې، او د سند لپاره مرحلې جوړې کړئ."] },
      { title: "۴. خپرول", paragraphs: ["کورس د بیاکتنې لپاره واستوئ، غوښتل شوې سمونې بشپړې کړئ، او له منظورۍ وروسته خپور کړئ."] }
    ],
    before: ["د تدریس کورس لنډ توضیح چمتو کړئ.", "هغه ژبې ولیکئ چې ملاتړ یې کوئ: انګلیسي، پښتو، دري، یا ګډه بڼه.", "ډاډ ترلاسه کړئ چې د ټولو موادو د کارولو حق لرئ.", "ازموینې یا د پوهې د تایید مرحلې پلان کړئ.", "د ویډیوګانو، لوستنو، د معلوماتو ټولګو، یا سلایډونو له پورته کولو مخکې لارښوونې وګورئ."]
  },
  educatorResources: {
    eyebrow: "د ښوونکو سرچینې",
    title: "د ښوونکو سرچینې",
    description: "د کابل‌لرن کورسونو د جوړولو، ثبتولو، ژباړلو، او سپارلو لپاره عملي لارښود.",
    instructionsEyebrow: "د جوړونکي لارښوونې",
    workflowTitle: "څلور پړاوه د خپرولو بهیر",
    checklistTitle: "د کورس چمتووالي لست",
    guidelinesTitle: "د ښوونکي لارښوونې",
    guidelinesDescription: "د درس جوړښت، درې ژبې منځپانګې، ازموینو، رسنۍ کیفیت، کاپي‌رایټ، او سپارلو معیارونه وګورئ.",
    openGuidelines: "لارښوونې پرانیزئ",
    becomeEducatorLink: "پر کابل‌لرن تدریس وکړئ",
    videoTitle: "د ښوونکي د پیل ویډیو",
    videoDescription: "لنډه ویډیو اضافه کړئ چې ښوونکي څنګه مسودې جوړوي، درسونه زیاتوي، او بیاکتنې ته یې سپاري.",
    steps: [
      { title: "۱. ثبت", paragraphs: ["د خپل اصلي نوم او فعال ایمیل سره وړیا حساب جوړ کړئ."] },
      { title: "۲. لاسرسی وغواړئ", paragraphs: ["تشریح کړئ چې څه تدریس کول غواړئ. اډمین ستاسو حساب لوړوي."] },
      { title: "۳. جوړ کړئ", paragraphs: ["ماډیولونه، درسونه، لوستنې، ویډیوګانې، ازموینې او د سند مرحلې جوړې کړئ."] },
      { title: "۴. خپور کړئ", paragraphs: ["کورس بیاکتنې ته واستوئ، سمونې بشپړې کړئ، او له منظورۍ وروسته یې خپور کړئ."] }
    ],
    checklist: ["د کورس لنډ توضیح چمتو کړئ.", "د ملاتړ ژبې ولیکئ.", "د موادو د کارولو اجازه تایید کړئ.", "د پوهې د تایید ازموینې پلان کړئ.", "د پورته کولو مخکې لارښوونې وګورئ."]
  },
  educatorGuidelines: {
    eyebrow: "د ښوونکو سرچینې",
    title: "د ښوونکي لارښوونې",
    description: "دا لارښوونې وکاروئ ترڅو د کورس ویډیوګانې، لوستنې، ازموینې، ژباړې، او پورته کولونه چمتو کړئ چې د کابل‌لرن د کیفیت او باور معیارونو سره سمون خوري.",
    goPortal: "د ښوونکو پورټل ته لاړ شئ",
    teach: "پر کابل‌لرن تدریس وکړئ",
    walkthroughTitle: "د ښوونکي لارښوونې",
    videoTitle: "د ښوونکي لارښوونو ویډیو ځای ساتونکی",
    videoDescription: "د درسونو ثبت، درې ژبيزه منځپانګه، د موادو پورته کول، او د بیاکتنې لپاره سپارلو لپاره روزنیز ویډیو اضافه کړئ.",
    structureTitle: "د کورس جوړښت",
    structureItems: [
      "د زده کونکو روښانه موخو او مخکینو اړتیاو سره پیل وکړئ.",
      "کورسونه د تمرکز شوو درسونو سره ماډیولونو ته وویشئ.",
      "هر درس یوه مفهوم، مهارت، یا کاربردي مرحلې سره تړلی وساتئ.",
      "د محدود ویډیو پلورنې لرونکو زده کونکو لپاره لوستنې یا لنډیزونه اضافه کړئ.",
      "د پوهاوي د تایید لپاره د زده کونکو د پرمختګ مخکې ازموینې وکاروئ."
    ],
    recordingTitle: "د ثبت معیارونه",
    recordingItems: [
      "د روښانه غږ سره یو چوپه چاپیریال کې ثبت وکړئ.",
      "د لوستلو وړ سلایډونه، لوی فونټونه، او لوړ کنتراسته لیدلوری وکاروئ.",
      "د لیسانس پرته د کاپي‌رایت شوي موسیقي، انځورونو، ډیټاسیټونو، یا کلیپونو څخه ډډه وکړئ.",
      "تخنیکي اصطلاحات ورو ورو تشریح کړئ او مهم اصطلاحات تعریف کړئ.",
      "ویډیوګانې لنډې وساتئ او د درس موخو سره همغږي کړئ."
    ],
    trilingualTitle: "درې ژبيزه فارمیټ کول",
    trilingualItems: [
      "کله چې ممکن وي د انګلیسي، پښتو، او دري سرلیکونه یا لنډیزونه وړاندې کړئ.",
      "د ژبو نسخو کې یو شان اصطلاحات وکاروئ.",
      "د ښوونکي له بیاکتنې پرته د ماشینه ژباړې باندې تکیه مه کوئ.",
      "مثالونه د افغاني زده کونکو لپاره فرهنګي او د لاسرسي وړ وساتئ.",
      "د بیاکتنې لپاره د سپارلو مخکې هر ورک شوی ژباړه روښانه کړئ."
    ],
    quizTitle: "د ازموینې او تایید قواعد",
    quizItems: [
      "پوښتنې باید د درس موخه وازموي، نه بې ارزښته معلومات.",
      "د غیر مبهم ځوابونو انتخابونه ولیکئ او د ګمراه کونکو الفاظو څخه ډډه وکړئ.",
      "عملي ازموینې شامل کړئ چیرې چې زده کونکي تفسیر، حساب، جوړول، یا تشریح کوي.",
      "خصوصي د زده کونکو معلومات، محرمانه ډیټاسیټونه، یا خطرناک لارښوونې مه شاملوئ.",
      "د کورس د خپرولو لپاره د سپارلو مخکې د ازموینې سکور بیاکتنه وکړئ."
    ],
    ownershipTitle: "د منځپانګې مالکیت، محرمیت، او خوندیتوب",
    ownershipParagraphs: [
      "ښوونکو ته یوازې هغه موادو ته اجازه ده چې دوی مالک دي، جوړ کړي دي، لیسانس لري، یا لیکلي اجازه لري. خصوصي د زده کونکو معلومات، د اجازې پرته کاپي‌رایټ شوي سرچینې، محرمانه د کارموندونکي موادو، یا هغه منځپانګه چې کولی شي زده کونکو ته زیان ورسوي مه پورته کوئ.",
      "کابل‌لرن کولی شي د قانوني، محرمیت، خوندیتوب، کیفیت، یا د باور اندیښنو لپاره ترمیمونه وغواړي، لاسرسی محدود کړي، منځپانګه غیر خپره کړي، یا موادو لرې کړي."
    ],
    checklistTitle: "د پورته کولو او بیاکتنې چکلیست",
    checklistItems: [
      "د کورس سرلیک، لنډیز، کچه، او کټګوري بشپړه ده.",
      "ماډیولونه او درسونه منطقي ترتیب لري.",
      "هر درس ویډیو، لوستنه، یا روښانه د زده کړې فعالیت لري.",
      "اړین ازموینې بشپړې او د درسونو سره همغږي دي.",
      "درې ژبيزه برخې چیرې چې وعده شوي بشپړې دي.",
      "ټول پورته شوي منځپانګه مالکیت، لیسانس، یا اجازه لري.",
      "کورس د خپرولو مخکې د بیاکتنې لپاره سپارل شوی."
    ]
  },
  terms: {
    ...en.terms,
    eyebrow: "قانوني او باور",
    title: "د خدمت شرایط",
    description: "دا شرایط د کابل‌لرن د کارولو اصول تشریح کوي، لکه حسابونه، د ښوونکو وسایل، ازموینې، کورس منځپانګه، او د سند تصدیق.",
    privacy: "د محرمیت تګلاره",
    contact: "ملاتړ سره اړیکه",
    note: "دا پاڼې د کابل‌لرن لپاره د عملیاتي پالیسۍ مسودې دي. مخکې له قانوني کارونې باید د وړ وکیل له خوا وکتل شي.",
    sections: en.terms.sections.map((section) => ({
      title: section.title.replace(/Acceptance of these terms/, "د دې شرایطو منل").replace(/Accounts and eligibility/, "حسابونه او وړتیا").replace(/Learning content and validation/, "زده کړه او تایید").replace(/Certificates and verification/, "سندونه او تصدیق").replace(/Educator content/, "د ښوونکي منځپانګه").replace(/User conduct/, "د کاروونکي چلند").replace(/Intellectual property/, "فکري ملکیت").replace(/Payments and payouts/, "تادیات او ورکړې").replace(/Privacy and data use/, "محرمیت او د ډاټا کارول").replace(/Third-party services/, "درېیم اړخ خدمتونه").replace(/Suspension and termination/, "ځنډول او پای").replace(/Disclaimers and limitation of liability/, "مسؤولیت محدودول").replace(/Governing law and disputes/, "حاکم قانون او شخړې").replace(/Contact/, "اړیکه"),
      paragraphs: section.paragraphs?.map(() => "دا برخه د کابل‌لرن د کارولو اړوند اصول، حقونه، مسؤولیتونه، محدودیتونه، او د ملاتړ له لارې د ستونزو د حل لاره تشریح کوي. د حساب، کورس، سند، محرمیت، یا ښوونکي منځپانګې په اړه پوښتنې info@kabulhub.com ته ولېږئ.")
    }))
  },
  privacy: {
    ...en.privacy,
    eyebrow: "قانوني او باور",
    title: "د محرمیت تګلاره",
    description: "دا تګلاره تشریح کوي چې کابل‌لرن کوم معلومات راټولوي، ولې یې کاروي، څنګه یې شریکوي، څومره یې ساتي، او کاروونکي کوم انتخابونه لري.",
    terms: "د خدمت شرایط",
    help: "مرسته وغواړئ",
    note: "دا پاڼې د کابل‌لرن لپاره د عملیاتي پالیسۍ مسودې دي. مخکې له قانوني کارونې باید د وړ وکیل له خوا وکتل شي.",
    sections: en.privacy.sections.map((section) => ({
      title: section.title.replace(/Who operates KabulLearn/, "کابل‌لرن څوک چلوي").replace(/Information we collect/, "کوم معلومات راټولوو").replace(/How we use information/, "معلومات څنګه کاروو").replace(/How information is shared/, "معلومات څنګه شریکېږي").replace(/Cookies and similar technology/, "کوکیز او ورته ټکنالوژي").replace(/Data retention/, "د معلوماتو ساتل").replace(/Security/, "امنیت").replace(/Your choices and rights/, "ستاسو انتخابونه او حقونه").replace(/International users/, "نړیوال کاروونکي").replace(/Children and students/, "ماشومان او زده کوونکي").replace(/Changes to this policy/, "د تګلارې بدلونونه"),
      paragraphs: section.paragraphs?.map(() => "کابل‌لرن د حساب، زده کړې، ازموینو، سندونو، ښوونکو، ملاتړ، امنیت، او تخنیکي کارونو لپاره اړین معلومات کاروي. موږ شخصي معلومات نه پلورو. د لاسرسي، سمون، ړنګولو، یا صادرولو غوښتنې info@kabulhub.com ته ولېږئ.")
    }))
  }
};

const fa: Omit<PublicInfoContent, "footer"> = {
  ...ps,
  catalog: {
    ...ps.catalog,
    eyebrow: "راهنمای فراگیر",
    title: "فهرست دوره‌ها",
    description: "دوره‌های کابل‌لرن را بر اساس دسته‌بندی مرور کنید، سپس وارد بازار کامل دوره‌ها شوید، ثبت‌نام کنید، بیاموزید، آزمون‌ها را تکمیل کنید و گواهی‌های واجد شرایط دریافت کنید.",
    openAll: "همه دوره‌ها را باز کنید",
    learnerSupport: "پشتیبانی فراگیر",
    categoriesTitle: "دسته‌بندی‌های اصلی",
    walkthroughTitle: "راهنمای فهرست",
    videoTitle: "جای ویدیوی راهنمای فهرست",
    videoDescription: "یک ویدیوی کوتاه درباره مرور دسته‌ها، ثبت‌نام در دوره، و ادامه یادگیری اضافه کنید.",
    categories: [
      { title: "ریاضیات", description: "بنیادهای استدلال کمی، حل مسئله، و یادگیری فنی.", href: "/courses?category=Mathematics", cta: "مرور ریاضیات" },
      { title: "احصائیه", description: "احتمال، تغییر، استنباط، و تفکر آماری کاربردی.", href: "/courses?category=Statistics", cta: "مرور احصائیه" },
      { title: "علم داده", description: "تحلیل داده، جریان‌های مدل‌سازی، پروژه‌های کاربردی، و تفسیر تصمیم‌محور.", href: "/courses?category=Data%20Science", cta: "مرور علم داده" },
      { title: "یادگیری ماشین و هوش مصنوعی", description: "یادگیری ماشین کاربردی، ابزارهای هوش مصنوعی، استفاده مسئولانه، و سیستم‌های هوشمند.", href: "/courses?category=Machine%20Learning", cta: "مرور دوره‌های هوش مصنوعی" },
      { title: "مبانی کمپیوتر", description: "سواد دیجیتال، کارهای مرورگرمحور، و بنیادهای عملی فناوری.", href: "/courses?category=Computer%20Basics", cta: "مرور مبانی" },
      { title: "نرم‌افزار و توسعه وب", description: "زبان‌ها و ابزارهای ساخت وب، کارهای عملی وب، و بنیادهای ساخت نرم‌افزار.", href: "/courses?category=Software", cta: "مرور نرم‌افزار" }
    ]
  },
  certificate: {
    ...ps.certificate,
    eyebrow: "قانونی و اعتماد",
    title: "تصدیق گواهی",
    description: "کارفرمایان، نهادها، و طرف‌های سوم می‌توانند بررسی کنند که آیا گواهی کابل‌لرن از سیستم ما صادر شده و هنوز معتبر است.",
    exploreCourses: "مرور دوره‌ها",
    reportIssue: "گزارش مشکل",
    verifyTitle: "گواهی را تصدیق کنید",
    verifyDescription: "شناسه گواهی، کد تصدیق، یا لینک کد سریع را وارد کنید. صفحه نتیجه فقط اطلاعات محدود لازم برای تأیید اصالت را نشان می‌دهد.",
    lookupLabel: "شناسه گواهی یا لینک تصدیق",
    lookupPlaceholder: "شناسه گواهی، کد تصدیق، یا نشانی کد سریع را وارد کنید",
    lookupError: "شناسه گواهی، کد تصدیق، یا لینک تصدیق کد سریع را وارد کنید.",
    lookupButton: "تصدیق گواهی",
    meaningTitle: "تصدیق چه معنی دارد",
    meaningParagraphs: ["تصدیق نشان می‌دهد که رکورد گواهی در سیستم کابل‌لرن وجود دارد و باطل نشده است. این ضمانت استخدام، جواز، پذیرش، یا قبول طرف سوم نیست.", "اگر گواهی نادرست یا مشکوک به نظر می‌رسد، با کد گواهی و تصویر صفحه با پشتیبانی تماس بگیرید."],
    walkthroughTitle: "راهنمای تصدیق",
    videoTitle: "جای ویدیوی تصدیق گواهی",
    videoDescription: "برای کارفرمایان و فراگیران ویدیوی کوتاهی درباره کد سریع، شناسه گواهی، و نتایج تصدیق اضافه کنید."
  },
  support: {
    ...ps.support,
    eyebrow: "راهنمای فراگیر",
    title: "پشتیبانی فراگیر",
    description: "برای دسترسی به دوره، ویدیوها، آزمون‌های تعاملی، حساب، و گواهی‌های قابل تصدیق کمک بگیرید.",
    goCourses: "رفتن به دوره‌ها",
    contactSupport: "تماس با پشتیبانی",
    walkthroughTitle: "راهنمای فراگیر",
    videoTitle: "جای ویدیوی راهنمای فراگیر",
    videoDescription: "ویدیویی درباره ثبت‌نام، شامل شدن در دوره، دیدن درس‌ها، تکمیل آزمون‌ها، و دریافت گواهی اضافه کنید.",
    faqTitle: "پرسش‌های متداول",
    faqs: [
      { question: "به درس دوره دسترسی ندارم. چه چیز را بررسی کنم؟", answer: "مطمئن شوید وارد حساب شده‌اید، در دوره ثبت‌نام دارید، و آزمون یا بخش قفل‌شده قبلی را تکمیل کرده‌اید. اگر مشکل ادامه داشت، نام دوره، درس، مرورگر، و تصویر صفحه را به پشتیبانی بفرستید." },
      { question: "ویدیو بارگذاری نمی‌شود.", answer: "صفحه را تازه کنید، اینترنت را بررسی کنید، مرورگر دیگری امتحان کنید، و مطمئن شوید خدمات ویدیویی در شبکه شما مسدود نیست." },
      { question: "پاسخ یا نمره آزمون اشتباه به نظر می‌رسد.", answer: "اگر تلاش باقی مانده است، آزمون را دوباره انجام دهید. اگر خطای پرسش وجود دارد، نام دوره، ماژول، متن پرسش، و تصویر صفحه را بفرستید." },
      { question: "چگونه گواهی بگیرم؟", answer: "درس‌ها، آزمون‌ها، و مراحل لازم دوره را کامل کنید. گواهی‌های واجد شرایط پس از تکمیل نیازمندی‌ها با کد سریع یا شناسه گواهی قابل تصدیق می‌شوند." },
      { question: "آیا می‌توانم به انگلیسی، پشتو و دری یاد بگیرم؟", answer: "کابل‌لرن برای یادگیری سه‌زبانه ساخته شده است. زبان‌های هر دوره ممکن است بر اساس استاد و دوره فرق کند." }
    ]
  },
  contact: {
    ...ps.contact,
    eyebrow: "تماس / پشتیبانی",
    title: "از پشتیبانی شروع کنید.",
    description: "بگویید چه اتفاق افتاد، کدام حساب یا دوره متأثر است، و انتظار شما چه بود. هرچه گزارش دقیق‌تر باشد، سریع‌تر کمک می‌کنیم.",
    emailSupport: "ایمیل به پشتیبانی",
    learnerFaq: "پرسش‌های فراگیر",
    emailTitle: "ایمیل پشتیبانی",
    emailParagraphs: ["ایمیل: info@kabulhub.com", "نام، ایمیل حساب، نام دوره، تصاویر صفحه، دستگاه/مرورگر، و جزئیات گواهی یا آزمون را شامل کنید.", "ما معمولاً در ۱-۲ روز کاری پاسخ می‌دهیم. گزارش‌های فوری امنیتی یا رازداری باید در عنوان «فوری» داشته باشند."],
    areasTitle: "در چه مواردی کمک می‌کنیم",
    areas: ["ورود، ثبت‌نام، یا دسترسی ایمیل", "ثبت‌نام دوره، دسترسی درس، یا پخش ویدیو", "نمره آزمون، بخش‌های قفل‌شده، یا پیشرفت", "دانلود گواهی، کد سریع، یا تصدیق", "دسترسی استاد، بررسی دوره، یا نشر", "رازداری، حذف داده، کاپی‌رایت، سوءاستفاده، یا امنیت"],
    ticketTitle: "جای سیستم تکت",
    ticketText: "یادداشت: وقتی سیستم تکت آماده شد، اینجا فورم یا مرکز پشتیبانی اضافه شود. تا آن زمان درخواست‌ها از طریق ایمیل فرستاده شوند.",
    ticketFormTitle: "ارسال تکت پشتیبانی",
    ticketFormDescription: "فورم زیر را پر کنید، ما در ۱-۲ روز کاری با شما تماس می‌گیریم. ایمیل تأیید با شماره تکت بلافاصله فرستاده می‌شود."
  },
  donate: {
    eyebrow: "KabulHub LLC",
    title: "حمایت از کابل‌لرن",
    description: "به ما کمک کنید دسترسی به آموزش عملی به زبان‌های انگلیسی، پشتو، و دری را گسترش دهیم.",
    longDescription: "کابل‌لرن دوره‌های ساختاریافته، آزمون‌های راهنما، پشتیبانی از استادان، و گواهی‌های قابل تصدیق برای فراگیران افغان در سراسر جهان ایجاد می‌کند. کمک شما به ما در ساخت دوره‌های جدید، بهبود پلتفرم، و دسترس‌پذیر نگه داشتن یادگیری کمک می‌کند.",
    ctaButton: "حمایت با Stripe",
    ctaComingSoon: "لینک اهدا به زودی.",
    purposes: [
      { title: "ایجاد دوره‌های جدید", description: "توسعه دوره‌های جدید در زمینه ریاضیات، علم داده، هوش مصنوعی، و سایر موضوعات عملی را تأمین مالی کنید." },
      { title: "نگهداری پلتفرم", description: "زیرساخت، میزبانی، و سیستم‌های فنی را برای فراگیران سراسر جهان به‌طور قابل اعتماد نگه دارید." },
      { title: "گسترش دسترسی فراگیر", description: "به فراگیران بیشتر افغان در جامعه غرب و داخل کشور با مسیرهای یادگیری ساختاریافته و عملی دسترسی دهید." },
      { title: "پشتیبانی از گواهی‌ها", description: "سیستم گواهی و تصدیق را نگه دارید تا فراگیران بتوانند اعتبارنامه‌های معتبر کسب و به اشتراک بگذارند." }
    ],
    disclosure: "کابل‌لرن توسط KabulHub LLC اداره می‌شود. کمک‌ها از محتوای آموزشی، توسعه پلتفرم، و ابتکارات دسترسی فراگیر پشتیبانی می‌کنند. کمک‌ها داوطلبانه هستند و کسر مالیاتی محسوب نمی‌شوند.",
    questions: "سؤال دارید؟ با ما تماس بگیرید",
    browseCourses: "مرور دوره‌ها ←"
  },
  educators: {
    ...ps.educators,
    eyebrow: "منابع استادان",
    title: "تدریس در کابل‌لرن",
    description: "دانش عملی خود را با فراگیران افغان به انگلیسی، پشتو و دری از طریق دوره‌های ساختاریافته، آزمون‌های راهنما، و مسیرهای گواهی‌دار شریک کنید.",
    goPortal: "رفتن به درگاه استاد",
    requestAccess: "درخواست دسترسی استاد",
    register: "ثبت حساب رایگان",
    resources: "ابزارهای تدریس",
    pipelineTitle: "مسیر چهار مرحله‌ای پیوستن",
    beforeTitle: "پیش از درخواست دسترسی",
    steps: [
      { title: "۱. ثبت", paragraphs: ["با نام واقعی و ایمیل قابل دسترس، حساب رایگان کابل‌لرن بسازید."] },
      { title: "۲. درخواست دسترسی", paragraphs: ["توضیح دهید چه چیزی می‌خواهید تدریس کنید. ادمین حساب موجود شما را ارتقا می‌دهد."] },
      { title: "۳. ایجاد", paragraphs: ["ماژول‌ها، درس‌ها، خواندنی‌ها، ویدیوها، آزمون‌ها، و مراحل آماده گواهی بسازید."] },
      { title: "۴. نشر", paragraphs: ["دوره را برای بررسی بفرستید، اصلاحات خواسته‌شده را انجام دهید، و پس از تأیید نشر کنید."] }
    ],
    before: ["توضیح کوتاهی از دوره آماده کنید.", "زبان‌هایی را که پشتیبانی می‌کنید مشخص کنید: انگلیسی، پشتو، دری، یا ترکیب.", "مطمئن شوید حق استفاده از همه مواد را دارید.", "آزمون‌ها یا مراحل سنجش فهم را برنامه‌ریزی کنید.", "قبل از بارگذاری ویدیو، خواندنی، مجموعه‌داده، یا اسلاید، رهنمودها را بررسی کنید."]
  },
  educatorResources: {
    ...ps.educatorResources,
    eyebrow: "منابع استادان",
    title: "منابع استادان",
    description: "رهنمود عملی برای ایجاد، ضبط، ترجمه، و سپردن دوره‌های کابل‌لرن.",
    instructionsEyebrow: "رهنمود سازنده",
    workflowTitle: "جریان چهار مرحله‌ای نشر",
    checklistTitle: "فهرست آمادگی دوره",
    guidelinesTitle: "رهنمودهای استاد",
    guidelinesDescription: "معیارهای ساختار درس، محتوای سه‌زبانه، آزمون‌ها، کیفیت رسانه، کاپی‌رایت، و آمادگی سپردن را بررسی کنید.",
    openGuidelines: "باز کردن رهنمودها",
    becomeEducatorLink: "در کابل‌لرن تدریس کنید",
    videoTitle: "ویدیوی آغاز استاد",
    videoDescription: "ویدیوی کوتاهی اضافه کنید که نشان دهد استادان تأییدشده چگونه مسوده می‌سازند، درس اضافه می‌کنند، و برای بررسی می‌فرستند.",
    steps: [
      { title: "۱. ثبت", paragraphs: ["با نام واقعی و ایمیل قابل دسترس حساب رایگان بسازید."] },
      { title: "۲. درخواست دسترسی", paragraphs: ["توضیح دهید چه چیزی می‌خواهید تدریس کنید. ادمین حساب شما را ارتقا می‌دهد."] },
      { title: "۳. ایجاد کنید", paragraphs: ["ماژول‌ها، درس‌ها، خواندنی‌ها، ویدیوها، آزمون‌ها و مراحل گواهی را بسازید."] },
      { title: "۴. نشر کنید", paragraphs: ["دوره را برای بررسی بفرستید، اصلاحات را انجام دهید، و پس از تأیید نشر کنید."] }
    ],
    checklist: ["توضیح کوتاه دوره را آماده کنید.", "زبان‌های پشتیبانی را مشخص کنید.", "اجازه استفاده از مواد را تأیید کنید.", "آزمون‌های سنجش فهم را برنامه‌ریزی کنید.", "قبل از بارگذاری رهنمودها را بخوانید."]
  },
  educatorGuidelines: {
    eyebrow: "منابع استادان",
    title: "رهنمودهای استاد",
    description: "از این رهنمودها برای آماده‌سازی ویدیوها، خواندنی‌ها، آزمون‌ها، ترجمه‌ها، و بارگذاری‌های کورس استفاده کنید که با معیارهای کیفیت و اعتماد کابل‌لرن مطابقت دارند.",
    goPortal: "به پورتال استادان بروید",
    teach: "در کابل‌لرن تدریس کنید",
    walkthroughTitle: "راهنمایی استاد",
    videoTitle: "جای‌نگهدار ویدیوی رهنمودهای استاد",
    videoDescription: "یک ویدیوی آموزشی برای ثبت درس‌ها، قالب‌بندی محتوای سه‌زبانه، بارگذاری مواد، و ارسال برای بررسی اضافه کنید.",
    structureTitle: "ساختار کورس",
    structureItems: [
      "با اهداف روشن یادگیرنده و پیش‌نیازها شروع کنید.",
      "کورس‌ها را به ماژول‌هایی با درس‌های متمرکز سازمان دهید.",
      "هر درس را به یک مفهوم، مهارت، یا نقطه عطف کاربردی مرتبط نگه دارید.",
      "برای یادگیرندگانی با پهنای باند محدود ویدیو، خواندنی یا خلاصه اضافه کنید.",
      "از آزمون‌ها برای تأیید درک قبل از پیشرفت یادگیرندگان استفاده کنید."
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
      "از اصطلاح‌شناسی یکسان در نسخه‌های زبانی استفاده کنید.",
      "بدون بررسی استاد به ترجمه ماشینی تکیه نکنید.",
      "مثال‌ها را از نظر فرهنگی محترمانه و برای یادگیرندگان افغان در سراسر جهان قابل دسترس نگه دارید.",
      "هر ترجمه ناقص را قبل از ارسال برای بررسی به وضوح مشخص کنید."
    ],
    quizTitle: "قوانین آزمون و اعتبارسنجی",
    quizItems: [
      "سوالات باید هدف درس را بیازمایند، نه اطلاعات بی‌ربط.",
      "گزینه‌های پاسخ واضح بنویسید و از الفاظ گمراه‌کننده خودداری کنید.",
      "بررسی‌های عملی شامل کنید که یادگیرندگان تفسیر، محاسبه، ساخت، یا توضیح دهند.",
      "اطلاعات خصوصی یادگیرندگان، مجموعه داده‌های محرمانه، یا دستورالعمل‌های ناامن وارد نکنید.",
      "قبل از ارسال کورس برای انتشار، نمره‌دهی آزمون را بررسی کنید."
    ],
    ownershipTitle: "مالکیت محتوا، حریم خصوصی، و ایمنی",
    ownershipParagraphs: [
      "استادان باید فقط موادی را بارگذاری کنند که مالک آن هستند، ایجاد کرده‌اند، مجوز دارند، یا اجازه کتبی دارند. اطلاعات خصوصی دانشجویان، منابع دارای حق چاپ بدون اجازه، مواد محرمانه کارفرما، یا محتوایی که می‌تواند به یادگیرندگان آسیب برساند بارگذاری نکنید.",
      "کابل‌لرن می‌تواند تجدیدنظر درخواست کند، دسترسی را محدود کند، محتوا را از انتشار خارج کند، یا موادی را که نگرانی‌های قانونی، حریم خصوصی، ایمنی، کیفیت، یا اعتماد ایجاد می‌کنند حذف کند."
    ],
    checklistTitle: "چک‌لیست بارگذاری و بررسی",
    checklistItems: [
      "عنوان، خلاصه، سطح، و دسته‌بندی کورس کامل است.",
      "ماژول‌ها و درس‌ها به صورت منطقی مرتب شده‌اند.",
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
    description: "این شرایط قواعد استفاده از کابل‌لرن را توضیح می‌دهد، از جمله حساب‌ها، ابزار استادان، آزمون‌ها، محتوای دوره، و تصدیق گواهی.",
    privacy: "خط مشی رازداری",
    contact: "تماس با پشتیبانی",
    note: "این صفحه‌ها به‌عنوان مسوده سیاست عملیاتی کابل‌لرن تهیه شده‌اند و پیش از استفاده حقوقی باید توسط وکیل واجد شرایط بررسی شوند.",
    sections: ps.terms.sections.map((section) => ({
      title: section.title.replace("د خدمت", "شرایط").replace("د دې شرایطو منل", "پذیرش این شرایط").replace("حسابونه او وړتیا", "حساب‌ها و واجد شرایط بودن").replace("زده کړه او تایید", "محتوای آموزشی و سنجش").replace("سندونه او تصدیق", "گواهی‌ها و تصدیق").replace("د ښوونکي منځپانګه", "محتوای استاد").replace("د کاروونکي چلند", "رفتار کاربر").replace("فکري ملکیت", "مالکیت فکری").replace("تادیات او ورکړې", "پرداخت‌ها و پرداختی‌ها").replace("محرمیت او د ډاټا کارول", "رازداری و استفاده از داده").replace("درېیم اړخ خدمتونه", "خدمات طرف سوم").replace("ځنډول او پای", "تعلیق و پایان").replace("مسؤولیت محدودول", "سلب مسئولیت و محدودیت مسئولیت").replace("حاکم قانون او شخړې", "قانون حاکم و اختلافات").replace("اړیکه", "تماس"),
      paragraphs: section.paragraphs?.map(() => "این بخش قواعد، حقوق، مسئولیت‌ها، محدودیت‌ها، و راه حل پشتیبانی مربوط به استفاده از کابل‌لرن را توضیح می‌دهد. پرسش‌های حساب، دوره، گواهی، رازداری، یا محتوای استاد را به info@kabulhub.com بفرستید.")
    }))
  },
  privacy: {
    ...ps.privacy,
    eyebrow: "قانونی و اعتماد",
    title: "خط مشی رازداری",
    description: "این خط مشی توضیح می‌دهد کابل‌لرن چه اطلاعاتی جمع می‌کند، چرا استفاده می‌کند، چگونه شریک می‌سازد، چه مدت نگه می‌دارد، و کاربران چه انتخاب‌هایی دارند.",
    terms: "شرایط خدمات",
    help: "درخواست کمک",
    note: "این صفحه‌ها به‌عنوان مسوده سیاست عملیاتی کابل‌لرن تهیه شده‌اند و پیش از استفاده حقوقی باید توسط وکیل واجد شرایط بررسی شوند.",
    sections: ps.privacy.sections.map((section) => ({
      title: section.title.replace("کابل‌لرن څوک چلوي", "کابل‌لرن را چه کسی اداره می‌کند").replace("کوم معلومات راټولوو", "چه اطلاعاتی جمع می‌کنیم").replace("معلومات څنګه کاروو", "اطلاعات را چگونه استفاده می‌کنیم").replace("معلومات څنګه شریکېږي", "اطلاعات چگونه شریک می‌شود").replace("کوکیز او ورته ټکنالوژي", "کوکی‌ها و فناوری مشابه").replace("د معلوماتو ساتل", "نگهداری داده").replace("امنیت", "امنیت").replace("ستاسو انتخابونه او حقونه", "انتخاب‌ها و حقوق شما").replace("نړیوال کاروونکي", "کاربران بین‌المللی").replace("ماشومان او زده کوونکي", "کودکان و دانش‌آموزان").replace("د تګلارې بدلونونه", "تغییرات این خط مشی"),
      paragraphs: section.paragraphs?.map(() => "کابل‌لرن اطلاعات لازم برای حساب، یادگیری، آزمون‌ها، گواهی‌ها، استادان، پشتیبانی، امنیت، و کارهای فنی را استفاده می‌کند. ما اطلاعات شخصی را نمی‌فروشیم. درخواست دسترسی، اصلاح، حذف، یا صدور داده را به info@kabulhub.com بفرستید.")
    }))
  }
};

export function getPublicInfoContent(locale: Locale): PublicInfoContent {
  const body = locale === "ps" ? ps : locale === "fa" ? fa : en;
  return { ...body, footer: footer(locale) };
}
