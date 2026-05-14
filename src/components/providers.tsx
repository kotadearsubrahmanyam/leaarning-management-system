"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NotificationProvider } from "@/components/ui/notification-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NotificationProvider>
  );
}
