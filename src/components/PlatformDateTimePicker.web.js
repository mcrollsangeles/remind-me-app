import React, { createElement } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function toDateInputValue(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInputValue(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PlatformDateTimePicker({
    mode,
    value,
    onChange,
    minimumDate,
    is24Hour,
    webStyle,
}) {
    const handleChange = (e) => {
        const raw = e.target.value;
        if (!raw) return;
        if (mode === 'date') {
            onChange({ type: 'set' }, new Date(`${raw}T00:00:00`));
        } else {
            const [h, m] = raw.split(':').map(Number);
            onChange({ type: 'set' }, new Date(2000, 0, 1, h, m));
        }
    };

    return createElement('input', {
        type: mode === 'date' ? 'date' : 'time',
        value: mode === 'date' ? toDateInputValue(value) : toTimeInputValue(value),
        min: minimumDate && mode === 'date' ? toDateInputValue(minimumDate) : undefined,
        onChange: handleChange,
        style: webStyle,
    });
}
