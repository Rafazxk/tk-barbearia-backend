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
    const parts = value.split("T");

    if (parts.length !== 2) {
      throw new Error(`Data inválida: ${value}`);
    }

    const datePart = parts[0];
    const timePart = parts[1];

    if (datePart === undefined || timePart === undefined) {
      throw new Error(`Data inválida: ${value}`);
    }

    const date = datePart.split("-").map(Number);
    const time = timePart.split(":").map(Number);

    if (date.length !== 3 || time.length < 2) {
      throw new Error(`Data inválida: ${value}`);
    }

    const year = date[0];
    const month = date[1];
    const day = date[2];

    const hour = time[0];
    const minute = time[1];
    const second = time[2] ?? 0;

    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      hour === undefined ||
      minute === undefined
    ) {
      throw new Error(`Data inválida: ${value}`);
    }

    // CORREÇÃO: Cria a data assumindo explicitamente o padrão ISO UTC correspondente 
    // ao horário de Brasília/Recife (-03:00) para que o servidor na nuvem não desloque as horas.
    // Ex: "2026-06-06T08:00:00-03:00"
    const isoWithOffset = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}-03:00`;

    return new DateTime(new Date(isoWithOffset));
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