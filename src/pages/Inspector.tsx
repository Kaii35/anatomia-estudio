import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { Check, Copy, Upload } from 'lucide-react'
import type { Mesh, Object3D } from 'three'
import type { ModelDef } from '../data/models'
import { partName } from '../data/parts'
import { cn } from '../lib/text'
import { ModelViewer, type MeshClick } from '../three/ModelViewer'

interface Row {
  mesh: string
  partId: string | null
}

/** Herramienta para preparar modelos: muestra las mallas de un .glb y a qué hueso se asigna cada una. */
export function Inspector() {
  const [file, setFile] = useState<{ name: string; url: string } | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [click, setClick] = useState<MeshClick | null>(null)
  const [copied, setCopied] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => void (file && URL.revokeObjectURL(file.url)), [file])

  const def = useMemo<ModelDef | null>(
    () => (file ? { id: `inspector:${file.url}`, title: file.name, url: file.url, parts: [] } : null),
    [file],
  )

  const load = (f: File | undefined) => {
    if (!f) return
    setRows([])
    setClick(null)
    setFile({ name: f.name, url: URL.createObjectURL(f) })
  }

  const onReady = useCallback((root: Object3D) => {
    const found: Row[] = []
    root.traverse((o) => {
      if ((o as Mesh).isMesh) found.push({ mesh: o.name || '(sin nombre)', partId: o.userData.partId ?? null })
    })
    setRows(found)
  }, [])

  const unmatched = rows.filter((r) => !r.partId)
  const snippet = useMemo(() => {
    const parts = [...new Set(rows.map((r) => r.partId).filter(Boolean))]
    const pending = [...new Set(unmatched.map((r) => r.mesh))]
    return `'mi-modelo': {
  id: 'mi-modelo',
  title: '${file?.name.replace(/\.glb$/i, '') ?? ''}',
  url: 'models/${file?.name ?? ''}',
  parts: ${JSON.stringify(parts)},${pending.length ? `\n  // Mallas sin asignar: ${pending.join(', ')}\n  resolve: (name) => undefined,` : ''}
},`
  }, [rows, unmatched, file])

  const copy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    load(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Modelos 3D</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Suelta aquí un archivo <strong>.glb</strong> para ver cómo se llaman sus mallas y qué hueso se le asigna a cada una. Con eso se
          registra el modelo en <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">src/data/models.ts</code>.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'card flex cursor-pointer flex-col items-center gap-2 border-dashed p-7 text-center transition hover:border-accent',
          dragging && 'border-accent bg-accent/8',
        )}
      >
        <Upload size={24} className="text-accent" />
        <span className="font-medium">{file ? file.name : 'Arrastra un .glb o haz clic para elegirlo'}</span>
        <span className="text-sm text-muted">El archivo no se sube a ningún sitio: se abre solo en tu navegador.</span>
        <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(e) => load(e.target.files?.[0])} />
      </label>

      {def && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <ModelViewer model={def} onReady={onReady} onMeshClick={setClick} selected={click?.partId ? [click.partId] : []} className="h-[460px]" />
            <div className="card p-4 text-sm">
              {click ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <dt className="text-muted">Malla</dt>
                  <dd className="font-mono break-all">{click.meshName || '(sin nombre)'}</dd>
                  <dt className="text-muted">Asignada a</dt>
                  <dd>{click.partId ? partName(click.partId) : <span className="text-bad">sin asignar</span>}</dd>
                  <dt className="text-muted">Punto</dt>
                  <dd className="font-mono">[{click.point.map((n) => n.toFixed(3)).join(', ')}]</dd>
                </dl>
              ) : (
                <p className="text-muted">Haz clic en el modelo para ver el nombre de la malla y las coordenadas del punto (útiles para marcar accidentes óseos).</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="font-display text-lg font-semibold">
                {rows.length} mallas · {rows.length - unmatched.length} reconocidas
              </h2>
              <ul className="mt-3 max-h-72 space-y-1 overflow-auto pr-1 text-sm">
                {rows.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 odd:bg-surface-2">
                    <span className="min-w-0 truncate font-mono text-[13px]">{r.mesh}</span>
                    <span className={cn('shrink-0', r.partId ? 'text-ok' : 'text-bad')}>{r.partId ? partName(r.partId) : 'sin asignar'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Entrada para models.ts</h2>
                <button type="button" className="btn-soft px-3 py-1.5" onClick={copy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">Deja en parts solo las partes sobre las que quieras preguntas. Las mallas sin asignar se resuelven en resolve.</p>
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-surface-2 p-3 text-xs leading-relaxed">{snippet}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
