import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert is a no-op, so dialogs are implemented with
// window.alert / window.confirm on web and the native Alert API elsewhere.

export function showAlert(title, message) {
    if (Platform.OS === 'web') {
        window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }
    Alert.alert(title, message);
}

export function showConfirm({
    title,
    message,
    confirmLabel = 'OK',
    destructive = false,
    onConfirm,
    onCancel,
}) {
    if (Platform.OS === 'web') {
        const ok = window.confirm(message ? `${title}\n\n${message}` : title);
        if (ok) onConfirm?.();
        else onCancel?.();
        return;
    }
    Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
}
