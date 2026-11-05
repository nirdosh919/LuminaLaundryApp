import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Invoices"
    storageKey="lumina_invoices"
    fields={["Invoice number", "Order reference", "Amount", "Invoice notes"]}
  />;
}
