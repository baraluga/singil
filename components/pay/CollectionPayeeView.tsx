"use client";

import { useState } from "react";
import { Collection, BillWithMembers, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import { findMemberByName, extractUniqueNames } from "@/lib/utils/members";
import ConsolidatedPayeeFlow from "@/components/pay/ConsolidatedPayeeFlow";

interface CollectionPayeeViewProps {
  collection: Collection;
  bills: BillWithMembers[];
  paymentMethods: PaymentMethod[];
}

export default function CollectionPayeeView({
  collection,
  bills,
  paymentMethods,
}: CollectionPayeeViewProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  // Track member IDs that have been claimed in this session
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const uniqueNames = extractUniqueNames(bills);

  function handleAllClaimed(name: string) {
    // Mark all members for this name across all bills as claimed
    const ids = bills.flatMap((b) => {
      const m = findMemberByName(name, b);
      return m ? [m.id] : [];
    });
    setClaimedIds((prev: Set<string>) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  // Step 1: name selection
  if (!selectedName) {
    return (
      <main className="pay-page">
        <div className="pay-header">
          <p className="pay-header-sub">Brian is collecting for</p>
          <h1 className="pay-header-title">{collection.name}</h1>
          <p className="pay-header-date">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="pay-inner">
          <p className="section-label">Who are you?</p>
          <div className="name-grid">
            {uniqueNames.map((name, i) => {
              const colors = getAvatarColor(i);
              const billCount = bills.filter((b) => findMemberByName(name, b) !== null).length;
              const member = bills.flatMap((b) => b.members).find(
                (m) => m.name.toLowerCase().trim() === name.toLowerCase().trim()
              );
              const isDone = bills
                .filter((b) => findMemberByName(name, b) !== null)
                .every((b) => {
                  const m = findMemberByName(name, b)!;
                  return m.is_paid || m.claimed_paid || claimedIds.has(m.id);
                });
              return (
                <button
                  key={name}
                  className={`name-card${isDone ? " done" : ""}`}
                  onClick={() => setSelectedName(name)}
                >
                  <div
                    className="member-avatar"
                    style={{ background: colors.bgValue, color: colors.textValue }}
                  >
                    {getInitial(name)}
                  </div>
                  <span className="name-card-label">{name}</span>
                  {bills.length > 1 && (
                    <span className="collection-badge">
                      {billCount}/{bills.length}
                    </span>
                  )}
                  {member?.is_paid && <span className="name-card-status">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // Step 2: consolidated payment flow
  const myBills = bills.filter((b) => findMemberByName(selectedName, b) !== null);
  const otherBills = bills.filter((b) => findMemberByName(selectedName, b) === null);

  const unpaidBills = myBills.filter((b) => {
    const m = findMemberByName(selectedName, b)!;
    return !m.is_paid && !m.claimed_paid && !claimedIds.has(m.id);
  });
  const doneBills = myBills.filter((b) => {
    const m = findMemberByName(selectedName, b)!;
    return m.is_paid || m.claimed_paid || claimedIds.has(m.id);
  });

  const paidCount = doneBills.length;
  const remainingAmount = unpaidBills.reduce((sum, b) => {
    const m = findMemberByName(selectedName, b)!;
    return sum + m.share_amount;
  }, 0);

  return (
    <main className="pay-page">
      <div className="pay-header">
        <p className="pay-header-sub">Brian is collecting for</p>
        <h1 className="pay-header-title">{collection.name}</h1>
      </div>
      <div className="pay-inner">
        <button
          className="pay-back-btn"
          onClick={() => setSelectedName(null)}
        >
          ← Not {selectedName}?
        </button>

        {/* Summary bar */}
        {myBills.length > 0 && (
          <div className="collection-summary">
            <div className="collection-summary-text">
              <span className="collection-summary-name">Hi {selectedName}!</span>
              <span className="collection-summary-stat">
                {paidCount} of {myBills.length} paid
                {remainingAmount > 0 && ` · ${formatCurrency(remainingAmount)} left`}
              </span>
            </div>
            <div className="collection-summary-bar">
              <div
                className="collection-summary-fill"
                style={{ width: `${myBills.length > 0 ? (paidCount / myBills.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {myBills.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">You&apos;re not in any of these bills</p>
            <p className="empty-state-sub">Contact Brian if you think this is a mistake.</p>
          </div>
        ) : (
          <ConsolidatedPayeeFlow
            unpaidBills={unpaidBills}
            doneBills={doneBills}
            memberName={selectedName}
            paymentMethods={paymentMethods}
            collectionId={collection.id}
            onAllClaimed={() => handleAllClaimed(selectedName)}
          />
        )}

        {/* Bills the payee is NOT in */}
        {otherBills.length > 0 && (
          <div className="dimmed-section">
            <p className="section-label" style={{ marginBottom: 8 }}>Not in these bills</p>
            {otherBills.map((bill) => {
              const date = new Date(bill.date).toLocaleDateString("en-PH", {
                month: "short", day: "numeric",
              });
              return (
                <div key={bill.id} className="dimmed-bill-row">
                  <span>{bill.name}</span>
                  <span>{date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
