/**
 * ========================================================
 * RESOURCES VIEW — Content Expansion Patch
 * ========================================================
 * INSTRUCTIONS: Apply these changes to your existing ResourcesView.tsx
 *
 * Adds new resource content sections:
 * - BNEO (Barangay Newly Elected Officials)
 * - BOIS (Barangay Official Information System)
 * - Report Templates
 * - Barangay Governance Templates
 *
 * These are added as new resource_types in the config and
 * displayed as organized tabs/sections in the Resources view.
 */

// ──────────────────────────────────────────────────────────
// CHANGE 1: Add new resource type constants
// Add these to your existing type constants in ResourcesView.tsx
// or in a shared constants file:
// ──────────────────────────────────────────────────────────

export const RESOURCE_SECTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  // Existing sections
  standard_formats: {
    label: "Standard Formats & Templates",
    icon: "📝",
    description: "Official report templates and standard forms",
  },
  sectoral_toolkits: {
    label: "Sectoral Toolkits",
    icon: "🔧",
    description: "Specialized toolkits for different barangay sectors",
  },
  citizen_charts: {
    label: "Citizen's Charts",
    icon: "📊",
    description: "Service delivery charts and performance indicators",
  },
  drive_links: {
    label: "Drive Links & References",
    icon: "🔗",
    description: "External shared drives and reference materials",
  },

  // NEW sections for the feature expansion
  bneo: {
    label: "BNEO (Barangay Newly Elected Officials)",
    icon: "🏛️",
    description: "Orientation materials, roles & responsibilities guides, and oath-of-office templates for newly elected barangay officials",
  },
  bois: {
    label: "BOIS (Barangay Official Information System)",
    icon: "💻",
    description: "System user guides, data management templates, and BOIS compliance materials",
  },
  report_templates: {
    label: "Report Templates",
    icon: "📄",
    description: "Standardized report templates for all PPA categories — weekly through annual",
  },
  governance_templates: {
    label: "Barangay Governance Templates",
    icon: "📋",
    description: "Governance documents: resolutions, ordinances, meeting minutes, council agenda templates",
  },
};

// ──────────────────────────────────────────────────────────
// CHANGE 2: Add section tabs in the Resources view.
// Find your existing ResourcesView component and add
// a section/tab selector:
// ──────────────────────────────────────────────────────────

/*
  // State for active section
  const [section, setSection] = useState<string>("all");

  // Render section tabs:
  <div className="flex gap-1 rounded-2xl bg-slate-100 dark:bg-white/5 p-1 mb-6 overflow-x-auto">
    <button
      onClick={() => setSection("all")}
      className={`min-w-fit rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
        section === "all"
          ? "bg-[#7B4DFF] text-white shadow-sm"
          : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
      }`}
    >
      All Resources
    </button>
    {Object.entries(RESOURCE_SECTION_LABELS).map(([key, info]) => (
      <button
        key={key}
        onClick={() => setSection(key)}
        className={`min-w-fit flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
          section === key
            ? "bg-[#7B4DFF] text-white shadow-sm"
            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
        }`}
      >
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </button>
    ))}
  </div>
*/

// ──────────────────────────────────────────────────────────
// CHANGE 3: Backend config update
// In config/reporting.php, add to the resource_types array:
// ──────────────────────────────────────────────────────────

/*
  'resource_types' => [
      // ... existing types
      'bneo_orientation' => 'BNEO Orientation Material',
      'bneo_guide' => 'BNEO Roles & Responsibilities Guide',
      'bois_user_guide' => 'BOIS User Guide',
      'bois_template' => 'BOIS Data Template',
      'governance_template' => 'Governance Template',
  ],

  'resource_groups' => [
      // ... existing groups
      'bneo' => ['bneo_orientation', 'bneo_guide'],
      'bois' => ['bois_user_guide', 'bois_template'],
      'report_templates' => ['template'],
      'governance_templates' => ['governance_template'],
  ],
*/

// ──────────────────────────────────────────────────────────
// CHANGE 4: Filter resources by section
// When displaying resources, filter by the selected section's
// resource types:
// ──────────────────────────────────────────────────────────

/*
  const filteredResources = useMemo(() => {
    if (section === "all") return resources;
    const groupTypes = RESOURCE_GROUPS[section] ?? [];
    return resources.filter((r) => groupTypes.includes(r.type));
  }, [resources, section]);
*/

export {};
