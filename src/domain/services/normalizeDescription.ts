export function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/\s+parcela\s+\d+\/\d+$/i, "") // strip " parcela X/Y"
    .replace(/\s+\d+\/\d+$/, "") // strip " X/Y"
    .trim();
}
