export function pad(n) {
    return String(n).padStart(2, '0');
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTimeString() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function parseTimeString(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return new Date(2000, 0, 1, h, m);
}

export function timeLabel(timeStr) {
    const [hh, mm] = timeStr.split(':').map(Number);
    const hours = hh % 12 || 12;
    const ampm = hh < 12 ? 'AM' : 'PM';
    return `${hours}:${pad(mm)} ${ampm}`;
}

export function dateLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function dateTimeLabel(dateStr, timeStr) {
    return `${dateLabel(dateStr)} · ${timeLabel(timeStr)}`;
}

export function isExpiredOnce(r) {
    if (r.repeatType !== 'once') return false;
    if (r.repeatEveryMinutes && r.repeatEveryMinutes > 0) return false;
    return new Date(`${r.date}T${r.time}:00`).getTime() <= Date.now();
}

export function reminderSummary(r) {
    if (r.repeatEveryMinutes && r.repeatEveryMinutes > 0) {
        return `Repeats every ${r.repeatEveryMinutes} min${r.body ? `\n${r.body}` : ''}`;
    }
    if (r.repeatType === 'daily') {
        return `Every day at ${timeLabel(r.time)}${r.body ? `\n${r.body}` : ''}`;
    }
    return `${dateTimeLabel(r.date, r.time)}${r.body ? `\n${r.body}` : ''}`;
}
