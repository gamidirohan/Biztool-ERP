"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Building2, 
  Phone, 
  MapPin,
  Camera,
  Save,
  Loader2
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    location: ""
  });

  useEffect(() => {
    const supabase = createClient();
    
    async function loadProfile() {
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
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: user.email || "",
          phone: profileData.phone || "",
          company: profileData.company || "",
          location: profileData.location || ""
        });
      } else {
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }
      
      setLoading(false);
    }
    
    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    
    try {
      if (profile?.id) {
        await supabase
          .from("tenant_memberships")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            company: formData.company,
            location: formData.location
          })
          .eq("id", profile.id);
      }
      
      // Success feedback
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <User className="h-8 w-8 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500">
                Profile
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your personal information
              </p>
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        <Card className="p-6 mb-6 border-white/10 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>
              <button className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload a new photo
              </p>
              <Button variant="outline" size="sm">
                Change Photo
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 border-white/10 bg-card/50 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                Email
              </label>
              <Input
                value={formData.email}
                disabled
                className="bg-background/30 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400" />
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-400" />
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Your Company Name"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
