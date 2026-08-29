import React, { useMemo, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import PlatformDateTimePicker from './PlatformDateTimePicker';
import { useAudioPlayer } from 'expo-audio';
import { useTheme } from '../theme';
import { showAlert } from '../utils/ui';
import {
    nowTimeString,
    pad,
    parseDateString,
    parseTimeString,
    timeLabel,
    todayString,
} from '../utils/helpers';

const SOUND = require('../../assets/psyduck.mp3');
const PSYDUCK_ICON = require('../../assets/psyduck-icon.png');

const REPEAT_OPTIONS = [
    { label: 'Off', value: null },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '60 min', value: 60 },
];

export default function ReminderForm({
    initialValues,
    submitLabel = 'Create Reminder',
    onSubmit,
    onDelete,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [body, setBody] = useState(initialValues?.body ?? '');
    const [repeatType, setRepeatType] = useState(initialValues?.repeatType ?? 'once');
    const [date, setDate] = useState(initialValues?.date ?? todayString());
    const [time, setTime] = useState(initialValues?.time ?? nowTimeString());
    const [repeatEveryMinutes, setRepeatEveryMinutes] = useState(
        initialValues?.repeatEveryMinutes ?? null
    );
    const [sound, setSound] = useState(initialValues?.sound ?? 'psyduck');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const player = useAudioPlayer(SOUND);

    const onDateChange = (event, selected) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selected) {
            setDate(`${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`);
        }
    };

    const onTimeChange = (event, selected) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selected) {
            setTime(`${pad(selected.getHours())}:${pad(selected.getMinutes())}`);
        }
    };

    const playSound = () => {
        player.seekTo(0);
        player.play();
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            showAlert('Title required', 'Please give your reminder a title.');
            return;
        }
        if (repeatType === 'once') {
            const when = new Date(`${date}T${time}:00`);
            if (when.getTime() <= Date.now()) {
                showAlert('Invalid date & time', 'Please pick a date and time in the future.');
                return;
            }
        }
        onSubmit({
            title: title.trim(),
            body: body.trim(),
            repeatType,
            date: repeatType === 'once' ? date : null,
            time,
            repeatEveryMinutes,
            sound,
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>TITLE</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Screen break"
                    placeholderTextColor={colors.disabled}
                    maxLength={80}
                />

                <Text style={styles.label}>MESSAGE (OPTIONAL)</Text>
                <TextInput
                    style={[styles.input, styles.multiline]}
                    value={body}
                    onChangeText={setBody}
                    placeholder="Shown on the notification"
                    placeholderTextColor={colors.disabled}
                    multiline
                    maxLength={200}
                />

                <Text style={styles.label}>WHEN</Text>
                <View style={styles.segmented}>
                    <Pressable
                        style={[styles.segment, repeatType === 'once' && styles.segmentActive]}
                        onPress={() => setRepeatType('once')}
                    >
                        <Text style={[styles.segmentText, repeatType === 'once' && styles.segmentTextActive]}>
                            Specific date
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, repeatType === 'daily' && styles.segmentActive]}
                        onPress={() => setRepeatType('daily')}
                    >
                        <Text style={[styles.segmentText, repeatType === 'daily' && styles.segmentTextActive]}>
                            Every day
                        </Text>
                    </Pressable>
                </View>

                {Platform.OS === 'web' ? (
                    <>
                        {repeatType === 'once' && (
                            <>
                                <Text style={styles.webFieldLabel}>DATE</Text>
                                <PlatformDateTimePicker
                                    value={parseDateString(date)}
                                    mode="date"
                                    minimumDate={initialValues ? undefined : new Date()}
                                    onChange={onDateChange}
                                    webStyle={styles.webPicker}
                                />
                            </>
                        )}
                        <Text style={styles.webFieldLabel}>TIME</Text>
                        <PlatformDateTimePicker
                            value={parseTimeString(time)}
                            mode="time"
                            onChange={onTimeChange}
                            webStyle={styles.webPicker}
                        />
                    </>
                ) : (
                    <>
                        <View style={styles.pickerRow}>
                            {repeatType === 'once' && (
                                <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.pickerBtnLabel}>DATE</Text>
                                    <Text style={styles.pickerBtnValue}>{dateLabel(date)}</Text>
                                </Pressable>
                            )}
                            <Pressable style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                                <Text style={styles.pickerBtnLabel}>TIME</Text>
                                <Text style={styles.pickerBtnValue}>{timeLabel(time)}</Text>
                            </Pressable>
                        </View>

                        {repeatType === 'once' && showDatePicker && (
                            <PlatformDateTimePicker
                                value={parseDateString(date)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={initialValues ? undefined : new Date()}
                                onChange={onDateChange}
                            />
                        )}
                        {showTimePicker && (
                            <PlatformDateTimePicker
                                value={parseTimeString(time)}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                is24Hour={false}
                                onChange={onTimeChange}
                            />
                        )}
                    </>
                )}

                <Text style={styles.label}>REPEAT</Text>
                <Text style={styles.hint}>Repeat every</Text>
                <View style={styles.chips}>
                    {REPEAT_OPTIONS.map((opt) => {
                        const active = repeatEveryMinutes === opt.value;
                        return (
                            <Pressable
                                key={opt.label}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => setRepeatEveryMinutes(opt.value)}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                {repeatEveryMinutes && repeatEveryMinutes > 0 ? (
                    <Text style={styles.note}>
                        First alert at the chosen time, then every {repeatEveryMinutes} minutes.
                    </Text>
                ) : null}

                <Text style={styles.label}>SOUND</Text>
                <View style={styles.segmented}>
                    <Pressable
                        style={[styles.segment, sound === 'psyduck' && styles.segmentActive]}
                        onPress={() => setSound('psyduck')}
                    >
                        <Text style={[styles.segmentText, sound === 'psyduck' && styles.segmentTextActive]}>
                            Psyduck
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segment, sound === 'silent' && styles.segmentActive]}
                        onPress={() => setSound('silent')}
                    >
                        <Text style={[styles.segmentText, sound === 'silent' && styles.segmentTextActive]}>
                            No sound
                        </Text>
                    </Pressable>
                </View>

                {sound === 'psyduck' ? (
                    <View style={styles.soundRow}>
                        <View style={styles.soundInfo}>
                            <Image source={PSYDUCK_ICON} style={styles.soundIcon} />
                            <Text style={styles.soundName}>Psyduck</Text>
                        </View>
                        <Pressable style={styles.playBtn} onPress={playSound}>
                            <Text style={styles.playBtnText}>Play</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.soundRow}>
                        <Text style={styles.soundName}>No sound (silent)</Text>
                    </View>
                )}

                <Pressable style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitText}>{submitLabel}</Text>
                </Pressable>

                {onDelete ? (
                    <Pressable style={styles.deleteBtn} onPress={onDelete}>
                        <Text style={styles.deleteText}>Delete Reminder</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function dateLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const createStyles = (colors) => StyleSheet.create({
    flex: { flex: 1 },
    content: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 48,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        color: colors.textMuted,
        marginTop: 22,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
    },
    multiline: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: 12,
        padding: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9,
        alignItems: 'center',
    },
    segmentActive: {
        backgroundColor: colors.card,
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMuted,
    },
    segmentTextActive: {
        color: colors.primary,
    },
    pickerRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    pickerBtn: {
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
    },
    pickerBtnLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        color: colors.textMuted,
    },
    pickerBtnValue: {
        marginTop: 4,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    webPicker: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        width: '100%',
    },
    webFieldLabel: {
        marginTop: 14,
        marginBottom: 8,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        color: colors.textMuted,
    },
    hint: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    chipTextActive: {
        color: colors.onPrimary,
    },
    note: {
        marginTop: 8,
        fontSize: 12,
        color: colors.textMuted,
    },
    soundRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
    },
    soundInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    soundIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    soundName: {
        fontSize: 15,
        color: colors.text,
    },
    playBtn: {
        backgroundColor: colors.primarySoft,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9,
    },
    playBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    submitBtn: {
        marginTop: 28,
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.onPrimary,
    },
    deleteBtn: {
        marginTop: 12,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.danger,
    },
});
