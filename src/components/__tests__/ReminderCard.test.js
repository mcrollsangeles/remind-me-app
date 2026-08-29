import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ReminderCard from '../ReminderCard';
import { ThemeProvider } from '../../theme';

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

const reminder = {
    id: '1',
    title: 'Take meds',
    body: 'Blue pill',
    repeatType: 'once',
    date: '2999-01-01',
    time: '08:30',
    repeatEveryMinutes: null,
    enabled: true,
};

const renderCard = (props = {}) =>
    render(
        <ReminderCard
            reminder={reminder}
            onPress={jest.fn()}
            onToggle={jest.fn()}
            onDelete={jest.fn()}
            {...props}
        />,
        { wrapper }
    );

test('shows the title and schedule summary', () => {
    const { getByText } = renderCard();
    expect(getByText('Take meds')).toBeTruthy();
    expect(getByText(/8:30 AM/)).toBeTruthy();
});

test('shows the body message', () => {
    const { getByText } = renderCard();
    expect(getByText(/Blue pill/)).toBeTruthy();
});

test('shows an expired hint for a past one-off reminder', () => {
    const { getByText } = renderCard({ reminder: { ...reminder, date: '2020-01-01' } });
    expect(getByText('Date has passed - tap to update')).toBeTruthy();
});

test('calls onDelete when the delete button is pressed', () => {
    const onDelete = jest.fn();
    const { getByText } = renderCard({ onDelete });
    fireEvent.press(getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
});

test('calls onPress when the card body is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderCard({ onPress });
    fireEvent.press(getByText('Take meds'));
    expect(onPress).toHaveBeenCalledTimes(1);
});

test('calls onToggle when the switch is toggled', () => {
    const onToggle = jest.fn();
    const { getByRole } = renderCard({ onToggle });
    const toggle = getByRole('switch');
    fireEvent(toggle, 'valueChange', false);
    expect(onToggle).toHaveBeenCalledTimes(1);
});
