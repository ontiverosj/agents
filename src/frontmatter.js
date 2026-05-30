// Minimal, dependency-free YAML frontmatter parser — just enough for the agent
// definition files (.claude/agents/*.md). Supports top-level scalar keys and
// folded/literal/plain multi-line values (e.g. `description: >`). Not a general
// YAML parser; kept tiny and pure so it can be unit-tested.

function parseFrontmatter(text) {
  const src = String(text || '').replace(/\r\n/g, '\n');
  if (!src.startsWith('---\n')) return { data: {}, body: src };

  const end = src.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: src };

  const block = src.slice(4, end + 1);
  const body = src.slice(end + 4).replace(/^\n/, '');

  const data = {};
  const lines = block.split('\n');
  let key = null;
  let folded = []; // accumulated multi-line value parts

  const commit = () => {
    if (key !== null) {
      data[key] = folded.join(' ').replace(/\s+/g, ' ').trim();
    }
  };

  for (const line of lines) {
    const top = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (top && !/^\s/.test(line)) {
      commit();
      key = top[1];
      const val = top[2];
      if (val === '' || val === '>' || val === '|' || val === '>-' || val === '|-') {
        folded = []; // value continues on following indented lines
      } else {
        folded = [val.replace(/^["']|["']$/g, '')];
      }
    } else if (key !== null && /^\s+/.test(line)) {
      folded.push(line.trim());
    }
  }
  commit();

  return { data, body };
}

module.exports = { parseFrontmatter };
