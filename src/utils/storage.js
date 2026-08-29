import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'remindme.reminders.v1';

export async function loadReminders() {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to load reminders', e);
        return [];
    }
}

export async function saveReminders(reminders) {
    try {
        await AsyncStorage.setItem(KEY, JSON.stringify(reminders));
    } catch (e) {
        console.warn('Failed to save reminders', e);
    }
}
