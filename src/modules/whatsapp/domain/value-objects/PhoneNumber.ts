export class PhoneNumber {

  constructor(
    private readonly value: string
  ) {}

  normalize(): string {

    return this.value.replace(/\D/g, "");

  }

  toWhatsapp(): string {

    const phone = this.normalize();

    return phone.startsWith("55")
      ? phone
      : `55${phone}`;

  }

}