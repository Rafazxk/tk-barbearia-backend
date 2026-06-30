import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export class SocketService {
  // 🔹 Definindo os tipos explicitamente para evitar erros de compilação
  private static io: SocketServer | null = null;
  private static connectedBarbers = new Map<number, string>();

  // 🔹 Tipando os parâmetros recebidos do seu server principal
  public static init(httpServer: HttpServer, allowedOrigins: string[]): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: allowedOrigins, 
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Novo cliente conectado: ${socket.id}`);

      // 🔹 Garantindo que o barberId seja convertido e guardado como número
      socket.on("register-barber", (barberId: string | number) => {
        const idNumeric = Number(barberId);
        
        if (!isNaN(idNumeric)) {
          this.connectedBarbers.set(idNumeric, socket.id);
          console.log(`👤 Barbeiro ${idNumeric} registrado no socket ${socket.id}`);
        }
      });

      socket.on("disconnect", () => {
        for (const [barberId, socketId] of this.connectedBarbers.entries()) {
          if (socketId === socket.id) {
            this.connectedBarbers.delete(barberId);
            console.log(`❌ Barbeiro ${barberId} desconectou.`);
            break;
          }
        }
      });
    });
  }

  // 🔹 Método de disparo limpo e tipado para os seus Services utilizarem
  public static sendNotificationToBarber(barberId: string | number, eventName: string, data: any): void {
    const idNumeric = Number(barberId);
    const socketId = this.connectedBarbers.get(idNumeric);
    
    if (socketId && this.io) {
      this.io.to(socketId).emit(eventName, data);
      console.log(`⚡ Evento "${eventName}" enviado para o barbeiro ${idNumeric}`);
    }
  }
}