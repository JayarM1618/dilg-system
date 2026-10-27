export { formatDate } from "./format";

/** Simple class name joiner utility */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
