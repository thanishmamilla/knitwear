"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, ShieldCheck, Search, Filter, Calendar, User, ArrowRight } from "lucide-react";

export default function AuditHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

  // Aggregate all audit logs from all orders
  const allLogs: any[] = [];
  orders.forEach((o) => {
    if (o.auditLogs) {
      o.auditLogs.forEach((log: any) => {
        allLogs.push({
          ...log,
          poNumber: o.poNumber,
          style: o.style,
          orderId: o.id,
          buyerName: o.buyer?.name,
        });
      });
    }
  });

  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter logs
  const filteredLogs = allLogs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.poNumber?.toLowerCase().includes(q) ||
      log.field?.toLowerCase().includes(q) ||
      log.changedBy?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Compliance Audit Trail & Change History
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all ex-factory date revisions, milestone schedule amendments, and buyer visibility changes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            EU/UK Compliance Ready
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO, field name, changed by, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 ml-4">
          Showing <strong>{filteredLogs.length}</strong> logged events
        </span>
      </div>

      {/* Timeline view */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading compliance audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No audit log records found.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative text-xs space-y-1.5">
                {/* Dot */}
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-white" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/orders/${log.orderId}`}
                      className="font-mono font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {log.poNumber}
                    </Link>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-bold text-blue-700">{log.field}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-500">{log.buyerName}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleDateString("en-GB")}{" "}
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Change comparison */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-semibold">Value Changed:</span>
                    <span className="text-rose-600 line-through bg-rose-50 px-1.5 py-0.5 rounded">
                      {log.oldValue}
                    </span>
                    <span>&rarr;</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {log.newValue}
                    </span>
                  </div>

                  <div className="text-slate-700 text-[11px]">
                    <span className="font-semibold text-slate-500">Compliance Reason: </span>
                    <em>"{log.reason}"</em>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1">
                    Authorized By: <strong>{log.changedBy}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

