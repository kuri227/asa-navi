export class NotificationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotificationError";
  }
}
