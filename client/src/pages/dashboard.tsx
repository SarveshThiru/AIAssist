import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<"inbox" | "analytics" | "urgent" | "processed" | "settings">("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 flex overflow-hidden">
        {activeView === "inbox" && (
          <EmailList 
            filter={{}}
            onEmailSelect={setSelectedEmailId}
            selectedEmailId={selectedEmailId}
          />
        )}
        
        {activeView === "urgent" && (
          <EmailList 
            filter={{ urgency: "urgent" }}
            onEmailSelect={setSelectedEmailId}
            selectedEmailId={selectedEmailId}
          />
        )}
        
        {activeView === "processed" && (
          <EmailList 
            filter={{ status: "processed" }}
            onEmailSelect={setSelectedEmailId}
            selectedEmailId={selectedEmailId}
          />
        )}
        
        {activeView === "analytics" && <AnalyticsDashboard />}
        
        {activeView === "settings" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Settings</h2>
              <p className="text-muted-foreground">Settings panel would be implemented here</p>
            </div>
          </div>
        )}

        {selectedEmailId && (
          <EmailDetail 
            emailId={selectedEmailId} 
            onClose={() => setSelectedEmailId(null)} 
          />
        )}
      </div>
    </div>
  );
}
