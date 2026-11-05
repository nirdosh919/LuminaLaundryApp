import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Booking management"
    storageKey="lumina_admin_bookings"
    fields={["Booking reference", "Customer", "Service", "Pickup details", "Amount"]}
  />;
}
