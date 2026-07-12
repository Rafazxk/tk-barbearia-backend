export class Time {

    constructor(
        private readonly value: string
    ) { }

    private parse() {
        const value = this.value.replace(/['"]/g, "").trim();

        const parts = value.split(":");

        if (parts.length < 2) {
            throw new Error(`Horário inválido: ${value}`);
        }

        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (
            Number.isNaN(hours) ||
            Number.isNaN(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            throw new Error(`Horário inválido: ${value}`);
        }

        return { hours, minutes };
    }



    toMinutes(): number {
        const { hours, minutes } = this.parse();
        return hours * 60 + minutes;
    }
    toString(): string {
        return this.value;
    }


    addMinutes(minutes: number): Time {
        return Time.fromMinutes(
            this.toMinutes() + minutes
        );
    }


    compare(other: Time): number {
        return this.toMinutes() - other.toMinutes();
    }
    equals(other: Time) {
        return this.compare(other) === 0;
    }

    isBefore(other: Time) {
        return this.compare(other) < 0;
    }


    isAfter(other: Time) {
        return this.compare(other) > 0;
    }


    isBetween(start: Time, end: Time) {

        return (
            this.toMinutes() >= start.toMinutes() &&
            this.toMinutes() < end.toMinutes()
        );

    }


    static fromMinutes(minutes: number): Time {
        const total = ((minutes % 1440) + 1440) % 1440;

        const h = Math.floor(total / 60);
        const m = total % 60;

        return new Time(
            `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
    }

}