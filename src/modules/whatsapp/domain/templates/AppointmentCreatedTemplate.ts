export function appointmentCreatedTemplate(
  client: string,
  service: string,
  barber: string,
  date: string
) {

  return `
📅 Novo agendamento

Cliente: ${client}

Serviço: ${service}

Barbeiro: ${barber}

Horário: ${date}
`;

}