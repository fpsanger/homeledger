"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { usePrivacy } from "@/components/layout/PrivacyProvider";
import { Dialog } from "@/components/ui/dialog";
import {
  type PurchaseSimulation,
  type PurchaseVerdict,
  type ReferencePosition,
  simulateLoyaltyPurchase,
} from "@/domain/services/simulateLoyaltyPurchase";
import { maskCurrency } from "@/lib/maskCurrency";
import { formatBrl, formatReferenceRange } from "./loyaltyFormat";

export type SimulatorProgram = {
  name: string;
  referenceMinPer1kBrl: number | null;
  referenceMaxPer1kBrl: number | null;
};

export type SimulatorSummary = {
  currentLotsPoints: number;
  currentLotsCostBrl: number;
  avgRedeemValuePer1k: number | null;
};

type Props = {
  open: boolean;
  program: SimulatorProgram;
  summary: SimulatorSummary;
  onClose: () => void;
};

const INPUT_CLASS =
  "rounded-md border bg-background px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring";

const VERDICTS: Record<PurchaseVerdict, { title: string; tone: string; Icon: typeof Info }> = {
  GREAT: { title: "Vale a pena", tone: "text-primary", Icon: CheckCircle2 },
  OK: { title: "Vale a pena", tone: "text-primary", Icon: CheckCircle2 },
  CAUTION: { title: "Atenção", tone: "text-foreground", Icon: AlertTriangle },
  NOT_WORTH: { title: "Não vale a pena", tone: "text-destructive", Icon: XCircle },
  NO_REFERENCE: { title: "Sem referência", tone: "text-muted-foreground", Icon: Info },
};

const REDEEM_NOT_COVERING = "mas a média dos seus resgates não cobre esse custo.";

const REFERENCE_PHRASE: Record<ReferencePosition, string> = {
  BELOW: "abaixo da faixa de referência",
  WITHIN: "dentro da faixa de referência",
  ABOVE: "acima da faixa de referência",
  NONE: "",
};

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Explains the verdict with the comparison that actually produced it. */
function describeVerdict(sim: PurchaseSimulation): string {
  const reference = REFERENCE_PHRASE[sim.referencePosition];
  switch (sim.verdict) {
    case "GREAT":
    case "OK":
      return reference ? `Custo ${reference}.` : "Custo abaixo da média dos seus resgates.";
    case "CAUTION":
      return `${capitalize(reference)}, ${REDEEM_NOT_COVERING}`;
    case "NOT_WORTH":
      return reference
        ? `Custo ${reference}.`
        : "Custo não fica abaixo da média dos seus resgates.";
    default:
      return "Defina a referência do milheiro no programa ou registre resgates para comparar.";
  }
}

function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function describeReferencePosition(sim: PurchaseSimulation): string {
  const distance = Math.abs(sim.vsReferenceBrl ?? 0);
  if (sim.referencePosition === "BELOW") return `${formatBrl(distance)} abaixo do mínimo`;
  if (sim.referencePosition === "ABOVE") return `${formatBrl(distance)} acima do máximo`;
  return "dentro da faixa";
}

function formatDelta(sim: PurchaseSimulation): string | null {
  if (sim.vsCurrentBrl === null || sim.vsCurrentPercent === null) return null;
  const sign = sim.vsCurrentBrl >= 0 ? "+" : "−";
  return `${sign}${formatBrl(Math.abs(sim.vsCurrentBrl))} (${sign}${Math.abs(sim.vsCurrentPercent).toFixed(1)}%) vs custo médio atual`;
}

function Row({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <span data-testid={testId} className="text-sm font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}

function VerdictBanner({ sim }: { sim: PurchaseSimulation }) {
  const { title, tone, Icon } = VERDICTS[sim.verdict];
  return (
    <div
      data-testid="simulator-verdict"
      data-verdict={sim.verdict}
      className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone}`} aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-semibold ${tone}`}>{title}</span>
        <span data-testid="simulator-verdict-detail" className="text-xs text-muted-foreground">
          {describeVerdict(sim)}
        </span>
      </div>
    </div>
  );
}

type ResultProps = {
  sim: PurchaseSimulation;
  program: SimulatorProgram;
  avgRedeemValuePer1k: number | null;
  hidden: boolean;
};

function ReferenceRow({ sim, program }: Pick<ResultProps, "sim" | "program">) {
  const range = formatReferenceRange(program.referenceMinPer1kBrl, program.referenceMaxPer1kBrl);
  if (!range) return <Row label="Referência do milheiro" value="não definida" />;
  return (
    <Row
      label="Referência do milheiro"
      value={range}
      hint={describeReferencePosition(sim)}
      testId="simulator-reference"
    />
  );
}

function SimulationResult({ sim, program, avgRedeemValuePer1k, hidden }: ResultProps) {
  const money = (value: number) => maskCurrency(formatBrl(value), hidden);
  return (
    <div className="flex flex-col gap-3">
      <VerdictBanner sim={sim} />
      <dl className="divide-y">
        <Row
          label="Custo efetivo / milheiro"
          value={formatBrl(sim.effectiveCostPer1k)}
          hint={formatDelta(sim) ?? undefined}
          testId="simulator-effective-cost"
        />
        <ReferenceRow sim={sim} program={program} />
        <Row
          label="Custo médio atual → depois"
          value={
            sim.currentCostPer1k === null
              ? `sem lotes → ${money(sim.afterCostPer1k)}`
              : `${money(sim.currentCostPer1k)} → ${money(sim.afterCostPer1k)}`
          }
          testId="simulator-average"
        />
        <Row
          label="Média dos seus resgates / milheiro"
          value={avgRedeemValuePer1k === null ? "sem resgates" : money(avgRedeemValuePer1k)}
          hint={
            sim.projectedRoiPercent === null
              ? undefined
              : `ROI projetado ${sim.projectedRoiPercent.toFixed(1)}%`
          }
          testId="simulator-redeem-average"
        />
      </dl>
    </div>
  );
}

export function LoyaltyPurchaseSimulator({ open, program, summary, onClose }: Props) {
  const { hidden } = usePrivacy();
  const [points, setPoints] = useState("");
  const [paid, setPaid] = useState("");

  const simulation = useMemo(
    () =>
      simulateLoyaltyPurchase({
        points: parseDecimal(points),
        paidBrl: parseDecimal(paid),
        currentLotsPoints: summary.currentLotsPoints,
        currentLotsCostBrl: summary.currentLotsCostBrl,
        referenceMinPer1kBrl: program.referenceMinPer1kBrl,
        referenceMaxPer1kBrl: program.referenceMaxPer1kBrl,
        avgRedeemValuePer1k: summary.avgRedeemValuePer1k,
      }),
    [points, paid, program, summary],
  );

  return (
    <Dialog open={open} onClose={onClose} title={`Simular compra — ${program.name}`}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="sim-points">
              Pontos (já com bônus)
            </label>
            <input
              id="sim-points"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="Ex: 20000"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="sim-paid">
              Valor pago (R$)
            </label>
            <input
              id="sim-paid"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Ex: 350,00"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {simulation ? (
          <SimulationResult
            sim={simulation}
            program={program}
            avgRedeemValuePer1k={summary.avgRedeemValuePer1k}
            hidden={hidden}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Informe os pontos e o valor pago para ver o custo por milheiro e o veredito.
          </p>
        )}
      </div>
    </Dialog>
  );
}
