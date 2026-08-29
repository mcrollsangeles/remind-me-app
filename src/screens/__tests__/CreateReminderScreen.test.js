import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CreateReminderScreen from '../CreateReminderScreen';
import { ThemeProvider } from '../../theme';
import { RemindersProvider } from '../../context/RemindersContext';
import * as storage from '../../utils/storage';
import * as notifications from '../../utils/notifications';

jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), seekTo: jest.fn() }),
}));
jest.mock('../../components/PlatformDateTimePicker', () => 'PlatformDateTimePicker');
jest.mock('../../utils/storage', () => ({
    loadReminders: jest.fn(),
    saveReminders: jest.fn(),
}));
jest.mock('../../utils/notifications', () => ({
    scheduleReminder: jest.fn(),
    cancelReminder: jest.fn(),
}));

const wrapper = ({ children }) => (
    <ThemeProvider>
        <RemindersProvider>{children}</RemindersProvider>
    </ThemeProvider>
);

beforeEach(() => {
    jest.clearAllMocks();
    storage.loadReminders.mockResolvedValue([]);
    storage.saveReminders.mockResolvedValue(undefined);
    notifications.scheduleReminder.mockResolvedValue('nid');
    notifications.cancelReminder.mockResolvedValue(undefined);
});

test('creates a reminder and navigates back', async () => {
    const nav = { goBack: jest.fn(), navigate: jest.fn() };
    const { getByText, getByPlaceholderText } = render(
        <CreateReminderScreen navigation={nav} />,
        { wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Screen break'), 'New reminder');
    fireEvent.press(getByText('Every day'));
    fireEvent.press(getByText('Create Reminder'));

    await waitFor(() => expect(nav.goBack).toHaveBeenCalled());
    expect(storage.saveReminders).toHaveBeenCalled();
    expect(notifications.scheduleReminder).toHaveBeenCalled();
});
