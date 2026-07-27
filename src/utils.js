export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeIn = t => t * t * t;
