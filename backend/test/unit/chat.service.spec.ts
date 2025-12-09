import { ChatService } from '../../src/chat/chat.service';
import { Repository } from 'typeorm';
import { Chat } from '../../src/entities/chat.entity';
import { Message } from '../../src/entities/message.entity';

describe('ChatService (unit)', () => {
  let service: ChatService;
  let chatRepo: jest.Mocked<Repository<Chat>>;
  let msgRepo: jest.Mocked<Repository<Message>>;

  beforeEach(() => {
    chatRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } as any;
    msgRepo = { save: jest.fn(), create: jest.fn() } as any;
    service = new ChatService(chatRepo, msgRepo);
  });

  it('createMessage guarda mensaje en chat existente', async () => {
    (msgRepo.create as jest.Mock).mockReturnValue({ content: 'hi' } as any);
    (msgRepo.save as jest.Mock).mockResolvedValue({ messageId: 1, content: 'hi' } as any);
    const res = await service.createMessage(1, 1, 'hi');
    expect(res.messageId).toBe(1);
  });
});
