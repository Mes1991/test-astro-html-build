const DEFAULT_WPM = 200;

export function readingTime(body: string, wpm: number = DEFAULT_WPM): number {
  if (!body) return 1;

  let cleaned = body.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`[^`]*`/g, ' ');
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  const words = cleaned.split(/\s+/).filter((token) => /\w/.test(token)).length;
  return Math.max(1, Math.ceil(words / wpm));
}
