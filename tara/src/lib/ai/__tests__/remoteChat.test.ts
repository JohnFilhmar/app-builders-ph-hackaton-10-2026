import { remoteChat } from '@/lib/ai/remoteChat';

jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('@/lib/ai/aiSources', () => ({ cloudKey: { get: jest.fn() }, voiceServerKey: { get: jest.fn() } }));

type Sent = { messages: { role: string; content: unknown }[]; reasoning_effort?: string };

const reply = (content: string, reasoning = '') => ({ ok: true, json: async () => ({ choices: [{ message: { content, reasoning } }] }) });
const caps = (list: string[]) => ({ ok: true, json: async () => ({ capabilities: list }) });

/** Fakes Ollama: /api/show answers with `capabilities`, each chat call takes the next scripted reply. */
function fakeOllama(capabilities: string[], replies: ReturnType<typeof reply>[]) {
  const chats: Sent[] = [];
  global.fetch = jest.fn(async (url: string, init?: { body?: string }) => {
    if (url.endsWith('/api/show')) return caps(capabilities);
    chats.push(JSON.parse(init?.body ?? '{}'));
    const next = replies.shift();
    if (!next) throw new Error('no scripted reply left');
    return next;
  }) as unknown as typeof fetch;
  return chats;
}

const isPrefilled = (body: Sent) => body.messages.at(-1)?.role === 'assistant';

describe('remoteChat thinking control', () => {
  it('asks a non-thinking model plainly, even when Ollama lists it as thinking', async () => {
    const chats = fakeOllama(['completion', 'thinking'], [reply('OK')]);
    const source = { kind: 'lan' as const, base_url: 'http://a:11434', model: 'qwen3:4b-instruct' };
    await expect(remoteChat(source, [{ role: 'user', content: 'Reply OK' }])).resolves.toBe('OK');
    expect(isPrefilled(chats[0] as Sent)).toBe(false);
    expect(chats[0]?.reasoning_effort).toBe('none');
  });

  it('retries once with the think block for a model that thinks anyway, then remembers it', async () => {
    const chats = fakeOllama(['completion', 'thinking', 'vision'], [reply('', 'hmm...'), reply('A desk.'), reply('A cup.')]);
    const source = { kind: 'lan' as const, base_url: 'http://b:11434', model: 'qwen3-vl:4b' };
    await expect(remoteChat(source, [{ role: 'user', content: 'Describe' }])).resolves.toBe('A desk.');
    expect(chats.map((c) => isPrefilled(c))).toEqual([false, true]);
    await expect(remoteChat(source, [{ role: 'user', content: 'Describe' }])).resolves.toBe('A cup.');
    expect(isPrefilled(chats[2] as Sent)).toBe(true);
  });

  it('still fails on a truly empty answer so the phone takes over', async () => {
    fakeOllama(['completion', 'vision'], [reply('')]);
    const source = { kind: 'lan' as const, base_url: 'http://c:11434', model: 'moondream' };
    await expect(remoteChat(source, [{ role: 'user', content: 'Is there a cup?' }])).rejects.toThrow(/empty answer/);
  });
});
