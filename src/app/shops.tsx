import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Shop Management" description="Manage laundry shops and service locations." sections={["Shop directory", "Shop status", "Location details"]} actions={[]} />;
}

