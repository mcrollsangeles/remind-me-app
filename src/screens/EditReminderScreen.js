import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReminderForm from '../components/ReminderForm';
import { useReminders } from '../context/RemindersContext';
import { useTheme } from '../theme';
import { showConfirm } from '../utils/ui';

export default function EditReminderScreen({ navigation, route }) {
    const { reminders, updateReminder, deleteReminder } = useReminders();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const reminder = reminders.find((r) => r.id === route.params.id);

    if (!reminder) {
        return (
            <View style={styles.missing}>
                <Text style={styles.missingText}>Reminder not found.</Text>
            </View>
        );
    }

    const handleSubmit = async (values) => {
        await updateReminder(reminder.id, values);
        navigation.goBack();
    };

    const confirmDelete = () => {
        showConfirm({
            title: 'Delete reminder?',
            message: `"${reminder.title}" will be removed and its notification cancelled.`,
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: async () => {
                await deleteReminder(reminder.id);
                navigation.goBack();
            },
        });
    };

    return (
        <ReminderForm
            initialValues={reminder}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
            onDelete={confirmDelete}
        />
    );
}

const createStyles = (colors) => StyleSheet.create({
    missing: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    missingText: {
        fontSize: 16,
        color: colors.textMuted,
    },
});
