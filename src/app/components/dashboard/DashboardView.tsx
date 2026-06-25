import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, Layers, TrendingUp, X, Check, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { ConflictGroupCard } from './ConflictGroupCard';

export function DashboardView({
  bookings,
  pendingCount,
  confirmedCount,
  totalSlotsCount,
  totalRevenue,
  isLoading,
  handleConfirm,
  handleReject,
  handleResolveSlotConflict,
  actionLoadingId,
  isDoubleBooked,
  setActiveNav,
  setSelectedAdminCourt
}: any) {
  const [localActiveTab, setLocalActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const localFilteredBookings = bookings.filter((b: any) => b.status === localActiveTab);

  // Compute "Activity by Day" across all bookings
  const weekActivity = [0, 0, 0, 0, 0, 0, 0]; // Mon - Sun

  bookings.forEach((b: any) => {
    if (b.status === 'rejected') return;
    b.slots?.forEach((s: any) => {
      if (s.status === 'rejected') return;
      if (!s.date) return;
      try {
        const [year, month, day] = s.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayIdx = dateObj.getDay(); 
        const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        weekActivity[mappedIdx] += 1;
      } catch (e) {}
    });
  });

  const maxActivity = Math.max(...weekActivity, 1);
  const activityData = [
    { day: 'Mon', h: `${(weekActivity[0] / maxActivity) * 100}%`, count: weekActivity[0] },
    { day: 'Tue', h: `${(weekActivity[1] / maxActivity) * 100}%`, count: weekActivity[1] },
    { day: 'Wed', h: `${(weekActivity[2] / maxActivity) * 100}%`, count: weekActivity[2] },
    { day: 'Thu', h: `${(weekActivity[3] / maxActivity) * 100}%`, count: weekActivity[3] },
    { day: 'Fri', h: `${(weekActivity[4] / maxActivity) * 100}%`, count: weekActivity[4] },
    { day: 'Sat', h: `${(weekActivity[5] / maxActivity) * 100}%`, count: weekActivity[5] },
    { day: 'Sun', h: `${(weekActivity[6] / maxActivity) * 100}%`, count: weekActivity[6] },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Pending Action", value: pendingCount.toString(), delta: pendingCount > 0 ? "Requires review" : "All caught up", icon: Clock, highlight: pendingCount > 0 },
          { label: "Confirmed Bookings", value: confirmedCount.toString(), delta: "Active in Calendar", icon: CheckCircle2, highlight: false },
          { label: "Booked Hours", value: totalSlotsCount.toString(), delta: "Total reserved slots", icon: Layers, highlight: false },
          { label: "Estimated Revenue", value: `₱${totalRevenue.toLocaleString()}`, delta: "Based on confirmed", icon: TrendingUp, highlight: true },
        ].map(({ label, value, delta, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`rounded-2xl p-6 border transition-all ${
              highlight && label === "Estimated Revenue"
                ? "bg-amber-400 border-amber-400 text-amber-950 shadow-[0_8px_20px_rgba(251,191,36,0.2)]"
                : highlight && label === "Pending Action"
                ? "bg-white border-amber-300 shadow-sm"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${
                  highlight && label === "Estimated Revenue" ? "text-amber-900/70" 
                  : highlight && label === "Pending Action" ? "text-amber-600" 
                  : "text-slate-500"
                }`}>
                  {label}
                </p>
                <p className={`text-4xl font-black mt-2 tracking-tight ${
                  highlight && label === "Estimated Revenue" ? "text-amber-950" : "text-slate-900"
                }`}>
                  {value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                highlight && label === "Estimated Revenue" ? "bg-amber-300/50" 
                : highlight && label === "Pending Action" ? "bg-amber-100/50 text-amber-600"
                : "bg-slate-100 text-slate-500"
              }`}>
                <Icon size={24} />
              </div>
            </div>
            <p className={`text-xs mt-4 font-semibold ${
              highlight && label === "Estimated Revenue" ? "text-amber-900/80" 
              : highlight && label === "Pending Action" ? "text-amber-700/80" 
              : "text-slate-400"
            }`}>
              {delta}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Facilities */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Facilities Status */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
              Facilities Status
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Occupied
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Available
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
            {[1, 2, 3, 4, 5, 6].map(courtId => {
              const isOccupied = false; 
              return (
                <div 
                  key={courtId}
                  onClick={() => {
                    setSelectedAdminCourt(courtId);
                    setActiveNav("Courts");
                  }}
                  className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Court {courtId}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block bg-slate-100 text-slate-600 uppercase tracking-wider">
                        Padel
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isOccupied ? "bg-slate-900 text-white" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {isOccupied ? "Occupied" : "Available"}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span className="text-xs font-semibold">
                        View Schedule
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly bookings chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">
            Activity by Day
          </h2>
          <div className="flex-1 flex items-end gap-3 justify-between pb-2 h-48 mt-4">
            {activityData.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full h-full group cursor-pointer relative">
                {stat.count > 0 && (
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                    {stat.count}
                  </div>
                )}
                <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end flex-1">
                  <div 
                    className="w-full bg-amber-400 rounded-t-md group-hover:bg-amber-300 transition-colors" 
                    style={{ height: stat.h }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">{stat.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Manage Bookings
              </h2>
              <button 
                onClick={() => setActiveNav("Bookings")}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                View All Bookings
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setLocalActiveTab('pending')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${
                  localActiveTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Pending</span>
              </button>
              <button
                onClick={() => setLocalActiveTab('confirmed')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${
                  localActiveTab === 'confirmed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Confirmed</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
                <p className="font-bold text-sm">Loading...</p>
              </div>
            ) : localFilteredBookings.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 font-bold text-sm">No bookings found</p>
              </div>
            ) : (
              (() => {
                const renderedIds = new Set<string>();
                const elements: React.ReactNode[] = [];

                localFilteredBookings.forEach((b: any) => {
                  if (renderedIds.has(b.id)) return;

                  if (b.status === 'pending') {
                    const conflicts = bookings.filter((other: any) => {
                      if (other.id === b.id || other.status !== 'pending') return false;
                      return b.slots?.some((slot: any) => 
                        other.slots?.some((otherSlot: any) => 
                          slot.court === otherSlot.court && 
                          slot.date === otherSlot.date && 
                          slot.timeSlot === otherSlot.timeSlot
                        )
                      );
                    });

                    if (conflicts.length > 0) {
                      const group = [b, ...conflicts];
                      group.forEach(g => renderedIds.add(g.id));
                      elements.push(
                        <ConflictGroupCard
                          key={`conflict-${b.id}`}
                          bookings={group}
                          handleConfirm={handleConfirm}
                          handleReject={handleReject}
                          handleResolveSlotConflict={handleResolveSlotConflict}
                          actionLoadingId={actionLoadingId}
                        />
                      );
                      return;
                    }
                  }

                  renderedIds.add(b.id);
                  elements.push(
                    <BookingCard
                      key={b.id}
                      booking={b}
                      handleConfirm={handleConfirm}
                      handleReject={handleReject}
                      actionLoadingId={actionLoadingId}
                      isDoubleBooked={isDoubleBooked}
                      setActiveNav={setActiveNav}
                    />
                  );
                });

                return elements;
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
