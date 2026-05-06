import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Installment = {
  id: string;
  installmentNumber: number;
  amount: number;
  dueYear: number;
  dueMonth: number;
  isPaid: boolean;
  isCanceled: boolean;
};

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function InstallmentTable({ installments }: { installments: Installment[] }) {
  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = total - paid;

  if (installments.length === 0) {
    return <p className="text-sm text-muted-foreground">No installments this month.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Installment</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => (
            <TableRow key={inst.id}>
              <TableCell className="text-sm">#{inst.installmentNumber}</TableCell>
              <TableCell className="text-right font-medium">{fmt(inst.amount)}</TableCell>
              <TableCell>
                <span
                  className={
                    inst.isPaid
                      ? "text-green-600 text-sm font-medium"
                      : "text-muted-foreground text-sm"
                  }
                >
                  {inst.isPaid ? "Paid" : "Unpaid"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-6 text-sm justify-end">
        <span>Total: {fmt(total)}</span>
        <span className="text-green-600">Paid: {fmt(paid)}</span>
        <span className="text-red-600">Remaining: {fmt(remaining)}</span>
      </div>
    </div>
  );
}
