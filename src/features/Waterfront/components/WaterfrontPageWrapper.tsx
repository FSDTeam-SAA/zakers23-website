"use client";

import dynamic from "next/dynamic";

const WaterfrontPage = dynamic(() => import("./waterfront-page"), { ssr: false });

export default function WaterfrontPageWrapper() {
  return <WaterfrontPage />;
}
