import { Time } from "./Time.js";

export class TimeRange {

    constructor(
        public readonly start: Time,
        public readonly end: Time
    ) {}

    durationInMinutes() {
        return (
            this.end.toMinutes() -
            this.start.toMinutes()
        );
    }

    contains(time: Time) {

        return (
            time.toMinutes() >= this.start.toMinutes() &&
            time.toMinutes() < this.end.toMinutes()
        );

    }

}