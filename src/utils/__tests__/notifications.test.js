import * as Notifications from 'expo-notifications';
import {
    SILENT_CHANNEL_ID,
    cancelReminder,
    ensurePermissionsAndChannel,
    scheduleReminder,
    sendTestNotification,
} from '../notifications';

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn().mockResolvedValue({}),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    getNotificationChannelAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    AndroidImportance: { HIGH: 6 },
    IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: {
        DATE: 'date',
        DAILY: 'daily',
        TIME_INTERVAL: 'timeInterval',
    },
}));

// Module-load side effect (runs before any test, so it lives outside the
// describe whose beforeEach clears mock call history).
describe('notifications module init', () => {
    test('registers a notification handler at module load', () => {
        expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });
});

describe('notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ensurePermissionsAndChannel resolves true when already granted', async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
        await expect(ensurePermissionsAndChannel()).resolves.toBe(true);
        expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    test('ensurePermissionsAndChannel requests permissions when not granted', async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: false });
        Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
        await expect(ensurePermissionsAndChannel()).resolves.toBe(true);
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    test('scheduleReminder does nothing when disabled', async () => {
        await expect(scheduleReminder({ enabled: false })).resolves.toBeNull();
        expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('schedules a DATE trigger for a one-off reminder', async () => {
        Notifications.scheduleNotificationAsync.mockResolvedValue('nid-1');
        const reminder = {
            id: 'r1',
            enabled: true,
            title: 'Take meds',
            body: '',
            repeatType: 'once',
            date: '2026-08-29',
            time: '08:30',
            repeatEveryMinutes: null,
        };

        await expect(scheduleReminder(reminder)).resolves.toBe('nid-1');
        const arg = Notifications.scheduleNotificationAsync.mock.calls[0][0];
        expect(arg.identifier).toBe('r1');
        expect(arg.content.title).toBe('Take meds');
        expect(arg.trigger.type).toBe('date');
        expect(arg.trigger.date).toBeInstanceOf(Date);
    });

    test('schedules a DAILY trigger for an every-day reminder', async () => {
        Notifications.scheduleNotificationAsync.mockResolvedValue('nid-2');
        const reminder = {
            id: 'r2',
            enabled: true,
            title: 'Stretch',
            body: '',
            repeatType: 'daily',
            date: null,
            time: '09:00',
            repeatEveryMinutes: null,
        };

        await scheduleReminder(reminder);
        const arg = Notifications.scheduleNotificationAsync.mock.calls[0][0];
        expect(arg.trigger.type).toBe('daily');
        expect(arg.trigger.hour).toBe(9);
        expect(arg.trigger.minute).toBe(0);
    });

    test('uses the silent channel when the reminder sound is silent', async () => {
        Notifications.scheduleNotificationAsync.mockResolvedValue('nid-4');
        await scheduleReminder({
            id: 'r4',
            enabled: true,
            title: 'Quiet reminder',
            body: '',
            repeatType: 'daily',
            date: null,
            time: '10:00',
            repeatEveryMinutes: null,
            sound: 'silent',
        });
        const arg = Notifications.scheduleNotificationAsync.mock.calls[0][0];
        expect(arg.content.sound).toBe(false);
        expect(arg.content.data.silent).toBe(true);
        expect(arg.trigger.channelId).toBe(SILENT_CHANNEL_ID);
    });

    test('schedules exact one-off occurrences starting at the chosen time for repeats', async () => {
        Notifications.scheduleNotificationAsync.mockResolvedValue('nid');
        await scheduleReminder({
            id: 'r3',
            enabled: true,
            title: 'Drink water',
            body: '',
            repeatType: 'once',
            date: '2026-08-29',
            time: '08:30',
            repeatEveryMinutes: 15,
            sound: 'psyduck',
        });

        const calls = Notifications.scheduleNotificationAsync.mock.calls;
        expect(calls.length).toBeGreaterThan(1);
        const first = calls[0][0];
        expect(first.trigger.type).toBe('date');
        expect(first.trigger.date.getTime()).toBeGreaterThan(Date.now());
        const second = calls[1][0];
        expect(second.trigger.date.getTime() - first.trigger.date.getTime()).toBe(15 * 60 * 1000);
        expect(first.identifier).not.toBe(second.identifier);
    });

    test('cancelReminder cancels by identifier', async () => {
        await cancelReminder('abc');
        expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('abc');
    });

    test('sendTestNotification reports the pipeline status', async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
        Notifications.scheduleNotificationAsync.mockResolvedValue('test-id');
        Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);

        const result = await sendTestNotification();

        expect(result).toContain('Permission: granted');
        expect(result).toContain('Scheduled OK (id: test-id)');
        expect(result).toContain('Total scheduled now: 0');
    });
});
