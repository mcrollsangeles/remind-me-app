export const SOUND_FILE = 'psyduck.mp3';
export const CHANNEL_ID = 'reminders';

export async function ensurePermissionsAndChannel() {
    return true;
}

export async function scheduleReminder() {
    return null;
}

export async function cancelReminder() {
    // no-op on web
}
