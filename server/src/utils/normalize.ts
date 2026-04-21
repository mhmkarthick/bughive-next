type AnyRecord = Record<string, any>

const isPlainObject = (v: any) => {
  if (!v || typeof v !== 'object') return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

export function normalizeIds<T>(input: T): T {
  if (input === null || input === undefined) return input

  if (Array.isArray(input)) {
    return input.map(v => normalizeIds(v)) as any
  }

  if (typeof input !== 'object') return input

  if (input instanceof Date) return input

  const maybeSerializable = input as any
  if (!isPlainObject(maybeSerializable) && typeof maybeSerializable?.toJSON === 'function') {
    return normalizeIds(maybeSerializable.toJSON()) as any
  }

  const obj = input as AnyRecord
  const out: AnyRecord = {}

  for (const [k, v] of Object.entries(obj)) {
    out[k] = normalizeIds(v)
  }

  if (out._id !== undefined && out.id === undefined) {
    out.id = typeof out._id === 'string' ? out._id : (out._id?.toString?.() ?? out._id)
  }

  return out as T
}
