"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Plus,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

interface OrderItem {
  id: string;
  poNumber: string;
  style: string;
  color: string;
  totalQuantity: number;
  currentProducedQty: number;
  currentStage: string;
  riskStatus: string;
  exFactoryDate: string;
  buyer: {
    id: string;
    name: string;
    code: string;
    country: string;
  };
  unit: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  runRate: {
    remainingQty: number;
    daysLeft: number;
    requiredRate: number;
    actualRate: number;
    difference: number;
    ratioPercentage: number;
    projectedDelayDays: number;
    riskStatus: "GREEN" | "AMBER" | "RED";
    statusLabel: string;
    mathExplanation: {
      remainingFormula: string;
      daysFormula: string;
      requiredFormula: string;
      actualFormula: string;
      differenceFormula: string;
      projectedFormula: string;
      delayFormula: string;
    };
  };
  milestones: any[];
  warnings: any[];
  dailyUpdates: any[];
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [buyerFilter, setBuyerFilter] = useState<string>("ALL");
  const [unitFilter, setUnitFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Options
  const [buyers, setBuyers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Math modal / tooltip state
  const [selectedMathOrder, setSelectedMathOrder] = useState<OrderItem | null>(null);

  const fetchFilters = async () => {
    try {
      const [bRes, uRes] = await Promise.all([
        fetch("/api/buyers"),
        fetch("/api/units"),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBuyers(bData.buyers || []);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUnits(uData.units || []);
      }
    } catch (e) {
      console.error("Filter fetch error:", e);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buyerFilter !== "ALL") params.set("buyerId", buyerFilter);
      if (unitFilter !== "ALL") params.set("unitId", unitFilter);
      if (riskFilter !== "ALL") params.set("risk", riskFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setKpis(data.kpis);
        setCurrentUser(data.currentUser);
      }
    } catch (err) {
      console.error("Orders load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [buyerFilter, unitFilter, riskFilter, search]);

  // If user is buyer, show a tailored header note with link to buyer portal
  const isBuyerRole = currentUser?.role === "BUYER";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Role Alert */}
      {isBuyerRole && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Logged in as {currentUser?.name} ({currentUser?.buyer?.name})
              </p>
              <p className="text-xs text-blue-700">
                Order isolation active: Only your company's confirmed orders, milestones, and approved updates are visible.
              </p>
            </div>
          </div>
          <Link
            href="/buyer"
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            Go to Buyer Portal <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Production Order Board</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time shop floor run rates, early delay risk indicators, and TNA progress across all 5 units.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/export"
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export Status
          </Link>

          {!isBuyerRole && (
            <Link
              href="/orders/new"
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Order Setup
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{kpis.totalOrders}</span>
              <span className="text-xs text-slate-500">Active POs</span>
            </div>
          </div>

          {/* Green Orders */}
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider">On Schedule</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-700">{kpis.greenOrders}</span>
              <span className="text-xs font-medium text-emerald-600">Green Status</span>
            </div>
          </div>

          {/* Amber Orders */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-semibold uppercase tracking-wider">At Risk</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-700">{kpis.amberOrders}</span>
              <span className="text-xs font-medium text-amber-600">80–99% rate</span>
            </div>
          </div>

          {/* Red Orders */}
          <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Critical Delay</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-700">{kpis.redOrders}</span>
              <span className="text-xs font-medium text-rose-600">&lt; 80% rate</span>
            </div>
          </div>

          {/* Due This Week */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Due This Week</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{kpis.dueThisWeek}</span>
              <span className="text-xs text-slate-500">&le; 7 days</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PO number, style name, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Buyer Filter */}
            {!isBuyerRole && (
              <div className="flex items-center text-xs">
                <span className="text-slate-500 mr-1.5 font-medium">Buyer:</span>
                <select
                  value={buyerFilter}
                  onChange={(e) => setBuyerFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Buyers</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unit Filter */}
            <div className="flex items-center text-xs">
              <span className="text-slate-500 mr-1.5 font-medium">Unit:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Status Filter */}
            <div className="flex items-center text-xs">
              <span className="text-slate-500 mr-1.5 font-medium">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="GREEN">Green (On Schedule)</option>
                <option value="AMBER">Amber (At Risk)</option>
                <option value="RED">Red (Critical Delay)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Buyer</th>
                <th className="py-3.5 px-4">Style & Color</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Stage & Progress</th>
                <th className="py-3.5 px-4 text-right">Remaining</th>
                <th className="py-3.5 px-4 text-right">Days Left</th>
                <th className="py-3.5 px-4 text-center">Run-Rate Risk</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading production orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const progressPct = Math.min(
                    100,
                    Math.round((order.currentProducedQty / order.totalQuantity) * 100)
                  );
                  const isRed = order.runRate.riskStatus === "RED";
                  const isAmber = order.runRate.riskStatus === "AMBER";
                  const isGreen = order.runRate.riskStatus === "GREEN";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* PO Number */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Link
                          href={`/orders/${order.id}`}
                          className="hover:text-blue-600 transition-colors flex items-center space-x-1"
                        >
                          <span>{order.poNumber}</span>
                        </Link>
                      </td>

                      {/* Buyer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{order.buyer.name}</div>
                        <div className="text-[10px] text-slate-400">{order.buyer.country}</div>
                      </td>

                      {/* Style & Color */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{order.style}</div>
                        <div className="text-[11px] text-slate-500">Color: {order.color}</div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {order.unit.name}
                        </span>
                      </td>

                      {/* Stage & Progress */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">{order.currentStage}</span>
                          <span className="text-slate-500">
                            {order.currentProducedQty.toLocaleString()} / {order.totalQuantity.toLocaleString()} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isRed ? "bg-rose-500" : isAmber ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Remaining Qty */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {order.runRate.remainingQty.toLocaleString()} pcs
                      </td>

                      {/* Days Left */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            order.runRate.daysLeft <= 3
                              ? "text-rose-600"
                              : order.runRate.daysLeft <= 7
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {order.runRate.daysLeft} days
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Ex: {new Date(order.exFactoryDate).toISOString().split("T")[0]}
                        </div>
                      </td>

                      {/* Run-Rate Risk Pill (Interactive Math Trigger) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedMathOrder(order)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-2xs hover:scale-105 cursor-pointer ${
                            isGreen
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : isAmber
                              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isGreen ? "bg-emerald-600" : isAmber ? "bg-amber-600" : "bg-rose-600 animate-pulse"
                            }`}
                          />
                          {order.runRate.riskStatus}
                          <Info className="w-3 h-3 ml-1 opacity-70" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                            title="View Order Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {!isBuyerRole && (
                            <Link
                              href={`/supervisor?po=${order.poNumber}`}
                              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                              title="Update floor production"
                            >
                              + Floor Update
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Rate Math Proof Modal */}
      {selectedMathOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedMathOrder.runRate.riskStatus === "GREEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedMathOrder.runRate.riskStatus === "AMBER"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedMathOrder.runRate.riskStatus} RISK
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Run-Rate Mathematical Proof
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  PO: {selectedMathOrder.poNumber} &bull; {selectedMathOrder.style} ({selectedMathOrder.buyer.name})
                </p>
              </div>
              <button
                onClick={() => setSelectedMathOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Formula Breakdown Cards */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Remaining Qty:</span>
                <span className="font-semibold text-slate-900">
                  {selectedMathOrder.runRate.mathExplanation.remainingFormula}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Days Remaining:</span>
                <span className="font-semibold text-slate-900">
                  {selectedMathOrder.runRate.mathExplanation.daysFormula}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Required Rate:</span>
                <span className="font-bold text-blue-700">
                  {selectedMathOrder.runRate.mathExplanation.requiredFormula}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Actual Rate (7-Day Avg):</span>
                <span className="font-bold text-purple-700">
                  {selectedMathOrder.runRate.mathExplanation.actualFormula}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Throughput Ratio:</span>
                <span
                  className={`font-bold ${
                    selectedMathOrder.runRate.ratioPercentage >= 100
                      ? "text-emerald-700"
                      : selectedMathOrder.runRate.ratioPercentage >= 80
                      ? "text-amber-700"
                      : "text-rose-700"
                  }`}
                >
                  {selectedMathOrder.runRate.mathExplanation.differenceFormula}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-sans">Projected Slippage:</span>
                <span
                  className={`font-bold ${
                    selectedMathOrder.runRate.projectedDelayDays > 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {selectedMathOrder.runRate.mathExplanation.delayFormula}
                </span>
              </div>
            </div>

            {/* Status Rules Callout */}
            <div className="text-[11px] text-slate-500 bg-slate-100/70 rounded-lg p-3">
              <span className="font-semibold text-slate-700">Threshold Rules: </span>
              Green: &ge; 100% throughput &bull; Amber: 80%–99% throughput &bull; Red: &lt; 80% throughput
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <Link
                href={`/orders/${selectedMathOrder.id}`}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                onClick={() => setSelectedMathOrder(null)}
              >
                Open Full 360° Order Details &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
