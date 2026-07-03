import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeSlot(timeSlot: string): string {
  if (!timeSlot) return '';
  const match = timeSlot.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeSlot;

  const [_, hoursStr, __, modifier] = match;
  const startHour = parseInt(hoursStr, 10);
  let endHour = startHour + 1;
  let endModifier = modifier;

  if (startHour === 11 && modifier.toUpperCase() === 'AM') {
    endHour = 12;
    endModifier = 'PM';
  } else if (startHour === 11 && modifier.toUpperCase() === 'PM') {
    endHour = 12;
    endModifier = 'AM';
  } else if (startHour === 12) {
    endHour = 1;
  } else if (endHour > 12) {
    endHour = endHour - 12;
  }

  const startHourFormatted = String(startHour).padStart(2, '0');
  const endHourFormatted = String(endHour).padStart(2, '0');

  return `${startHourFormatted}:00 ${modifier} to ${endHourFormatted}:00 ${endModifier}`;
}
