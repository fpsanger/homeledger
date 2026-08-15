export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type Step1Data = {
  statementType: "credit-card" | "debit";
  creditCardId?: string;
  personId: string;
  year: number;
  month: number;
  detectedBank?: string;
};

export type ImportSummary = {
  imported: number;
  alreadyRegistered: number;
};
