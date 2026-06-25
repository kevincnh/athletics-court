import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function CourtsView({ bookings, selectedAdminCourt, setSelectedAdminCourt }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];
  const courts = [1, 2, 3, 4, 5, 6];

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Compute status for a specific court and slot on selectedDate
  const getSlotStatus = (court: number, time: string) => {
    let status = 'available'; // 'available', 'pending', 'confirmed'
    for (const b of bookings) {
      if (b.status === 'rejected') continue;
      const hasSlot = b.slots?.some((s: any) => s.court === court && s.date === dateStr && s.timeSlot === time);
      if (hasSlot) {
        if (b.status === 'confirmed') return 'confirmed';
        if (b.status === 'pending') status = 'pending';
      }
    }
    return status;
  };

  const visibleCourts = selectedAdminCourt ? [selectedAdminCourt] : courts;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
            {selectedAdminCourt ? `Court ${selectedAdminCourt} Schedule` : 'All Courts Schedule'}
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            View available, pending, and confirmed time slots.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedAdminCourt && (
            <button
              onClick={() => setSelectedAdminCourt(null)}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              View All Courts
            </button>
          )}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button 
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-1 flex items-center gap-2 font-bold text-sm text-slate-800 min-w-[140px] justify-center">
              <Calendar size={14} className="text-slate-400" />
              {format(selectedDate, 'MMM d, yyyy')}
            </div>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 px-2 text-xs font-bold text-slate-500">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-200"></span>
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300"></span>
          Pending
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-slate-900 border border-slate-900"></span>
          Confirmed
        </span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${visibleCourts.length}, minmax(0, 1fr))` }}>
            {/* Header */}
            <div className="p-3 text-xs font-black text-slate-400 text-right uppercase border-b border-slate-100">
              Time
            </div>
            {visibleCourts.map(c => (
              <div key={c} className="p-3 text-center font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 border-l border-slate-50">
                Court {c}
              </div>
            ))}

            {/* Rows */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="p-3 text-xs font-bold text-slate-400 text-right border-b border-slate-50 flex items-center justify-end">
                  {time}
                </div>
                {visibleCourts.map(c => {
                  const status = getSlotStatus(c, time);
                  return (
                    <div key={`${c}-${time}`} className="p-1.5 border-b border-l border-slate-50">
                      <div className={`w-full h-full min-h-[36px] rounded-lg border transition-all flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${
                        status === 'available' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600/0 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                        : status === 'pending' ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      }`}>
                        {status === 'available' ? 'Avail' : status}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
