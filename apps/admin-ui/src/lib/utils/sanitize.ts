const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
];

const ALLOWED_ATTRS = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "id",
  "width",
  "height",
  "target",
  "rel",
  "colspan",
  "rowspan",
];

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttrs?: string[];
  stripScripts?: boolean;
  stripStyles?: boolean;
}

export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = {},
): string {
  const {
    allowedTags = ALLOWED_TAGS,
    allowedAttrs = ALLOWED_ATTRS,
    stripScripts = true,
    stripStyles = true,
  } = options;

  if (!html) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function sanitizeNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    if (!allowedTags.includes(tagName)) {
      return Array.from(node.childNodes).map(sanitizeNode).join("");
    }

    let attrs = "";
    for (const attr of Array.from(element.attributes)) {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value;

      if (!allowedAttrs.includes(attrName)) {
        if (
          stripScripts &&
          (attrName === "onclick" || attrName.startsWith("on"))
        ) {
          continue;
        }
        if (stripStyles && attrName === "style") {
          continue;
        }
        if (attrName === "href" || attrName === "src") {
          if (
            attrValue.startsWith("javascript:") ||
            attrValue.startsWith("data:")
          ) {
            continue;
          }
        }
        continue;
      }

      if (attrName === "href" || attrName === "src") {
        if (
          attrValue.startsWith("javascript:") ||
          attrValue.startsWith("data:")
        ) {
          continue;
        }
      }

      attrs += ` ${attrName}="${escapeAttr(attrValue)}"`;
    }

    const children = Array.from(node.childNodes).map(sanitizeNode).join("");

    if (["br", "hr", "img"].includes(tagName)) {
      return `<${tagName}${attrs}>`;
    }

    return `<${tagName}${attrs}>${children}</${tagName}>`;
  }

  return Array.from(doc.body.childNodes).map(sanitizeNode).join("");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function stripHtml(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
