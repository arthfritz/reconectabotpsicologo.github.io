
export enum Sender {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
}
