import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditReminderScreen from '../EditReminderScreen';
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

const reminder = {
    id: '1',
    title: 'Old title',
    body: 'note',
    repeatType: 'daily',
    date: null,
    time: '09:00',
    repeatEveryMinutes: null,
    enabled: true,
};

const renderScreen = (nav) =>
    render(
        <EditReminderScreen navigation={nav} route={{ params: { id: '1' } }} />,
        { wrapper }
    );

beforeEach(() => {
    jest.clearAllMocks();
    storage.loadReminders.mockResolvedValue([reminder]);
    storage.saveReminders.mockResolvedValue(undefined);
    notifications.scheduleReminder.mockResolvedValue('nid');
    notifications.cancelReminder.mockResolvedValue(undefined);
    Alert.alert = jest.fn();
});

test('renders the form pre-filled', async () => {
    const { getByDisplayValue, getByText } = renderScreen({ goBack: jest.fn() });
    expect(await waitFor(() => getByDisplayValue('Old title'))).toBeTruthy();
    expect(getByText('Save Changes')).toBeTruthy();
});

test('updates the reminder and navigates back', async () => {
    const nav = { goBack: jest.fn() };
    const { getByText, getByPlaceholderText } = renderScreen(nav);

    fireEvent.changeText(
        await waitFor(() => getByPlaceholderText('e.g. Screen break')),
        'Updated title'
    );
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => expect(nav.goBack).toHaveBeenCalled());
    expect(storage.saveReminders).toHaveBeenCalled();
    expect(notifications.cancelReminder).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    expect(notifications.scheduleReminder).toHaveBeenCalled();
});

test('delete button asks for confirmation', async () => {
    const nav = { goBack: jest.fn() };
    const { getByText } = renderScreen(nav);

    fireEvent.press(await waitFor(() => getByText('Delete Reminder')));
    expect(Alert.alert).toHaveBeenCalled();
});
