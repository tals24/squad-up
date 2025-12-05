import React, { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import { PageLayout, PageHeader } from "@/shared/ui/primitives/design-system-components";
import DatabaseSyncSection from "./DatabaseSyncSection";
import OrganizationSettingsSection from "./OrganizationSettingsSection";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("database");

  return (
    <PageLayout maxWidth="max-w-6xl">
      {/* Header */}
      <PageHeader
        title="Settings"
        accentWord=""
        subtitle="Manage your system configuration and preferences"
      />

      {/* Tabbed Interface */}
      <Tabs defaultValue="database" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800/50 p-1 rounded-xl">
          <TabsTrigger 
            value="database"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/10"
          >
            Database & Sync
          </TabsTrigger>
          <TabsTrigger 
            value="organization"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/10"
          >
            Organization Settings
          </TabsTrigger>
          <TabsTrigger 
            value="user"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/10"
          >
            User Preferences
          </TabsTrigger>
          <TabsTrigger 
            value="team"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/10 data-[state=active]:text-cyan-400 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/10"
          >
            Team Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Database & Sync */}
        <TabsContent value="database">
          <DatabaseSyncSection />
        </TabsContent>

        {/* Tab 2: Organization Settings */}
        <TabsContent value="organization">
          <OrganizationSettingsSection />
        </TabsContent>

        {/* Tab 3: User Preferences (Placeholder) */}
        <TabsContent value="user">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <SettingsIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">User Preferences</h3>
            <p className="text-slate-400">
              User preference settings will be available in a future update.
            </p>
          </div>
        </TabsContent>

        {/* Tab 4: Team Settings (Placeholder) */}
        <TabsContent value="team">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <SettingsIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Team Settings</h3>
            <p className="text-slate-400">
              Team-specific settings will be available in a future update.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

