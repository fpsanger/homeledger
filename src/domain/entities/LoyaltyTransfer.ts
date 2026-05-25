export type LoyaltyTransferRecord = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  costBrl: number | null;
  transferDate: Date;
  personId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateLoyaltyTransferInput = {
  id: string;
  fromProgramId: string;
  toProgramId: string;
  pointsSent: number;
  pointsReceived: number;
  costBrl: number | null;
  transferDate: Date;
  personId: string | null;
  description: string | null;
};

export function createLoyaltyTransfer(input: CreateLoyaltyTransferInput): LoyaltyTransferRecord {
  if (input.pointsSent <= 0) throw new Error("pointsSent must be positive");
  if (input.pointsReceived < input.pointsSent) throw new Error("pointsReceived cannot be less than pointsSent");
  if (input.costBrl !== null && input.costBrl <= 0) throw new Error("costBrl must be positive");

  const now = new Date();
  return {
    id: input.id,
    fromProgramId: input.fromProgramId,
    toProgramId: input.toProgramId,
    pointsSent: input.pointsSent,
    pointsReceived: input.pointsReceived,
    costBrl: input.costBrl,
    transferDate: input.transferDate,
    personId: input.personId,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };
}
