/**
 * Errores típicos cuando el servidor (Supabase) corta una conexión inactiva
 * y el pool entrega un socket que ya está muerto.
 */
const CONNECTION_DROP_PATTERNS = [
  'connection terminated',
  'connection ended',
  'connection closed',
  'connection timeout',
  'timeout exceeded when trying to connect',
  'server closed the connection',
  'socket hang up',
  'econnreset',
  'epipe',
  'not queryable',
]

function isConnectionDrop(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = `${error.message} ${error.cause ? String(error.cause) : ''}`.toLowerCase()
  return CONNECTION_DROP_PATTERNS.some((pattern) => message.includes(pattern))
}

/**
 * Ejecuta `run` reintentando una vez si falla por una conexión caída.
 * El pool descarta el cliente roto, así que el segundo intento ya usa una
 * conexión nueva y la consulta sale normal.
 */
export async function withConnectionRetry<T>(
  run: () => Promise<T>,
  retriesRemaining = 1
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (retriesRemaining > 0 && isConnectionDrop(error)) {
      return withConnectionRetry(run, retriesRemaining - 1)
    }
    throw error
  }
}
