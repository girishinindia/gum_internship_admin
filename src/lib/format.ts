export function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
export const MODE_LABEL: Record<string, string> = {
  recorded: 'Recorded', live: 'Live', hybrid: 'Hybrid', project_only: 'Project-only',
};
