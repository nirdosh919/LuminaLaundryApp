import LocalFeaturePage from "../components/LocalFeaturePage";

export default function Screen() {
  return (
    <LocalFeaturePage
      title="Service categories"
      storageKey="lumina_categories"
      fields={["Category name", "Description", "Display order"]}
    />
  );
}
