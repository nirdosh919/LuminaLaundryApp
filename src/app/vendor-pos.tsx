import VendorFeaturePage from "../components/VendorFeaturePage";

export default function Screen() {
  return <VendorFeaturePage
    title="Point of sale"
    subtitle="Keep walk-in receipts and counter orders organized alongside bookings."
    icon="₹"
    storageKey="lumina_vendor_pos"
    fields={["Receipt reference", "Customer", "Items", "Total amount"]}
  />;
}
