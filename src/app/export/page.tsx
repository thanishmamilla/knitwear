"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  Building,
  ArrowRight,
  ShieldCheck,
  Layers,
} from "lucide-react";

export default function ExportCenterPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, oRes] = await Promise.all([fetch("/api/buyers"), fetch("/api/orders")]);
        if (bRes.ok) {
          const bData = await bRes.json();
          setBuyers(bData.buyers || []);
          if (bData.buyers?.length > 0) setSelectedBuyerId(bData.buyers[0].id);
        }
        if (oRes.ok) {
          const oData = await oRes.json();
          setOrders(oData.orders || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedBuyer = buyers.find((b) => b.id === selectedBuyerId);
  const buyerOrders = orders.filter((o) => o.buyerId === selectedBuyerId);

  const downloadUrl = `/api/export?buyerId=${selectedBuyerId}&format=${format}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Weekly Buyer Status Export Center
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Generate comprehensive production status dossiers formatted in Microsoft Excel or print-ready PDF per buyer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Buyer & Format Select */}
        <div className="space-y-4">
          {/* Buyer Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Select Buyer
            </label>
            <div className="space-y-2">
              {buyers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBuyerId(b.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    selectedBuyerId === b.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{b.name}</span>
                    <span className="text-[10px] opacity-75">{b.country}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 text-xs font-bold transition-all ${
                  format === "excel"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 text-xs font-bold transition-all ${
                  format === "pdf"
                    ? "bg-rose-50 text-rose-900 border-rose-400 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-5 h-5 text-rose-600" />
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          {/* Instant Download Button */}
          <a
            href={downloadUrl}
            download
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download {format.toUpperCase()}</span>
          </a>
        </div>

        {/* Right Column: Preview of Included Dossier Data */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Export Dossier Preview: {selectedBuyer?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Includes all orders, risk indicators, TNA milestone checkpoints, and production photo links.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              {buyerOrders.length} Orders Included
            </span>
          </div>

          <div className="space-y-3">
            {buyerOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active orders found for this buyer.
              </div>
            ) : (
              buyerOrders.map((o) => {
                const isRed = o.runRate.riskStatus === "RED";
                const isAmber = o.runRate.riskStatus === "AMBER";

                return (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{o.poNumber}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-medium text-slate-700">{o.style}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRed
                            ? "bg-rose-100 text-rose-800"
                            : isAmber
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {o.runRate.riskStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono">
                      <div>
                        Total: <strong>{o.totalQuantity.toLocaleString()}</strong> pcs
                      </div>
                      <div>
                        Done: <strong>{o.currentProducedQty.toLocaleString()}</strong> pcs
                      </div>
                      <div>
                        Days Left: <strong>{o.runRate.daysLeft}</strong> days
                      </div>
                      <div>
                        Ex-Factory:{" "}
                        <strong>{new Date(o.exFactoryDate).toISOString().split("T")[0]}</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                      <span>Milestones: {o.milestones?.map((m: any) => m.stage).join(" &rarr; ")}</span>
                      <span>
                        Photos: {o.dailyUpdates?.filter((u: any) => !!u.photoUrl).length || 0} attached
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

