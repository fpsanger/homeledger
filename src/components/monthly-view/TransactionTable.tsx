import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Transaction = {
  id: string;
  personId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  description: string;
  paymentMethod: string;
};

type Person = { id: string; name: string };

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  DEBIT_CARD: "Debit Card",
  CREDIT_CARD: "Credit Card",
  PIX: "PIX",
  BANK_TRANSFER: "Bank Transfer",
  BOLETO: "Boleto",
};

function fmt(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransactionTable({
  transactions,
  people,
}: {
  transactions: Transaction[];
  people: Person[];
}) {
  const byId = Object.fromEntries(people.map((p) => [p.id, p.name]));

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions this month.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Person</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(t.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{byId[t.personId] ?? t.personId}</TableCell>
              <TableCell>{t.description || "—"}</TableCell>
              <TableCell>
                <span
                  className={
                    t.type === "INCOME"
                      ? "text-green-600 font-medium text-sm"
                      : "text-red-600 font-medium text-sm"
                  }
                >
                  {t.type === "INCOME" ? "Income" : "Expense"}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {PAYMENT_LABELS[t.paymentMethod] ?? t.paymentMethod}
              </TableCell>
              <TableCell className="text-right font-medium">{fmt(t.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-6 text-sm justify-end">
        <span className="text-green-600">Income: {fmt(totalIncome)}</span>
        <span className="text-red-600">Expenses: {fmt(totalExpenses)}</span>
        <span className={balance >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
          Balance: {fmt(balance)}
        </span>
      </div>
    </div>
  );
}
