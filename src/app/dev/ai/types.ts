export type ProbeView = {
  provider: string;
  model: string;
  ok: boolean;
  text?: string;
  error?: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type AttemptView = {
  provider: string;
  model: string;
  ok: boolean;
  error?: string;
  latencyMs: number;
};

export type AnswerView = {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  fallbackUsed: boolean;
  attempts: AttemptView[];
};

export type PlaygroundState = {
  probes?: ProbeView[];
  answer?: AnswerView;
  attempts?: AttemptView[];
  error?: string;
};
