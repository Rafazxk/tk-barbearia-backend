export interface MessageProvider {
  sendText(
    phone: string,
    message: string
  ): Promise<void>;

  sendImage(
    phone: string,
    imageUrl: string,
    caption?: string
  ): Promise<void>;

  isConnected(): Promise<boolean>;
}