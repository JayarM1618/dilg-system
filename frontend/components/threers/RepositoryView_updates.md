/**
 * ========================================================
 * REPOSITORY VIEW — Expanded Category Groups Patch
 * ========================================================
 * INSTRUCTIONS: Apply these changes to your existing RepositoryView.tsx
 *
 * Adds expanded category groups aligned with 3Rs:
 * - Resolutions & Ordinances (legislative)
 * - Civil Registry
 * - Audit & Compliance
 * - Katarungang Pambarangay
 * - Peace & Order / Anti-Illegal Drugs
 * - GAD (Gender & Development)
 * - Vulnerable Sectors
 * - SK (Sangguniang Kabataan)
 * - Environment / Solid Waste Management
 */

// ──────────────────────────────────────────────────────────
// CHANGE 1: Add this constant near the top of RepositoryView.tsx
//           (alongside or after your existing constants)
// ──────────────────────────────────────────────────────────

export const REPO_GROUP_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  legislative: {
    label: "Resolutions & Ordinances",
    icon: "📜",
    description: "Official barangay and SK resolutions and ordinances",
  },
  civil_registry: {
    label: "Civil Registry",
    icon: "📋",
    description: "Birth, death, clearance, and indigency certificates",
  },
  audit_compliance: {
    label: "Audit & Compliance",
    icon: "📊",
    description: "COA audit reports, financial statements, and budgets",
  },
  katarungang_pambarangay: {
    label: "Katarungang Pambarangay",
    icon: "⚖️",
    description: "KP case records, mediation agreements, and CTFAs",
  },
  peace_order: {
    label: "Peace & Order / Anti-Illegal Drugs",
    icon: "🛡️",
    description: "Peace & order reports, BADAC, and tanod duty records",
  },
  gad: {
    label: "Gender & Development (GAD)",
    icon: "🤝",
    description: "GAD plans, budgets, and accomplishment reports",
  },
  vulnerable_sectors: {
    label: "Vulnerable Sectors",
    icon: "🫶",
    description: "PWD, senior citizens, and solo parent records",
  },
  sk: {
    label: "Sangguniang Kabataan (SK)",
    icon: "🧑‍🤝‍🧑",
    description: "SK plans, programs, financial and activity reports",
  },
  environment: {
    label: "Environment / Solid Waste",
    icon: "🌱",
    description: "SWM plans, environmental reports, and cleanup documentation",
  },
};

// ──────────────────────────────────────────────────────────
// CHANGE 2: Add a group filter dropdown in the filter bar.
// Find the existing filter section and ADD this after the
// search input or category dropdown:
// ──────────────────────────────────────────────────────────

/*
  // State: add at the top of RepositoryView
  const [groupFilter, setGroupFilter] = useState("");

  // In the filter bar, add this dropdown:
  <select
    className={`${field} w-52 font-medium`}
    value={groupFilter}
    onChange={(e) => setGroupFilter(e.target.value)}
  >
    <option value="">All sections</option>
    {Object.entries(REPO_GROUP_LABELS).map(([key, info]) => (
      <option key={key} value={key}>
        {info.icon} {info.label}
      </option>
    ))}
  </select>
*/

// ──────────────────────────────────────────────────────────
// CHANGE 3: Group documents by group_slug in the display.
// Replace the flat document list with grouped sections:
// ──────────────────────────────────────────────────────────

/*
  // When displaying documents, group by their category's group_slug:

  const groupedDocs = useMemo(() => {
    const groups: Record<string, typeof documents> = {};
    for (const doc of filteredDocs) {
      const slug = doc.category?.group_slug ?? "uncategorized";
      (groups[slug] ??= []).push(doc);
    }
    return groups;
  }, [filteredDocs]);

  // Then render each group:
  {Object.entries(groupedDocs).map(([slug, docs]) => {
    const groupInfo = REPO_GROUP_LABELS[slug];
    return (
      <section key={slug} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">{groupInfo?.icon ?? "📁"}</span>
          <h3 className="text-sm font-bold text-navy-900 dark:text-white">
            {groupInfo?.label ?? slug}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({docs.length} document{docs.length !== 1 ? "s" : ""})
          </span>
        </div>
        {groupInfo?.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
            {groupInfo.description}
          </p>
        )}
        {/* Render your existing document cards/rows here for `docs` */}
      </section>
    );
  })}
*/

// ──────────────────────────────────────────────────────────
// CHANGE 4: The backend RepositoryController already supports
// filtering. Add group_slug filter support:
//
// In RepositoryController.php → index(), add:
//
//   if ($groupSlug = $request->query('group_slug')) {
//       $query->whereHas('category', function ($q) use ($groupSlug) {
//           $q->where('group_slug', $groupSlug);
//       });
//   }
// ──────────────────────────────────────────────────────────

export {};
