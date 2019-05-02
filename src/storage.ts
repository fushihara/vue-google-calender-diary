const localStorageKey = `qm8wjtae-google-calender-diary`;

export class Storage {
    static get googleApiRefreshToken() {
        return String(localStorage[`${localStorageKey}-refresh-token`] || "")
    }
    static set googleApiRefreshToken(val: string) {
        localStorage[`${localStorageKey}-refresh-token`] = val;
    }
    static get inputStatus(): { 入力開始時刻: Date, 入力値: string } | null {
        const r = JSON.parse(localStorage[`${localStorageKey}-input-status`] || "{}");
        if (!r.startTime) { return null };
        return {
            入力開始時刻: new Date(Number(r.startTime)),
            入力値: String(r.text)
        };
    }
    static set inputStatus(val: { 入力開始時刻: Date, 入力値: string } | null) {
        if (val == null) {
            localStorage[`${localStorageKey}-input-status`] = "{}";
            return;
        }
        localStorage[`${localStorageKey}-input-status`] = JSON.stringify({
            startTime: val.入力開始時刻.getTime(),
            text: val.入力値
        });
    }
    static get calenderId(): string {
        return String(localStorage[`${localStorageKey}-calender-id`] || "");
    }
    static set calenderId(id: string) {
        localStorage[`${localStorageKey}-calender-id`] = id;
    }
}