import React, { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReminders } from '../context/RemindersContext';
import ReminderCard from '../components/ReminderCard';
import { useTheme } from '../theme';
import { showAlert, showConfirm } from '../utils/ui';
import { isExpiredOnce } from '../utils/helpers';
// DEBUG: uncomment to re-enable the test notification button
// import { sendTestNotification } from '../utils/notifications';

const PSYDUCK_ICON = require('../../assets/psyduck-icon.png');

export default function HomeScreen({ navigation }) {
    const { reminders, loaded, toggleReminder, deleteReminder } = useReminders();
    const { colors, isDark, toggleDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const confirmDelete = (reminder) => {
        showConfirm({
            title: 'Delete reminder?',
            message: `"${reminder.title}" will be removed and its notification cancelled.`,
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: () => deleteReminder(reminder.id),
        });
    };

    const handleToggle = (reminder) => {
        if (isExpiredOnce(reminder)) {
            showAlert('Date has passed', 'Tap the reminder to pick a new date and time.');
            return;
        }
        toggleReminder(reminder.id);
    };

    // DEBUG: uncomment to re-enable the test notification button
    // const runTestNotification = async () => {
    //     const result = await sendTestNotification();
    //     showAlert('Test notification', result);
    // };

    const renderItem = ({ item }) => (
        <ReminderCard
            reminder={item}
            onPress={() => navigation.navigate('EditReminder', { id: item.id })}
            onToggle={() => handleToggle(item)}
            onDelete={() => confirmDelete(item)}
        />
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Image source={PSYDUCK_ICON} style={styles.headerIcon} />
                        <View>
                            <Text style={styles.title}>Reminders</Text>
                            <Text style={styles.subtitle}>
                                {loaded
                                    ? `${reminders.length} active reminder${reminders.length === 1 ? '' : 's'}`
                                    : 'Loading…'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerAction}>
                        <Text style={styles.darkLabel}>Dark</Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleDark}
                            trackColor={{ true: colors.primary, false: colors.border }}
                            thumbColor="#FFFFFF"
                            accessibilityLabel="Dark mode"
                        />
                    </View>
                </View>
            </View>

            {/* DEBUG: uncomment to re-enable the test notification button
            <Pressable style={styles.testBtn} onPress={runTestNotification}>
                <Text style={styles.testBtnText}>Send test notification</Text>
            </Pressable>
            */}

            <FlatList
                data={reminders}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    loaded ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyTitle}>No reminders yet</Text>
                            <Text style={styles.emptyText}>Tap + to create your first reminder.</Text>
                        </View>
                    ) : null
                }
            />

            <Pressable
                style={styles.fab}
                onPress={() => navigation.navigate('CreateReminder')}
                accessibilityLabel="Create reminder"
            >
                <View style={styles.plusH} />
                <View style={styles.plusV} />
            </Pressable>
        </SafeAreaView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    darkLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    testBtn: {
        alignSelf: 'flex-start',
        marginLeft: 20,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    testBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    }, headerIcon: {
        width: 60,
        height: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        marginTop: 2,
        fontSize: 14,
        color: colors.textMuted,
    },
    listContent: {
        padding: 20,
        paddingBottom: 120,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        fontSize: 48,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    emptyText: {
        marginTop: 6,
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primaryDark,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    plusH: {
        position: 'absolute',
        width: 26,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.onPrimary,
    },
    plusV: {
        position: 'absolute',
        width: 4,
        height: 26,
        borderRadius: 2,
        backgroundColor: colors.onPrimary,
    },
});
