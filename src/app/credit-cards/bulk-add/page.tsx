import { redirect } from "next/navigation";

/** Card purchases are entered on the unified bulk page, in its "Compras no cartão" section. */
export default function BulkAddCreditCardPage() {
  redirect("/transactions/bulk-add");
}
