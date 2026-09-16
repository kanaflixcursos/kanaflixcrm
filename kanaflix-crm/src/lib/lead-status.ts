export const leadStatuses = [
  { value: "new", label: "Novo" },
  { value: "reviewing", label: "Em análise" },
  { value: "qualified", label: "Qualificado" },
  { value: "follow_up", label: "Acompanhamento" },
  { value: "converted", label: "Convertido" },
  { value: "discarded", label: "Descartado" },
] as const;

export type LeadStatus = (typeof leadStatuses)[number]["value"];

export const leadStatusLabels = Object.fromEntries(
  leadStatuses.map((status) => [status.value, status.label]),
) as Record<LeadStatus, string>;

export function parseTags(value: string) {
  return [...new Set(value.split(/[\n,]/).map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}
