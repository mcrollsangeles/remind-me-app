import { Alert } from 'react-native';
import { showAlert, showConfirm } from '../ui';

describe('ui', () => {
    beforeEach(() => {
        Alert.alert = jest.fn();
    });

    test('showAlert calls Alert.alert with title and message', () => {
        showAlert('Title required', 'Please fill this in.');
        expect(Alert.alert).toHaveBeenCalledWith('Title required', 'Please fill this in.');
    });

    test('showConfirm triggers the confirm button callback', () => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();

        showConfirm({
            title: 'Delete reminder?',
            message: 'It will be removed.',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm,
            onCancel,
        });

        expect(Alert.alert).toHaveBeenCalledTimes(1);
        const [title, message, buttons] = Alert.alert.mock.calls[0];
        expect(title).toBe('Delete reminder?');
        expect(message).toBe('It will be removed.');

        const confirmBtn = buttons.find((b) => b.text === 'Delete');
        const cancelBtn = buttons.find((b) => b.text === 'Cancel');
        expect(confirmBtn.style).toBe('destructive');

        confirmBtn.onPress();
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();

        cancelBtn.onPress();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('showConfirm defaults the label and non-destructive style', () => {
        showConfirm({ title: 'T', onConfirm: () => { } });
        const [, , buttons] = Alert.alert.mock.calls[0];
        expect(buttons.find((b) => b.text === 'OK').style).toBe('default');
    });
});
