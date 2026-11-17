import type { PendingTransactionRecord } from "../entities/PendingTransaction";

export interface IPendingTransactionRepository {
  /**
   * Stores the record unless an identical purchase (same person, amount, moment, merchant and
   * card) was already reported, so a Shortcut that fires twice does not create two entries.
   */
  saveIfNew(
    record: PendingTransactionRecord,
  ): Promise<{ record: PendingTransactionRecord; created: boolean }>;
  findById(id: string): Promise<PendingTransactionRecord | null>;
  findPending(): Promise<PendingTransactionRecord[]>;
  /** Moves a PENDING record to a final status. Returns false when it was no longer PENDING. */
  resolve(id: string, status: "CONFIRMED" | "DISCARDED", at: Date): Promise<boolean>;
  /** Puts a record resolved by `resolve` back to PENDING, used when confirming it failed. */
  reopen(id: string): Promise<void>;
}
