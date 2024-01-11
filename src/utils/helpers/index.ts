export function randomGenerator(digits: number) {
  let randomNumber = '';
  for (let i = 0; i < digits; i++) {
    randomNumber += Math.floor(Math.random() * 10).toString();
  }
  return randomNumber;
}
// Gets UTC offset of a timezone |
// getUTCoffsetOfTimezone('Asia/Calcutta', 'US') => +5:30
// getUTCoffsetOfTimezone('America/New_York', 'US') => -5
// getUTCoffsetOfTimezone('America/Los_Angeles', 'US') => -8
export const getUTCoffsetOfTimezone = (tz: string) =>
  Intl.DateTimeFormat(`en`, {timeZoneName: 'shortOffset', timeZone: tz})
    .formatToParts()
    .find((i) => i.type === 'timeZoneName')
    .value.slice(3); // ex: '+5:30'

// Get TimeZone name with offset | ex: '+5:30' => ['Asia/Calcutta', 'Asia/Colombo']
export const getTimeZoneListWithOffset = (offset: string) =>
  Intl.supportedValuesOf('timeZone').filter((tz) => getUTCoffsetOfTimezone(tz) === offset);

// Get time offset w.r.t UTC | ex: '+5:30' or '-9' or '+10'
export const extractUTCoffset = (dateObject = new Date()) => {
  const offset = dateObject.getTimezoneOffset(),
    o = Math.abs(offset);
  if (o % 60 === 0) {
    return offset === 0 ? '' : `${offset < 0 ? '+' : '-'}${o / 60}`;
  }
  return offset === 0 ? '' : `${offset < 0 ? '+' : '-'}${('' + Math.floor(o / 60)).slice(-2)}${('' + Math.floor(o / 60)).slice(-2)}`;
};

// Get time offset w.r.t UTC | ex: '+5:30'
export const calculateUTCoffsetForDate = (dateObject = new Date(), withPadding = false) => {
  const offset = dateObject.getTimezoneOffset(),
    o = Math.abs(offset);
  if (o % 60 === 0) {
    return offset === 0
      ? ''
      : `${offset < 0 ? '+' : '-'}${((withPadding ? '00' : '') + Math.floor(o / 60)).slice(-2)}${withPadding ? ':00' : ''}`;
  }
  return offset === 0
    ? ''
    : `${offset < 0 ? '+' : '-'}${((withPadding ? '00' : '') + Math.floor(o / 60)).slice(-2)}:${(
        (withPadding ? '00' : '') + Math.floor(o / 60)
      ).slice(-2)}`;
};

// Ex: 10:30 AM IST / UTC +5:30
// Ex: 05:47 AM CST / UTC -6
export const getTimeStringWithTimezoneAndOffset = (
  date: Date,
  timezone: string = 'America/Chicago',
  locale: string = 'en',
  country: string = 'US',
) => {
  const timeString = date
    .toLocaleString(`${locale}-${country}`, {
      timeZone: timezone,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .toUpperCase();

  return `${timeString} / UTC ${getUTCoffsetOfTimezone(timezone)}`;
};

//
