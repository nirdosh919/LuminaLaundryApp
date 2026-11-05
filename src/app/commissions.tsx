import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Commissions"
    storageKey="lumina_commissions"
    fields={["Shop or vendor", "Order reference", "Commission amount", "Notes"]}
  />;
}
