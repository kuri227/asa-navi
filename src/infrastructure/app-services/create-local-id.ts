let idSequence = 0;

export function createLocalId(): string {
  idSequence += 1;
  return `${Date.now().toString(36)}-${idSequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
