export const PERMISSION_DENIED_EVENT = 'permission-denied';

export function emitPermissionDenied(message?: string): void {
  const event = new CustomEvent<string>(PERMISSION_DENIED_EVENT, {
    detail: message || 'No tienes permisos para realizar esta acción o ver este contenido.',
  });
  globalThis.dispatchEvent(event);
}
