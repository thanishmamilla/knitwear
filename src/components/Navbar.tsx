"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  PlusCircle,
  Smartphone,
  AlertTriangle,
  Eye,
  History,
  FileSpreadsheet,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
} from "lucide-react";
import { getPendingOfflineUpdates } from "@/lib/offlineDb";

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lang, setLang] = useState<"en" | "ta">("en");
  const [switching, setSwitching] = useState<boolean>(false);

  // Monitor network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Poll or check pending offline count
  useEffect(() => {
    async function checkPending() {
      try {
        const pending = await getPendingOfflineUpdates();
        setPendingCount(pending.length);
      } catch (e) {
        // ignore
      }
    }
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load current user and available roles
  const loadSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.currentUser);
        setAvailableUsers(data.availableUsers || []);
      }
    } catch (err) {
      console.error("Session load error:", err);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleSwitchUser = async (email: string) => {
    try {
      setSwitching(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        await loadSession();
        window.location.reload();
      }
    } catch (err) {
      console.error("Switch error:", err);
    } finally {
      setSwitching(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Order Board", icon: LayoutDashboard, roles: ["MERCHANDISER"] },
    { href: "/orders/new", label: "New Order", icon: PlusCircle, roles: ["MERCHANDISER"] },
    { href: "/supervisor", label: "Supervisor Floor", icon: Smartphone, roles: ["MERCHANDISER", "SUPERVISOR"] },
    { href: "/risk", label: "Risk & AI Review", icon: AlertTriangle, roles: ["MERCHANDISER"] },
    { href: "/buyer", label: "Buyer Portal", icon: Eye, roles: ["MERCHANDISER", "BUYER"] },
    { href: "/audit", label: "Audit Trail", icon: History, roles: ["MERCHANDISER"] },
    { href: "/export", label: "Export Center", icon: FileSpreadsheet, roles: ["MERCHANDISER", "BUYER"] },
  ];

  const userRole = currentUser?.role || "MERCHANDISER";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors">
                <Layers className="w-5 h-5 text-blue-400 group-hover:text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Thread<span className="text-blue-600">Flow</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tiruppur Export Ops
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isAllowed = link.roles.includes(userRole);

              if (!isAllowed && userRole === "BUYER" && link.href !== "/buyer" && link.href !== "/export") {
                return null;
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right status & Role switcher */}
          <div className="flex items-center space-x-3">
            {/* Offline badge */}
            {!isOnline ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <WifiOff className="w-3 h-3 mr-1 text-rose-600 animate-pulse" />
                Offline
              </span>
            ) : pendingCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <RefreshCw className="w-3 h-3 mr-1 text-amber-600 animate-spin" />
                {pendingCount} Queued
              </span>
            ) : null}

            {/* Role Switcher Pill */}
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
              <select
                aria-label="Active Demo Role"
                value={currentUser?.email || ""}
                disabled={switching}
                onChange={(e) => handleSwitchUser(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 pr-2 py-0.5 focus:outline-none cursor-pointer"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.role === "MERCHANDISER"
                      ? `👔 Merchandiser (${u.name.split(" ")[0]})`
                      : u.role === "SUPERVISOR"
                      ? `👷 Supervisor (${u.name.split(" ")[0]})`
                      : u.buyer?.code === "COMPANY_B"
                      ? `🇬🇧 Buyer Company B (UK)`
                      : `🇩🇪 Buyer Company C (Germany)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

