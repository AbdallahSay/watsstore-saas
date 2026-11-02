/** Local operational signals only. Never accepts URLs, messages, tokens, bodies or PII. */
export type IssueArea =
  | "application"
  | "checkout"
  | "merchant-publish"
  | "product-image"
  | "api";
export function reportClientIssue(area: IssueArea, status?: number) {
  if (typeof window === "undefined") return;
  const event = {
    area,
    status: status && Number.isInteger(status) ? status : undefined,
    at: new Date().toISOString(),
  };
  console.warn("[WatsStore operational issue]", event);
  window.dispatchEvent(new CustomEvent("watsstore:issue", { detail: event }));
}
