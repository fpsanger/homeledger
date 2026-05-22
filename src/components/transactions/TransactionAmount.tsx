type TransactionAmountProps = {
  type: string;
  amount: number;
};

function fmtCurrency(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransactionAmount({ type, amount }: TransactionAmountProps) {
  switch (type) {
    case "INVESTMENT":
      return (
        <span className="inline-flex items-center gap-1.5 text-violet-600">
          <span className="text-xs font-normal bg-violet-100 text-violet-700 rounded px-1.5 py-0.5">
            INV
          </span>

          {fmtCurrency(amount)}
        </span>
      );

    case "EXPENSE":
      return  <span className="inline-flex items-center gap-1.5 text-red-600">
          <span className="text-xs font-normal bg-red-100 text-red-700 rounded px-1.5 py-0.5">
            DES
          </span>

          {fmtCurrency(amount)}
        </span>

    case "INCOME":
      return <span className="inline-flex items-center gap-1.5 text-green-600">
          <span className="text-xs font-normal bg-green-100 text-green-700 rounded px-1.5 py-0.5">
            REC
          </span>

          {fmtCurrency(amount)}
        </span>

    default:
      return <span>{fmtCurrency(amount)}</span>;
  }
}
