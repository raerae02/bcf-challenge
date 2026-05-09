import type { Regulation, Alert, ProjectProfile } from "./types";

export function matchRegulations(
  profile: ProjectProfile,
  regulations: Regulation[]
): Regulation[] {
  return regulations.filter((reg) => {
    // Match if any of the project's activities matches any of the regulation's appliesWhen tags
    const activityMatch = profile.activities.some((act) =>
      reg.appliesWhen.includes(act)
    );

    // Also match if businessType matches a tag
    const businessTypeMatch = reg.appliesWhen.includes(profile.businessType);

    // Jurisdiction filter: keep if regulation applies to user's city/borough/province
    const jurisdictionMatch =
      reg.jurisdiction === "Federal" ||
      reg.jurisdiction === "Quebec" ||
      (reg.jurisdiction === "Montreal" && profile.location.city === "Montréal") ||
      (reg.jurisdiction === "Borough" &&
        profile.location.borough &&
        reg.authority.includes(profile.location.borough));

    return (activityMatch || businessTypeMatch) && jurisdictionMatch;
  });
}

export function matchAlerts(
  profile: ProjectProfile,
  alerts: Alert[]
): Alert[] {
  return alerts.filter((alert) => {
    const activityMatch = alert.affectsActivities.some(
      (a) => profile.activities.includes(a) || profile.businessType === a
    );
    const jurisdictionMatch =
      alert.affectsJurisdictions.length === 0 ||
      alert.affectsJurisdictions.includes(profile.location.city) ||
      (profile.location.borough && alert.affectsJurisdictions.includes(profile.location.borough));

    return activityMatch && jurisdictionMatch;
  });
}
