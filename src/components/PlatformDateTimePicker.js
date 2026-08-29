import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PlatformDateTimePicker({ webStyle, ...props }) {
    return <DateTimePicker {...props} />;
}
