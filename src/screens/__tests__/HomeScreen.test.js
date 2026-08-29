import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../HomeScreen';
import { ThemeProvider } from '../../theme';
import { RemindersProvider } from '../../context/RemindersContext';
import * as storage from '../../utils/storage';
import * as notifications from '../../utils/notifications';

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    };
});

jest.mock('../../utils/storage', () => ({
    loadReminders: jest.fn(),
    saveReminders: jest.fn(),
}));
jest.mock('../../utils/notifications', () => ({
    scheduleReminder: jest.fn(),
    cancelReminder: jest.fn(),
    sendTestNotification: jest.fn(),
}));

const wrapper = ({ children }) => (
    <ThemeProvider>
        <RemindersProvider>{children}</RemindersProvider>
    </ThemeProvider>
);

const makeNav = () => ({ navigate: jest.fn(), goBack: jest.fn() });

const reminder = {
    id: '1',
    title: 'Take meds',
    body: '',
    repeatType: 'once',
    date: '2999-01-01',
    time: '08:30',
    repeatEveryMinutes: null,
    enabled: true,
};

beforeEach(() => {
    jest.clearAllMocks();
    storage.loadReminders.mockResolvedValue([]);
    storage.saveReminders.mockResolvedValue(undefined);
    notifications.scheduleReminder.mockResolvedValue('nid');
    notifications.cancelReminder.mockResolvedValue(undefined);
    Alert.alert = jest.fn();
});

test('renders the header and empty state', async () => {
    const { getByText } = render(<HomeScreen navigation={makeNav()} />, { wrapper });
    expect(getByText('Reminders')).toBeTruthy();
    expect(await waitFor(() => getByText('No reminders yet'))).toBeTruthy();
});

test('renders reminders and opens edit on tap', async () => {
    storage.loadReminders.mockResolvedValue([reminder]);
    const nav = makeNav();
    const { getByText } = render(<HomeScreen navigation={nav} />, { wrapper });

    fireEvent.press(await waitFor(() => getByText('Take meds')));
    expect(nav.navigate).toHaveBeenCalledWith('EditReminder', { id: '1' });
});

test('FAB navigates to create', async () => {
    const nav = makeNav();
    const { getByLabelText } = render(<HomeScreen navigation={nav} />, { wrapper });

    fireEvent.press(getByLabelText('Create reminder'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateReminder');
});

// DEBUG: uncomment when the test notification button is re-enabled
// test('test notification button reports the result', async () => {
//     notifications.sendTestNotification.mockResolvedValue('Permission: granted\nScheduled OK');
//     const { getByText } = render(<HomeScreen navigation={makeNav()} />, { wrapper });
//
//     fireEvent.press(getByText('Send test notification'));
//
//     await waitFor(() =>
//         expect(Alert.alert).toHaveBeenCalledWith(
//             'Test notification',
//             'Permission: granted\nScheduled OK'
//         )
//     );
// });

test('delete asks for confirmation then removes the reminder', async () => {
    storage.loadReminders.mockResolvedValue([reminder]);
    const nav = makeNav();
    const { getByText } = render(<HomeScreen navigation={nav} />, { wrapper });

    fireEvent.press(await waitFor(() => getByText('Delete')));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const buttons = Alert.alert.mock.calls[0][2];
    const confirm = buttons.find((b) => b.text === 'Delete');

    await act(async () => {
        await confirm.onPress();
    });

    expect(storage.saveReminders).toHaveBeenCalledWith([]);
    expect(notifications.cancelReminder).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
});
