import { appendRow, writeTabRows } from './sheets.js';

const queue = [];
let processing = false;
let pendingCount = 0;

export function getSyncStatus() {
  return { pending: pendingCount, processing };
}

export function enqueueWrite(tab, rows) {
  queue.push({ type: 'write', tab, rows });
  pendingCount++;
  processQueue();
}

export function enqueueAppend(tab, row) {
  queue.push({ type: 'append', tab, row });
  pendingCount++;
  processQueue();
}

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length) {
    const job = queue[0];
    let attempt = 0;
    const maxAttempts = 5;
    let done = false;
    while (attempt < maxAttempts && !done) {
      try {
        if (job.type === 'write') {
          await writeTabRows(job.tab, job.rows);
        } else if (job.type === 'append') {
          await appendRow(job.tab, job.row);
        }
        done = true;
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) {
          console.error(`Sync job failed permanently for tab ${job.tab}:`, err.message);
          done = true; // drop after exhausting retries
        } else {
          const delay = Math.min(2 ** attempt * 1000, 16000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    queue.shift();
    pendingCount = Math.max(0, pendingCount - 1);
  }
  processing = false;
}
