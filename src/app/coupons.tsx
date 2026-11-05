import React from "react";
import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return <LocalFeaturePage
    title="Coupons & promo codes"
    storageKey="lumina_coupons"
    fields={["Coupon code", "Discount details", "Expiry date", "Usage limit"]}
  />;
}
