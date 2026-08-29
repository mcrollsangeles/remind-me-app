import {
    dateLabel,
    dateTimeLabel,
    isExpiredOnce,
    nowTimeString,
    pad,
    parseDateString,
    parseTimeString,
    reminderSummary,
    timeLabel,
    todayString,
    uuid,
} from '../helpers';

describe('helpers', () => {
    test('pad pads numbers to two digits', () => {
        expect(pad(5)).toBe('05');
        expect(pad(12)).toBe('12');
        expect(pad(0)).toBe('00');
    });

    test('uuid returns a unique v4-shaped string', () => {
        const a = uuid();
        const b = uuid();
        expect(a).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
        expect(a).not.toBe(b);
    });

    test('todayString returns YYYY-MM-DD for today', () => {
        const d = new Date();
        const expected = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        expect(todayString()).toBe(expected);
    });

    test('nowTimeString returns HH:mm shape', () => {
        expect(nowTimeString()).toMatch(/^\d{2}:\d{2}$/);
    });

    test('parseDateString builds a local Date from YYYY-MM-DD', () => {
        const d = parseDateString('2026-08-29');
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(7); // months are 0-based
        expect(d.getDate()).toBe(29);
    });

    test('parseTimeString builds a Date carrying hour/minute', () => {
        const t = parseTimeString('09:05');
        expect(t.getHours()).toBe(9);
        expect(t.getMinutes()).toBe(5);
    });

    test('timeLabel formats to 12-hour with AM/PM', () => {
        expect(timeLabel('00:00')).toBe('12:00 AM');
        expect(timeLabel('09:05')).toBe('9:05 AM');
        expect(timeLabel('12:00')).toBe('12:00 PM');
        expect(timeLabel('13:30')).toBe('1:30 PM');
    });

    test('dateLabel includes the year', () => {
        expect(dateLabel('2026-08-29')).toContain('2026');
    });

    test('dateTimeLabel combines date and time', () => {
        const label = dateTimeLabel('2026-08-29', '08:30');
        expect(label).toContain('8:30 AM');
        expect(label).toContain('2026');
    });

    test('isExpiredOnce detects past one-off reminders', () => {
        expect(
            isExpiredOnce({ repeatType: 'once', date: '2020-01-01', time: '00:00', repeatEveryMinutes: null })
        ).toBe(true);
        expect(
            isExpiredOnce({ repeatType: 'once', date: '2999-01-01', time: '00:00', repeatEveryMinutes: null })
        ).toBe(false);
        expect(
            isExpiredOnce({ repeatType: 'daily', date: null, time: '08:00', repeatEveryMinutes: null })
        ).toBe(false);
        // Interval repeats are not "expired" even if the anchor date passed.
        expect(
            isExpiredOnce({ repeatType: 'once', date: '2020-01-01', time: '00:00', repeatEveryMinutes: 10 })
        ).toBe(false);
    });

    test('reminderSummary describes each schedule type', () => {
        expect(
            reminderSummary({ repeatType: 'once', date: '2026-08-29', time: '08:30', body: 'hi', repeatEveryMinutes: null })
        ).toContain('8:30 AM');

        expect(
            reminderSummary({ repeatType: 'daily', date: null, time: '09:00', body: '', repeatEveryMinutes: null })
        ).toBe('Every day at 9:00 AM');

        expect(
            reminderSummary({ repeatType: 'once', date: '2026-08-29', time: '08:30', body: '', repeatEveryMinutes: 15 })
        ).toBe('Repeats every 15 min');
    });
});
