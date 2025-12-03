
import React, { useState, useEffect } from 'react';
import { Tab, ShoppingItem, ExpenseRecord } from './types';
import { LOCATION_DETAILS, GOOGLE_SCRIPT_URL } from './constants';
import { ItineraryView } from './views/ItineraryView';
import { PrepView } from './views/PrepView';
import { PackingView } from './views/PackingView';
import { DetailView } from './views/DetailView';
import { InfoView } from './views/InfoView';
import { ShoppingView } from './views/ShoppingView';
import { CostView } from './views/CostView';
import { SunIcon, CloudIcon, RainIcon, SnowIcon, ThunderIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  
  // --- Checkbox State (Prep & Packing) with Persistence ---
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    // Load from local storage on initial render
    try {
      const saved = localStorage.getItem('checked_items');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load checked items", e);
    }
    return new Set();
  });

  // Save to local storage whenever checkedItems changes
  useEffect(() => {
    try {
      // Convert Set to Array for JSON serialization
      const array = Array.from(checkedItems);
      localStorage.setItem('checked_items', JSON.stringify(array));
    } catch (e) {
      console.error("Failed to save checked items", e);
    }
  }, [checkedItems]);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0);

  // --- Shopping List State with Persistence ---
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  // Weather State
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Fetch Weather Logic
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current=temperature_2m,weather_code&timezone=Asia%2FTokyo'
        );
        const data = await res.json();
        if (data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          });
        }
      } catch (e) {
        console.error("Failed to fetch weather", e);
      }
    };
    fetchWeather();
  }, []);

  // Fetch Expenses Logic
  const fetchExpenses = async () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsExpensesLoading(true);
    setExpensesError(null);
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);
      
      const contentType = response.headers.get("content-type");
      // Remove strict content-type check or make it optional as some proxies might strip it
      // if (!contentType || !contentType.includes("application/json")) { ... }

      const json = await response.json();
      if (json.status === 'error') throw new Error(json.message);
      
      const data = json.data || [];
      console.log("【除錯】原始 API 資料:", data); 

      let hasInvalidRowIndex = false;

      const parsedData: ExpenseRecord[] = data.map((row: any) => {
        const rIndex = Number(row.rowIndex);
        // 檢查 rowIndex 是否無效 (NaN 或 0)
        if (isNaN(rIndex) || rIndex <= 0) {
          hasInvalidRowIndex = true;
        }

        return {
          rowIndex: rIndex,
          date: row.date,
          item: row.item,
          payer: row.payer,
          amountTwd: typeof row.twd === 'string' ? Number(row.twd.replace(/[^0-9.-]/g, '')) : Number(row.twd || 0),
          amountJpy: typeof row.jpy === 'string' ? Number(row.jpy.replace(/[^0-9.-]/g, '')) : Number(row.jpy || 0),
          note: row.note
        };
      });

      console.log("【除錯】解析後資料:", parsedData);
      setExpenses(parsedData);

      // 自動診斷：如果發現資料缺少行號，顯示錯誤提示
      if (hasInvalidRowIndex) {
        setExpensesError("⚠️ 警告：偵測到資料缺少「行號 (rowIndex)」。\n這表示您的 GAS 程式碼可能未正確更新。\n請至 GAS 編輯器 > 部署 > 管理部署 > 點擊筆 > 版本選「建立新版本」 > 部署。");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === 'Failed to fetch') {
        setExpensesError("無法連線到 Google Sheet。\n1. 請檢查您的網路連線。\n2. 若有安裝 AdBlock 請先關閉。\n3. 請確認 GAS 部署權限是否為「任何人」。");
      } else {
        setExpensesError(err.message || "讀取失敗，請檢查網路或 GAS 設定");
      }
    } finally {
      setIsExpensesLoading(false);
    }
  };

  // Initial fetch for expenses if on Cost tab
  useEffect(() => {
    if (activeTab === Tab.COST && expenses.length === 0) {
      fetchExpenses();
    }
  }, [activeTab]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNavigateToDetail = (locationId: string) => {
    if (LOCATION_DETAILS[locationId]) {
      setSelectedLocationId(locationId);
    }
  };

  const getWeatherIcon = (code: number) => {
    const iconClass = "w-14 h-14"; 
    if (code === 0) return <SunIcon className={`${iconClass} text-mag-gold`} />;
    if (code >= 1 && code <= 3) return <CloudIcon className={`${iconClass} text-gray-500`} />;
    if ((code >= 45 && code <= 48) || (code >= 51 && code <= 55)) return <CloudIcon className={`${iconClass} text-gray-400`} />;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <RainIcon className={`${iconClass} text-blue-500`} />;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <SnowIcon className={`${iconClass} text-blue-300`} />;
    if (code >= 95) return <ThunderIcon className={`${iconClass} text-purple-500`} />;
    return <SunIcon className={`${iconClass} text-mag-gold`} />;
  };

  return (
    <div className="relative min-h-screen font-sans text-mag-black bg-mag-paper selection:bg-mag-gold selection:text-white">
      
      {selectedLocationId && LOCATION_DETAILS[selectedLocationId] && (
        <DetailView 
          location={LOCATION_DETAILS[selectedLocationId]} 
          onBack={() => setSelectedLocationId(null)} 
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-30 bg-mag-paper border-b border-gray-200 pt-safe-top">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-2">
          <div className="flex justify-between items-center mb-4">
             {/* LEFT: Title */}
             <div className="text-left">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-mag-gold mb-1">Travel Plan</p>
                <h1 className="font-serif text-mag-black">
                  <span className="block text-3xl font-black tracking-tight">冬富士之旅</span>
                  <span className="block text-sm font-bold text-gray-500 mt-1">2回目の日本旅</span>
                </h1>
             </div>

             {/* RIGHT: Weather (Clickable Link) */}
             <a 
               href="https://www.google.com/search?q=Tokyo+weather" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-end gap-3 cursor-pointer hover:opacity-70 transition-opacity"
               title="查看詳細天氣"
             >
                 <div className="flex flex-col items-end mb-1">
                     {weather && (
                       <>
                         <span className="text-lg font-bold font-serif text-mag-black leading-none text-right">{weather.temp}°</span>
                         <span className="text-[9px] font-bold uppercase tracking-wider text-mag-gray leading-none mt-1 text-right">TOKYO</span>
                       </>
                     )}
                 </div>
                 <div className="leading-none shrink-0">
                    {weather && getWeatherIcon(weather.code)}
                 </div>
             </a>
          </div>

          <div className="flex gap-6 border-b border-transparent overflow-x-auto no-scrollbar">
            {[Tab.ITINERARY, Tab.PREP, Tab.PACKING, Tab.INFO, Tab.COST, Tab.SHOPPING].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-bold tracking-wide transition-all relative whitespace-nowrap ${
                  activeTab === tab ? 'text-mag-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === Tab.ITINERARY && '行程表'}
                {tab === Tab.PREP && '準備'}
                {tab === Tab.PACKING && '行李'}
                {tab === Tab.INFO && '資訊'}
                {tab === Tab.COST && '記帳'}
                {tab === Tab.SHOPPING && '購物'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mag-gold rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="h-[140px]"></div>

      <main className="max-w-lg mx-auto min-h-[calc(100vh-140px)]">
        {activeTab === Tab.ITINERARY && (
          <ItineraryView 
            onNavigateToDetail={handleNavigateToDetail} 
            selectedDateIdx={selectedDateIdx}
            setSelectedDateIdx={setSelectedDateIdx}
          />
        )}
        {activeTab === Tab.PREP && <PrepView checkedItems={checkedItems} toggleItem={toggleItem} />}
        {activeTab === Tab.PACKING && <PackingView checkedItems={checkedItems} toggleItem={toggleItem} />}
        {activeTab === Tab.INFO && <InfoView />}
        {activeTab === Tab.COST && (
          <CostView 
            expenses={expenses}
            isLoading={isExpensesLoading}
            fetchError={expensesError}
            onRefresh={fetchExpenses}
            onAddSuccess={fetchExpenses}
          />
        )}
        {activeTab === Tab.SHOPPING && <ShoppingView items={shoppingList} setItems={setShoppingList} />}
      </main>
      
    </div>
  );
};

export default App;
