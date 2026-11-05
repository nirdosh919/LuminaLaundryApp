import React from 'react';
import WebsitePage from '@/components/website-page';

export default function Screen() {
  return <WebsitePage title="Subscription Plans" description="Review available subscription plans and account status." sections={["Plan overview", "Billing status", "Plan benefits"]} actions={[]} />;
}

