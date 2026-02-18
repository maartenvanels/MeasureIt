/**
 * Feature flags for MeasureIt.
 *
 * The open-source core includes all measurement tools, local export, and local storage.
 * Pro features (cloud sync, teams, PDF export, batch processing) are gated behind
 * environment variables and will be available in the hosted version.
 */

function envBool(key: string, fallback = false): boolean {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const features = {
  /** Enable pro/commercial features (cloud sync, teams, etc.) */
  pro: envBool("NEXT_PUBLIC_ENABLE_PRO"),

  /** Enable cloud project storage via Supabase */
  cloudStorage: envBool("NEXT_PUBLIC_ENABLE_CLOUD_STORAGE"),

  /** Enable team/collaboration features */
  teams: envBool("NEXT_PUBLIC_ENABLE_TEAMS"),

  /** Enable PDF report export */
  pdfExport: envBool("NEXT_PUBLIC_ENABLE_PDF_EXPORT"),
} as const;
