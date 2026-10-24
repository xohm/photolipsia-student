// Checks your OpenRouter key and the course guardrail. Same command on Mac and Windows:
//
//   node tools/check-openrouter.mjs
//
// Reads OPENROUTER_API_KEY from your environment and never prints it.
// Sends two tiny requests (a fraction of a cent): one to the course model,
// which must work, and one to another model, which the guardrail must block.

const API = 'https://openrouter.ai/api/v1';
const COURSE_MODEL = 'z-ai/glm-5.3-flash';
const key = process.env.OPENROUTER_API_KEY?.trim();

if (!key) {
  console.log('OPENROUTER_API_KEY is not set in this terminal.');
  console.log('  Mac:     add it to ~/.zshrc, then run: source ~/.zshrc');
  console.log('  Windows: setx OPENROUTER_API_KEY "sk-or-...", then open a NEW terminal');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
let ok = true;

console.log(`key: ${key.slice(0, 9)}... (${key.length} characters)`);
await showKeyInfo();
await expect(COURSE_MODEL, 'should work', (status) => status === 200);
const other = await anotherModel();
if (other) await expect(other, 'should be blocked', (status) => status === 403);
console.log(ok ? '\nAll good.' : '\nSomething is off. See docs/teacher-setup.md, "Troubleshooting".');
process.exit(ok ? 0 : 1);

async function showKeyInfo() {
  const response = await fetch(`${API}/key`, { headers });
  if (!response.ok) {
    ok = false;
    console.log(`key info: ${response.status} ${await errorText(response)}`);
    return;
  }
  const { data } = await response.json();
  const dollars = (value) => (value == null ? 'none' : `$${Number(value).toFixed(2)}`);
  console.log(`key info: limit ${dollars(data.limit)}, used ${dollars(data.usage)}, left ${dollars(data.limit_remaining)}`);
}

async function expect(model, label, isExpected) {
  const response = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with the single word: hello' }],
      reasoning: { effort: 'low' },
      max_tokens: 300,
    }),
  });
  const passed = isExpected(response.status);
  ok &&= passed;
  const detail = response.ok ? replyText(await response.json()) : await errorText(response);
  console.log(`${model} (${label}): ${response.status} ${passed ? 'OK' : 'UNEXPECTED'} ${detail}`);
}

// A cheap model that is not on the course allowlist.
async function anotherModel() {
  const response = await fetch(`${API}/models`);
  if (!response.ok) return null;
  const { data } = await response.json();
  const cheap = data
    .filter((model) => !model.id.includes('z-ai/') && !model.id.startsWith('~') && Number(model.pricing?.prompt) > 0)
    .sort((a, b) => Number(a.pricing.prompt) - Number(b.pricing.prompt));
  return cheap[0]?.id ?? null;
}

function replyText(json) {
  const text = json.choices?.[0]?.message?.content ?? '';
  return text ? `"${text.trim().slice(0, 40)}"` : '';
}

async function errorText(response) {
  const text = await response.text();
  try {
    return `"${JSON.parse(text).error?.message ?? text}"`.slice(0, 160);
  } catch {
    return text.slice(0, 160);
  }
}
