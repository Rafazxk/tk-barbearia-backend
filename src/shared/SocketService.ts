import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export class SocketService {
  private static io: SocketServer | null = null;
  private static connectedBarbers = new Map<number, string>();

  public static init(httpServer: HttpServer, allowedOrigins: string[]): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Permite conexões sem origem (ex: ferramentas de API ou requisições internas)
          if (!origin) return callback(null, true);

          const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

          if (isAllowed) {
            callback(null, true);
          } else {
            console.error("CORS Socket.io Bloqueado para:", origin);
            callback(new Error("Bloqueado pelo CORS do Socket.io"));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Novo cliente conectado: ${socket.id}`);

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

  public static sendNotificationToBarber(barberId: string | number, eventName: string, data: any): void {
    const idNumeric = Number(barberId);
    const socketId = this.connectedBarbers.get(idNumeric);
    
    if (socketId && this.io) {
      this.io.to(socketId).emit(eventName, data);
      console.log(`⚡ Evento "${eventName}" enviado para o barbeiro ${idNumeric}`);
    }
  }
}