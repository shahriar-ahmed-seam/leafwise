export interface ClassEntry {
  raw: string;
  crop: string;
  condition: string;
  healthy: boolean;
  label: string;
}

export interface ModelMeta {
  model: string;
  architecture: string;
  inputSize: number;
  inputLayout: string;
  output: string;
  classCount: number;
  crops: string[];
  sizeMb: number;
  onnxDrift: number;
  classes: ClassEntry[];
}

export interface BenchSuite {
  key: string;
  title?: string;
  kind?: string;
  dataset?: string;
  split?: string;
  note?: string;
  images?: number;
  skipped?: number;
  exactTop1?: number;
  exactTop3?: number;
  cropTop1?: number | null;
  conditionTop1?: number | null;
  latencyMeanMs?: number;
  latencyP95Ms?: number;
  perCrop?: Record<string, number>;
  topConfusions?: { truth: string; count: number; predicted: string }[];
  error?: string;
}

export interface Benchmarks {
  model: string;
  architecture: string;
  classCount: number;
  sizeMb: number;
  host: string;
  generatedAt: string;
  suites: BenchSuite[];
}

export interface Prediction {
  index: number;
  probability: number;
  entry: ClassEntry;
}

export interface ScanResult {
  id: string;
  at: number;
  predictions: Prediction[];
  latencyMs: number;
  preprocessMs: number;
  thumbnail: string;
  source: "camera" | "upload" | "sample";
}
