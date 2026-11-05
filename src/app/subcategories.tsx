import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Service Categories" description="Browse the available laundry and garment-care categories." sections={["Wash and fold", "Dry cleaning", "Special garment care"]} actions={[{ label: "Browse services", route: "/services" }]} />;
}

