import type { Session } from '@/types/types';
import { parseTimeStrToMinutes, parseCustomDate } from './dateFormating';

export const checkTimeOverlap = (
  timeStr: string,
  selectedTimes: string[],
  startDateStr: string,
  endDateStr: string,
  movieDurationMins: number,
  hallSessions: Session[],
  currentMovieId: number | null 
): boolean => {
  const cleaningTimeMins = 15; 
  const currentDurationMins = movieDurationMins + cleaningTimeMins; 
  const proposedStartMins = parseTimeStrToMinutes(timeStr);
  const proposedEndMins = proposedStartMins + currentDurationMins;

  const overlapWithSelected = selectedTimes.some(selTime => {
    if (selTime === timeStr) return false;
    const selStart = parseTimeStrToMinutes(selTime);
    return proposedStartMins < (selStart + currentDurationMins) && proposedEndMins > selStart;
  });
  if (overlapWithSelected) return true;

  const start = parseCustomDate(startDateStr);
  const end = parseCustomDate(endDateStr);
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return false;

  let isOverlap = false;
  const current = new Date(start);
  
  while (current <= end && !isOverlap) {
    const proposedStartTs = new Date(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}T${timeStr}:00`).getTime();
    const proposedEndTs = proposedStartTs + currentDurationMins * 60000;

    isOverlap = hallSessions.some(s => {

      const existingStart = new Date(s.startTime).getTime();

      const existingDurationMins = (s.Movies?.duration || movieDurationMins) + cleaningTimeMins;
      
      return proposedStartTs < (existingStart + existingDurationMins * 60000) && proposedEndTs > existingStart;
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return isOverlap;
};