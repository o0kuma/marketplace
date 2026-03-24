import DOMPurify from "isomorphic-dompurify";

/** Allowed tags for site legal pages (terms / privacy). */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
  "hr",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

/**
 * Sanitize admin-authored HTML before save or public render.
 */
export function sanitizeLegalHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
    ALLOW_DATA_ATTR: false,
  });
}

/** True if there is no meaningful text (empty editor / only empty paragraphs). */
export function isLegalHtmlEmpty(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
}
