import React from 'react';
import { format } from 'date-fns';
import { X, Check, RefreshCw, AlertTriangle, User, Phone, Mail, Calendar, MapPin, Clock } from 'lucide-react';

export function ConflictGroupCard({
  bookings,
  handleConfirm,
  handleReject,
  actionLoadingId
}: any) {
  // All bookings in the group conflict. Let's find the conflicting slots to display in the header banner.
  // We can collect unique slots (court, date, timeSlot) that are shared between them.
  const conflictSlots: string[] = [];
  const slotsMap = new Map<string, number>();

  bookings.forEach((b: any) => {
    b.slots?.forEach((s: any) => {
      const key = `${s.court}|${s.date}|${s.timeSlot}`;
      slotsMap.set(key, (slotsMap.get(key) || 0) + 1);
    });
  });

  // Any slot with a count > 1 is conflicting
  for (const [key, count] of slotsMap.entries()) {
    if (count > 1) {
      const [court, date, timeSlot] = key.split('|');
      conflictSlots.push(`Court ${court} on ${date} @ ${timeSlot}`);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      return format(new Date(year, month - 1, day), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="border-2 border-amber-300 rounded-2xl bg-amber-50/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header Banner */}
      <div className="bg-amber-500/10 border-b border-amber-200 px-5 py-3 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-amber-505 bg-amber-500 text-amber-950">
          <AlertTriangle size={18} className="stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
            Booking Conflict Detected ({bookings.length} Requests)
          </h3>
          <p className="text-xs font-semibold text-amber-700 mt-0.5">
            The following requests overlap on: <span className="font-extrabold">{conflictSlots.join('; ')}</span>
          </p>
        </div>
      </div>

      {/* Grid of overlapping bookings */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 divide-y lg:divide-y-0 lg:divide-x divide-amber-200/55">
        {bookings.map((b: any, index: number) => {
          const createdAtFormatted = b.createdAt ? format(new Date(b.createdAt), "MMM d, h:mm a") : 'N/A';
          const shortId = b.id.substring(0, 3).toUpperCase();
          const totalSlots = b.slots?.length || 0;
          const totalPrice = totalSlots * 500;

          // Group slots by court
          const slotsByCourt = b.slots?.reduce((acc: any, slot: any) => {
            if (!acc[slot.court]) acc[slot.court] = [];
            acc[slot.court].push(slot);
            return acc;
          }, {}) || {};

          return (
            <div key={b.id} className={`flex flex-col justify-between gap-4 ${index > 0 ? 'pt-5 lg:pt-0 lg:pl-5' : ''}`}>
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">#{shortId}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      Submitted: {createdAtFormatted}
                    </span>
                  </div>
                  <span className="text-lg font-black text-slate-900">₱{totalPrice.toLocaleString()}</span>
                </div>

                {/* Customer Details Card */}
                <div className="bg-white/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-1">
                    Customer
                  </p>
                  <div className="flex items-center gap-2 font-extrabold text-slate-800 text-sm">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{b.email}</span>
                  </div>
                </div>

                {/* Reservation Slots Details */}
                <div className="bg-white/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 pb-1 mb-1">
                    Reservation Details
                  </p>
                  {Object.entries(slotsByCourt).map(([court, slots]: [string, any]) => (
                    <div key={court} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>{formatDate(slots[0]?.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-800 font-extrabold">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>Court {court}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-900 font-black">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>
                          {slots.map((s: any) => s.timeSlot).join(', ')}
                          <span className="text-slate-400 text-[10px] font-bold ml-1">({slots.length}h)</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action for this booking */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleConfirm(b.id)}
                  disabled={actionLoadingId !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  {actionLoadingId === b.id ? (
                    <RefreshCw size={14} className="animate-spin text-white" />
                  ) : (
                    <Check size={14} strokeWidth={2.5} />
                  )}
                  <span>Confirm & Decline Other</span>
                </button>
                <button
                  onClick={() => handleReject(b.id)}
                  disabled={actionLoadingId !== null}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all font-bold text-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  title="Reject only this request"
                >
                  <X size={15} strokeWidth={2.5} />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
