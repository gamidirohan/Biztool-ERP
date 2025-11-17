"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  ChevronRight,
  Moon,
  Sun,
  Monitor
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const supabase = createClient();
    
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("tenant_memberships")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setProfile(profileData);
      setLoading(false);
    }
    
    loadUser();
  }, [router]);

  const settingsSections = [
    {
      title: "Account",
      icon: User,
      items: [
        { label: "Profile Information", href: "/profile", icon: User },
        { label: "Password & Security", href: "/settings/security", icon: Key },
      ]
    },
    {
      title: "Preferences",
      icon: Palette,
      items: [
        { label: "Appearance", href: "/settings/appearance", icon: theme === "dark" ? Moon : theme === "light" ? Sun : Monitor },
        { label: "Notifications", href: "/settings/notifications", icon: Bell },
        { label: "Language & Region", href: "/settings/language", icon: Globe },
      ]
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      items: [
        { label: "Privacy Settings", href: "/settings/privacy", icon: Shield },
        { label: "Connected Devices", href: "/settings/devices", icon: Monitor },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20">
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                <section.icon className="h-5 w-5" />
                {section.title}
              </h2>
              <Card className="overflow-hidden border-white/10 bg-card/50 backdrop-blur-sm">
                {section.items.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500/10 to-blue-500/10">
                        <item.icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
          <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Irreversible actions that will affect your account
          </p>
          <Button 
            variant="outline" 
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
