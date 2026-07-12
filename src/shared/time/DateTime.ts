export class DateTime {

    constructor(
        private readonly date: Date
    ) {}

    static fromISO(value: string) {
        return new DateTime(new Date(value));
    }

    static now() {
        return new DateTime(new Date());
    }

    toDate() {
        return this.date;
    }

    formatTime() {

        return this.date.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Recife"
            }
        );

    }

    formatDate() {

        return this.date.toLocaleDateString(
            "pt-BR",
            {
                timeZone: "America/Recife"
            }
        );

    }

}