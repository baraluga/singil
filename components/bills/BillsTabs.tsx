"use client";

import { useState } from "react";
import Link from "next/link";
import { BillWithMembers, CollectionWithBills } from "@/lib/types";
import BillCard from "@/components/bills/BillCard";
import CollectionCard from "@/components/collections/CollectionCard";

interface BillsTabsProps {
  activeBills: BillWithMembers[];
  settledBills: BillWithMembers[];
  collections: CollectionWithBills[];
}

type Tab = "active" | "settled" | "collections";

export default function BillsTabs({ activeBills, settledBills, collections }: BillsTabsProps) {
  const [tab, setTab] = useState<Tab>("active");

  return (
    <>
      <div className="bills-tab-bar">
        <button
          className={`bills-tab${tab === "active" ? " active" : ""}`}
          onClick={() => setTab("active")}
        >
          Active {activeBills.length > 0 && <span className="bills-tab-count">{activeBills.length}</span>}
        </button>
        <button
          className={`bills-tab${tab === "settled" ? " active" : ""}`}
          onClick={() => setTab("settled")}
        >
          Settled {settledBills.length > 0 && <span className="bills-tab-count">{settledBills.length}</span>}
        </button>
        <button
          className={`bills-tab${tab === "collections" ? " active" : ""}`}
          onClick={() => setTab("collections")}
        >
          Collections {collections.length > 0 && <span className="bills-tab-count">{collections.length}</span>}
        </button>
      </div>

      {tab === "active" && (
        <>
          {activeBills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <p className="empty-state-title">No active bills</p>
              <p className="empty-state-sub">Create your first bill to get started</p>
            </div>
          ) : (
            <div className="bills-grid">
              {activeBills.map((bill) => <BillCard key={bill.id} bill={bill} />)}
            </div>
          )}
        </>
      )}

      {tab === "settled" && (
        <>
          {settledBills.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No settled bills yet</p>
            </div>
          ) : (
            <div className="bills-grid">
              {settledBills.map((bill) => <BillCard key={bill.id} bill={bill} settled />)}
            </div>
          )}
        </>
      )}

      {tab === "collections" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Link href="/collections/new" className="btn-new" style={{ display: "inline-block" }}>
              ＋ New collection
            </Link>
          </div>
          {collections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <p className="empty-state-title">No collections yet</p>
              <p className="empty-state-sub">Group multiple bills into one shareable link</p>
            </div>
          ) : (
            <div className="bills-grid">
              {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
            </div>
          )}
        </>
      )}
    </>
  );
}
