import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "../../api";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL = `${BACKEND_URL}/auth`;

const predefinedImages = [
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown",
];

const Settings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-populate from auth context
  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
      setSelectedAvatar(user.profile_picture || predefinedImages[0]);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!name && !email && !password && !selectedAvatar) {
      setMessage("Please update at least one field.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/edit-profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password: password || undefined,
          profile_picture: selectedAvatar,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser({ username: name, email, profile_picture: selectedAvatar });
        setMessage("Profile updated successfully!");
        setPassword("");
      } else {
        setMessage(data.error || "Failed to update profile.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setMessage("An error occurred. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-12">
        {/* Profile Section */}
        <section className="mb-16">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[20px] font-bold tracking-tight text-on-surface">Profile Settings</h3>
              <p className="text-xs text-on-surface-variant mt-1">Manage your identity and credentials</p>
            </div>
            {message && (
              <span
                className={`text-xs font-mono px-3 py-1 rounded-full ${
                  message.includes("error") || message.includes("Failed") || message.includes("Please")
                    ? "bg-red-500/10 text-red-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {message}
              </span>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Avatar Selection */}
            <div className="md:col-span-3 flex flex-col items-center gap-4">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-primary/30 overflow-hidden bg-surface-container-low">
                <img
                  src={selectedAvatar || predefinedImages[0]}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Update Avatar
              </p>
              <div className="grid grid-cols-5 gap-2">
                {predefinedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAvatar(img)}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === img
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-outline-variant/20 hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-9 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.5px] text-on-surface-variant font-semibold">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-on-surface"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.5px] text-on-surface-variant font-semibold">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-on-surface"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email || "user@zenxplor.ai"}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    mail
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.5px] text-on-surface-variant font-semibold">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-on-surface"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    lock
                  </span>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] text-[#1a1b23] px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Search Preferences */}
        <section className="mb-16 pt-16 border-t border-outline-variant/10">
          <header className="mb-8">
            <h3 className="text-[20px] font-bold tracking-tight text-on-surface">Search Preferences</h3>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.5px] text-on-surface-variant font-semibold">
                  Default source filter
                </label>
                <select className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg px-4 py-2.5 text-sm appearance-none focus:border-primary outline-none text-on-surface">
                  <option>All Sources</option>
                  <option>Local Desktop Only</option>
                  <option>Cloud Storage Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.5px] text-on-surface-variant font-semibold">
                  Results per page
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/15 rounded-lg max-w-[140px]">
                  <button className="p-2.5 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="flex-1 text-center font-mono text-sm text-on-surface">50</span>
                  <button className="p-2.5 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start justify-between p-6 bg-surface-container-low rounded-2xl border border-primary/5">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-on-surface">Enable fuzzy search</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Allow approximate string matching to find items even with typos or partial phrases.
                </p>
              </div>
              <button className="w-9 h-5 flex-shrink-0 mt-1 rounded-full bg-[#6C63FF] relative flex items-center px-1 transition-colors">
                <span className="w-3.5 h-3.5 bg-white rounded-full transition-all translate-x-4"></span>
              </button>
            </div>
          </div>
        </section>

        {/* Advanced / Security */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-outline-variant/10">
          <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl relative overflow-hidden group border border-outline-variant/5">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <h4 className="text-lg font-bold mb-2">Connected Devices</h4>
            <p className="text-sm text-on-surface-variant mb-6">
              Manage the active sessions currently logged into ZenXplor.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl">
                <span className="material-symbols-outlined text-primary">laptop_mac</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">Current Session</p>
                  <p className="text-[10px] text-on-surface-variant">Active now</p>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant/40">v2.4.1</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-surface-container to-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between border border-outline-variant/5">
            <div>
              <span
                className="material-symbols-outlined text-3xl text-primary mb-4"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
              <h4 className="text-lg font-bold">Two-Factor</h4>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Enhanced security for your account and architectural assets.
              </p>
            </div>
            <button className="mt-8 text-xs font-bold text-primary flex items-center gap-2 group w-max">
              CONFIGURE 2FA
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Settings;