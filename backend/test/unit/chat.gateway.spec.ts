import { ChatGateway } from '../../src/chat/chat.gateway';

describe('ChatGateway (unit)', () => {
  let gateway: ChatGateway;
  let server: any;
  let client: any;

  beforeEach(() => {
    gateway = new ChatGateway();
    server = { emit: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) } as any;
    client = { id: 'sock1', emit: jest.fn() } as any;
    (gateway as any).server = server;
  });

  it('handleSendMessage debería emitir en la sala correspondiente', async () => {
    const payload = { chatId: 1, senderId: 2, content: 'hola' };
    await (gateway as any).handleSendMessage(payload, client);
    expect(server.to).toHaveBeenCalledWith('chat_1');
  });
});
