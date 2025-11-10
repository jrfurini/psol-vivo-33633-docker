import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ClientHeader } from "@/components/ClientHeader";
import { useApp } from "@/contexts/AppContext";

export function MainLayout() {
  const { selectedClient } = useApp();
  const location = useLocation();

  // Hide client header on administracao page
  const showClientHeader = location.pathname !== "/administracao";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-24 border-b border-border bg-card flex items-center px-4">
            <SidebarTrigger />
            <div className="flex items-center ml-5">
              <h1 className="text-2xl font-semibold">Simulador de Preços</h1>
            </div>
          </header>
          {showClientHeader && <ClientHeader client={selectedClient} />}
          <main className="flex-1 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
