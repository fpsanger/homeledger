"use client";

import { useState } from "react";
import type { ReconciledItem } from "@/domain/entities/ReconciledItem";
import { Step1Upload } from "./Step1Upload";
import { Step2Review } from "./Step2Review";
import { Step3Reconcile } from "./Step3Reconcile";
import { Step4Import } from "./Step4Import";
import { Step5Done } from "./Step5Done";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type Step1Data = {
  statementType: "credit-card" | "debit";
  creditCardId?: string;
  personId: string;
  year: number;
  month: number;
};

export type ImportSummary = {
  imported: number;
  alreadyRegistered: number;
};

const STEPS = [
  { label: "Upload" },
  { label: "Revisar" },
  { label: "Reconciliar" },
  { label: "Importar" },
  { label: "Concluído" },
];

export function BillingImportWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [reconciledItems, setReconciledItems] = useState<ReconciledItem[]>([]);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary>({ imported: 0, alreadyRegistered: 0 });

  function reset() {
    setStep(1);
    setReconciledItems([]);
    setStep1Data(null);
    setImportSummary({ imported: 0, alreadyRegistered: 0 });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-4">Importar Extrato</h1>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const stepNum = (i + 1) as WizardStep;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? "✓" : stepNum}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-1 mb-4 ${step > stepNum ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <Step1Upload
          onSuccess={(items, data) => {
            setReconciledItems(items);
            setStep1Data(data);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <Step2Review
          reconciledItems={reconciledItems}
          onUpdate={setReconciledItems}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Reconcile
          reconciledItems={reconciledItems}
          onNext={(selected) => {
            setStep(4);
          }}
          onBack={() => setStep(2)}
          onAllMatched={() => {
            setImportSummary({ imported: 0, alreadyRegistered: reconciledItems.length });
            setStep(5);
          }}
          step1Data={step1Data!}
        />
      )}
      {step === 4 && (
        <Step4Import
          reconciledItems={reconciledItems}
          step1Data={step1Data!}
          onDone={(summary) => {
            setImportSummary(summary);
            setStep(5);
          }}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <Step5Done
          summary={importSummary}
          onReset={reset}
        />
      )}
    </div>
  );
}
