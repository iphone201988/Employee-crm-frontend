export const getExpectedDailyHours = (member: any) => {
  const capacityHours = parseFloat(member.capacity.split(':')[0]);
  return capacityHours / 5; // Split across 5 weekdays only (Mon-Fri)
};

export const isDayUnderCapacity = (dailyHours: string, expectedHours: number) => {
  const actualHours = parseFloat(dailyHours.split(':')[0]) + parseFloat(dailyHours.split(':')[1]) / 60;
  return actualHours < expectedHours;
};

export const getTimeSummary = (member: any) => {
  const billableTime = member.timeEntries
    .filter((entry: any) => entry.billable === 'billable')
    .reduce((sum: number, entry: any) => {
      const hours = parseFloat(entry.hours.split(':')[0]);
      const minutes = parseFloat(entry.hours.split(':')[1]);
      return sum + hours + (minutes / 60);
    }, 0);

  const nonBillableTime = member.timeEntries
    .filter((entry: any) => entry.billable === 'non-billable')
    .reduce((sum: number, entry: any) => {
      const hours = parseFloat(entry.hours.split(':')[0]);
      const minutes = parseFloat(entry.hours.split(':')[1]);
      return sum + hours + (minutes / 60);
    }, 0);

  const unknownTime = member.timeEntries
    .filter((entry: any) => entry.billable === 'unknown')
    .reduce((sum: number, entry: any) => {
      const hours = parseFloat(entry.hours.split(':')[0]);
      const minutes = parseFloat(entry.hours.split(':')[1]);
      return sum + hours + (minutes / 60);
    }, 0);

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  return {
    billable: formatTime(billableTime),
    nonBillable: formatTime(nonBillableTime),
    unknown: formatTime(unknownTime)
  };
};