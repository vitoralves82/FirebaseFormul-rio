import React from "react";

import HomePageContent from "@/components/app/home-page-content";

export default function Home() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <HomePageContent />
    </React.Suspense>
  );
}
