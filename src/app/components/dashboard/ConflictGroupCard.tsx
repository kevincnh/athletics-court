import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Check, RefreshCw, User, Phone, Mail, Calendar, MapPin, Clock } from 'lucide-react';

export function ConflictGroupCard({
  bookings,
  handleConfirm,
  handleReject,
  handleResolveSlotConflict,
  actionLoadingId
}: any) {
  // All bookings in the group conflict. Let's find the conflicting slots to display in the header banner.
  const conflictSlotsData: { court: number; date: string; timeSlot: string; key: string }[] = [];
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
      conflictSlotsData.push({
        court: Number(court),
        date,
        timeSlot,
        key
      });
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
        <div className="p-1.5 rounded-lg bg-amber-500 text-amber-950">
          <AlertTriangle size={18} className="stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
            Booking Conflict Detected ({bookings.length} Requests)
          </h3>
          <p className="text-xs font-semibold text-amber-700 mt-0.5">
            Resolve conflicts per slot below. Confirming a slot dynamically confirms it for that request and auto-rejects/removes it from others.
          </p>
        </div>
      </div>

      {/* Grid of Conflicting Slots */}
      <div className="p-5 space-y-6">
        {conflictSlotsData.map(({ court, date, timeSlot, key }) => {
          // Find all bookings that requested this specific slot
          const slotBookings = bookings.filter((b: any) =>
            b.slots?.some((s: any) => String(s.court) === String(court) && s.date === date && s.timeSlot === timeSlot)
          );

          return (
            <div key={key} className="border border-amber-200/80 rounded-xl bg-white overflow-hidden shadow-sm">
              {/* Conflicting Slot Title */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="font-extrabold text-sm text-slate-800">
                    Court {court} &bull; {formatDate(date)} &bull; {timeSlot}
                  </span>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Conflict
                </span>
              </div>

              {/* Side-by-side bookings requesting this slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {slotBookings.map((b: any) => {
                  const shortId = b.id.substring(0, 3).toUpperCase();
                  const isLoading = actionLoadingId === `${b.id}-${court}-${date}-${timeSlot}`;

                  return (
                    <div key={b.id} className="p-4 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Request #{shortId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Submitted: {b.createdAt ? format(new Date(b.createdAt), "MMM d, h:mm a") : 'N/A'}
                          </span>
                        </div>

                        {/* Customer details mini card */}
                        <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-xs">
                          <div className="font-bold text-slate-800 truncate">{b.name}</div>
                          <div className="text-slate-600 font-semibold">{b.phone}</div>
                          {b.email && <div className="text-slate-500 truncate">{b.email}</div>}
                        </div>

                      </div>

                      {/* Action Button for this slot */}
                      <button
                        onClick={() => handleResolveSlotConflict(b.id, court, date, timeSlot)}
                        disabled={actionLoadingId !== null}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <RefreshCw size={12} className="animate-spin text-white" />
                        ) : (
                          <Check size={12} strokeWidth={3} />
                        )}
                        <span>Confirm slot for {b.name.split(' ')[0]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Whole Booking Actions */}
      <div className="bg-slate-50 border-t border-amber-200/50 p-4 flex flex-col gap-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Manage Whole Booking Requests
        </h4>
        <div className="flex flex-wrap gap-3">
          {bookings.map((b: any) => {
            const shortId = b.id.substring(0, 3).toUpperCase();
            return (
              <div key={b.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
                <span className="font-bold text-slate-700">#{shortId} ({b.name})</span>
                <button
                  onClick={() => handleReject(b.id)}
                  disabled={actionLoadingId !== null}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                >
                  Decline Request
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
