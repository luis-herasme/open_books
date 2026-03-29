import type { Bindings } from '../bindings.ts';

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Bindings {}
}
