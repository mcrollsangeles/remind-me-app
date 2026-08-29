import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ReminderForm from '../ReminderForm';
import { ThemeProvider } from '../../theme';

jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), seekTo: jest.fn() }),
}));
jest.mock('../PlatformDateTimePicker', () => 'PlatformDateTimePicker');

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

beforeEach(() => {
    Alert.alert = jest.fn();
});

test('submits the form with valid values (every day)', () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
        <ReminderForm onSubmit={onSubmit} />,
        { wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Screen break'), 'Drink water');
    fireEvent.press(getByText('Every day'));
    fireEvent.press(getByText('Create Reminder'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0][0];
    expect(values.title).toBe('Drink water');
    expect(values.repeatType).toBe('daily');
    expect(values.date).toBeNull();
    expect(values.time).toBeDefined();
});

test('submits silent when No sound is selected', () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
        <ReminderForm onSubmit={onSubmit} />,
        { wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Screen break'), 'X');
    fireEvent.press(getByText('Every day'));
    fireEvent.press(getByText('No sound'));
    fireEvent.press(getByText('Create Reminder'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].sound).toBe('silent');
});

test('alerts when the title is empty', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<ReminderForm onSubmit={onSubmit} />, { wrapper });

    fireEvent.press(getByText('Create Reminder'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
        'Title required',
        'Please give your reminder a title.'
    );
});

test('alerts when a one-off date is in the past', () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
        <ReminderForm
            initialValues={{ repeatType: 'once', date: '2020-01-01', time: '08:00' }}
            onSubmit={onSubmit}
        />,
        { wrapper }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Screen break'), 'Task');
    fireEvent.press(getByText('Create Reminder'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid date & time',
        'Please pick a date and time in the future.'
    );
});

test('pre-fills fields from initialValues', () => {
    const { getByDisplayValue, getByText } = render(
        <ReminderForm
            initialValues={{
                title: 'Prefilled',
                body: 'A note',
                repeatType: 'daily',
                date: null,
                time: '09:00',
                repeatEveryMinutes: 15,
            }}
            onSubmit={jest.fn()}
        />,
        { wrapper }
    );

    expect(getByDisplayValue('Prefilled')).toBeTruthy();
    expect(getByDisplayValue('A note')).toBeTruthy();
    expect(getByText('15 min')).toBeTruthy();
});
