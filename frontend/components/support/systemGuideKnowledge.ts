export interface GuideTopic {
  id: string;
  category: "borms" | "bagwis" | "announcements" | "receipts" | "deadlines" | "security" | "escalation";
  question: string;
  keywords: string[];
  summary: string;
  steps: string[];
  actionLink?: {
    label: string;
    href: string;
  };
  canEscalateToDilg?: boolean;
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "what-is-borms",
    category: "borms",
    question: "What is BORMS and how does it work?",
    keywords: ["borms", "overview", "what is", "system", "about", "dilg"],
    summary:
      "BORMS stands for Barangay Operations and Reporting Management System. It manages the '3 Rs' cycle of governance: Reports (barangay submissions), Requirements (DILG directives & memos), and Resources (downloadable templates & guides).",
    steps: [
      "Access BORMS from your main navigation bar.",
      "Track assigned compliance requirements under Requirements.",
      "Submit periodic reports (Quarterly, Semestral, Annual) under Reports.",
      "Download official memorandum templates under Resources.",
    ],
    actionLink: { label: "Go to BORMS", href: "/borms" },
  },
  {
    id: "how-to-submit-report",
    category: "borms",
    question: "How do I submit a compliance report?",
    keywords: ["submit", "upload", "compliance", "file", "attach", "send report"],
    summary:
      "Barangay representatives submit compliance reports for their assigned reporting categories (e.g. BCPC, BADAC, VAW Desk, Financial Disclosures).",
    steps: [
      "Navigate to BORMS -> Reports.",
      "Select your report category and target reporting period (e.g. Q1 2026).",
      "Fill out the required form fields or attach the required PDF/document files.",
      "Click 'Submit Report'. Your submission status will update to 'Under Review'.",
    ],
    actionLink: { label: "Open Reports", href: "/borms?tab=reports" },
  },
  {
    id: "download-receipt",
    category: "receipts",
    question: "How do I download an official Submission Receipt (e-AR)?",
    keywords: ["receipt", "proof", "acknowledgement", "e-ar", "print", "certificate"],
    summary:
      "Every submitted or compliant report generates an official Electronic Acknowledgement Receipt (e-AR) with an institutional reference number, submission timestamp, and verification hash.",
    steps: [
      "Open BORMS -> Reports (or check your Barangay Hub recent submissions).",
      "Locate the submission with status 'Submitted' or 'Compliant'.",
      "Click the 'Receipt' button next to the submission.",
      "In the receipt modal, review the reference details and click 'Print / Save as PDF'.",
    ],
    actionLink: { label: "View Reports & Receipts", href: "/borms?tab=reports" },
  },
  {
    id: "returned-report-resubmit",
    category: "borms",
    question: "What should I do if my submission is marked 'Non-Compliant' or returned?",
    keywords: ["non-compliant", "rejected", "returned", "revision", "remarks", "resubmit", "fail"],
    summary:
      "When a DILG reviewer finds lacking attachments or errors in a submission, it is returned with reviewer remarks detailing what needs revision.",
    steps: [
      "Go to BORMS -> Reports and look for items flagged as 'Non-Compliant' or 'Revision'.",
      "Read the highlighted 'Reviewer Feedback / Remarks' box.",
      "Click 'Resubmit Report' to update your form answers or attach the corrected documents.",
      "Once re-uploaded, the status transitions back to 'Submitted' for re-evaluation.",
    ],
    canEscalateToDilg: true,
  },
  {
    id: "deadline-extensions",
    category: "deadlines",
    question: "How do deadlines work and can I request an extension?",
    keywords: ["deadline", "due date", "overdue", "late", "extension", "grace period"],
    summary:
      "Each requirement has an official due date set by DILG Makati. Items not submitted by midnight of the due date are flagged as Overdue.",
    steps: [
      "Check your Barangay Hub dashboard for the 'Urgent Deadlines' reminder card.",
      "Upcoming requirements due within 3 days are highlighted with an amber indicator.",
      "If your barangay cannot meet a deadline due to force majeure or official delays, submit a 'Communication Request' to the DILG Officer requesting an extension.",
    ],
    canEscalateToDilg: true,
  },
  {
    id: "what-is-bagwis",
    category: "bagwis",
    question: "What is Bagwis and what are PPAs?",
    keywords: ["bagwis", "ppa", "programs", "projects", "activities", "governance", "sglgb"],
    summary:
      "Bagwis is DILG Makati's performance oversight and monitoring portal. It tracks Programs, Projects, and Activities (PPAs) aligned with the Seal of Good Local Governance for Barangays (SGLGB).",
    steps: [
      "Navigate to 'Bagwis' from the main navigation bar.",
      "Review governance indicators across Peace & Order, Financial Administration, and Social Protection.",
      "Track your barangay's compliance trends, completion ratings, and city benchmarks.",
    ],
    actionLink: { label: "Go to Bagwis", href: "/bagwis" },
  },
  {
    id: "announcements-programs",
    category: "announcements",
    question: "How do I publish announcements and calendar events for citizens?",
    keywords: ["announcements", "citizens", "events", "calendar", "publish", "programs", "public"],
    summary:
      "The Announcements & Programs tab lets you broadcast advisories and community events directly onto the public Citizens Transparency Portal.",
    steps: [
      "Click 'Announcements & programs' in your navigation bar.",
      "To publish news: Enter a title and description in 'Post new announcement', and optionally toggle 'Pin to top'.",
      "To post events: Switch the toggle to 'Event', specify date, time, and venue.",
      "To post services: Switch the toggle to 'Program' and specify the service schedule.",
      "Citizens instantly see these on your barangay's public transparency page.",
    ],
    actionLink: { label: "Manage Announcements", href: "/borms/community" },
  },
  {
    id: "edit-barangay-profile",
    category: "announcements",
    question: "How can I update our barangay hall address, hotline, and office hours?",
    keywords: ["profile", "hotline", "address", "hall", "contact", "office hours", "about"],
    summary:
      "Barangay representatives can update their public directory details anytime without waiting for admin approval.",
    steps: [
      "Go to Announcements & Programs -> Barangay Profile column.",
      "Update your official Hall Address, Emergency Hotline, and Office Operating Hours.",
      "Click 'Save profile'. The updated information reflects immediately on the Citizens Portal.",
    ],
    actionLink: { label: "Edit Profile", href: "/borms/community" },
  },
  {
    id: "two-factor-auth",
    category: "security",
    question: "How does Two-Factor Authentication (2FA) work?",
    keywords: ["2fa", "security", "two factor", "totp", "authenticator", "code", "login"],
    summary:
      "2FA adds a layer of security to safeguard your barangay portal account from unauthorized access.",
    steps: [
      "Open your User Profile by clicking your avatar in the upper right header.",
      "Select 'Security & 2FA'.",
      "Scan the QR code with Google Authenticator or Microsoft Authenticator.",
      "Save your backup recovery codes in a secure location.",
    ],
  },
  {
    id: "contact-dilg-escalation",
    category: "escalation",
    question: "How do I contact a DILG representative or escalate a problem to Super Admin?",
    keywords: ["contact", "dilg officer", "chat", "message", "escalate", "super admin", "help", "concern", "ticket"],
    summary:
      "If you encounter a problem, reporting conflict, or need official clarification, use the built-in DILG Concerns & Communication Desk.",
    steps: [
      "Click 'Raise a Concern' or 'Contact DILG Officer'.",
      "Select the category (BORMS Reporting, Deadline Extension, Policy Clarification, Technical Issue) and write your concern.",
      "Submit the request. Your concern enters 'Waiting for DILG Acceptance' status.",
      "A DILG Officer accepts your request, opening an active two-way message thread.",
      "If both parties encounter an unresolved dispute or technical blocker, either party can click 'Escalate to Super Admin' for direct executive intervention.",
    ],
    canEscalateToDilg: true,
  },
];

export function searchGuide(query: string): GuideTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return GUIDE_TOPICS;

  return GUIDE_TOPICS.filter((topic) => {
    if (topic.question.toLowerCase().includes(q)) return true;
    if (topic.summary.toLowerCase().includes(q)) return true;
    return topic.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
  });
}

