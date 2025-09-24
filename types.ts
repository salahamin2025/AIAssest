export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface Source {
  uri: string;
  title: string;
}

export interface Citation {
  startIndex: number;
  endIndex: number;
  sourceIndex: number;
}

export interface Message {
  role: MessageRole;
  text: string;
  imageUrl?: string;
  sources?: Source[];
  citations?: Citation[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}