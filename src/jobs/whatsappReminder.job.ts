import cron from "node-cron";
import { AppointmentsRepository } from "../modules/appointments/repositories/AppointmentsRepository.js"; 
import { db, appointmentsTable } from "../database/index.js";
import { eq } from "drizzle-orm";

const appointmentsRepo = new AppointmentsRepository();

// Função que formata o template substituindo as chaves
function formatarMensagemLembrete(template: string, dados: { cliente: string; data: string; hora: string }) {
  return template
    .replace("{cliente}", dados.cliente)
    .replace("{data}", dados.data)
    .replace("{hora}", dados.hora);
}

// Configura o cron para rodar a cada 5 minutos ("*/5 * * * *")
export function iniciarJobLembreteWhatsapp() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("⏱️ Verificando agendamentos para envio de lembrete...");

      const agendamentos = await appointmentsRepo.findAppointmentsNeedingReminder();

      if (agendamentos.length === 0) {
        return;
      }

      for (const agendamento of agendamentos) {
        const dataObj = new Date(agendamento.dataHora);
        const dataFormatada = dataObj.toLocaleDateString("pt-BR");
        const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        // 1. Monta a mensagem final usando o template do barbeiro
        const mensagem = formatarMensagemLembrete(agendamento.reminderMessageTemplate, {
          cliente: agendamento.clienteNome,
          data: dataFormatada,
          hora: horaFormatada,
        });

        console.log(`📲 Enviando WhatsApp para ${agendamento.clienteTelefone}: "${mensagem}"`);

        // TODO: Substitua este bloco pela chamada real da sua API de WhatsApp (Evolution API, Z-API, etc.)
        // await meuServicoDeWhatsapp.enviarMensagem(agendamento.clienteTelefone, mensagem);

        // 2. Atualiza no banco que o lembrete já foi enviado (evita spam)
        await db
          .update(appointmentsTable)
          .set({ lembreteEnviado: true })
          .where(eq(appointmentsTable.id, agendamento.id));
      }

      console.log("✅ Lembretes de WhatsApp processados com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao rodar o job de lembretes de WhatsApp:", error);
    }
  });
}