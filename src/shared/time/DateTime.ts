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
static fromLocalString(value: string) {
  // Converte uma string tipo "2026-07-17T15:00:00" para Date local
  // O construtor Date(string) sem o 'Z' trata como horário local
  return new DateTime(new Date(value));
}
  static fromDate(date: Date) {
    return new DateTime(date);
  }

  addMinutes(minutes: number) {
    return new DateTime(
      new Date(this.date.getTime() + minutes * 60_000)
    );
  }

  isBefore(other: DateTime) {
    return this.date.getTime() < other.date.getTime();
  }

  isAfter(other: DateTime) {
    return this.date.getTime() > other.date.getTime();
  }

  isBetween(start: DateTime, end: DateTime) {
    const current = this.date.getTime();

    return (
      current >= start.date.getTime() &&
      current < end.date.getTime()
    );
  }

  startOfDay() {
    const date = new Date(this.date);

    date.setHours(0, 0, 0, 0);

    return new DateTime(date);
  }

  endOfDay() {
    const date = new Date(this.date);

    date.setHours(23, 59, 59, 999);

    return new DateTime(date);
  }

  toISOString() {
    return this.date.toISOString();
  }

  toDate() {
    return this.date;
  }

  formatTime() {
    return this.date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Recife",
    });
  }

  formatDate() {
    return this.date.toLocaleDateString("pt-BR", {
      timeZone: "America/Recife",
    });
  }

  static fromUTC(isoString: string) {
  
  return new DateTime(new Date(isoString));
}

static fromDateOnly(value: string) {
  const parts = value.split("-");

  if (parts.length !== 3) {
    throw new Error(`Data inválida: ${value}`);
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Data inválida: ${value}`);
  }

  return new DateTime(
    new Date(year, month - 1, day)
  );
}
}