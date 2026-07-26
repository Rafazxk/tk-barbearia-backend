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


toLocalISOString() {
    // Usa Intl.DateTimeFormat para extrair os componentes corretos baseados no fuso do negócio
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Recife", // ou America/Sao_Paulo (consistente com o resto da sua classe)
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(this.date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = getPart("hour");
    const minute = getPart("minute");
    const second = getPart("second");

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

static fromLocalString(value: string): DateTime {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    throw new Error(`Data inválida: ${value}`);
  }

  const [year , month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);


  
  const date = new DateTime(  
    new Date(
    year!,
    month! - 1,
    day!,
    hour!,
    minute!,
    second
  )
);

console.log("Timezone do servidor:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Date:", date);
console.log("ISO:", date.toISOString());

return date;
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