import { Header } from "@/components/header";
import { SWRProvider } from "@/lib/query-client";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </SWRProvider>
  );
}
