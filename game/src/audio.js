// Procedural sound only: every effect is synthesised with WebAudio (oscillators and filtered
// noise), so the game needs no audio files and stays offline. The audio context is created on
// the first user gesture; before that every call is a silent no-op.
export function createAudio() {
  throw new Error('not implemented');
}
