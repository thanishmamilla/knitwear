"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Bot,
  CheckCircle2,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

export default function RiskAnalysisPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Category Override state
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [overrideCat, setOverrideCat] = useState<string>("");

  const CATEGORIES = [
    "Machine Breakdown",
    "Material Delay",
    "Quality Issue",
    "Labour Shortage",
    "Printing Delay",
    "Washing Delay",
    "Approval Pending",
    "Other",
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders that have warnings or are AMBER/RED
  const atRiskOrders = orders.filter(
    (o) => o.runRate.riskStatus === "RED" || o.runRate.riskStatus === "AMBER" || o.warnings?.length > 0
  );

  // Handle warning approval
  const handleToggleApproval = async (warningId: string, currentStatus: boolean) => {
    try {
      setActionLoading(warningId);
      const res = await fetch(`/api/warnings/${warningId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !currentStatus }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle AI Category Override
  const handleSaveOverride = async (analysisId: string) => {
    if (!overrideCat) return;
    try {
      setActionLoading(analysisId);
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiAnalysisId: analysisId,
          finalCategory: overrideCat,
          reviewerName: "Karthik Raja (Senior Merchandiser)",
        }),
      });
      if (res.ok) {
        setEditingAnalysisId(null);
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Risk Analysis & Early Delay Warning Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Run-rate delay projections, Tamil AI floor note verification, and Buyer Warning authorization gate.
            </p>
          </div>
        </div>
      </div>

      {/* Warning Workflow Architecture Pill */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Warning Approval Protocol:</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold">1. Floor Rate Lag</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">2. Pending Review</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">3. Merchandiser Approval</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">4. Published to Buyer</span>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading risk projections...</div>
        ) : atRiskOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">All Production Orders On Track</h3>
            <p className="text-xs text-slate-500">Every active order is pacing at &ge; 100% of required throughput.</p>
          </div>
        ) : (
          atRiskOrders.map((order) => {
            const isRed = order.runRate.riskStatus === "RED";
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0"
              >
                {/* Header bar */}
                <div
                  className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b ${
                    isRed ? "bg-rose-50/60 border-rose-100" : "bg-amber-50/60 border-amber-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        isRed ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                      }`}
                    >
                      {order.runRate.riskStatus} RISK
                    </span>
                    <div>
                      <span className="font-mono text-base font-bold text-slate-900">{order.poNumber}</span>
                      <span className="text-xs text-slate-600 ml-2">
                        {order.style} ({order.color}) &bull; {order.buyer.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-medium">
                    <span className="text-slate-600">
                      Unit: <strong>{order.unit.name}</strong>
                    </span>
                    <span className="text-slate-600">
                      Ex-Factory:{" "}
                      <strong className="font-mono">
                        {new Date(order.exFactoryDate).toISOString().split("T")[0]}
                      </strong>
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold"
                    >
                      360° Order Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Math Proof Row */}
                <div className="p-6 bg-slate-900 text-white space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Transparent Run-Rate Mathematical Proof
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Remaining Qty</span>
                      <span className="text-sm font-bold mt-0.5 block">
                        {order.runRate.remainingQty.toLocaleString()} pcs
                      </span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Days Left</span>
                      <span className="text-sm font-bold mt-0.5 block">{order.runRate.daysLeft} days</span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-blue-400 block">Required Rate</span>
                      <span className="text-sm font-bold text-blue-300 mt-0.5 block">
                        {order.runRate.requiredRate} pcs/d
                      </span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-purple-400 block">Actual Rate (7d)</span>
                      <span className="text-sm font-bold text-purple-300 mt-0.5 block">
                        {order.runRate.actualRate} pcs/d
                      </span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Throughput Ratio</span>
                      <span
                        className={`text-sm font-bold mt-0.5 block ${
                          order.runRate.difference >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {order.runRate.ratioPercentage}%
                      </span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Projected Delay</span>
                      <span className="text-sm font-bold text-rose-400 mt-0.5 block">
                        +{order.runRate.projectedDelayDays} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Floor Notes & Translations */}
                <div className="p-6 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Supervisor Floor Notes & AI Categorization Review</span>
                  </div>

                  <div className="space-y-3">
                    {order.dailyUpdates?.filter((u: any) => u.aiAnalysis).length === 0 ? (
                      <p className="text-xs text-slate-400">No AI-analyzed notes for this order.</p>
                    ) : (
                      order.dailyUpdates
                        ?.filter((u: any) => u.aiAnalysis)
                        .map((u: any) => {
                          const ai = u.aiAnalysis;
                          const isEditing = editingAnalysisId === ai.id;

                          return (
                            <div
                              key={ai.id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2.5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-800">Stage: {u.stage}</span>
                                  <span className="text-slate-400">&bull;</span>
                                  <span className="text-slate-500">
                                    Logged: {new Date(u.createdAt).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                                <span className="text-indigo-600 font-semibold text-[11px]">
                                  AI Confidence: {Math.round(ai.confidence * 100)}%
                                </span>
                              </div>

                              {/* Side-by-side Tamil vs Translation */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Original Tamil Floor Note
                                  </span>
                                  <p className="text-slate-800 font-medium">{ai.originalNote}</p>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    English Translation (Llama AI)
                                  </span>
                                  <p className="text-slate-800 font-medium">{ai.translation}</p>
                                </div>
                              </div>

                              {/* Category & Override Control */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-slate-500">Final Category:</span>
                                  <span className="px-2.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                    {ai.finalCategory}
                                  </span>
                                  {ai.isOverridden && (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                      Overridden by {ai.reviewedBy}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <select
                                        value={overrideCat}
                                        onChange={(e) => setOverrideCat(e.target.value)}
                                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                                      >
                                        {CATEGORIES.map((cat) => (
                                          <option key={cat} value={cat}>
                                            {cat}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        disabled={actionLoading === ai.id}
                                        onClick={() => handleSaveOverride(ai.id)}
                                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingAnalysisId(null)}
                                        className="px-2 py-1 text-slate-500 hover:text-slate-800"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAnalysisId(ai.id);
                                        setOverrideCat(ai.finalCategory);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 font-bold"
                                    >
                                      Override Reason Category &rarr;
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Warning Approval Gate */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Active Delay Warnings for Buyer Portal
                  </div>

                  <div className="space-y-2">
                    {order.warnings?.map((w: any) => (
                      <div
                        key={w.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.severity === "RED" ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                              }`}
                            >
                              {w.severity}
                            </span>
                            <span className="font-semibold text-slate-900">{w.message}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Status:{" "}
                            <strong className={w.isApprovedForBuyer ? "text-emerald-700" : "text-amber-700"}>
                              {w.isApprovedForBuyer ? "Visible to Buyer" : "Pending Merchandiser Approval"}
                            </strong>
                            {w.approvedBy && ` (Approved by ${w.approvedBy})`}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={actionLoading === w.id}
                          onClick={() => handleToggleApproval(w.id, w.isApprovedForBuyer)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                            w.isApprovedForBuyer
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                          }`}
                        >
                          {w.isApprovedForBuyer ? "Revoke Visibility" : "Approve for Buyer Portal"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

