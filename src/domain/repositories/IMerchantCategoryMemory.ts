/** What the app has learned about which category a merchant belongs to. */
export interface IMerchantCategoryMemory {
  /** Suggests a leaf category for the merchant, or null when nothing is known about it. */
  suggest(merchant: string): Promise<string | null>;
  /** Remembers the category the user chose so the next purchase there is suggested correctly. */
  learn(merchant: string, categoryId: string): Promise<void>;
}
