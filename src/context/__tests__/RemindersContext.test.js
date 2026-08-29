import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { RemindersProvider, useReminders } from '../RemindersContext';
import * as storage from '../../utils/storage';
import * as notifications from '../../utils/notifications';

jest.mock('../../utils/storage', () => ({
    loadReminders: jest.fn(),
    saveReminders: jest.fn(),
}));
jest.mock('../../utils/notifications', () => ({
    scheduleReminder: jest.fn(),
    cancelReminder: jest.fn(),
}));

const wrapper = ({ children }) => <RemindersProvider>{children}</RemindersProvider>;

const baseReminder = {
    id: '1',
    title: 'Take meds',
    body: '',
    repeatType: 'daily',
    date: null,
    time: '08:00',
    repeatEveryMinutes: null,
    enabled: true,
};

beforeEach(() => {
    jest.clearAllMocks();
    storage.loadReminders.mockResolvedValue([]);
    storage.saveReminders.mockResolvedValue(undefined);
    notifications.scheduleReminder.mockResolvedValue('nid');
    notifications.cancelReminder.mockResolvedValue(undefined);
});

test('loads reminders from storage on mount', async () => {
    const stored = [baseReminder];
    storage.loadReminders.mockResolvedValue(stored);

    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.reminders).toEqual(stored);
});

test('addReminder prepends, persists and schedules', async () => {
    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    let created;
    await act(async () => {
        created = await result.current.addReminder({
            title: 'New',
            repeatType: 'once',
            date: '2999-01-01',
            time: '08:30',
            repeatEveryMinutes: null,
        });
    });

    expect(created.id).toBeDefined();
    expect(created.enabled).toBe(true);
    expect(result.current.reminders).toHaveLength(1);
    expect(storage.saveReminders).toHaveBeenCalled();
    expect(notifications.scheduleReminder).toHaveBeenCalledWith(created);
});

test('updateReminder applies the patch and reschedules', async () => {
    storage.loadReminders.mockResolvedValue([baseReminder]);

    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
        await result.current.updateReminder('1', { title: 'Renamed' });
    });

    expect(result.current.reminders[0].title).toBe('Renamed');
    expect(notifications.cancelReminder).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    expect(notifications.scheduleReminder).toHaveBeenCalled();
});

test('deleteReminder removes the reminder and cancels its notification', async () => {
    storage.loadReminders.mockResolvedValue([
        baseReminder,
        { ...baseReminder, id: '2', title: 'Other' },
    ]);

    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
        await result.current.deleteReminder('1');
    });

    expect(result.current.reminders.map((r) => r.id)).toEqual(['2']);
    expect(notifications.cancelReminder).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
});

test('toggleReminder flips enabled state and schedules/cancels', async () => {
    storage.loadReminders.mockResolvedValue([{ ...baseReminder, enabled: false }]);

    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
        await result.current.toggleReminder('1');
    });
    expect(result.current.reminders[0].enabled).toBe(true);
    expect(notifications.scheduleReminder).toHaveBeenCalled();

    await act(async () => {
        await result.current.toggleReminder('1');
    });
    expect(result.current.reminders[0].enabled).toBe(false);
    expect(notifications.cancelReminder).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
});
