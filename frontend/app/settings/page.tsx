"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-body tracking-tight mb-2">Settings</h1>
            <p className="text-slate-400 text-sm mb-8">
              Configure API keys, notification recipients, and scan schedule.
            </p>
            <Card>
              <CardHeader title="Backend API" description="Connection settings for the FastAPI backend." />
              <CardContent className="space-y-4">
                <Input
                  label="API Base URL"
                  placeholder="http://localhost:8000"
                  defaultValue={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                />
                <Button variant="ghost">Save Settings</Button>
              </CardContent>
            </Card>
            <div className="mt-8 text-xs text-slate-500">
              <p>Email digests and AI diff analysis are configured on the backend via environment variables.</p>
              <p>See backend/.env.example for required keys: GEMINI_API_KEY, RESEND_API_KEY, DATABASE_URL.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
