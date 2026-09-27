import React, { useState } from 'react';
import { X, IndianRupee, Check, ShieldCheck, Lock, AlertCircle, Printer, MessageSquare } from 'lucide-react';
import { ReceptionPatientEntry } from '../types';

interface CollectRemainingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ReceptionPatientEntry | null;
  onCollectPayment?: (
    entryId: string,
    collectedAmount: number,
    mode: 'Cash' | 'UPI' | 'Card',
    note?: string
  ) => void;
  onPaymentCollected?: (updatedEntry: ReceptionPatientEntry) => void;
}

export const CollectRemainingPaymentModal: React.FC<CollectRemainingPaymentModalProps> = ({
  isOpen,
  onClose,
  entry,
  onCollectPayment,
  onPaymentCollected,
}) => {
  if (!isOpen || !entry) return null;

  const netPayable = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
  const currentDue = entry.dueAmount;

  const [collectAmount, setCollectAmount] = useState<number>(currentDue);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [receiptNote, setReceiptNote] = useState('');

  const remainingAfterCollection = Math.max(0, currentDue - collectAmount);
  const willBeFullPayment = remainingAfterCollection === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectAmount <= 0) {
      alert('Please enter a valid collection amount greater than 0');
      return;
    }
    if (collectAmount > currentDue) {
      alert(`Collection amount cannot exceed due balance of ₹${currentDue}`);
      return;
    }

    const newPaidAmount = (entry.paidAmount || 0) + collectAmount;
    const newDueAmount = Math.max(0, currentDue - collectAmount);
    const newStatus: ReceptionPatientEntry['paymentStatus'] = newDueAmount === 0 ? 'Full Payment' : 'Partial';

    const updatedEntry: ReceptionPatientEntry = {
      ...entry,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newStatus,
      balancePaidAmount: collectAmount,
      balancePaymentMode: paymentMode,
      balancePaidAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    if (onCollectPayment) {
      onCollectPayment(entry.id, collectAmount, paymentMode, receiptNote.trim() || undefined);
    }
    if (onPaymentCollected) {
      onPaymentCollected(updatedEntry);
    }
    onClose();
  };

  const isReportReady =
    entry.status === 'Report Ready' ||
    entry.technicianStatus === 'Report Generated' ||
    Boolean(entry.reportId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#123B6D] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-white/20 text-white font-black px-2.5 py-1 rounded-lg text-xs">
              {entry.tokenNumber}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Remaining Balance Payment
              </h2>
              <p className="text-xs text-blue-100">
                {entry.patientName} • UHID: {entry.uhid}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Banner if Report is Ready */}
        {isReportReady && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-amber-900 text-xs">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <span className="font-black text-amber-950">Report Issued ({entry.reportId})</span>
              <span className="text-amber-800 ml-1">
                — Patient demographics and tests are locked. Settle remaining payment below.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Financial Breakdown Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Bill (Tests):</span>
              <span className="font-bold text-slate-900">₹{entry.totalAmount}</span>
            </div>
            {entry.discountINR > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount / Concession:</span>
                <span className="font-bold">-₹{entry.discountINR}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
              <span>Net Bill Amount:</span>
              <span className="font-extrabold text-[#123B6D]">₹{netPayable}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Previously Paid ({entry.paymentMode}):</span>
              <span className="font-bold text-emerald-700">₹{entry.paidAmount}</span>
            </div>
            <div className="flex justify-between items-center bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-900 mt-1">
              <span className="font-extrabold">Current Balance Due:</span>
              <span className="text-base font-black text-rose-700">₹{currentDue}</span>
            </div>
          </div>

          {/* Collection Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Amount to Collect Now (₹) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCollectAmount(currentDue)}
                className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
              >
                Pay Full Due (₹{currentDue})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                max={currentDue}
                required
                value={collectAmount}
                onChange={(e) => setCollectAmount(Math.min(currentDue, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Method for Remaining Balance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMode === mode
                      ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode === 'UPI' && <span>📱 UPI / QR</span>}
                  {mode === 'Cash' && <span>💵 Cash</span>}
                  {mode === 'Card' && <span>💳 Card</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Status Preview Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Updated Payment Status:</span>
              <span
                className={`font-black text-xs ${
                  willBeFullPayment ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {willBeFullPayment ? '✓ Full Payment (All Dues Cleared)' : '⚠️ Advance (Remaining Balance Due)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Remaining After Payment:</span>
              <span
                className={`font-black text-xs ${
                  remainingAfterCollection === 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ₹{remainingAfterCollection}
              </span>
            </div>
          </div>

          {/* Receipt Note / Transaction Ref */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder="e.g. Settle balance at report counter • UPI Ref 928374"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Collect ₹{collectAmount} & Confirm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
