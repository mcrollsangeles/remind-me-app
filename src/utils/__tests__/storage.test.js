import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadReminders, saveReminders } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
    },
}));

describe('storage', () => {
    beforeEach(() => {
        AsyncStorage.getItem.mockReset();
        AsyncStorage.setItem.mockReset();
    });

    test('loadReminders returns [] when nothing is stored', async () => {
        AsyncStorage.getItem.mockResolvedValue(null);
        await expect(loadReminders()).resolves.toEqual([]);
    });

    test('loadReminders parses stored JSON', async () => {
        const data = [{ id: '1', title: 'Take meds' }];
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify(data));
        await expect(loadReminders()).resolves.toEqual(data);
    });

    test('loadReminders falls back to [] on invalid JSON', async () => {
        AsyncStorage.getItem.mockResolvedValue('not-json{');
        await expect(loadReminders()).resolves.toEqual([]);
    });

    test('loadReminders falls back to [] on non-array data', async () => {
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify({ nope: true }));
        await expect(loadReminders()).resolves.toEqual([]);
    });

    test('saveReminders writes the list as JSON under the reminders key', async () => {
        const data = [{ id: '1', title: 'Drink water' }];
        await saveReminders(data);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'remindme.reminders.v1',
            JSON.stringify(data)
        );
    });
});
