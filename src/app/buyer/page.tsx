"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Camera,
  Layers,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function BuyerPortalPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBuyerOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCurrentUser(data.currentUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerOrders();
  }, []);

  const buyerName = currentUser?.buyer?.name || "Global Sourcing Partner";
  const buyerCountry = currentUser?.buyer?.country || "International";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Buyer Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Dedicated Buyer Sourcing Portal &bull; Verified Feed</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{buyerName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Live knitwear production tracking, milestone progression, and approved shipment updates from Company A
              (Tiruppur).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser?.buyer?.id && (
              <a
                href={`/api/export?buyerId=${currentUser.buyer.id}&format=pdf`}
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Download Status PDF
              </a>
            )}
          </div>
        </div>

        {/* Isolation guarantee note */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Multi-tenant data isolation active. Only {buyerName} confirmed orders are accessible.</span>
          </div>
          <span>Showing {orders.length} Active Orders</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading your production orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Active Orders Found</h3>
            <p className="text-xs text-slate-500">There are currently no active production orders for your account.</p>
          </div>
        ) : (
          orders.map((order) => {
            const progressPct = Math.min(
              100,
              Math.round((order.currentProducedQty / order.totalQuantity) * 100)
            );
            const isRed = order.runRate?.riskStatus === "RED";
            const isAmber = order.runRate?.riskStatus === "AMBER";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-lg font-bold text-slate-900">{order.poNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isRed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isAmber
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isRed ? "Action Required" : isAmber ? "Moderate Delay Risk" : "On Track"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {order.style} &bull; Color: <strong>{order.color}</strong> &bull; Total Quantity:{" "}
                      <strong>{order.totalQuantity.toLocaleString()} pcs</strong>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Confirmed Ex-Factory</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {new Date(order.exFactoryDate).toISOString().split("T")[0]}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {order.runRate?.daysLeft} days remaining
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Current Status: <span className="text-blue-600 font-bold">{order.currentStage}</span>
                    </span>
                    <span>
                      {order.currentProducedQty.toLocaleString()} / {order.totalQuantity.toLocaleString()} pcs completed ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isRed ? "bg-rose-500" : isAmber ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Approved Delay Warnings (Only approved ones appear!) */}
                {order.warnings?.length > 0 && (
                  <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100 space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Production Advisory (Approved by Merchandising Head)</span>
                    </div>
                    {order.warnings.map((w: any) => (
                      <div key={w.id} className="text-xs text-rose-950 bg-white p-3 rounded-lg border border-rose-200">
                        <p className="font-semibold">{w.message}</p>
                        {w.reasonCategory && (
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Primary Factor: {w.reasonCategory} &bull; Verified by Factory Merchandiser
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Milestones Flow */}
                <div className="p-6 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Time & Action (TNA) Milestone Progression
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {order.milestones?.map((m: any) => {
                      const done = m.status === "COMPLETED";
                      const inProg = m.status === "IN_PROGRESS";
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border text-xs text-center space-y-1 ${
                            done
                              ? "bg-emerald-50/60 border-emerald-200"
                              : inProg
                              ? "bg-blue-50/60 border-blue-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase text-slate-400">Stage</div>
                          <div className="font-bold text-slate-900">{m.stage}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(m.targetDate).toISOString().split("T")[0]}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              done
                                ? "bg-emerald-600 text-white"
                                : inProg
                                ? "bg-blue-600 text-white"
                                : "text-slate-400"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Approved Photos Gallery */}
                {order.dailyUpdates?.some((u: any) => !!u.photoUrl) && (
                  <div className="px-6 pb-6 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Verified Production Floor Inspection Photos</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {order.dailyUpdates
                        ?.filter((u: any) => !!u.photoUrl)
                        .slice(0, 4)
                        .map((u: any) => (
                          <div key={u.id} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                            <img
                              src={u.photoUrl}
                              alt="Floor update"
                              className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs p-1.5 text-white text-[10px] flex justify-between">
                              <span>{u.stage}</span>
                              <span>{new Date(u.createdAt).toLocaleDateString("en-GB")}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

