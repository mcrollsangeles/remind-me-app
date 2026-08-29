import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { isExpiredOnce, reminderSummary } from '../utils/helpers';

export default function ReminderCard({ reminder, onPress, onToggle, onDelete }) {
    const expired = isExpiredOnce(reminder);
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.card}>
            <Pressable style={styles.mainRow} onPress={onPress}>
                <View style={styles.textWrap}>
                    <Text style={[styles.title, expired && styles.expiredTitle]} numberOfLines={1}>
                        {reminder.title}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {reminderSummary(reminder)}
                    </Text>
                    {expired && <Text style={styles.expiredLabel}>Date has passed - tap to update</Text>}
                </View>
                <Switch
                    value={reminder.enabled}
                    onValueChange={() => onToggle(reminder.id)}
                    disabled={expired}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={reminder.enabled ? '#FFFFFF' : '#FFFFFF'}
                />
            </Pressable>
            <View style={styles.footer}>
                <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
                    <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    textWrap: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    expiredTitle: {
        color: colors.textMuted,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 19,
        color: colors.textMuted,
    },
    expiredLabel: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '600',
        color: colors.danger,
    },
    footer: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    deleteBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: colors.dangerSoft,
    },
    deleteText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.danger,
    },
});
