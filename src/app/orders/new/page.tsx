"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CreateOrderPage() {
  const router = useRouter();

  const [poNumber, setPoNumber] = useState<string>("");
  const [buyerId, setBuyerId] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [totalQuantity, setTotalQuantity] = useState<number>(10000);
  const [exFactoryDate, setExFactoryDate] = useState<string>("2026-12-05");

  // Sizes: S, M, L, XL, XXL
  const [sizeS, setSizeS] = useState<number>(2000);
  const [sizeM, setSizeM] = useState<number>(3000);
  const [sizeL, setSizeL] = useState<number>(3000);
  const [sizeXL, setSizeXL] = useState<number>(1500);
  const [sizeXXL, setSizeXXL] = useState<number>(500);

  const [buyers, setBuyers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load buyers and units
  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, uRes] = await Promise.all([fetch("/api/buyers"), fetch("/api/units")]);
        if (bRes.ok) {
          const b = await bRes.json();
          setBuyers(b.buyers || []);
          if (b.buyers?.length > 0) setBuyerId(b.buyers[0].id);
        }
        if (uRes.ok) {
          const u = await uRes.json();
          setUnits(u.units || []);
          if (u.units?.length > 0) setUnitId(u.units[0].id);
        }
      } catch (err) {
        console.error("Failed to load buyers/units:", err);
      }
    }
    loadData();
  }, []);

  const sizeSum = (sizeS || 0) + (sizeM || 0) + (sizeL || 0) + (sizeXL || 0) + (sizeXXL || 0);
  const sizeMatches = sizeSum === Number(totalQuantity);

  // Auto-distribute standard 20:30:30:15:5 knitwear ratio
  const handleAutoDistribute = () => {
    const total = Number(totalQuantity) || 10000;
    setSizeS(Math.round(total * 0.2));
    setSizeM(Math.round(total * 0.3));
    setSizeL(Math.round(total * 0.3));
    setSizeXL(Math.round(total * 0.15));
    setSizeXXL(total - (Math.round(total * 0.2) + Math.round(total * 0.3) + Math.round(total * 0.3) + Math.round(total * 0.15)));
  };

  // Preview TNA schedule
  const getMilestonePreview = () => {
    if (!exFactoryDate) return [];
    const ex = new Date(exFactoryDate);
    const stages = [
      { name: "Cutting", daysBefore: 24 },
      { name: "Printing", daysBefore: 18 },
      { name: "Stitching", daysBefore: 10 },
      { name: "Washing", daysBefore: 6 },
      { name: "Finishing", daysBefore: 3 },
      { name: "Packing", daysBefore: 1 },
    ];
    return stages.map((s) => {
      const d = new Date(ex);
      d.setDate(d.getDate() - s.daysBefore);
      return {
        stage: s.name,
        targetDate: d.toISOString().split("T")[0],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!poNumber.trim()) {
      setError("Please enter a PO Number");
      return;
    }
    if (!style.trim()) {
      setError("Please enter Style name");
      return;
    }
    if (!sizeMatches) {
      setError(`Size breakdown sum (${sizeSum.toLocaleString()}) does not match Total Quantity (${Number(totalQuantity).toLocaleString()})`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: poNumber.trim().toUpperCase(),
          buyerId,
          style: style.trim(),
          color: color.trim() || "Navy",
          unitId,
          totalQuantity: Number(totalQuantity),
          exFactoryDate,
          sizeBreakdown: {
            S: sizeS,
            M: sizeM,
            L: sizeL,
            XL: sizeXL,
            XXL: sizeXXL,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Order Board
        </Link>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Order Booking Setup</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure order parameters, size matrix, and initialize automated 6-stage TNA milestones.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Order Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Order Header Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PO Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. B-PO-99120"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono uppercase"
              />
            </div>

            {/* Buyer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer (Client) *</label>
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Style Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Men's heavy jersey crew neck tee"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colorway *</label>
              <input
                type="text"
                required
                placeholder="e.g. Navy, White, Mustard"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Manufacturing Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Production Unit *</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.type === "OWN" ? "In-House Unit" : "Subcontractor"}) &bull; {u.dailyCapacity} pcs/day
                  </option>
                ))}
              </select>
            </div>

            {/* Ex Factory Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ex-Factory Date *</label>
              <input
                type="date"
                required
                value={exFactoryDate}
                onChange={(e) => setExFactoryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>
        </div>

        {/* Size Breakdown Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">2. Order Quantity & Size Matrix</h2>
              <p className="text-xs text-slate-500 mt-0.5">Define S, M, L, XL, XXL ratio.</p>
            </div>
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Standard Ratio (20:30:30:15:5)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Qty (pcs)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size S</label>
              <input
                type="number"
                min="0"
                value={sizeS}
                onChange={(e) => setSizeS(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size M</label>
              <input
                type="number"
                min="0"
                value={sizeM}
                onChange={(e) => setSizeM(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size L</label>
              <input
                type="number"
                min="0"
                value={sizeL}
                onChange={(e) => setSizeL(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size XL</label>
              <input
                type="number"
                min="0"
                value={sizeXL}
                onChange={(e) => setSizeXL(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Size XXL</label>
              <input
                type="number"
                min="0"
                value={sizeXXL}
                onChange={(e) => setSizeXXL(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Validation Pill */}
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
              sizeMatches
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {sizeMatches ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>
                Total Size Sum: <strong>{sizeSum.toLocaleString()} pcs</strong> / Required:{" "}
                <strong>{Number(totalQuantity).toLocaleString()} pcs</strong>
              </span>
            </div>
            {!sizeMatches && (
              <span className="font-semibold">
                Difference: {Math.abs(sizeSum - Number(totalQuantity)).toLocaleString()} pcs
              </span>
            )}
          </div>
        </div>

        {/* TNA Milestones Template Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                3. Auto-Generated TNA Milestones Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically calculated lead time schedules based on standard Tiruppur knitwear workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {getMilestonePreview().map((m, idx) => (
              <div
                key={m.stage}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step {idx + 1}
                </div>
                <div className="text-xs font-bold text-slate-900">{m.stage}</div>
                <div className="text-[11px] text-blue-600 font-mono">{m.targetDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !sizeMatches}
            className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {loading ? "Creating Order..." : "Confirm & Book Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

