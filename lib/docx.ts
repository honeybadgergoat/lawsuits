import fs from "node:fs/promises";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeDocxValue } from "@/lib/utils";

const FIELD_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

/**
 * Reads template binary from /templates.
 */
export async function readCaseTemplate(): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "templates", "case-template.docx");
  return fs.readFile(filePath);
}

/**
 * Parses unique field placeholders from template body.
 */
export function extractTemplateFieldsFromBuffer(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const xmlFiles = Object.keys(zip.files).filter((filePath) =>
    filePath.startsWith("word/") && filePath.endsWith(".xml")
  );
  const fields = new Set<string>();
  for (const xmlPath of xmlFiles) {
    const content = zip.files[xmlPath]?.asText() ?? "";
    for (const match of content.matchAll(FIELD_PATTERN)) {
      fields.add(match[1]);
    }
  }
  return [...fields];
}

/**
 * Renders docx with provided fields, missing keys become empty strings.
 */
export function renderTemplate(buffer: Buffer, fields: Record<string, string>): Buffer {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    sanitized[key] = sanitizeDocxValue(value);
  }

  doc.render(sanitized);
  return doc.getZip().generate({ type: "nodebuffer" });
}
