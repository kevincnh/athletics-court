import React from 'react';
import { Search, RefreshCw, X, Check } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { ConflictGroupCard } from './ConflictGroupCard';

export function BookingsView({
  bookings,
  filteredBookings,
  isLoading,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  handleConfirm,
  handleReject,
  actionLoadingId
}: any) {
  const [selectedCourtTab, setSelectedCourtTab] = React.useState<string>('All');
  
  const courts = ['All', '1', '2', '3', '4', '5', '6'];

  const bookingsForSelectedCourt = filteredBookings.filter((b: any) => {
    if (selectedCourtTab === 'All') return true;
    return b.slots?.some((s: any) => String(s.court) === selectedCourtTab);
  });

  const conflictMap = React.useMemo(() => {
    const slotToBookingIds = new Map<string, string[]>();
    const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
    
    // Map slot key to booking IDs
    pendingBookings.forEach((b: any) => {
      b.slots?.forEach((slot: any) => {
        const key = `${slot.court}-${slot.date}-${slot.timeSlot}`;
        if (!slotToBookingIds.has(key)) {
          slotToBookingIds.set(key, []);
        }
        slotToBookingIds.get(key)!.push(b.id);
      });
    });

    // Map each booking ID to its conflicting booking IDs
    const conflicts = new Map<string, Set<string>>();
    pendingBookings.forEach((b: any) => {
      const confSet = new Set<string>();
      b.slots?.forEach((slot: any) => {
        const key = `${slot.court}-${slot.date}-${slot.timeSlot}`;
        slotToBookingIds.get(key)?.forEach(id => {
          if (id !== b.id) confSet.add(id);
        });
      });
      conflicts.set(b.id, confSet);
    });
    
    return conflicts;
  }, [bookings]);

  const renderBookingsList = () => {
    const renderedIds = new Set<string>();
    const elements: React.ReactNode[] = [];

    bookingsForSelectedCourt.forEach((b: any) => {
      if (renderedIds.has(b.id)) return;

      if (b.status === 'pending') {
        const conflictSet = conflictMap.get(b.id);
        if (conflictSet && conflictSet.size > 0) {
          const conflicts = bookings.filter((other: any) => conflictSet.has(other.id));
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
        />
      );
    });

    return elements;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
          Manage Bookings
        </h2>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          {(['pending', 'confirmed', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                activeTab === tab 
                  ? tab === 'pending' ? 'bg-amber-100 text-amber-800' 
                    : tab === 'confirmed' ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {bookings.filter((b: any) => b.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search bookings..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none transition-all text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
        />
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Vertical Tabs for Courts */}
        <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4 gap-1.5 scrollbar-thin">
          <p className="hidden md:block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3">Filter by Court</p>
          {courts.map(court => {
            const isActive = selectedCourtTab === court;
            const count = bookings.filter((b: any) => {
              if (b.status !== activeTab) return false;
              if (court === 'All') return true;
              return b.slots?.some((s: any) => String(s.court) === court);
            }).length;

            return (
              <button
                key={court}
                onClick={() => setSelectedCourtTab(court)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap md:w-full ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{court === 'All' ? 'All Courts' : `Court ${court}`}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ml-2 font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Bookings List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px]">
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
              <p className="font-bold text-sm">Loading...</p>
            </div>
          ) : bookingsForSelectedCourt.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 font-bold text-sm">No bookings found for this court</p>
            </div>
          ) : (
            renderBookingsList()
          )}
        </div>
      </div>
    </div>
  );
}
