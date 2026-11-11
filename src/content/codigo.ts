// Fragmentos ilustrativos (NO es código real de ningún sistema): cortos, limpios y de <= 60 columnas.
// Las claves coinciden con `codigo` de cada sistema en es.ts / en.ts.
export const codigo: Record<string, string> = {
  'calidad.ts': `import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
export const useDocs = defineStore('docs', () => {
  const items = ref<Doc[]>([])
  const current = computed(() =>
    items.value.filter((d) => d.status === 'approved'))

  async function publish(id: number, file: File) {
    const body = new FormData()
    body.append('file', file)
    const url = \`/docs/\${id}/versions\`
    const v = await api.post<Version>(url, body)
    items.value.find((d) => d.id === id)?.versions.push(v)
  }
  return { items, current, publish }
})`,
  'sync.ts': `type Job = { url: string; body: unknown }
const read = (): Job[] =>
  JSON.parse(localStorage.queue ?? '[]')
const write = (q: Job[]) =>
  (localStorage.queue = JSON.stringify(q))

export const enqueue = (j: Job) => write([...read(), j])
export async function flush() {
  for (const j of read()) {
    const body = JSON.stringify(j.body)
    const res = await fetch(j.url, { method: 'POST', body })
    if (!res.ok) return // retry on the next 'online'
    write(read().slice(1))
  }
}
window.addEventListener('online', flush)`,
  'expediente.php': `class RecordController extends Controller
{
    public function store(Request $r, Case $case)
    {
        $r->validate(['pdf' => 'required|mimes:pdf']);
        $file = $r->file('pdf');
        $path = $file->store("records/{$case->id}");

        return $case->records()->create([
            'path' => $path,
            'hash' => hash_file('sha256', $file->path()),
            'signed_by' => $r->user()->id,
            'signed_at' => now(),
        ]);
    }
}`,
  'migracion.php': `return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('code')->unique();
            $t->decimal('total', 12, 2)->default(0);
            $t->timestamp('legacy_date')->nullable();
            $t->timestamps();
        });
    }

    // C# Order.Total   -> orders.total
    // C# Order.Created -> orders.legacy_date
};`,
}
