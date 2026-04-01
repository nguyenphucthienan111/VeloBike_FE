import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../constants";
import { handleSessionExpired } from "../../utils/auth";

interface WalletBalance { balance: number }
interface BankAccount { accountName?: string; accountNumber?: string; bankName?: string }
interface Transaction { _id: string; type: string; amount: number; status: string; description: string; createdAt: string }
interface Withdrawal { id: string; amount: number; fee: number; status: string; bankAccount: string; requestedAt: string; transferProof?: string; note?: string }

const TYPE_LABELS: Record<string, string> = { PAYMENT_HOLD: "Payment hold", REFUND: "Refund", DEPOSIT: "Deposit" };

export const BuyerWallet: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [savedBank, setSavedBank] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankForm, setBankForm] = useState<BankAccount>({ accountName: "", accountNumber: "", bankName: "" });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [proofModal, setProofModal] = useState<{ image?: string; note?: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const [walletRes, txRes, wdRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/transactions/my-transactions?page=1&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/wallet/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if ([walletRes, txRes, wdRes, userRes].some(r => r.status === 401)) { handleSessionExpired(); return; }
      if (walletRes.ok) { const d = await walletRes.json(); setBalance({ balance: d.data?.balance ?? 0 }); }
      if (txRes.ok) {
        const d = await txRes.json();
        const buyerTypes = ["PAYMENT_HOLD", "REFUND", "DEPOSIT"];
        setTransactions((Array.isArray(d.data) ? d.data : []).filter((t: Transaction) => buyerTypes.includes(t.type)));
      }
      if (wdRes.ok) {
        const d = await wdRes.json();
        setWithdrawals((d.data || []).map((w: any) => ({
          id: w._id, amount: w.amount, fee: w.fee ?? 0, status: w.status,
          bankAccount: w.bankAccount?.accountNumber ? `***${String(w.bankAccount.accountNumber).slice(-4)}` : "-",
          requestedAt: w.requestedAt, transferProof: w.transferProof, note: w.note,
        })));
      }
      if (userRes.ok) { const d = await userRes.json(); if (d.data?.bankAccount) setSavedBank(d.data.bankAccount); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const calcFee = (amount: number) => amount >= 1000000 ? 0 : 10000;

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = parseInt(withdrawAmount);
    if (!amount || isNaN(amount)) { setWithdrawError("Please enter a valid amount"); return; }
    if (amount < 50000) { setWithdrawError("Minimum withdrawal is 50,000 VND"); return; }
    if (!balance || amount > balance.balance) { setWithdrawError("Insufficient balance"); return; }
    const bank = savedBank || bankForm;
    if (!bank.accountName?.trim() || !bank.accountNumber?.trim() || !bank.bankName?.trim()) {
      setWithdrawError("Please fill in all bank account fields"); return;
    }
    setWithdrawLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount, bankAccount: { accountName: bank.accountName?.trim(), accountNumber: bank.accountNumber?.trim(), bankName: bank.bankName?.trim() } }),
      });
      if (res.ok) {
        setShowWithdraw(false); setWithdrawAmount("");
        setBankForm({ accountName: "", accountNumber: "", bankName: "" });
        await fetchData();
      } else { const d = await res.json(); setWithdrawError(d.message || "Withdrawal request failed"); }
    } catch { setWithdrawError("Error processing request"); }
    finally { setWithdrawLoading(false); }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/wallet/withdrawals/${id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) await fetchData();
    } finally { setCancellingId(null); }
  };

  const fmt = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
  const isOutflow = (type: string) => type === "PAYMENT_HOLD";
  const statusBadge = (s: string) => ({ COMPLETED: "bg-green-100 text-green-800", PENDING: "bg-yellow-100 text-yellow-800", FAILED: "bg-red-100 text-red-800", CANCELLED: "bg-gray-100 text-gray-600" } as Record<string,string>)[s] || "bg-gray-100 text-gray-700";

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-center">
      <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Loading wallet...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wallet</h1>
      <div className="bg-gray-900 text-white rounded-xl p-6 mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-400 mb-1">Available balance</p>
          <p className="text-4xl font-bold">{fmt(balance?.balance ?? 0)}</p>
          <p className="text-xs text-gray-500 mt-2">Refunds from disputes will appear here</p>
        </div>
        <button onClick={() => setShowWithdraw(true)} disabled={(balance?.balance ?? 0) < 50000}
          className="px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Withdraw
        </button>
      </div>

      {withdrawals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Withdrawal History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["Date","Amount","Fee","Account","Status","Action"].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-600">{new Date(w.requestedAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{fmt(w.amount)}</td>
                    <td className="py-3 px-3 text-gray-600">{fmt(w.fee)}</td>
                    <td className="py-3 px-3 text-gray-600">{w.bankAccount}</td>
                    <td className="py-3 px-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${statusBadge(w.status)}`}>{w.status.replace(/_/g, ' ')}</span></td>
                    <td className="py-3 px-3">
                      {w.status === "PENDING" && <button onClick={() => handleCancel(w.id)} disabled={cancellingId === w.id} className="text-red-600 text-xs font-medium hover:underline disabled:opacity-50">{cancellingId === w.id ? "Cancelling..." : "Cancel"}</button>}
                      {w.status === "COMPLETED" && (w.transferProof || w.note) && <button onClick={() => setProofModal({ image: w.transferProof, note: w.note })} className="text-blue-600 text-xs font-medium hover:underline">View proof</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Transaction History</h2>
        {transactions.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">No transactions yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["Date","Type","Description","Amount","Status"].map(h => <th key={h} className={`py-2 px-3 text-xs font-semibold text-gray-500 uppercase ${h==="Amount"?"text-right":"text-left"}`}>{h}</th>)}
              </tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-3 px-3 text-gray-800 font-medium">{TYPE_LABELS[t.type] || t.type}</td>
                    <td className="py-3 px-3 text-gray-500 max-w-xs truncate">{t.description}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${isOutflow(t.type) ? "text-red-600" : "text-green-600"}`}>{isOutflow(t.type) ? "-" : "+"}{fmt(Math.abs(t.amount))}</td>
                    <td className="py-3 px-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${statusBadge(t.status)}`}>{t.status.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Withdraw</h2>
              <button onClick={() => { setShowWithdraw(false); setWithdrawError(""); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-1">Amount (VND)</label>
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Minimum 50,000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm" />
              {withdrawAmount && !isNaN(parseInt(withdrawAmount)) && (
                <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                  <p>Fee: {fmt(calcFee(parseInt(withdrawAmount)))}</p>
                  <p>You receive: {fmt(parseInt(withdrawAmount) - calcFee(parseInt(withdrawAmount)))}</p>
                </div>
              )}
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Bank Account</label>
              {savedBank ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-gray-900">{savedBank.bankName}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{savedBank.accountName} - {savedBank.accountNumber}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="text" placeholder="Account holder name" value={bankForm.accountName} onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm" />
                  <input type="text" placeholder="Account number" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm" />
                  <input type="text" placeholder="Bank name (e.g. Vietcombank)" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm" />
                </div>
              )}
            </div>
            {withdrawError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{withdrawError}</div>}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-5">
              Balance: <span className="font-bold text-gray-900">{fmt(balance?.balance ?? 0)}</span>
              <span className="ml-3">Processing: 1-3 business days</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowWithdraw(false); setWithdrawError(""); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={handleWithdraw} disabled={withdrawLoading} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium text-sm">{withdrawLoading ? "Processing..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {proofModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setProofModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transfer Proof</h3>
              <button onClick={() => setProofModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
            </div>
            {proofModal.image && <a href={proofModal.image} target="_blank" rel="noopener noreferrer"><img src={proofModal.image} alt="Transfer proof" className="w-full rounded-lg border mb-3 hover:opacity-90 transition" /></a>}
            {proofModal.note && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700"><p className="text-xs text-gray-400 mb-1">Admin note</p>{proofModal.note}</div>}
          </div>
        </div>
      )}
    </div>
  );
};