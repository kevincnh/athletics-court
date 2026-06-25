import React from 'react';
import { Search, Clock, CheckCircle2, Layers, TrendingUp, X, Check, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { ConflictGroupCard } from './ConflictGroupCard';

export function DashboardView({
  bookings,
  pendingCount,
  confirmedCount,
  totalSlotsCount,
  totalRevenue,
  filteredBookings,
  isLoading,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  handleConfirm,
  handleReject,
  actionLoadingId,
  isDoubleBooked,
  setActiveNav,
  setSelectedAdminCourt
}: any) {
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
                : highlight && label === "Pending Action" ? "bg-amber-50 text-amber-600"
                : "bg-slate-50 text-slate-500"
              }`}>
                <Icon size={20} className={
                  highlight && label === "Estimated Revenue" ? "text-amber-950" 
                  : highlight && label === "Pending Action" ? "text-amber-600"
                  : "text-slate-500"
                } />
              </div>
            </div>
            <p className={`text-sm font-semibold mt-4 ${
              highlight && label === "Estimated Revenue" ? "text-amber-900/80" 
              : highlight && label === "Pending Action" ? "text-amber-600"
              : "text-slate-400"
            }`}>
              {delta}
            </p>
          </div>
        ))}
      </div>

      {/* Court availability + chart row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Court grid */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
              Facilities Status
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />Occupied</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            {[1, 2, 3, 4, 5, 6].map((courtId) => {
              const isOccupied = false; 
              return (
                <div
                  key={courtId}
                  onClick={() => {
                    // Navigate to Courts tab
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

        {/* Weekly bookings chart (Tailwind CSS based) */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">
            This Week Activity
          </h2>
          <div className="flex-1 flex items-end gap-3 justify-between pb-2 h-48">
            {[
              { day: 'Mon', h: '0%' },
              { day: 'Tue', h: '0%' },
              { day: 'Wed', h: '0%' },
              { day: 'Thu', h: '0%' },
              { day: 'Fri', h: '0%' },
              { day: 'Sat', h: '0%' },
              { day: 'Sun', h: '0%' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full group cursor-pointer">
                <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end h-full">
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
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
              Manage Bookings
            </h2>
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${
                  activeTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Pending</span>
              </button>
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${
                  activeTab === 'confirmed'
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
            ) : filteredBookings.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 font-bold text-sm">No bookings found</p>
              </div>
            ) : (
              (() => {
                const renderedIds = new Set<string>();
                const elements: React.ReactNode[] = [];

                filteredBookings.forEach((b: any) => {
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
