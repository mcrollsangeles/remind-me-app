import React from 'react';
import ReminderForm from '../components/ReminderForm';
import { useReminders } from '../context/RemindersContext';

export default function CreateReminderScreen({ navigation }) {
    const { addReminder } = useReminders();

    const handleSubmit = async (values) => {
        await addReminder(values);
        navigation.goBack();
    };

    return <ReminderForm onSubmit={handleSubmit} />;
}
