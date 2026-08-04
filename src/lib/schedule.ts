const STUDIO_TIME_ZONE = 'America/Los_Angeles';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DateDisplay = { dateStr: string; month: string; day: string };

function parseTime(value?: string): number | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const modifier = match[3]?.toUpperCase();
  if (minutes > 59 || (modifier && (hours < 1 || hours > 12)) || (!modifier && hours > 23)) return null;
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatCalendarDate(date: Date): DateDisplay {
  return {
    dateStr: date.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    month: date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }),
    day: date.toLocaleDateString('en-US', { timeZone: 'UTC', day: '2-digit' }),
  };
}

export function getClassDateDisplay(scheduleDay?: string, scheduleTime?: string, now = new Date()): DateDisplay {
  const value = scheduleDay?.trim() || '';
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateMatch) {
    return formatCalendarDate(new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))));
  }

  const targetWeekday = WEEKDAYS.findIndex(day => day.toLowerCase() === value.toLowerCase());
  if (targetWeekday >= 0) {
    const studioParts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: STUDIO_TIME_ZONE,
        year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
      }).formatToParts(now).filter(part => part.type !== 'literal').map(part => [part.type, part.value]),
    );
    const studioWeekday = WEEKDAYS.indexOf(studioParts.weekday);
    let daysAhead = (targetWeekday - studioWeekday + 7) % 7;
    const scheduledMinutes = parseTime(scheduleTime);
    const currentMinutes = Number(studioParts.hour) * 60 + Number(studioParts.minute);
    if (daysAhead === 0 && scheduledMinutes !== null && currentMinutes > scheduledMinutes) daysAhead = 7;

    const nextDate = new Date(Date.UTC(Number(studioParts.year), Number(studioParts.month) - 1, Number(studioParts.day) + daysAhead));
    return formatCalendarDate(nextDate);
  }

  const parsed = new Date(value);
  if (value && !Number.isNaN(parsed.getTime())) {
    return {
      dateStr: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      month: parsed.toLocaleDateString('en-US', { month: 'short' }),
      day: parsed.toLocaleDateString('en-US', { day: '2-digit' }),
    };
  }

  return { dateStr: 'Date to be confirmed', month: 'Date', day: 'TBD' };
}
