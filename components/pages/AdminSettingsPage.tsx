"use client";

import { useAuthStore } from "@/store/authStore";
import { Settings, User, Bell, Shield, Clock } from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  const settingsGroups = [
    {
      icon: User,
      title: "Admin Profile",
      description: "Manage your admin account details",
      items: [
        { label: "Name", value: user?.name || "Admin" },
        { label: "Email", value: user?.email || "admin@fishndrop.com" },
        { label: "Role", value: "System Administrator" },
      ],
    },
    {
      icon: Clock,
      title: "Operating Hours",
      description: "Restaurant time slot configuration",
      items: [
        { label: "Dinner Service", value: "18:00 – 22:00" },
        { label: "Time Slots", value: "18:00, 19:00, 20:00, 21:00" },
        { label: "Slot Duration", value: "1 Hour" },
      ],
    },
    {
      icon: Shield,
      title: "Security",
      description: "Authentication and access control",
      items: [
        { label: "Session", value: "Active" },
        { label: "2FA", value: "Not configured" },
        { label: "Last Login", value: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ],
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Booking and system alerts",
      items: [
        { label: "New Bookings", value: "Enabled" },
        { label: "Cancellations", value: "Enabled" },
        { label: "Payment Alerts", value: "Enabled" },
      ],
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen">

      {/* Page Header */}
      <div className="space-y-2">
        <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
          Administration
        </span>
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
          Settings
        </h1>
        <p className="text-sm text-secondary font-body font-light italic">
          System configuration and admin preferences.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-headline text-xl italic text-on-surface">{group.title}</h3>
                  <p className="text-xs text-secondary font-body italic">{group.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-b-0">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-outline">{item.label}</span>
                    <span className="font-body text-sm text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
        <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-2">System Note</p>
        <p className="text-xs text-secondary italic font-body">
          Settings are currently read-only. Contact the development team to modify system configuration.
          Table management and slot locks can be controlled from their respective pages.
        </p>
      </div>
    </div>
  );
}
