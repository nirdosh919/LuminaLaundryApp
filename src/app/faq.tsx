import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Frequently Asked Questions" description="Answers about pickup, delivery, turnaround times, payments and garment care." sections={["Pickup and delivery", "Orders and turnaround", "Payments and support"]} actions={[]} />;
}

