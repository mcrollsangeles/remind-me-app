import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Custom sound bundled via the expo-notifications config plugin (app.json).
// Works in development/standalone builds; Expo Go falls back to the default sound.
export const SOUND_FILE = 'psyduck.mp3';
export const CHANNEL_ID = 'reminders'; // channel with the Psyduck sound
export const SILENT_CHANNEL_ID = 'reminders_silent'; // channel with no sound

// Expo Go doesn't bundle app-specific notification sounds, so use the default
// sound there (the custom Psyduck sound only works in a real build/APK).
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
export const CHANNEL_SOUND = IS_EXPO_GO ? 'default' : SOUND_FILE;

// Show a banner (+ Psyduck sound unless the reminder is set to silent) when the
// notification arrives while the app is open.
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const silent =
            notification.request.trigger?.channelId === SILENT_CHANNEL_ID ||
            notification.request.content.data?.silent === true;
        return {
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: !silent,
            shouldSetBadge: false,
        };
    },
});

async function createChannel(id, name, sound) {
    try {
        await Notifications.setNotificationChannelAsync(id, {
            name,
            importance: Notifications.AndroidImportance.HIGH,
            sound,
            vibrationPattern: [0, 250, 250, 250],
        });
    } catch (e) {
        console.warn('Failed to create notification channel', id, e);
    }
}

export async function ensurePermissionsAndChannel() {
    if (Platform.OS === 'android') {
        await createChannel(CHANNEL_ID, 'Reminders (Psyduck)', CHANNEL_SOUND);
        await createChannel(SILENT_CHANNEL_ID, 'Reminders (Silent)', null);
    }

    const current = await Notifications.getPermissionsAsync();
    const granted =
        current.granted ||
        current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (granted) return true;

    const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });

    return (
        requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
}

function buildTrigger(reminder, channelId) {
    const { repeatType, date, time, repeatEveryMinutes } = reminder;
    const [hour, minute] = time.split(':').map(Number);

    if (repeatEveryMinutes && repeatEveryMinutes > 0) {
        return {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: repeatEveryMinutes * 60,
            repeats: true,
            channelId,
        };
    }

    if (repeatType === 'daily') {
        return {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId,
        };
    }

    const [y, m, d] = date.split('-').map(Number);
    const fireDate = new Date(y, m - 1, d, hour, minute, 0);
    return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId,
    };
}

const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000; // schedule up to 24h of occurrences ahead
const MAX_OCCURRENCES = 64; // iOS caps pending notifications at 64

// repeat every X minutes, compute the next occurrences starting at the chosen time
function computeOccurrences(reminder, now = Date.now()) {
    const { repeatType, date, time, repeatEveryMinutes } = reminder;
    const [hour, minute] = time.split(':').map(Number);
    let start;
    if (repeatType === 'once' && date) {
        const [y, m, d] = date.split('-').map(Number);
        start = new Date(y, m - 1, d, hour, minute, 0).getTime();
    } else {
        // "every day" style: the chosen time today
        const d = new Date(now);
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0).getTime();
    }
    const intervalMs = repeatEveryMinutes * 60 * 1000;
    if (!intervalMs) return [];

    if (start < now) {
        start += Math.ceil((now - start) / intervalMs) * intervalMs;
    }

    const timestamps = [];
    let t = start;
    while (timestamps.length < MAX_OCCURRENCES && t - now < REPEAT_WINDOW_MS) {
        timestamps.push(t);
        t += intervalMs;
    }
    return timestamps;
}

function occurrenceId(reminderId, timestamp) {
    return `${reminderId}-${timestamp}`;
}

export async function scheduleReminder(reminder) {
    if (!reminder.enabled) return null;
    const silent = reminder.sound === 'silent';
    const channelId = silent ? SILENT_CHANNEL_ID : CHANNEL_ID;
    // `false` = silent notification (docs); Android 8+ uses the channel's sound.
    const contentSound = silent ? false : CHANNEL_SOUND;
    const makeContent = () => ({
        title: reminder.title,
        body: reminder.body || 'Reminder',
        sound: contentSound,
        data: { reminderId: reminder.id, silent },
    });

    try {
        if (reminder.repeatEveryMinutes && reminder.repeatEveryMinutes > 0) {
            // Repeating reminder: schedule exact one-off alerts starting at the
            // chosen time. Exact alarms are delivered on time (unlike Android's
            // inexact repeating alarms). Replaces any previously scheduled ones.
            await cancelReminder(reminder);
            const timestamps = computeOccurrences(reminder);
            for (const ts of timestamps) {
                await Notifications.scheduleNotificationAsync({
                    identifier: occurrenceId(reminder.id, ts),
                    content: makeContent(),
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: new Date(ts),
                        channelId,
                    },
                });
            }
            return timestamps.length ? occurrenceId(reminder.id, timestamps[0]) : null;
        }

        return await Notifications.scheduleNotificationAsync({
            identifier: reminder.id,
            content: makeContent(),
            trigger: buildTrigger(reminder, channelId),
        });
    } catch (e) {
        console.warn('Failed to schedule reminder', reminder.id, e);
        return null;
    }
}

export async function cancelReminder(reminder) {
    // Accepts a reminder object or a plain id string.
    const id = typeof reminder === 'string' ? reminder : reminder?.id;
    if (!id) return;

    // Cancel every possible occurrence id deterministically (safe no-op for ids
    // that were never scheduled).
    if (reminder && typeof reminder === 'object' && reminder.repeatEveryMinutes) {
        for (const ts of computeOccurrences(reminder)) {
            try {
                await Notifications.cancelScheduledNotificationAsync(occurrenceId(id, ts));
            } catch (e) {
                console.warn('Failed to cancel reminder occurrence', id, e);
            }
        }
    }

    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
        console.warn('Failed to cancel reminder', id, e);
    }
}

// Debug helper: fires a test notification ~2s from now and reports, in plain
// text, whether the permission/channel/scheduling pipeline is working. The
// result is meant to be shown on-screen (release builds hide console logs).
export async function sendTestNotification() {
    const lines = [];

    const permissionOk = await ensurePermissionsAndChannel();
    lines.push(`Permission: ${permissionOk ? 'granted' : 'NOT granted'}`);

    if (Platform.OS === 'android') {
        const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID).catch(
            () => null
        );
        lines.push(
            channel
                ? `Channel '${CHANNEL_ID}': EXISTS (sound: ${channel.sound ?? 'none'})`
                : `Channel '${CHANNEL_ID}': MISSING`
        );
    }

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Remind Me test',
                body: `Scheduled at ${new Date().toLocaleTimeString()}`,
                sound: CHANNEL_SOUND,
                data: { test: true },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
            },
        });
        lines.push(`Scheduled OK (id: ${id})`);
    } catch (e) {
        lines.push(`SCHEDULE FAILED: ${e?.message || e}`);
    }

    try {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        lines.push(`Total scheduled now: ${all.length}`);
        all.slice(0, 5).forEach((n) => {
            lines.push(`• ${n.content.title} [${n.trigger?.type ?? '?'}]`);
        });
    } catch (e) {
        lines.push(`Could not list scheduled: ${e?.message || e}`);
    }

    return lines.join('\n');
}
