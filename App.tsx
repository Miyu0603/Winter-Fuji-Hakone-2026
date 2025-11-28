
import React, { useState, useEffect, useCallback } from 'react';
import { Tab, ExpenseRecord, ShoppingItem } from './types';
import { LOCATION_DETAILS, GOOGLE_SCRIPT_URL } from './constants';
import { ItineraryView } from './views/ItineraryView';
import { PrepView } from './views/PrepView';
import { PackingView } from './views/PackingView';
import { CostView } from './views/CostView';
import { DetailView } from './views/DetailView';
import { InfoView } from './views/InfoView';
import { ShoppingView } from './views/ShoppingView';
import { SunIcon, CloudIcon, RainIcon, SnowIcon, ThunderIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0);

  // Expense State (Lifted Up)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expenseFetchError, setExpenseFetchError] = useState<string | null>(null);
  const [hasFetchedExpenses, setHasFetchedExpenses] = useState(false);

  // Shopping List State
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('shopping_list');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

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
        // Open-Meteo API for Tokyo
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

  // Fetch Expenses Logic
  const fetchExpenses = useCallback(async (force = false) => {
    // Prevent refetching if already fetched and not forced
    if (hasFetchedExpenses && !force) return;

    setIsExpensesLoading(true);
    setExpenseFetchError(null);
    try {
      if (!GOOGLE_SCRIPT_URL) {
          throw new Error("Missing Google Script URL");
      }
      
      const timestamp = new Date().getTime();
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${timestamp}`);
      
      if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
      }

      const text = await response.text();
      let json;
      try {
          json = JSON.parse(text);
      } catch (e) {
          if (text.includes("<!DOCTYPE html>") || text.includes("Google Accounts")) {
             throw new Error("GAS 權限錯誤：請檢查 Google Apps Script 部署設定是否為「任何人 (Anyone)」");
          }
          throw new Error("讀取失敗：伺服器回傳格式錯誤。");
      }

      if (json.result === 'success' && Array.isArray(json.data)) {
        // Filter out header rows if they exist
        const validData = json.data.filter((r: any) => 
          r.item !== '項目' && 
          r.item !== 'Item' && 
          r.date !== '時間'
        );
        setExpenses(validData);
        setHasFetchedExpenses(true);
      } else {
        throw new Error(json.error || "Unknown data format");
      }
    } catch (error: any) {
      console.error("Failed to fetch expenses", error);
      setExpenseFetchError(error.message || "無法讀取資料");
    } finally {
      setIsExpensesLoading(false);
    }
  }, [hasFetchedExpenses]);

  // Fetch expenses when switching to Cost tab (only if not fetched yet)
  useEffect(() => {
    if (activeTab === Tab.COST) {
      fetchExpenses();
    }
  }, [activeTab, fetchExpenses]);

  const getWeatherIcon = (code: number) => {
    // Large icon to be the protagonist
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
      
      {/* Detail View Overlay */}
      {selectedLocationId && LOCATION_DETAILS[selectedLocationId] && (
        <DetailView 
          location={LOCATION_DETAILS[selectedLocationId]} 
          onBack={() => setSelectedLocationId(null)} 
        />
      )}

      {/* Main App Header (Fixed) */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-mag-paper border-b border-gray-200 pt-safe-top">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-2">
          <div className="flex justify-between items-center mb-4">
             <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-mag-gold mb-1">Travel Plan</p>
                <h1 className="font-serif text-mag-black">
                  <span className="block text-3xl font-black tracking-tight">冬富士之旅</span>
                  <span className="block text-sm font-bold text-gray-500 mt-1">2回目の日本旅</span>
                </h1>
             </div>

             {/* Weather Widget */}
             {weather && (
               <div className="flex items-end gap-2 animate-in fade-in duration-700">
                  {/* Text Stack (Temp & Region) - Left side, Right Aligned */}
                  <div className="flex flex-col items-end leading-none mb-1.5">
                     <span className="text-xl font-bold font-serif text-mag-black leading-none">{weather.temp}°</span>
                     <span className="text-[9px] font-bold uppercase tracking-wider text-mag-gray leading-none mt-0.5">TOKYO</span>
                  </div>

                  {/* Icon (Main Visual) - Right side */}
                  <div className="leading-none">
                     {getWeatherIcon(weather.code)}
                  </div>
               </div>
             )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b border-transparent overflow-x-auto no-scrollbar">
            {[Tab.ITINERARY, Tab.PREP, Tab.PACKING, Tab.COST, Tab.INFO, Tab.SHOPPING].map((tab) => (
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
                {tab === Tab.COST && '記帳'}
                {tab === Tab.INFO && '資訊'}
                {tab === Tab.SHOPPING && '購物'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mag-gold rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Spacer for Fixed Header */}
      <div className="h-[140px]"></div>

      {/* Main Content */}
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
        {activeTab === Tab.COST && (
          <CostView 
            expenses={expenses}
            isLoading={isExpensesLoading}
            fetchError={expenseFetchError}
            onRefresh={() => fetchExpenses(true)}
            onAddSuccess={() => fetchExpenses(true)}
          />
        )}
        {activeTab === Tab.INFO && <InfoView />}
        {activeTab === Tab.SHOPPING && <ShoppingView items={shoppingList} setItems={setShoppingList} />}
      </main>
      
    </div>
  );
};

export default App;
