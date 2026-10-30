
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileText,
  CreditCard
} from "lucide-react";

import { useReconciliation } from "../context/ReconciliationContext";
import ConfidenceBadge from "./ConfidenceBadge";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(Number(value || 0));

export default function ReviewQueue() {
  const {
    suggestions,
    loading,
    error,
    confirmSuggestion,
    rejectSuggestion
  } = useReconciliation();

  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Normalize common backend response structures.
  const records = useMemo(() => {
    return suggestions.map((item) => ({
      ...item,
      paymentReference:
        item.paymentReference ||
        item.payment?.paymentReference ||
        item.payment?.reference ||
        item.paymentReferenceNumber ||
        "N/A",

      paymentAmount:
        item.paymentAmount ??
        item.payment?.amount ??
        item.amount ??
        0,

      invoiceCandidates:
        item.candidates ||
        item.invoiceCandidates ||
        (item.invoice ? [item.invoice] : [])
    }));
  }, [suggestions]);

  const selected = records.find(
    (item) => item.id === selectedId
  ) || records[0];

  const selectedCandidate =
    selected?.invoiceCandidates?.[0] || {};

  const selectSuggestion = (item) => {
    setSelectedId(item.id);
    setAmount(
      String(
        item.suggestedAmount ??
        selectedCandidate.suggestedAmount ??
        item.paymentAmount
      )
    );
    setNote("");
  };

  const handleConfirm = async () => {
    if (!selected) return;

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(amount)
    ) {
      alert("Enter a valid amount with maximum 2 decimal places.");
      return;
    }

    try {
      setBusy(true);

      await confirmSuggestion(
        selected.id,
        numericAmount.toFixed(2),
        note
      );

      setSelectedId(null);
      setAmount("");
      setNote("");

    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;

    if (!window.confirm("Reject this match suggestion?")) {
      return;
    }

    try {
      setBusy(true);

      await rejectSuggestion(selected.id, note);

      setSelectedId(null);
      setNote("");

    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !suggestions.length) {
    return (
      <div className="p-10 text-center">
        <RefreshCw className="animate-spin mx-auto mb-3" />
        Loading suggestions...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Reconciliation Review
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review AI-generated payment matches.
          </p>
        </div>

        <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-sm font-semibold">
          {records.length} Pending
        </span>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Two panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left payment panel */}
        <div className="lg:col-span-4 bg-white border rounded-xl">

          <div className="p-4 border-b">
            <h3 className="font-semibold text-slate-800">
              Unallocated Payments
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a payment to review its matches.
            </p>
          </div>

          <div className="divide-y max-h-[650px] overflow-y-auto">

            {records.map((item) => (
              <button
                key={item.id}
                onClick={() => selectSuggestion(item)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition ${
                  selected?.id === item.id
                    ? "bg-indigo-50 border-l-4 border-indigo-600"
                    : ""
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">
                    {item.paymentReference}
                  </span>

                  <CreditCard size={18} className="text-slate-400" />
                </div>

                <p className="text-xl font-bold text-slate-800 mt-2">
                  {money(item.paymentAmount)}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  {item.payment?.date ||
                    item.paymentDate ||
                    "Date unavailable"}
                </p>

                <div className="mt-3">
                  <ConfidenceBadge
                    confidence={item.confidence}
                  />
                </div>
              </button>
            ))}

            {!records.length && (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2
                  size={35}
                  className="mx-auto mb-3"
                />
                No pending suggestions.
              </div>
            )}

          </div>
        </div>

        {/* Right details panel */}
        <div className="lg:col-span-8 bg-white border rounded-xl">

          {!selected ? (
            <div className="p-12 text-center text-slate-400">
              Select a payment to review.
            </div>
          ) : (
            <div className="p-5 space-y-6">

              {/* Candidate header */}
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg">
                    Suggested Invoice Match
                  </h3>
                  <p className="text-sm text-slate-500">
                    Payment: {selected.paymentReference}
                  </p>
                </div>

                <ConfidenceBadge
                  confidence={selected.confidence}
                />
              </div>

              {/* Payment and invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="bg-slate-50 rounded-xl p-4">
                  <CreditCard className="text-indigo-600 mb-3" />

                  <p className="text-xs text-slate-500">
                    Payment Amount
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    {money(selected.paymentAmount)}
                  </h3>

                  <p className="text-sm mt-2">
                    {selected.paymentReference}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <FileText className="text-indigo-600 mb-3" />

                  <p className="text-xs text-slate-500">
                    Suggested Invoice
                  </p>

                  <h3 className="text-xl font-bold mt-1">
                    {selectedCandidate.invoiceNumber ||
                      selected.invoiceNumber ||
                      "Candidate unavailable"}
                  </h3>

                  <p className="text-sm mt-2">
                    Face value: {money(selectedCandidate.faceValue)}
                  </p>
                </div>

              </div>

              {/* All invoice candidates */}
              <div>
                <h4 className="font-semibold mb-3">
                  Invoice Candidates
                </h4>

                <div className="space-y-2">
                  {selected.invoiceCandidates.map(
                    (candidate, index) => (
                      <div
                        key={candidate.invoiceNumber || index}
                        className="border rounded-lg p-3 flex justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {candidate.invoiceNumber || "Invoice"}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Face Value: {money(candidate.faceValue)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {money(candidate.suggestedAmount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Suggested
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Rule based score */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">
                    Rule-based Match Score
                  </span>
                  <span className="font-bold text-indigo-600">
                    {Number(selected.score ?? 0)}/100
                  </span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(selected.score || 0))
                      )}%`
                    }}
                  />
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  This is a rule-based score, not a probability.
                </p>
              </div>

              {/* Flags */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle
                    size={18}
                    className="text-amber-500"
                  />
                  Review Flags
                </h4>

                <div className="flex flex-wrap gap-2">
                  {(selected.flags || []).map((flag, index) => (
                    <span
                      key={index}
                      className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2 text-xs"
                    >
                      {typeof flag === "string"
                        ? flag
                        : flag.message || flag.code || JSON.stringify(flag)}
                    </span>
                  ))}

                  {!selected.flags?.length && (
                    <span className="text-sm text-slate-400">
                      No review flags.
                    </span>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="font-semibold mb-3">
                  Why AI Suggested This Match
                </h4>

                <ul className="space-y-3">
                  {(selected.explanation || []).map(
                    (reason, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-slate-600"
                      >
                        <CheckCircle2
                          size={17}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        {typeof reason === "string"
                          ? reason
                          : reason.message || JSON.stringify(reason)}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Confirm form */}
              <div className="border-t pt-5 space-y-4">

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Confirm Amount (INR)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Reviewer Note
                  </label>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an optional review note..."
                    className="w-full border rounded-lg p-3 h-20 resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    disabled={busy}
                    onClick={handleConfirm}
                    className="flex-1 bg-indigo-600 text-white rounded-lg p-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    {busy ? "Processing..." : "Confirm Match"}
                  </button>

                  <button
                    disabled={busy}
                    onClick={handleReject}
                    className="flex-1 border border-rose-300 text-rose-600 rounded-lg p-3 font-semibold hover:bg-rose-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject Suggestion
                  </button>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
