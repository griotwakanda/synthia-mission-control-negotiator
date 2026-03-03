export interface TranscriptEntry {
  ts: string;
  speaker: 'AGENT' | 'CUSTOMER' | 'SYSTEM';
  text: string;
}

export interface LiveCallState {
  activeCallSid: string | null;
  toPhoneNumber: string;
  objective: string;
  liveInstruction: string;
  callStatus: string;
  transcript: TranscriptEntry[];
  updatedAt: string;
}

const state: LiveCallState = {
  activeCallSid: null,
  toPhoneNumber: '',
  objective: '',
  liveInstruction: '',
  callStatus: 'idle',
  transcript: [],
  updatedAt: new Date().toISOString()
};

type Listener = (snapshot: LiveCallState) => void;
const listeners = new Set<Listener>();

function nowIso(): string {
  return new Date().toISOString();
}

function snapshot(): LiveCallState {
  return {
    ...state,
    transcript: [...state.transcript]
  };
}

function publish(): void {
  state.updatedAt = nowIso();
  const current = snapshot();
  for (const listener of listeners) {
    listener(current);
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function getLiveCallState(): LiveCallState {
  return snapshot();
}

export function setCallContext(input: { toPhoneNumber?: string; objective?: string }): void {
  if (typeof input.toPhoneNumber === 'string') {
    state.toPhoneNumber = input.toPhoneNumber;
  }
  if (typeof input.objective === 'string') {
    state.objective = input.objective;
  }
  publish();
}

export function setInstruction(text: string): void {
  state.liveInstruction = text;
  publish();
}

export function startCall(callSid: string): void {
  state.activeCallSid = callSid;
  state.callStatus = 'in-progress';
  publish();
}

export function endCall(status = 'completed'): void {
  state.callStatus = status;
  state.activeCallSid = null;
  publish();
}

export function updateCallStatus(status: string): void {
  state.callStatus = status;
  if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status)) {
    state.activeCallSid = null;
  }
  publish();
}

export function appendTranscript(entry: TranscriptEntry): void {
  state.transcript = [...state.transcript.slice(-199), entry];
  publish();
}
