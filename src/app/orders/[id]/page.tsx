"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileEdit,
  ShieldCheck,
  Camera,
  Bot,
  History,
  Check,
  Eye,
  Smartphone,
  Info,
  ChevronRight,
  Upload,
} from "lucide-react";

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [runRate, setRunRate] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ex-factory date edit modal state
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const [newExDate, setNewExDate] = useState<string>("");
  const [dateChangeReason, setDateChangeReason] = useState<string>("");
  const [savingDate, setSavingDate] = useState<boolean>(false);

  // AI Override state
  const [selectedAiItem, setSelectedAiItem] = useState<any>(null);
  const [overrideCategory, setOverrideCategory] = useState<string>("");
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

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

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Order not found or permission denied");
      }
      const data = await res.json();
      setOrder(data.order);
      setRunRate(data.runRate);
      setCurrentUser(data.currentUser);
      if (data.order?.exFactoryDate) {
        setNewExDate(new Date(data.order.exFactoryDate).toISOString().split("T")[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  // Handle ex-factory date update with compliance audit log
  const handleSaveDate = async () => {
    if (!newExDate || !dateChangeReason.trim()) {
      alert("Please provide both the new date and a compliance audit reason.");
      return;
    }

    try {
      setSavingDate(true);
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exFactoryDate: newExDate,
          reason: dateChangeReason.trim(),
          changedBy: currentUser?.name || "Merchandiser",
        }),
      });

      if (res.ok) {
        setIsEditingDate(false);
        setDateChangeReason("");
        await fetchOrder();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update date");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating date");
    } finally {
      setSavingDate(false);
    }
  };

  // Handle warning approval for buyer portal
  const handleToggleWarningApproval = async (warningId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/warnings/${warningId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: !currentStatus,
          approverName: currentUser?.name || "Karthik Raja (Senior Merchandiser)",
        }),
      });
      if (res.ok) {
        await fetchOrder();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle AI Category Override
  const handleSaveCategoryOverride = async () => {
    if (!selectedAiItem || !overrideCategory) return;
    try {
      setSavingCategory(true);
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiAnalysisId: selectedAiItem.id,
          finalCategory: overrideCategory,
          reviewerName: currentUser?.name || "Karthik Raja",
        }),
      });
      if (res.ok) {
        setSelectedAiItem(null);
        await fetchOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading 360° Order Details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied or Not Found</h2>
        <p className="text-sm text-slate-600">{error || "Could not retrieve order details."}</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isBuyerRole = currentUser?.role === "BUYER";
  const progressPct = Math.min(100, Math.round((order.currentProducedQty / order.totalQuantity) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Order Board
        </Link>

        {!isBuyerRole && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditingDate(true)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Adjust Ex-Factory Date
            </button>

            <Link
              href={`/supervisor?po=${order.poNumber}`}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              Enter Floor Update
            </Link>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-xl font-extrabold text-slate-900">{order.poNumber}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  (runRate?.riskStatus || order.riskStatus) === "GREEN"
                    ? "bg-emerald-100 text-emerald-800"
                    : (runRate?.riskStatus || order.riskStatus) === "AMBER"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {runRate?.riskStatus || order.riskStatus} STATUS
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-800 mt-1">
              {order.style} &bull; <span className="text-slate-500 font-normal">Color: {order.color}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Buyer: <strong>{order.buyer.name}</strong> ({order.buyer.country}) &bull; Unit:{" "}
              <strong>{order.unit.name}</strong> ({order.unit.type === "OWN" ? "In-House" : "Vendor"})
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="block text-slate-400 font-medium text-[10px] uppercase">Total Order</span>
              <span className="text-base font-extrabold text-slate-900">{order.totalQuantity.toLocaleString()} pcs</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium text-[10px] uppercase">Produced</span>
              <span className="text-base font-extrabold text-blue-600">
                {order.currentProducedQty.toLocaleString()} pcs
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium text-[10px] uppercase">Ex-Factory Date</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {new Date(order.exFactoryDate).toISOString().split("T")[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Current Stage: <span className="text-blue-600 font-bold">{order.currentStage}</span>
            </span>
            <span className="font-medium text-slate-500">
              {order.currentProducedQty.toLocaleString()} / {order.totalQuantity.toLocaleString()} completed ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (runRate?.riskStatus || order.riskStatus) === "RED"
                  ? "bg-rose-500"
                  : (runRate?.riskStatus || order.riskStatus) === "AMBER"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* RUN-RATE MATHEMATICAL ENGINE PROOF PANEL (Prominently displayed) */}
      {!isBuyerRole && runRate && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-blue-500/20 text-blue-400">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Run-Rate Delay Mathematical Engine Proof
              </h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                runRate.riskStatus === "GREEN"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : runRate.riskStatus === "AMBER"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {runRate.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* 1. Remaining Qty */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Qty</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {runRate.remainingQty.toLocaleString()} pcs
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Total - Produced</span>
            </div>

            {/* 2. Days Left */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Days Remaining</span>
              <span className="text-lg font-bold text-white mt-1 block">{runRate.daysLeft} days</span>
              <span className="text-[10px] text-slate-400 font-mono">To Ex-Factory</span>
            </div>

            {/* 3. Required Rate */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-blue-400 uppercase font-semibold block">Required Rate</span>
              <span className="text-lg font-bold text-blue-300 mt-1 block">
                {runRate.requiredRate.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">pcs / day</span>
            </div>

            {/* 4. Actual Rate */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-purple-400 uppercase font-semibold block">Actual Rate</span>
              <span className="text-lg font-bold text-purple-300 mt-1 block">
                {runRate.actualRate.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">7-day avg / day</span>
            </div>

            {/* 5. Difference */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Difference</span>
              <span
                className={`text-lg font-bold mt-1 block ${
                  runRate.difference >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {runRate.difference > 0 ? "+" : ""}
                {runRate.difference.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{runRate.ratioPercentage}% throughput</span>
            </div>

            {/* 6. Projected Delay */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Projected Delay</span>
              <span
                className={`text-lg font-bold mt-1 block ${
                  runRate.projectedDelayDays > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {runRate.projectedDelayDays > 0 ? `+${runRate.projectedDelayDays}d late` : `On Time`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {runRate.projectedDaysNeeded} days needed
              </span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 text-[11px] font-mono text-slate-300 space-y-1">
            <div>
              &bull; <strong>Formula:</strong> Required Pieces Per Day = {runRate.remainingQty} pcs &divide;{" "}
              {runRate.daysLeft} days = {runRate.requiredRate} pcs/day
            </div>
            <div>
              &bull; <strong>Actual Floor Pace:</strong> {runRate.actualRate} pcs/day vs {runRate.requiredRate} pcs/day
              required ({runRate.ratioPercentage}%)
            </div>
          </div>
        </div>
      )}

      {/* Grid: TNA Timeline & Size Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TNA Milestones Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              TNA Milestones Timeline
            </h2>
            <span className="text-xs text-slate-400">6 Stages Standard</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {order.milestones?.map((m: any, idx: number) => {
              const isCompleted = m.status === "COMPLETED";
              const isInProgress = m.status === "IN_PROGRESS";

              return (
                <div key={m.id} className="relative flex items-start justify-between text-xs">
                  {/* Indicator Dot */}
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isCompleted
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : isInProgress
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {isCompleted && <Check className="w-2.5 h-2.5" />}
                  </span>

                  <div>
                    <div className="font-bold text-slate-900 text-sm">{m.stage}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Target:{" "}
                      <span className="font-mono text-slate-700">
                        {new Date(m.targetDate).toISOString().split("T")[0]}
                      </span>
                      {m.completedDate && (
                        <span className="ml-2 text-emerald-600 font-semibold">
                          &bull; Completed {new Date(m.completedDate).toISOString().split("T")[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700"
                        : isInProgress
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Size Breakup Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Size Breakup
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{order.totalQuantity.toLocaleString()} pcs</span>
          </div>

          <div className="space-y-2.5">
            {order.sizeBreakdowns?.map((sb: any) => {
              const pct = Math.round((sb.quantity / order.totalQuantity) * 100);
              return (
                <div key={sb.id} className="text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700 font-bold">Size {sb.size}</span>
                    <span className="text-slate-900 font-mono">
                      {sb.quantity.toLocaleString()} pcs ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-800" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warnings & Risk Approvals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Run-Rate Delay Warnings & Buyer Visibility Gate
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Buyers only see warnings that have been explicitly confirmed and approved by a merchandiser.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {order.warnings?.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No delay warnings currently logged for this order.
            </div>
          ) : (
            order.warnings?.map((w: any) => {
              const isRed = w.severity === "RED";
              return (
                <div
                  key={w.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isRed ? "bg-rose-50/70 border-rose-200" : "bg-amber-50/70 border-amber-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRed ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                        }`}
                      >
                        {w.severity} ALERT
                      </span>
                      {w.reasonCategory && (
                        <span className="font-semibold text-slate-800">
                          Category: {w.reasonCategory}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(w.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">{w.message}</p>
                    <div className="text-[11px] text-slate-600 font-mono">
                      Throughput: {w.actualRate} pcs/day vs {w.requiredRate} pcs/day required &bull; Projected Delay:{" "}
                      {w.projectedDelayDays} days
                    </div>
                  </div>

                  {/* Buyer Visibility Status & Toggle */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.isApprovedForBuyer
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {w.isApprovedForBuyer ? "Visible to Buyer" : "Internal Merchandiser Only"}
                      </span>
                      {w.approvedBy && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Approved by: {w.approvedBy}</div>
                      )}
                    </div>

                    {!isBuyerRole && (
                      <button
                        onClick={() => handleToggleWarningApproval(w.id, w.isApprovedForBuyer)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          w.isApprovedForBuyer
                            ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {w.isApprovedForBuyer ? "Revoke Visibility" : "Approve for Buyer Portal"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Daily Floor Updates & AI Issue Reviews */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Daily Floor Updates & AI Categorization
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisor observations, floor photos, Tamil translations, and reason categories.
            </p>
          </div>

          {!isBuyerRole && (
            <Link
              href={`/supervisor?po=${order.poNumber}`}
              className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            >
              + Submit Floor Update
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {order.dailyUpdates?.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No daily floor updates recorded yet.
            </div>
          ) : (
            order.dailyUpdates?.map((u: any) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{u.stage}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      +{u.quantityCompleted.toLocaleString()} pcs
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")} {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {u.supervisorName && (
                    <span className="text-[11px] text-slate-500">
                      Logged by: <strong>{u.supervisorName}</strong>
                    </span>
                  )}
                </div>

                {/* Content: Photo + Notes + AI */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Photo if present */}
                  {u.photoUrl && (
                    <div className="md:col-span-1">
                      <img
                        src={u.photoUrl}
                        alt="Production floor inspection"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Notes & AI Analysis */}
                  <div className={u.photoUrl ? "md:col-span-3 space-y-2.5" : "md:col-span-4 space-y-2.5"}>
                    {/* Raw Note */}
                    {u.rawNote && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Original Supervisor Note (Tamil / English)
                        </span>
                        <p className="text-slate-800 font-medium">{u.rawNote}</p>
                      </div>
                    )}

                    {/* AI Translation & Classification */}
                    {u.aiAnalysis && (
                      <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                            <Bot className="w-3.5 h-3.5 text-indigo-600" />
                            <span>AI Translation & Delay Classification</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-indigo-600 font-medium">
                              Confidence: {Math.round(u.aiAnalysis.confidence * 100)}%
                            </span>
                            {!isBuyerRole && (
                              <button
                                onClick={() => {
                                  setSelectedAiItem(u.aiAnalysis);
                                  setOverrideCategory(u.aiAnalysis.finalCategory);
                                }}
                                className="text-[11px] font-bold text-indigo-700 hover:underline"
                              >
                                Override Category
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-slate-700">
                          <span className="font-semibold text-slate-900">Translation: </span>
                          {u.aiAnalysis.translation}
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <span className="text-slate-500">Predicted: </span>
                          <span className="font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {u.aiAnalysis.finalCategory}
                          </span>
                          {u.aiAnalysis.isOverridden && (
                            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                              (Manual Override by {u.aiAnalysis.reviewedBy})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compliance Audit Trail */}
      {!isBuyerRole && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Compliance Audit Trail (Date & Milestone Changes)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Required by EU/UK Compliance</span>
          </div>

          <div className="space-y-3">
            {order.auditLogs?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No audited changes recorded yet.
              </div>
            ) : (
              order.auditLogs?.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.field}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-rose-600 line-through">{log.oldValue}</span>
                      <span>&rarr;</span>
                      <span className="text-emerald-700 font-bold">{log.newValue}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Reason: <em>"{log.reason}"</em>
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <div>Changed by: <strong>{log.changedBy}</strong></div>
                    <div className="text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString("en-GB")} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ex-Factory Date Adjustment Modal with Compliance Reason */}
      {isEditingDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Adjust Ex-Factory Date</h3>
              <button
                onClick={() => setIsEditingDate(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Every date amendment is recorded immutably in the buyer compliance audit log with your name and justification.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Ex-Factory Date *</label>
                <input
                  type="date"
                  value={newExDate}
                  onChange={(e) => setNewExDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compliance Reason for Date Change *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Buyer approved airfreight shipment delay due to yarn shortage..."
                  value={dateChangeReason}
                  onChange={(e) => setDateChangeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingDate(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingDate}
                onClick={handleSaveDate}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {savingDate ? "Saving & Auditing..." : "Save & Record Audit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Category Override Modal */}
      {selectedAiItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Review & Override AI Category</h3>
            <p className="text-xs text-slate-500">
              The AI categorized this note as <strong>{selectedAiItem.predictedCategory}</strong>. As merchandiser, you can verify or reclassify it.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-700">Note: {selectedAiItem.originalNote}</div>
              <div className="text-slate-500">Translation: {selectedAiItem.translation}</div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Select Correct Category</label>
              <select
                value={overrideCategory}
                onChange={(e) => setOverrideCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAiItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingCategory}
                onClick={handleSaveCategoryOverride}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                {savingCategory ? "Updating..." : "Save Classification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

