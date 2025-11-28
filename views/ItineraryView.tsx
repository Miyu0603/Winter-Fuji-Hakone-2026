

import React from 'react';
import { ITINERARY } from '../constants';
import { ItineraryEvent, DaySchedule } from '../types';
import { BedIcon, MapIcon, ChevronRightIcon } from '../components/Icons';

interface ItineraryViewProps {
  onNavigateToDetail: (locationId: string) => void;
  selectedDateIdx: number;
  setSelectedDateIdx: (idx: number) => void;
}

const TimelineEvent: React.FC<{ event: ItineraryEvent; isLast: boolean; onLocationClick: (id: string) => void }> = ({ event, isLast, onLocationClick }) => {
  return (
    <div className="flex relative group">
      {/* Left: Time */}
      <div className="w-14 pt-1 flex-shrink-0 text-right pr-4">
        <span className="text-sm font-bold text-mag-black font-mono">{event.time}</span>
      </div>

      {/* Middle: Line & Dot */}
      <div className="flex flex-col items-center mr-4 relative">
        <div className={`w-2.5 h-2.5 rounded-full border-2 z-10 bg-mag-paper ${event.isHighlight ? 'border-mag-red' : 'border-gray-300'}`}></div>
        {!isLast && <div className="w-[1px] bg-gray-200 flex-grow my-1"></div>}
      </div>

      {/* Right: Content Card */}
      <div className="flex-1 pb-8">
        <div 
          onClick={() => event.locationId && onLocationClick(event.locationId)}
          className={`relative p-4 rounded-lg transition-all ${
            event.isHighlight 
              ? 'bg-mag-gold-light border border-mag-gold/20' 
              : 'bg-white border border-gray-100 shadow-sm'
          } ${event.locationId ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''}`}
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className={`text-base leading-relaxed ${event.isHighlight ? 'text-mag-black font-bold' : 'text-mag-black font-medium'}`}>
                {event.description}
              </p>
              {event.note && (
                <p className="text-sm text-mag-gray mt-1">
                  {event.note}
                </p>
              )}
            </div>
            
            {/* Clickable Arrow */}
            {event.locationId && (
              <div className="text-mag-gold opacity-60 group-hover:opacity-100 transition-opacity">
                <ChevronRightIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({ onNavigateToDetail, selectedDateIdx, setSelectedDateIdx }) => {
  const currentDay = ITINERARY[selectedDateIdx];

  return (
    <div className="pt-2">
      {/* Horizontal Date Selector - Removed sticky to allow full scrolling */}
      <div className="relative bg-mag-paper border-b border-gray-200">
        <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-3 snap-x">
          {ITINERARY.map((day, idx) => {
            const isSelected = idx === selectedDateIdx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDateIdx(idx)}
                className={`flex-shrink-0 snap-center flex flex-col items-center justify-center min-w-[4.5rem] py-2 rounded-xl transition-all duration-300 border ${
                  isSelected 
                    ? 'bg-mag-black text-white border-mag-black shadow-md transform scale-105' 
                    : 'bg-white text-gray-400 border-gray-100'
                }`}
              >
                <span className="text-[10px] font-bold tracking-wider uppercase mb-0.5 opacity-80">{day.date}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>{day.weekday.replace('星期', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Day Header Info - Aligned Left (Removed pl-14) */}
        <div className="mb-6 relative">
          <div className="pr-10"> {/* Add padding right to avoid overlap with map icon */}
             <h2 className="text-2xl font-serif font-bold text-mag-black mb-1">{currentDay.title}</h2>
             
             {/* Minimal Accommodation Style with Link */}
             {currentDay.accommodation && (
               <div className="flex items-center gap-2 mt-2">
                 <BedIcon className="w-4 h-4 text-mag-gold" />
                 {currentDay.accommodationMapUrl ? (
                   <a 
                     href={currentDay.accommodationMapUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-sm font-bold text-mag-gray hover:text-mag-red hover:underline transition-colors"
                   >
                     {currentDay.accommodation}
                   </a>
                 ) : (
                   <span className="text-sm font-bold text-mag-gray">{currentDay.accommodation}</span>
                 )}
               </div>
             )}
          </div>

          {currentDay.mapUrl && (
             <a href={currentDay.mapUrl} target="_blank" rel="noopener noreferrer" className="absolute right-0 top-1 p-2 bg-white rounded-full border border-gray-200 shadow-sm text-mag-gold hover:text-mag-black transition-colors z-10">
                <MapIcon className="w-5 h-5" />
             </a>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {currentDay.events.map((event, idx) => (
            <TimelineEvent 
              key={idx} 
              event={event} 
              isLast={idx === currentDay.events.length - 1} 
              onLocationClick={onNavigateToDetail}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
