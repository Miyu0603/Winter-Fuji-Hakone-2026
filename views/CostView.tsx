
import React, { useState } from 'react';
import { GOOGLE_SHEET_URL, GOOGLE_SCRIPT_URL } from '../constants';
import { SheetIcon, SpinnerIcon, PlusIcon, RefreshIcon } from '../components/Icons';
import { ExpenseRecord } from '../types';

interface CostViewProps {
  expenses: ExpenseRecord[];
  isLoading: boolean;
  fetchError: string | null;
  onRefresh: () => void;
  onAddSuccess: () => void; // Trigger parent refresh
}

export const CostView: React.FC<CostViewProps> = ({ 
  expenses, 
  isLoading, 
  fetchError, 
  onRefresh,
  onAddSuccess
}) => {
  // Form State (Local UI state is fine here)
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY');
  const [item, setItem] = useState('');
  const [payer, setPayer] = useState<'想想' | '錢錢'>('想想');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Calculate Totals
  const totalTWD = expenses.reduce((sum, rec) => sum + (Number(rec.twd) || 0), 0);
  const totalJPY = expenses.reduce((sum, rec) => sum + (Number(rec.jpy) || 0), 0);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !item) return;

    if (!GOOGLE_SCRIPT_URL) {
      alert("請先設定 GOOGLE_SCRIPT_URL (constants.ts)");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const amountNum = Number(amount);
      const data = {
        item,
        payer,
        amountTwd: currency === 'TWD' ? amountNum : 0,
        amountJpy: currency === 'JPY' ? amountNum : 0,
        note
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Reset Form
      setAmount('');
      setItem('');
      setNote('');
      setSubmitStatus('success');
      
      // Trigger refresh in parent
      onAddSuccess();
      
      setTimeout(() => {
        setSubmitStatus('idle');
        setShowAddModal(false);
      }, 1000);

    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Date Helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return dateString; // Fallback to original string if parse fails
    }
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] text-mag-gray uppercase mb-1 pl-1">EXPENSES</h2>
          <h3 className="text-2xl font-serif font-bold text-mag-black">消費紀錄</h3>
        </div>
        
        <div className="flex gap-2">
            {/* Refresh Button */}
            <button 
                onClick={onRefresh}
                className="bg-white text-mag-gray border border-gray-200 p-3 rounded-full shadow-sm hover:text-mag-black hover:border-gray-300 active:scale-95 transition-all"
                title="重新整理"
            >
                <RefreshIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Add Button */}
            <button 
            onClick={() => setShowAddModal(true)}
            className="bg-mag-gold text-white p-3 rounded-full shadow-lg hover:bg-[#b08d48] active:scale-95 transition-transform"
            >
            <PlusIcon className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-mag-black text-white p-5 rounded-xl shadow-float">
           <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Total JPY</div>
           <div className="text-2xl font-mono font-bold">¥{totalJPY.toLocaleString()}</div>
        </div>
        <div className="bg-white text-mag-black border border-gray-100 p-5 rounded-xl shadow-sm">
           <div className="text-[10px] font-bold uppercase tracking-wider text-mag-gray mb-2">Total TWD</div>
           <div className="text-2xl font-mono font-bold text-mag-black">NT${totalTWD.toLocaleString()}</div>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {isLoading && expenses.length === 0 ? (
          <div className="flex justify-center py-10 text-mag-gray">
            <SpinnerIcon className="w-6 h-6 mr-2" /> 讀取中...
          </div>
        ) : fetchError ? (
          <div className="text-center py-6 px-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
             <p className="font-bold mb-2">無法載入資料</p>
             <p className="text-xs opacity-80 mb-4">{fetchError}</p>
             <button onClick={onRefresh} className="text-xs bg-white border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 font-bold">
               重試
             </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            尚無紀錄
          </div>
        ) : (
          expenses.map((record, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
              {/* Top Row: Date | Payer | Amount */}
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {formatDate(record.date)}
                    </span>
                    <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${record.payer === '想想' ? 'border-pink-200 text-pink-500 bg-pink-50' : 'border-blue-200 text-blue-50'}`}>
                      {record.payer}
                    </span>
                 </div>
                 
                 <div className="text-right">
                    {Number(record.jpy) > 0 && (
                      <span className="text-base font-bold font-mono block">¥{Number(record.jpy).toLocaleString()}</span>
                    )}
                    {Number(record.twd) > 0 && (
                      <span className="text-base font-bold font-mono text-mag-gray block">NT${Number(record.twd).toLocaleString()}</span>
                    )}
                 </div>
              </div>

              {/* Middle Row: Item */}
              <div className="text-base font-bold text-mag-black leading-tight">
                {record.item}
              </div>

              {/* Bottom Row: Note */}
              {record.note && (
                <div className="bg-gray-50 text-xs text-gray-500 px-2 py-1.5 rounded w-full">
                  備註：{record.note}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer Link */}
      <div className="text-center mt-8">
         <a 
           href={GOOGLE_SHEET_URL}
           target="_blank"
           rel="noopener noreferrer"
           className="inline-flex items-center gap-2 text-mag-gray hover:text-mag-gold transition-colors text-xs font-bold uppercase tracking-wider"
         >
           <SheetIcon className="w-4 h-4" />
           Open Google Sheets
         </a>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddModal(false)}
          ></div>
          
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 p-6 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-serif font-bold text-mag-black">新增支出</h3>
               <button 
                 onClick={() => setShowAddModal(false)}
                 className="text-gray-400 hover:text-mag-black p-2"
               >
                 ✕
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount & Currency */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-mag-gray uppercase tracking-wider">金額</label>
                    <div className="flex bg-gray-100 rounded p-0.5">
                      {(['JPY', 'TWD'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                            currency === c 
                              ? 'bg-mag-black text-white shadow-md' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                </div>
                <div className="relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-3xl font-serif font-bold text-mag-black bg-gray-50 rounded-lg px-3 py-3 border border-transparent focus:bg-white focus:border-mag-black transition-all outline-none placeholder-gray-300"
                      required
                      autoFocus
                    />
                    <span className="absolute right-3 bottom-4 text-sm font-bold text-gray-400 pointer-events-none">
                      {currency}
                    </span>
                </div>
              </div>

              {/* Item */}
              <div>
                <label className="block text-xs font-bold text-mag-gray uppercase tracking-wider mb-2">項目名稱</label>
                <input 
                  type="text" 
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="例如：午餐、車票..."
                  className="w-full text-lg font-medium text-mag-black bg-gray-50 rounded-lg px-3 py-3 border border-transparent focus:bg-white focus:border-mag-black transition-all outline-none placeholder-gray-300"
                  required
                />
              </div>

              {/* Payer */}
              <div>
                <label className="block text-xs font-bold text-mag-gray uppercase tracking-wider mb-2">付款者</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['想想', '錢錢'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPayer(p)}
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                        payer === p 
                          ? 'bg-white text-mag-black shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-mag-gray uppercase tracking-wider mb-2">備註 (選填)</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-base font-medium text-mag-black bg-gray-50 rounded-lg px-3 py-3 border border-transparent focus:bg-white focus:border-mag-black transition-all outline-none placeholder-gray-300"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-mag-gold text-white hover:bg-[#b08d48] active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <><SpinnerIcon className="w-5 h-5" /> 處理中...</>
                ) : (
                  '確認新增'
                )}
              </button>
              
              {submitStatus === 'success' && (
                 <div className="text-center text-green-600 text-sm font-bold">✓ 新增成功</div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
