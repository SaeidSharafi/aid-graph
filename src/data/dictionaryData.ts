/**
 * Complete Dictionary of AI Coding Dataset (from mattpocock/dictionary-of-ai-coding)
 * 69 Terms across 7 Core Sections
 */

export interface DictionaryNode {
  slug: string;
  title: string;
  description: string;
  body: string;
  prose: string;
  aliases: string[];
  links: string[];
  usage: string[];
  avoid: string;
  heardInTheWild?: {
    user: string;
    agent: string;
  };
  section: number;
  inDegree: number;
  layout: [number, number, number];
}

export interface DictionaryEdge {
  source: string;
  target: string;
  control?: [number, number, number];
}

export interface DictionarySection {
  title: string;
  index: number;
  slugs: string[];
  centroid: [number, number, number];
  radius: number;
  paperColor?: string;
}

export const DICTIONARY_SECTIONS: DictionarySection[] = [
  {
    index: 0,
    title: 'THE MODEL & PARAMETERS',
    slugs: ['model', 'agent', 'tool', 'inference', 'system-prompt', 'temperature', 'sampling', 'quantization', 'weights', 'context-window'],
    centroid: [40, 20, -20],
    radius: 140,
    paperColor: '#4500B3',
  },
  {
    index: 1,
    title: 'SESSIONS, CONTEXT WINDOWS & TURNS',
    slugs: ['turn', 'session', 'harness', 'tool-call', 'tool-result', 'model-provider-request', 'model-provider', 'prefix-cache', 'cache-tokens', 'input-tokens', 'output-tokens', 'stateful', 'stateless', 'compaction'],
    centroid: [0, 0, 0],
    radius: 160,
    paperColor: '#EB4347',
  },
  {
    index: 2,
    title: 'TOOLS, HARNESS & ENVIRONMENT',
    slugs: ['environment', 'bash-tool', 'file-system', 'diff-tool', 'lsp-tool', 'mcp-server', 'subagent', 'sandboxing', 'read-modify-write', 'anti-typo-rule'],
    centroid: [-80, -30, 40],
    radius: 150,
    paperColor: '#9DD395',
  },
  {
    index: 3,
    title: 'AGENTIC LOOP & AUTONOMY',
    slugs: ['afk', 'steering', 'chain-of-thought', 'reasoning-effort', 'planning', 'backtracking', 'repack', 'autonomous-execution', 'human-in-the-loop', 'grounding'],
    centroid: [70, -60, 30],
    radius: 140,
    paperColor: '#D3C2FE',
  },
  {
    index: 4,
    title: 'PROMPT ENGINEERING & CONTEXT',
    slugs: ['system-prompt-cache', 'progressive-disclosure', 'attention-degradation', 'hallucination', 'needle-in-a-haystack', 'lost-in-the-middle', 'few-shot-examples', 'prompt-injection'],
    centroid: [-60, 70, -30],
    radius: 150,
    paperColor: '#0F7A6B',
  },
  {
    index: 5,
    title: 'EVALUATION, BENCHMARKS & HARNESSES',
    slugs: ['swe-bench', 'benchmark', 'canary-test', 'golden-dataset', 'pass-at-1', 'lint-verifier', 'compile-check', 'test-driven-agent'],
    centroid: [90, 60, 40],
    radius: 130,
    paperColor: '#FFD23F',
  },
  {
    index: 6,
    title: 'MEMORY & KNOWLEDGE GRAPHS',
    slugs: ['graph-rag', 'semantic-embeddings', 'vector-database', 'triplestore', 'ast-graph', 'dependency-graph', 'agent-memory'],
    centroid: [-40, -90, -40],
    radius: 140,
    paperColor: '#2D3DCF',
  },
];

export const DICTIONARY_NODES: DictionaryNode[] = [
  // --- Section 1: Sessions, Context Windows & Turns (Featured in Image) ---
  {
    slug: 'turn',
    title: 'Turn',
    description: 'One user message plus everything the agent does in response, up until it yields back to the user. Contains one or more provider requests.',
    prose: 'One user message plus everything the agent does in response, up until it yields back to the user. Contains one or more provider requests.',
    body: `What makes the turn worth naming is that its length is the agent's decision, not yours. You hand over one message; the agent decides how many tool calls to chain before yielding. A turn can be a one-sentence answer or twenty minutes of reading, editing, and running tests. That's the same property from two angles: long turns are what make AFK work possible, and long turns are also where agents can drift off-course if unsteered.`,
    aliases: ['Step', 'Interaction Cycle'],
    links: ['agent', 'model-provider-request', 'tool', 'session', 'afk', 'harness', 'tool-call', 'tool-result', 'model-provider', 'stateful'],
    usage: ['One turn took two minutes?'],
    avoid: 'Confusing a single turn with a single model API request.',
    heardInTheWild: {
      user: 'One turn took two minutes?',
      agent: 'It made fourteen tool calls inside that turn — each one is a separate model provider request. Latency stacks up before the agent finally yields back to you.',
    },
    section: 1,
    inDegree: 48,
    layout: [0, 0, 0],
  },
  {
    slug: 'session',
    title: 'Session',
    description: 'The unbroken conversational context and history accumulated between the user and the agent.',
    prose: 'The ongoing state and event log maintained across multiple consecutive turns.',
    body: `A session captures the complete lineage of prompts, system directives, tool invocations, and observations in a continuous stateful thread until compacted or reset.`,
    aliases: ['Conversation', 'Thread'],
    links: ['turn', 'harness', 'context-window', 'compaction', 'stateful'],
    usage: ['Clear the session context before starting the next ticket.'],
    avoid: 'Assuming the model natively remembers past sessions without harness persistence.',
    heardInTheWild: {
      user: 'Why did the agent remember the file structure from earlier?',
      agent: 'It lives in the session history until you issue a reset or compaction.',
    },
    section: 1,
    inDegree: 36,
    layout: [8, -35, 12],
  },
  {
    slug: 'harness',
    title: 'Harness',
    description: 'The host software wrapping the raw model: executes tool calls, manages context windows, and maintains the loop.',
    prose: 'The runtime environment that orchestrates model calls and physical tool execution.',
    body: `The harness is everything around the model: the parser that intercepts tool requests, executes shell/filesystem actions on the host machine, and feeds formatted results back into the next prompt.`,
    aliases: ['Agent Framework', 'Host Runtime', 'Scaffolding'],
    links: ['agent', 'tool', 'turn', 'session', 'environment', 'sandboxing'],
    usage: ['The harness intercepted the command and prompted for user confirmation.'],
    avoid: 'Attributing harness capabilities (like running bash) to the raw neural weights.',
    heardInTheWild: {
      user: 'Did the model run the tests itself?',
      agent: 'No, the harness parsed the test command tool call and ran it in the container sandbox.',
    },
    section: 1,
    inDegree: 44,
    layout: [14, -60, 22],
  },
  {
    slug: 'tool-call',
    title: 'Tool Call',
    description: 'A structured command generated by the model requesting the harness to execute a specific function.',
    prose: 'A JSON-structured request from the model to interact with the environment.',
    body: `The model signals its intent by outputting arguments for a defined tool schema. The harness pauses model generation, executes the function, and injects the output as a Tool Result.`,
    aliases: ['Function Call', 'Action Request'],
    links: ['tool', 'tool-result', 'turn', 'harness'],
    usage: ['The model issued three parallel tool calls to inspect the directory.'],
    avoid: 'Expecting the model to execute tools internally without harness assistance.',
    heardInTheWild: {
      user: 'How does it edit files?',
      agent: 'It outputs a tool call with edit_file and target contents; the harness writes the actual disk bytes.',
    },
    section: 1,
    inDegree: 40,
    layout: [-38, -55, 30],
  },
  {
    slug: 'tool-result',
    title: 'Tool Result',
    description: 'The actual output returned by the environment after executing a tool call, fed back into context.',
    prose: 'The observation returned to the model following an environmental action.',
    body: `Contains stdout, stderr, or structured payloads. Provides empirical feedback that allows the agent to self-correct and verify results before proceeding.`,
    aliases: ['Observation', 'Tool Output'],
    links: ['tool-call', 'turn', 'chain-of-thought', 'steering'],
    usage: ['The tool result indicated a missing semicolon on line 42.'],
    avoid: 'Silencing error outputs from tool results.',
    heardInTheWild: {
      user: 'How did it know the build failed?',
      agent: 'The compiler error was returned in the tool result payload.',
    },
    section: 1,
    inDegree: 28,
    layout: [-26, -85, 45],
  },
  {
    slug: 'model-provider-request',
    title: 'Model Provider Request',
    description: 'A single HTTP/gRPC invocation sending the context window to the LLM API and receiving tokens.',
    prose: 'A discrete API network round-trip to the model provider.',
    body: `Each turn consists of one or more discrete provider requests separated by tool executions. Provider latency, rate limits, and TTFT (time to first token) determine agent responsiveness.`,
    aliases: ['API Call', 'Inference Request'],
    links: ['model-provider', 'turn', 'input-tokens', 'output-tokens', 'inference'],
    usage: ['Each tool iteration requires an additional provider request.'],
    avoid: 'Assuming multi-step reasoning happens in a single network round-trip.',
    heardInTheWild: {
      user: 'Why is the turn taking so long?',
      agent: 'It completed 6 model provider requests sequentially to inspect files and test fixes.',
    },
    section: 1,
    inDegree: 34,
    layout: [48, 85, -28],
  },
  {
    slug: 'model-provider',
    title: 'Model Provider',
    description: 'The hosting platform (Anthropic, OpenAI, Google, AWS Bedrock) serving LLM inference endpoints.',
    prose: 'The cloud infrastructure executing model forward-passes at scale.',
    body: `Provides API gateways, tokenizer engines, prompt caching infrastructure, and hardware accelerators (GPUs/TPUs).`,
    aliases: ['Inference Backend', 'API Host'],
    links: ['model-provider-request', 'prefix-cache', 'inference', 'model'],
    usage: ['Switching the provider from AWS to direct Anthropic API reduced TTFT by 400ms.'],
    avoid: 'Assuming all providers implement identical prompt caching and tool-calling semantics.',
    heardInTheWild: {
      user: 'Where does the code get sent?',
      agent: 'To the configured model provider endpoint for token prediction.',
    },
    section: 1,
    inDegree: 30,
    layout: [55, 58, -15],
  },
  {
    slug: 'prefix-cache',
    title: 'Prefix Cache',
    description: 'Server-side key-value cache reusing computed activations across matching prompt prefixes.',
    prose: 'KV-cache persistence that slashes latency and cost on repetitive system prompts.',
    body: `When the initial tokens of a prompt match a previously evaluated prompt (e.g. system instructions, tool schemas, file dumps), the provider skips re-evaluating the attention matrix.`,
    aliases: ['Prompt Caching', 'KV Cache Sharing'],
    links: ['cache-tokens', 'input-tokens', 'model-provider', 'system-prompt'],
    usage: ['Keep tool definitions identical across calls to maximize prefix cache hits.'],
    avoid: 'Randomizing or timestamping top-level prompt headers which invalidate the prefix cache.',
    heardInTheWild: {
      user: 'Why did the second prompt cost 90% less?',
      agent: 'The entire repo file tree hit the prefix cache at 10% base token cost.',
    },
    section: 1,
    inDegree: 32,
    layout: [92, 45, 10],
  },
  {
    slug: 'cache-tokens',
    title: 'Cache Tokens',
    description: 'Prompt tokens that hit precomputed KV-cache slots at the provider, billed at a steep discount.',
    prose: 'Cached input tokens requiring zero GPU matrix recomputation.',
    body: `Drastically reduces both monetary cost (typically 10-25% of standard input price) and time-to-first-token during long agentic coding sessions.`,
    aliases: ['Cached Inputs', 'Warm Tokens'],
    links: ['prefix-cache', 'input-tokens', 'output-tokens'],
    usage: ['85,000 of the 92,000 input tokens were billed as cache read tokens.'],
    avoid: 'Treating cache tokens as permanently free — cache lifetime typically expires after minutes of inactivity.',
    heardInTheWild: {
      user: 'Is it cheap to send large repo contexts?',
      agent: 'Yes, as long as subsequent calls reuse the same prefix and benefit from cache tokens.',
    },
    section: 1,
    inDegree: 26,
    layout: [70, 0, 15],
  },
  {
    slug: 'input-tokens',
    title: 'Input Tokens',
    description: 'All text and tool results encoded into vocabulary IDs and passed into the model attention context.',
    prose: 'The ingested token sequence processed during the prefill phase.',
    body: `Input tokens scale linearly with context window depth and are processed in parallel across GPU matrix cores during the prefill phase.`,
    aliases: ['Prompt Tokens', 'Context Tokens'],
    links: ['output-tokens', 'cache-tokens', 'context-window'],
    usage: ['The giant build log consumed 40,000 input tokens.'],
    avoid: 'Flooding context with redundant minified files or node_modules.',
    heardInTheWild: {
      user: 'What counts toward input tokens?',
      agent: 'System prompts, past chat messages, tool definitions, and tool output strings.',
    },
    section: 1,
    inDegree: 24,
    layout: [80, -15, 20],
  },
  {
    slug: 'output-tokens',
    title: 'Output Tokens',
    description: 'Newly generated tokens emitted autoregressively by the model during the decode phase.',
    prose: 'The generated response sequence produced one token at a time.',
    body: `Generated sequentially (one token per forward pass). Bound by GPU memory bandwidth and generation latency, making output generation much slower than input processing.`,
    aliases: ['Completion Tokens', 'Generated Tokens'],
    links: ['input-tokens', 'turn', 'sampling'],
    usage: ['We capped output tokens at 4,000 to prevent runaway loops.'],
    avoid: 'Asking models to reproduce entire unchanged 10,000 line files instead of concise diffs.',
    heardInTheWild: {
      user: 'Why are output tokens more expensive?',
      agent: 'Because they cannot be computed in parallel and require sequential memory roundtrips.',
    },
    section: 1,
    inDegree: 25,
    layout: [95, -45, 25],
  },
  {
    slug: 'stateful',
    title: 'Stateful Agent',
    description: 'An agent workflow maintaining working memory, scratchpads, and persistent disk state across turns.',
    prose: 'An architecture where previous actions and disk modifications persist into future decisions.',
    body: `Unlike single-shot prompt completions, stateful agents inspect their own prior actions, maintain scratchpad plans, and navigate deep directory structures over time.`,
    aliases: ['Persistent Agent', 'Iterative Agent'],
    links: ['session', 'turn', 'stateless', 'agent-memory'],
    usage: ['Stateful execution allows the agent to iteratively fix compilation errors until green.'],
    avoid: 'Assuming the model itself is stateful — the state is managed entirely by the harness.',
    heardInTheWild: {
      user: 'Does the model learn across sessions?',
      agent: 'No, statefulness is maintained by the harness context history, not weight updates.',
    },
    section: 1,
    inDegree: 22,
    layout: [-10, 85, -20],
  },
  {
    slug: 'stateless',
    title: 'Stateless Model',
    description: 'The fundamental mathematical property of neural weights: zero memory between discrete forward passes.',
    prose: 'The frozen parameter matrix that has no memory of past requests.',
    body: `Every API call starts completely blank. The model only knows what is explicitly present in the token stream of the current context window.`,
    aliases: ['Zero-Memory Function', 'Pure Transformation'],
    links: ['stateful', 'model', 'weights', 'context-window'],
    usage: ['Remember that the model is completely stateless; if you omit the file path, it cannot guess it.'],
    avoid: 'Anthropomorphizing the model as having personal memory of past chats.',
    heardInTheWild: {
      user: 'Why did it forget my previous comment?',
      agent: 'Because the session was cleared and the model is fundamentally stateless.',
    },
    section: 1,
    inDegree: 20,
    layout: [-30, 95, -35],
  },
  {
    slug: 'compaction',
    title: 'Context Compaction',
    description: 'Algorithmic summarization or pruning of older turn history to fit within context limits.',
    prose: 'Compressing dialogue and tool history into dense summaries to keep context lean.',
    body: `When approaching context window limits, the harness invokes a summarizer pass that replaces detailed tool logs with a concise state digest.`,
    aliases: ['Context Compression', 'Rolling Summary'],
    links: ['session', 'context-window', 'attention-degradation'],
    usage: ['Compaction ran after turn 30, reducing context from 180k to 24k tokens.'],
    avoid: 'Discarding critical file path references or error tracebacks during aggressive compaction.',
    heardInTheWild: {
      user: 'How do long sessions stay within token limits?',
      agent: 'Through context compaction, which distills completed tasks into brief summaries.',
    },
    section: 1,
    inDegree: 18,
    layout: [25, -95, 35],
  },

  // --- Section 0: The Model & Parameters ---
  {
    slug: 'model',
    title: 'Model',
    description: 'The parameters. Stateless — does next-token prediction and nothing else.',
    prose: 'The parameters. Stateless — does next-token prediction and nothing else.',
    body: `The core neural network weights trained on trillions of tokens. It takes a sequence of token IDs and computes a probability distribution over the next token in the vocabulary.`,
    aliases: ['LLM', 'Weights', 'Base Model'],
    links: ['agent', 'tool', 'inference', 'weights', 'context-window'],
    usage: ['Try swapping the model from Sonnet to Opus.'],
    avoid: 'Confusing the model with the harness.',
    heardInTheWild: {
      user: 'Can the model edit my hard drive directly?',
      agent: 'No, the model only produces text tokens; the harness executes file operations.',
    },
    section: 0,
    inDegree: 42,
    layout: [42.58, 5.5, -40.92],
  },
  {
    slug: 'agent',
    title: 'Agent',
    description: 'A model harnessed with tools, a system prompt, and an active context window loop.',
    prose: 'A model harnessed with tools.',
    body: `An autonomous system that combines a foundation model with tool schemas, memory, planning algorithms, and environmental feedback loops.`,
    aliases: ['Coding Assistant', 'Autonomous Bot'],
    links: ['model', 'tool', 'harness', 'turn', 'afk', 'steering'],
    usage: ['Which agent are you using for the refactor?'],
    avoid: 'Calling simple one-shot prompt templates an "agent".',
    heardInTheWild: {
      user: 'What makes it an agent instead of a chatbot?',
      agent: 'It can inspect results, decide its own next tools, and iterate until the task is complete.',
    },
    section: 0,
    inDegree: 50,
    layout: [-16.82, 9.88, -4.9],
  },
  {
    slug: 'tool',
    title: 'Tool',
    description: 'A function the harness exposes for the agent to call (e.g. read_file, edit_file, run_command).',
    prose: 'A function the harness exposes for the agent to call.',
    body: `The sensory and effector organs of an AI system. Defined via JSON schema with descriptions, parameter types, and strict contracts.`,
    aliases: ['Function', 'Capability', 'API Action'],
    links: ['agent', 'tool-call', 'tool-result', 'harness', 'bash-tool'],
    usage: ['Add a psql tool to the harness.'],
    avoid: 'Providing vague tool descriptions that confuse the model argument parser.',
    heardInTheWild: {
      user: 'Can it run unit tests?',
      agent: 'Yes, if the harness exposes a compile_applet or run_command tool.',
    },
    section: 0,
    inDegree: 45,
    layout: [-45, -20, 20],
  },
  {
    slug: 'inference',
    title: 'Inference',
    description: 'The execution phase where input tokens pass through transformer layers to produce logits.',
    prose: 'The forward-pass computation through neural network layers.',
    body: `Involves a prefill stage (evaluating all prompt tokens in parallel) followed by an autoregressive decode stage (sampling one token per step).`,
    aliases: ['Forward Pass', 'Prediction'],
    links: ['model', 'sampling', 'temperature', 'model-provider-request'],
    usage: ['Inference speed jumped to 85 tokens/second with FlashAttention.'],
    avoid: 'Confusing inference (read-only execution) with model fine-tuning or training.',
    heardInTheWild: {
      user: 'Why is the first response slower?',
      agent: 'Prefill has to process all input tokens before the first output token can be emitted.',
    },
    section: 0,
    inDegree: 35,
    layout: [30, 25, 5],
  },
  {
    slug: 'system-prompt',
    title: 'System Prompt',
    description: 'Top-level directives defining the persona, behavioral rules, constraints, and tool documentation.',
    prose: 'The foundational instructions that guide agent behavior across all turns.',
    body: `Sets the tone, format guidelines, safety guardrails, and decision frameworks. Placed at the very top of the context window to maximize attention influence.`,
    aliases: ['System Message', 'Developer Instructions', 'Meta Prompt'],
    links: ['agent', 'prefix-cache', 'attention-degradation', 'steering'],
    usage: ['We added an anti-typo rule to the system prompt.'],
    avoid: 'Overloading system prompts with conflicting or repetitive rules.',
    heardInTheWild: {
      user: 'How does it know not to invent new packages?',
      agent: 'The system prompt explicitly forbids hallucinating dependencies.',
    },
    section: 0,
    inDegree: 38,
    layout: [10, 95, -30],
  },
  {
    slug: 'context-window',
    title: 'Context Window',
    description: 'The maximum token buffer size the model can attend to in a single forward pass.',
    prose: 'The total capacity of working memory available to the attention mechanism.',
    body: `Modern frontier models support 128k to 2M tokens. However, effective retrieval and instruction following can degrade across extremely long windows.`,
    aliases: ['Attention Budget', 'Token Limit'],
    links: ['model', 'session', 'compaction', 'attention-degradation', 'needle-in-a-haystack'],
    usage: ['The entire repository fit comfortably in the 1M token context window.'],
    avoid: 'Assuming 100% recall across every token in a massive context window.',
    heardInTheWild: {
      user: 'Can I paste the entire codebase?',
      agent: 'Yes, but focused files yield higher accuracy and lower latency.',
    },
    section: 0,
    inDegree: 39,
    layout: [50, -30, -50],
  },
  {
    slug: 'temperature',
    title: 'Temperature',
    description: 'Hyperparameter scaling the logit distribution before softmax sampling.',
    prose: 'A parameter that controls the randomness of token selection.',
    body: `A temperature of 0.0 forces greedy deterministic selection of the top logit, standard for code generation and mathematical reasoning. Higher values increase diversity.`,
    aliases: ['Sampling Temperature', 'Randomness Factor'],
    links: ['sampling', 'inference', 'model'],
    usage: ['Set temperature to 0 for reliable TypeScript compilation.'],
    avoid: 'Using high temperature (e.g. 0.8+) for deterministic refactoring tasks.',
    heardInTheWild: {
      user: 'Why did the code change slightly when re-run?',
      agent: 'Because temperature was greater than 0, allowing alternative token paths.',
    },
    section: 0,
    inDegree: 21,
    layout: [65, 40, -60],
  },
  {
    slug: 'sampling',
    title: 'Sampling Strategy',
    description: 'Algorithms (top-p nucleus, top-k, greedy) converting output logits into concrete tokens.',
    prose: 'The probabilistic selection mechanism over vocabulary tokens.',
    body: `Determines how the model chooses from candidate next tokens based on probability mass thresholds.`,
    aliases: ['Top-P', 'Top-K', 'Nucleus Sampling'],
    links: ['temperature', 'inference', 'output-tokens'],
    usage: ['We used top-p = 0.95 with greedy fallback for syntax tokens.'],
    avoid: 'Restricting top-k too tightly during open-ended brainstorming.',
    heardInTheWild: {
      user: 'How are tokens chosen?',
      agent: 'By sampling from the top cumulative probability mass distribution.',
    },
    section: 0,
    inDegree: 19,
    layout: [80, 20, -45],
  },
  {
    slug: 'quantization',
    title: 'Model Quantization',
    description: 'Compressing 16-bit floating point weights into 8-bit or 4-bit integer representations.',
    prose: 'Reducing weight precision to run models on smaller hardware memory budgets.',
    body: `Techniques like AWQ, GPTQ, and GGUF allow local edge inference on Apple Silicon or consumer GPUs with minimal perplexity degradation.`,
    aliases: ['4-bit', '8-bit GGUF', 'AWQ'],
    links: ['weights', 'model', 'inference'],
    usage: ['A 4-bit quantized 70B model fits into 48GB unified memory.'],
    avoid: 'Excessive 2-bit quantization on logic-heavy coding models.',
    heardInTheWild: {
      user: 'Can this run locally on my laptop?',
      agent: 'Yes, using 4-bit quantized GGUF weights in Ollama.',
    },
    section: 0,
    inDegree: 16,
    layout: [95, 10, -70],
  },
  {
    slug: 'weights',
    title: 'Weights & Biases',
    description: 'The learned parameter tensors stored across transformer attention and MLP matrices.',
    prose: 'The frozen numerical parameters representing the model knowledge.',
    body: `Billions of matrix weights fine-tuned during pretraining, RLHF, and DPO stages to encode programming patterns and human intent.`,
    aliases: ['Parameters', 'Checkpoints'],
    links: ['model', 'quantization', 'stateless'],
    usage: ['The model weights require 140GB of VRAM in FP16 precision.'],
    avoid: 'Thinking weights change when chatting with an agent.',
    heardInTheWild: {
      user: 'Do weights update after my session?',
      agent: 'No, inference never modifies model weights.',
    },
    section: 0,
    inDegree: 25,
    layout: [70, -10, -60],
  },

  // --- Section 2: Tools, Harness & Environment ---
  {
    slug: 'environment',
    title: 'Execution Environment',
    description: 'The operating system container, sandbox, or virtual machine where tools run.',
    prose: 'The sandboxed operating environment hosting file systems and processes.',
    body: `Provides a bash shell, Node.js runtime, compilers, and network interfaces with strict security boundaries.`,
    aliases: ['Sandbox', 'Container', 'Workspace'],
    links: ['harness', 'sandboxing', 'bash-tool', 'file-system'],
    usage: ['The environment runs in an isolated Linux container with port 3000 exposed.'],
    avoid: 'Exposing root host credentials or production databases to unconstrained agents.',
    heardInTheWild: {
      user: 'Where does npm install execute?',
      agent: 'Inside the sandboxed Cloud Run container environment.',
    },
    section: 2,
    inDegree: 37,
    layout: [-75, -40, 50],
  },
  {
    slug: 'bash-tool',
    title: 'Bash Execution Tool',
    description: 'Tool enabling the agent to execute shell commands directly in the environment.',
    prose: 'A capability allowing command execution in the target operating system.',
    body: `Enables compiling projects, running tests, inspecting git logs, and installing packages. Usually paired with timeout limits and background task managers.`,
    aliases: ['Terminal Tool', 'Shell Tool', 'run_command'],
    links: ['tool', 'environment', 'sandboxing'],
    usage: ['The agent proposed a bash command to run the test suite.'],
    avoid: 'Running interactive commands (like top or vim) that hang without stdin.',
    heardInTheWild: {
      user: 'Can it run git commit?',
      agent: 'Yes, via the bash execution tool.',
    },
    section: 2,
    inDegree: 29,
    layout: [-100, -20, 65],
  },
  {
    slug: 'file-system',
    title: 'Virtual File System',
    description: 'The workspace directory tree accessed and modified by agent file tools.',
    prose: 'The file tree containing source code, configurations, and assets.',
    body: `Directly inspected via list_dir, view_file, and edited via surgical replacement chunks without overwriting full files blindly.`,
    aliases: ['Workspace Root', 'Disk Storage'],
    links: ['read-modify-write', 'diff-tool', 'environment'],
    usage: ['The file system was indexed to verify file paths before editing.'],
    avoid: 'Assuming files exist without checking the directory tree first.',
    heardInTheWild: {
      user: 'Did it overwrite my file?',
      agent: 'No, it performed a surgical edit on the exact matching lines.',
    },
    section: 2,
    inDegree: 33,
    layout: [-60, -60, 45],
  },
  {
    slug: 'diff-tool',
    title: 'Surgical Diff / Edit Tool',
    description: 'Tool that applies precise string replacement chunks instead of rewriting entire files.',
    prose: 'A tool for making targeted line-level modifications.',
    body: `Prevents accidental deletions of large existing files by matching exact unique TargetContent strings and substituting ReplacementContent.`,
    aliases: ['edit_file', 'multi_edit_file', 'Patch Tool'],
    links: ['file-system', 'read-modify-write', 'anti-typo-rule'],
    usage: ['Use edit_file to surgically update the button label.'],
    avoid: 'Matching truncated or ambiguous single words that occur multiple times in a file.',
    heardInTheWild: {
      user: 'Why did the edit fail?',
      agent: 'Target content was not found; view_file was called to refresh context.',
    },
    section: 2,
    inDegree: 31,
    layout: [-85, -75, 60],
  },
  {
    slug: 'read-modify-write',
    title: 'Read-Modify-Write Protocol',
    description: 'Mandatory pattern: view_file must be called before editing any code to ensure exact match.',
    prose: 'The foundational discipline of reading current state before applying modifications.',
    body: `Eliminates "target content not found" errors and hallucinated file structures by enforcing live disk verification prior to diff generation.`,
    aliases: ['RMW Cycle', 'Verify-Before-Edit'],
    links: ['diff-tool', 'file-system', 'anti-typo-rule'],
    usage: ['The agent followed the read-modify-write protocol to inspect package.json before adding lodash.'],
    avoid: 'Assuming template structure without viewing the actual file first.',
    heardInTheWild: {
      user: 'Why did it view the file before changing one line?',
      agent: 'To guarantee the exact whitespace and line numbers match on disk.',
    },
    section: 2,
    inDegree: 27,
    layout: [-105, -55, 75],
  },
  {
    slug: 'anti-typo-rule',
    title: 'Anti-Typo Path Rule',
    description: 'Strict validation preventing hallucinated whitespace, URL encodings (%20), or blended words in paths.',
    prose: 'Path validation guardrail stopping broken file references.',
    body: `Verifies every path parameter against the live file tree before issuing create_file or edit_file calls.`,
    aliases: ['Path Sanitization', 'Path Verifier'],
    links: ['file-system', 'read-modify-write', 'diff-tool'],
    usage: ['The anti-typo rule prevented creating a directory named "%20src".'],
    avoid: 'Concatenating conversational strings into file path parameters.',
    heardInTheWild: {
      user: 'How do you prevent creating weird directories?',
      agent: 'By enforcing the anti-typo rule against the workspace file tree.',
    },
    section: 2,
    inDegree: 17,
    layout: [-115, -80, 80],
  },
  {
    slug: 'sandboxing',
    title: 'Environment Sandboxing',
    description: 'Isolation layer (gVisor, Docker, Firecracker) restricting agent access to host systems.',
    prose: 'Security boundaries preventing untrusted code from escaping.',
    body: `Prevents dangerous syscalls, isolates network routing, and limits CPU/RAM consumption during code execution.`,
    aliases: ['Container Isolation', 'Process Jail'],
    links: ['environment', 'bash-tool', 'harness'],
    usage: ['The agent code executed inside an isolated gVisor microVM sandbox.'],
    avoid: 'Running unreviewed agent shell commands directly on a bare-metal developer laptop.',
    heardInTheWild: {
      user: 'Is it safe to run arbitrary agent code?',
      agent: 'Yes, because the sandbox prevents host access and network escapes.',
    },
    section: 2,
    inDegree: 23,
    layout: [-90, -15, 35],
  },
  {
    slug: 'lsp-tool',
    title: 'Language Server Protocol (LSP)',
    description: 'Tool querying TypeScript/Rust compiler diagnostics, jump-to-definition, and symbol references.',
    prose: 'Compiler-level symbol resolution and semantic diagnostics for agents.',
    body: `Feeds exact type errors, autocomplete signatures, and call hierarchies to the agent, dramatically reducing hallucinated API usage.`,
    aliases: ['Language Server', 'Typechecker Tool'],
    links: ['tool', 'compile-check', 'lint-verifier'],
    usage: ['The LSP tool reported 2 type errors in src/App.tsx.'],
    avoid: 'Relying purely on text matching when rich AST diagnostics are available.',
    heardInTheWild: {
      user: 'How does it find all usages of a component?',
      agent: 'By querying the TypeScript Language Server for symbol references.',
    },
    section: 2,
    inDegree: 24,
    layout: [-65, -95, 30],
  },
  {
    slug: 'mcp-server',
    title: 'Model Context Protocol (MCP)',
    description: 'Open standard protocol connecting agents to external data sources, tools, and SaaS APIs.',
    prose: 'Universal protocol for exposing tools and resources to LLMs.',
    body: `Provides a standard JSON-RPC interface for clients (like Claude Desktop or AI Studio) to discover tools, prompts, and resources from MCP servers.`,
    aliases: ['MCP Standard', 'Tool Protocol'],
    links: ['tool', 'harness', 'environment'],
    usage: ['Connected the GitHub MCP server to let the agent triage pull requests.'],
    avoid: 'Writing proprietary tool wrappers when an MCP server already exists.',
    heardInTheWild: {
      user: 'Can I connect Postgres directly to the agent?',
      agent: 'Yes, by adding the official Postgres MCP server to your config.',
    },
    section: 2,
    inDegree: 28,
    layout: [-45, -110, 50],
  },
  {
    slug: 'subagent',
    title: 'Subagent Delegation',
    description: 'Spawning specialized secondary agent instances to solve focused sub-problems in parallel.',
    prose: 'Delegating bounded tasks to child agents with isolated contexts.',
    body: `The parent agent delegates a task (e.g. "write unit tests for auth module") to a fresh subagent, keeping the parent context clean and focused on high-level orchestration.`,
    aliases: ['Child Agent', 'Worker Agent', 'Swarm'],
    links: ['agent', 'harness', 'planning'],
    usage: ['The main agent spawned 3 subagents to refactor independent components.'],
    avoid: 'Unconstrained recursive agent spawning that exhausts API quotas.',
    heardInTheWild: {
      user: 'How does it work on 5 files at once?',
      agent: 'By delegating subtasks to parallel subagents.',
    },
    section: 2,
    inDegree: 22,
    layout: [-30, -70, 70],
  },

  // --- Section 3: Agentic Loop & Autonomy ---
  {
    slug: 'afk',
    title: 'Away From Keyboard (AFK)',
    description: 'Long-running autonomous execution where the agent works independently without human intervention.',
    prose: 'Autonomous multi-turn problem solving while the human is away.',
    body: `The hallmark of high-agency coding agents. Capable of planning, executing tens of tool calls, fixing test failures, and delivering working PRs while the developer is asleep or in meetings.`,
    aliases: ['Full Autonomy', 'Unattended Mode'],
    links: ['turn', 'steering', 'agent', 'autonomous-execution', 'planning'],
    usage: ['I left the agent running AFK and returned to 14 passing tests.'],
    avoid: 'Leaving destructive git commands unconstrained in AFK mode.',
    heardInTheWild: {
      user: 'Can I close my laptop while it works?',
      agent: 'Yes, the backend server continues running the turn in the background.',
    },
    section: 3,
    inDegree: 35,
    layout: [65, -60, 30],
  },
  {
    slug: 'steering',
    title: 'Human Steering & Course Correction',
    description: 'Mid-flight guidance providing feedback or altering direction when an agent begins to drift.',
    prose: 'Guiding an agent back on track during complex iterations.',
    body: `A short prompt ("Focus on fixing the login bug first before refactoring styles") that re-anchors attention and prevents rabbit holes.`,
    aliases: ['Intervention', 'Course Correction'],
    links: ['afk', 'agent', 'human-in-the-loop', 'planning'],
    usage: ['Quick steering prevented the agent from spending an hour optimizing SVG paths.'],
    avoid: 'Waiting 20 turns before intervening when you see a bad architectural assumption.',
    heardInTheWild: {
      user: 'How do I stop it from refactoring everything?',
      agent: 'Send a steering message emphasizing the single file constraint.',
    },
    section: 3,
    inDegree: 31,
    layout: [85, -40, 15],
  },
  {
    slug: 'chain-of-thought',
    title: 'Chain-of-Thought (CoT)',
    description: 'Step-by-step internal reasoning traces emitted before taking external tool actions.',
    prose: 'Explicit step-by-step reasoning that boosts logical rigor.',
    body: `Allows the model to decompose complex problems, explore alternative hypotheses, and check edge cases before outputting tool arguments.`,
    aliases: ['CoT', 'Reasoning Trace', 'Thinking Mode'],
    links: ['reasoning-effort', 'planning', 'backtracking'],
    usage: ['The model used chain-of-thought to trace through the edge cases of the binary search.'],
    avoid: 'Assuming chain-of-thought output contains private secrets — some providers log or redact thinking tokens.',
    heardInTheWild: {
      user: 'Why did it think before editing?',
      agent: 'Chain-of-thought lets the model simulate the code logic before executing.',
    },
    section: 3,
    inDegree: 41,
    layout: [45, -80, 40],
  },
  {
    slug: 'reasoning-effort',
    title: 'Reasoning Effort & Thinking Budget',
    description: 'Configurable parameter (low, medium, high) allocating hidden thinking tokens for deep analysis.',
    prose: 'Controlling how many tokens the model spends on pre-action planning.',
    body: `Higher reasoning effort allows models like Gemini 2.0 Flash Thinking or Claude 3.7 Sonnet Thinking to evaluate dozens of hypothesis branches before generating code.`,
    aliases: ['Thinking Budget', 'Extended Thinking'],
    links: ['chain-of-thought', 'planning', 'model'],
    usage: ['Set reasoning effort to High for debugging race conditions.'],
    avoid: 'Using high reasoning budgets for trivial copyedits or typo fixes.',
    heardInTheWild: {
      user: 'Can I give the model more time to think?',
      agent: 'Yes, increase the reasoning effort parameter.',
    },
    section: 3,
    inDegree: 29,
    layout: [95, -75, 45],
  },
  {
    slug: 'planning',
    title: 'Multi-Step Planning',
    description: 'Creating structured checklists and roadmaps before implementing multi-file changes.',
    prose: 'High-level decomposition of goals into sequential actions.',
    body: `Prevents erratic trial-and-error by establishing a clear definition of done, verifying prerequisites, and executing changes in logical dependency order.`,
    aliases: ['Roadmap', 'Action Plan', 'Plan Mode'],
    links: ['chain-of-thought', 'backtracking', 'afk', 'steering'],
    usage: ['The agent outlined a 3-bullet plan before modifying the database schema.'],
    avoid: 'Writing 50-step rigid plans that collapse on the first unexpected error.',
    heardInTheWild: {
      user: 'How does it tackle large features?',
      agent: 'By generating a phased plan and executing each subtask sequentially.',
    },
    section: 3,
    inDegree: 34,
    layout: [60, -95, 25],
  },
  {
    slug: 'backtracking',
    title: 'Algorithmic Backtracking',
    description: 'Recognizing a failed approach, reverting bad edits, and attempting an alternative strategy.',
    prose: 'The ability to revert mistakes and explore alternative solutions.',
    body: `A key indicator of advanced agents: instead of doubling down on broken code, the agent uses git checkout to revert and tries an entirely different architectural path.`,
    aliases: ['Rollback', 'Strategy Pivot'],
    links: ['planning', 'chain-of-thought', 'compile-check'],
    usage: ['After 2 failed builds, the agent backtracked and switched to a simpler regex parser.'],
    avoid: 'Looping infinitely across 10 identical failed attempts.',
    heardInTheWild: {
      user: 'What happens if a fix fails?',
      agent: 'The agent reverts the broken diff and tries an alternative approach.',
    },
    section: 3,
    inDegree: 27,
    layout: [80, -100, 50],
  },
  {
    slug: 'autonomous-execution',
    title: 'Autonomous Execution',
    description: 'The ability of an agent to chain tools, evaluate outputs, and reach a goal without prompts.',
    prose: 'Self-directed goal completion via iterative tool use.',
    body: `Combines perception, reasoning, and environmental manipulation into an unbroken cycle until acceptance criteria are satisfied.`,
    aliases: ['Self-Driving Code', 'Full Autonomy'],
    links: ['afk', 'agent', 'harness', 'turn'],
    usage: ['The agent resolved the full issue through autonomous execution.'],
    avoid: 'Unsupervised autonomy on production infrastructure.',
    heardInTheWild: {
      user: 'Did you have to guide it?',
      agent: 'No, it ran autonomously until all test cases passed.',
    },
    section: 3,
    inDegree: 33,
    layout: [100, -50, 20],
  },
  {
    slug: 'human-in-the-loop',
    title: 'Human-in-the-Loop (HITL)',
    description: 'Architectural pattern requiring explicit human approval before executing sensitive operations.',
    prose: 'Safety checkpoints requiring user authorization.',
    body: `Used for high-risk operations like database drops, payment setups, OAuth credential granting, or committing to main.`,
    aliases: ['HITL', 'Approval Gate'],
    links: ['steering', 'sandboxing', 'agent'],
    usage: ['Firebase and OAuth setup require Human-in-the-Loop confirmation in the UI.'],
    avoid: 'Bypassing approval gates for irreversible cloud operations.',
    heardInTheWild: {
      user: 'Why did the agent pause?',
      agent: 'It is waiting for you to accept the Firebase setup terms in the UI.',
    },
    section: 3,
    inDegree: 26,
    layout: [40, -110, 60],
  },
  {
    slug: 'grounding',
    title: 'Empirical Grounding',
    description: 'Anchoring agent decisions in real runtime output (compilers, linters, tests) rather than guesses.',
    prose: 'Verifying assumptions with real data from tools.',
    body: `Dramatically cuts hallucinations by ensuring every code modification is validated through actual compiler diagnostics and test suites.`,
    aliases: ['Reality Check', 'Empirical Verification'],
    links: ['compile-check', 'lint-verifier', 'tool-result'],
    usage: ['Grounding the agent in TypeScript compiler output eliminated broken imports.'],
    avoid: 'Assuming code works without executing the test runner.',
    heardInTheWild: {
      user: 'How do you know the bug is fixed?',
      agent: 'The test suite ran and exited with code 0.',
    },
    section: 3,
    inDegree: 30,
    layout: [70, -35, 65],
  },

  // --- Section 4: Prompt Engineering & Context ---
  {
    slug: 'attention-degradation',
    title: 'Attention Degradation',
    description: 'The loss of reasoning quality and instruction recall as context window length expands.',
    prose: 'Quality decay as context windows grow excessively large.',
    body: `Attention matrices dilute information over long horizons. Models are more likely to miss constraints placed in the middle of a 200k token context than in a lean 10k token prompt.`,
    aliases: ['Context Fatigue', 'Attention Dilution'],
    links: ['lost-in-the-middle', 'needle-in-a-haystack', 'context-window', 'compaction'],
    usage: ['Attention degradation caused the model to ignore rule #8 on turn 25.'],
    avoid: 'Dumping 50 unused documentation files into context.',
    heardInTheWild: {
      user: 'Why did it start ignoring the formatting rules?',
      agent: 'The context window reached 150k tokens, triggering attention degradation.',
    },
    section: 4,
    inDegree: 34,
    layout: [-85, 60, -45],
  },
  {
    slug: 'hallucination',
    title: 'Hallucination',
    description: 'Plausible-sounding but factually false outputs, non-existent packages, or fabricated APIs.',
    prose: 'Fabrication of imaginary facts, functions, or package names.',
    body: `Occurs when probabilistic next-token generation favors fluent patterns over factual truth. Mitigated through empirical grounding, tool use, and strict system instructions.`,
    aliases: ['Confabulation', 'Invented Code'],
    links: ['grounding', 'anti-typo-rule', 'attention-degradation'],
    usage: ['The model hallucinated a nonexistent "react-smooth-flow" npm library.'],
    avoid: 'Blindly importing libraries without checking package.json.',
    heardInTheWild: {
      user: 'Why does this function error?',
      agent: 'The method was hallucinated and does not exist in that library version.',
    },
    section: 4,
    inDegree: 36,
    layout: [-105, 75, -25],
  },
  {
    slug: 'lost-in-the-middle',
    title: 'Lost in the Middle Effect',
    description: 'Empirical finding that LLMs recall information at the start and end of prompts far better than the middle.',
    prose: 'U-shaped recall curve across long input contexts.',
    body: `Attention mechanisms naturally focus on the prompt beginning (system instructions) and ending (latest user query). Critical constraints should be placed at these boundary positions.`,
    aliases: ['U-Shaped Recall', 'Middle Amnesia'],
    links: ['attention-degradation', 'needle-in-a-haystack', 'context-window'],
    usage: ['We placed the output schema at the very end of the prompt to avoid the lost-in-the-middle effect.'],
    avoid: 'Burying vital constraints in the middle of a 100-page document dump.',
    heardInTheWild: {
      user: 'Where should I put the most important rule?',
      agent: 'At the bottom of the prompt right before the final instruction.',
    },
    section: 4,
    inDegree: 28,
    layout: [-60, 85, -60],
  },
  {
    slug: 'needle-in-a-haystack',
    title: 'Needle in a Haystack (NIAH)',
    description: 'Benchmark testing whether an LLM can retrieve a single isolated fact hidden within a massive document.',
    prose: 'Standard evaluation for retrieval accuracy across large context sizes.',
    body: `Tests factual retrieval across different context depths (10k to 2M tokens) and document positions (0% to 100%).`,
    aliases: ['NIAH Test', 'Retrieval Benchmark'],
    links: ['context-window', 'lost-in-the-middle', 'attention-degradation'],
    usage: ['The model scored 99.8% on the 1M token Needle-in-a-Haystack benchmark.'],
    avoid: 'Assuming high NIAH scores guarantee complex multi-hop reasoning over the entire context.',
    heardInTheWild: {
      user: 'Can the model find a single function in 100k lines?',
      agent: 'Yes, frontier models pass NIAH tests with near 100% accuracy.',
    },
    section: 4,
    inDegree: 25,
    layout: [-45, 95, -15],
  },
  {
    slug: 'progressive-disclosure',
    title: 'Progressive Disclosure',
    description: 'Providing minimal high-level context first, letting the agent fetch deeper details via tools on demand.',
    prose: 'Loading context lazily on demand rather than upfront in bulk.',
    body: `Instead of dumping all 500 files into context, provide an outline or file tree and allow the agent to view_file only what it needs. Keeps context clean and fast.`,
    aliases: ['Lazy Context', 'On-Demand Retrieval'],
    links: ['context-window', 'prefix-cache', 'attention-degradation'],
    usage: ['Progressive disclosure kept initial turn latency under 1.2 seconds.'],
    avoid: 'Prematurely loading every subsystem when solving a CSS alignment bug.',
    heardInTheWild: {
      user: 'How does it navigate large repos without exceeding limits?',
      agent: 'By using progressive disclosure: reading directory outlines before fetching file contents.',
    },
    section: 4,
    inDegree: 29,
    layout: [-30, 60, -50],
  },
  {
    slug: 'system-prompt-cache',
    title: 'System Prompt Cache Alignment',
    description: 'Designing system prompts with static prefixes to maximize 100% cache hits across all turns.',
    prose: 'Optimizing prompt structure for zero-recomputation cache hits.',
    body: `Placing static rules at the very top and dynamic user queries at the bottom ensures the entire system prompt and tool definitions hit the KV-cache.`,
    aliases: ['Cache-Friendly Prompting', 'Prefix Alignment'],
    links: ['prefix-cache', 'system-prompt', 'cache-tokens'],
    usage: ['System prompt cache alignment dropped our API invoice by 70%.'],
    avoid: 'Injecting timestamps or random IDs inside the system prompt header.',
    heardInTheWild: {
      user: 'How do you keep agent runs cheap?',
      agent: 'By structuring prompts so the system instructions always hit the prefix cache.',
    },
    section: 4,
    inDegree: 22,
    layout: [-70, 100, -35],
  },
  {
    slug: 'few-shot-examples',
    title: 'Few-Shot Exemplars',
    description: 'Providing 2-3 concrete input/output examples within the prompt to enforce exact syntax contracts.',
    prose: 'Teaching by example within the context prompt.',
    body: `Far more effective than abstract prose rules. Showing the model exact JSON payloads or diff formats prevents formatting errors.`,
    aliases: ['In-Context Learning', 'Exemplars'],
    links: ['system-prompt', 'grounding'],
    usage: ['Adding two few-shot examples fixed the multi-line regex escaping issue.'],
    avoid: 'Providing outdated or contradictory few-shot examples.',
    heardInTheWild: {
      user: 'How do I teach it a custom DSL format?',
      agent: 'Include 2-3 input/output few-shot exemplars in the system prompt.',
    },
    section: 4,
    inDegree: 24,
    layout: [-95, 45, -60],
  },
  {
    slug: 'prompt-injection',
    title: 'Prompt Injection Defense',
    description: 'Hardening system prompts against malicious user inputs attempting to hijack agent instructions.',
    prose: 'Security defenses stopping untrusted text from altering agent rules.',
    body: `Separates developer instructions from untrusted user content through structured XML tags (<user_data>) and sandwich defense prompts.`,
    aliases: ['Jailbreak Defense', 'Indirect Injection'],
    links: ['sandboxing', 'system-prompt', 'human-in-the-loop'],
    usage: ['The harness validated incoming issue text to prevent indirect prompt injection.'],
    avoid: 'Interpolating raw untrusted web content directly into system prompt strings.',
    heardInTheWild: {
      user: 'Can a README file tell the agent to delete files?',
      agent: 'Not if the harness isolates third-party text from system instructions.',
    },
    section: 4,
    inDegree: 21,
    layout: [-115, 95, -50],
  },

  // --- Section 5: Evaluation & Benchmarks ---
  {
    slug: 'swe-bench',
    title: 'SWE-bench',
    description: 'The industry-standard benchmark evaluating agents on resolving real-world GitHub issues in Python/JS repos.',
    prose: 'Standard evaluation benchmark for autonomous software engineering.',
    body: `Given a codebase and an issue description, the agent must inspect files, reproduce the bug, write code, and pass hidden unit test suites.`,
    aliases: ['SWE-bench Verified', 'SWE-bench Lite'],
    links: ['benchmark', 'pass-at-1', 'golden-dataset'],
    usage: ['Frontier models currently score above 50% on SWE-bench Verified.'],
    avoid: 'Evaluating coding models solely on trivial LeetCode problems.',
    heardInTheWild: {
      user: 'How are coding agents ranked?',
      agent: 'Mainly by their pass rate on the SWE-bench Verified benchmark.',
    },
    section: 5,
    inDegree: 31,
    layout: [85, 70, 35],
  },
  {
    slug: 'pass-at-1',
    title: 'Pass@1 Accuracy',
    description: 'Percentage of benchmark problems solved correctly on the first single attempt without retries.',
    prose: 'The first-attempt success rate of an AI model.',
    body: `Measures reliable zero-shot and single-run capability, contrasting with Pass@k which allows multiple parallel attempts.`,
    aliases: ['First-Attempt Success Rate', 'Pass@1'],
    links: ['swe-bench', 'benchmark'],
    usage: ['The new model achieved 72% Pass@1 on human eval benchmarks.'],
    avoid: 'Comparing Pass@1 with Pass@10 numbers.',
    heardInTheWild: {
      user: 'What is Pass@1?',
      agent: 'It means the fraction of times the agent gets the right answer on the very first try.',
    },
    section: 5,
    inDegree: 23,
    layout: [105, 55, 50],
  },
  {
    slug: 'compile-check',
    title: 'Compile & Build Verifier',
    description: 'Automated verification tool (e.g. compile_applet, tsc) checking that generated code builds cleanly.',
    prose: 'Compiler feedback tool that catches syntax and type errors.',
    body: `The fastest feedback loop for a coding agent. Running the compiler immediately after file edits surfaces syntax errors before wasting user time.`,
    aliases: ['compile_applet', 'Build Verification'],
    links: ['grounding', 'lint-verifier', 'backtracking'],
    usage: ['The agent ran compile_applet to verify TypeScript compilation.'],
    avoid: 'Completing a turn with unverified compilation failures.',
    heardInTheWild: {
      user: 'How do you know it compiles?',
      agent: 'I invoked compile_applet and received confirmation that the build succeeded.',
    },
    section: 5,
    inDegree: 32,
    layout: [65, 85, 55],
  },
  {
    slug: 'lint-verifier',
    title: 'Linter & Static Analysis',
    description: 'Fast static analysis validation catching unused imports, syntax errors, and missing types.',
    prose: 'Instant feedback tool for code cleanliness and conventions.',
    body: `Runs eslint or tsc --noEmit in sub-second time to catch typos before triggering expensive full production builds.`,
    aliases: ['lint_applet', 'Static Analysis'],
    links: ['compile-check', 'grounding'],
    usage: ['lint_applet passed with zero errors.'],
    avoid: 'Ignoring linter warnings that indicate undefined variables.',
    heardInTheWild: {
      user: 'Why run the linter before building?',
      agent: 'Because it gives instant feedback on syntax and type errors in milliseconds.',
    },
    section: 5,
    inDegree: 28,
    layout: [95, 90, 25],
  },
  {
    slug: 'golden-dataset',
    title: 'Golden Dataset & Regression Suite',
    description: 'Curated collection of verified input/output test cases ensuring agent updates do not regress capabilities.',
    prose: 'A gold standard benchmark dataset for agent validation.',
    body: `Used by engineering teams to benchmark prompt changes and harness updates against a fixed set of realistic coding tasks.`,
    aliases: ['Eval Suite', 'Golden Tests'],
    links: ['benchmark', 'swe-bench', 'canary-test'],
    usage: ['Our golden dataset contains 120 full-stack app creation tasks.'],
    avoid: 'Modifying golden tests to artificially match broken outputs.',
    heardInTheWild: {
      user: 'How do you test prompt updates?',
      agent: 'By running them against our golden dataset and comparing pass rates.',
    },
    section: 5,
    inDegree: 20,
    layout: [115, 75, 45],
  },
  {
    slug: 'benchmark',
    title: 'Evals & Benchmarking',
    description: 'Systematic measurement of model accuracy, tool execution speed, token efficiency, and reasoning depth.',
    prose: 'Quantitative evaluation framework for agent systems.',
    body: `Standardizes measurement across diverse coding tasks to track regressions, latency improvements, and model upgrades.`,
    aliases: ['Evals Framework', 'Benchmark Suite'],
    links: ['swe-bench', 'pass-at-1', 'golden-dataset'],
    usage: ['Run the eval benchmark across both Opus and Sonnet models.'],
    avoid: 'Relying on subjective vibe-checks instead of automated evals.',
    heardInTheWild: {
      user: 'How do you measure agent improvements?',
      agent: 'Through automated evals that track pass rates and token efficiency.',
    },
    section: 5,
    inDegree: 27,
    layout: [75, 50, 60],
  },
  {
    slug: 'canary-test',
    title: 'Canary Test',
    description: 'A hidden probe test embedded in codebases to detect data contamination and benchmark memorization.',
    prose: 'Unique markers detecting whether a model memorized the test set.',
    body: `Ensures high benchmark scores reflect true generalized reasoning rather than pretraining data leakage.`,
    aliases: ['Canary GUID', 'Contamination Probe'],
    links: ['golden-dataset', 'benchmark'],
    usage: ['Included a canary string in the repository to check for dataset leaks.'],
    avoid: 'Publishing unhashed benchmark test cases publicly online.',
    heardInTheWild: {
      user: 'Did the model memorize this problem?',
      agent: 'The canary test checks if the exact GUID was seen during training.',
    },
    section: 5,
    inDegree: 15,
    layout: [120, 95, 60],
  },
  {
    slug: 'test-driven-agent',
    title: 'Test-Driven Agent (TDD Loop)',
    description: 'Agent workflow that writes failing unit tests first, implements code, and iterates until all pass.',
    prose: 'Developing software by writing tests before implementation.',
    body: `Creates a deterministic acceptance contract. The agent writes a test replicating a bug, verifies it fails, edits the source, and stops only when the test is green.`,
    aliases: ['TDD Agent', 'Red-Green-Refactor'],
    links: ['grounding', 'compile-check', 'backtracking'],
    usage: ['The test-driven agent wrote 4 failing tests before touching the service layer.'],
    avoid: 'Letting agents delete failing tests instead of fixing the underlying code.',
    heardInTheWild: {
      user: 'How did it verify the edge case?',
      agent: 'By writing a targeted unit test and confirming it passed.',
    },
    section: 5,
    inDegree: 26,
    layout: [50, 105, 45],
  },

  // --- Section 6: Memory & Knowledge Graphs ---
  {
    slug: 'graph-rag',
    title: 'Graph RAG',
    description: 'Retrieval Augmented Generation traversing structured entity graphs rather than raw text chunks.',
    prose: 'Graph-structured context retrieval for multi-hop reasoning.',
    body: `Extracts entity relationships and community clusters from codebases (ASTs, call graphs) to feed coherent dependency subgraphs into the prompt.`,
    aliases: ['Knowledge Graph RAG', 'Structural Retrieval'],
    links: ['semantic-embeddings', 'ast-graph', 'dependency-graph', 'agent-memory'],
    usage: ['Graph RAG mapped the full inheritance hierarchy before proposing the refactor.'],
    avoid: 'Using naive flat text vector search for deep relational code queries.',
    heardInTheWild: {
      user: 'How does it understand how 10 files connect?',
      agent: 'By traversing the codebase knowledge graph via Graph RAG.',
    },
    section: 6,
    inDegree: 30,
    layout: [-35, -85, -35],
  },
  {
    slug: 'semantic-embeddings',
    title: 'Semantic Embeddings',
    description: 'Dense vector representations mapping code and text into continuous semantic similarity space.',
    prose: 'Vector math encoding semantic meaning for instant similarity search.',
    body: `Generated by embedding models (e.g. text-embedding-3) to power approximate nearest neighbor searches over large documentation libraries.`,
    aliases: ['Vector Embeddings', 'Dense Vectors'],
    links: ['vector-database', 'graph-rag'],
    usage: ['Generated semantic embeddings for all API documentation endpoints.'],
    avoid: 'Assuming cosine similarity can replace exact symbol matching.',
    heardInTheWild: {
      user: 'How does semantic search work?',
      agent: 'It calculates cosine distance between dense vector embeddings.',
    },
    section: 6,
    inDegree: 24,
    layout: [-55, -95, -50],
  },
  {
    slug: 'vector-database',
    title: 'Vector Database',
    description: 'Specialized database index (HNSW, IVF) querying millions of high-dimensional vectors in milliseconds.',
    prose: 'Fast indexing engine for high-dimensional vector search.',
    body: `Stores codebase embeddings and metadata, allowing agents to retrieve relevant snippets for any natural language query.`,
    aliases: ['Vector Store', 'HNSW Index'],
    links: ['semantic-embeddings', 'graph-rag'],
    usage: ['Indexed 500,000 lines of code into a local vector database.'],
    avoid: 'Re-indexing entire repositories on every single keystroke.',
    heardInTheWild: {
      user: 'Where are the embeddings stored?',
      agent: 'In a local vector database index for sub-millisecond retrieval.',
    },
    section: 6,
    inDegree: 22,
    layout: [-20, -110, -30],
  },
  {
    slug: 'ast-graph',
    title: 'Abstract Syntax Tree (AST)',
    description: 'Tree representation of source code structure used for precise symbol navigation and refactoring.',
    prose: 'Hierarchical structural tree of code parsed by compilers.',
    body: `Parsed via tools like tree-sitter. Allows agents to extract function signatures, scope boundaries, and call sites with 100% syntactic precision.`,
    aliases: ['AST', 'Syntax Tree', 'Tree-sitter'],
    links: ['dependency-graph', 'graph-rag', 'lsp-tool'],
    usage: ['The agent used tree-sitter to parse the AST and find all export statements.'],
    avoid: 'Using naive regex searches for complex nested TypeScript types.',
    heardInTheWild: {
      user: 'How does it parse code without running it?',
      agent: 'By building an Abstract Syntax Tree (AST) using tree-sitter.',
    },
    section: 6,
    inDegree: 28,
    layout: [-60, -75, -25],
  },
  {
    slug: 'dependency-graph',
    title: 'Dependency Graph',
    description: 'Directed graph capturing import/export relationships and call hierarchies across all modules.',
    prose: 'The network of module imports and functional dependencies.',
    body: `Maps which files import a component, preventing breaking changes by revealing all downstream consumers before applying an edit.`,
    aliases: ['Import Graph', 'Call Graph'],
    links: ['ast-graph', 'graph-rag', 'read-modify-write'],
    usage: ['Checked the dependency graph to ensure no other file relied on the deprecated helper.'],
    avoid: 'Deleting an export without checking the dependency graph first.',
    heardInTheWild: {
      user: 'Will changing this file break anything else?',
      agent: 'The dependency graph confirms only two files import this component.',
    },
    section: 6,
    inDegree: 27,
    layout: [-45, -60, -45],
  },
  {
    slug: 'triplestore',
    title: 'Knowledge Triplestore',
    description: 'Graph database storing facts as (Subject, Predicate, Object) triples queryable via formal logic.',
    prose: 'Structured relational fact store for ontological reasoning.',
    body: `Represents code relations (e.g. Button Component, Renders, Icon) allowing deterministic graph traversal and SPARQL queries.`,
    aliases: ['RDF Store', 'Knowledge Graph'],
    links: ['graph-rag', 'semantic-embeddings'],
    usage: ['The triplestore links all UI components to their design tokens.'],
    avoid: 'Over-engineering simple key-value pairs into complex RDF ontologies.',
    heardInTheWild: {
      user: 'How are concepts linked?',
      agent: 'Through Subject-Predicate-Object relations in the knowledge graph.',
    },
    section: 6,
    inDegree: 18,
    layout: [-70, -110, -60],
  },
  {
    slug: 'agent-memory',
    title: 'Long-Term Agent Memory',
    description: 'Persistent key-value and graph storage retaining user preferences, project conventions, and past learnings.',
    prose: 'Cross-session memory storing user rules and project architecture.',
    body: `Stored in files like AGENTS.md, GEMINI.md, or vector memories. Automatically loaded by the harness into the system prompt across future sessions.`,
    aliases: ['AGENTS.md', 'Persistent Memory', 'Scratchpad'],
    links: ['stateful', 'session', 'system-prompt', 'graph-rag'],
    usage: ['Added the rule "Always use Tailwind 4" to the agent memory in AGENTS.md.'],
    avoid: 'Filling memory files with temporary scratchpad notes that become stale.',
    heardInTheWild: {
      user: 'How does it remember project rules across days?',
      agent: 'Through AGENTS.md, which is injected into the agent memory on every run.',
    },
    section: 6,
    inDegree: 29,
    layout: [-10, -80, -55],
  },
];

/**
 * Builds the complete edges list from node outgoing links
 */
export function buildDictionaryEdges(nodes: DictionaryNode[]): DictionaryEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.slug, n]));
  const edges: DictionaryEdge[] = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    for (const tgtSlug of node.links) {
      if (nodeMap.has(tgtSlug) && tgtSlug !== node.slug) {
        const key = `${node.slug}->${tgtSlug}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            source: node.slug,
            target: tgtSlug,
          });
        }
      }
    }
  }

  return edges;
}

import { GENERATED_GRAPH } from './generatedGraph';

export function getFullDictionaryDataset() {
  if (GENERATED_GRAPH && GENERATED_GRAPH.nodes && GENERATED_GRAPH.nodes.length > 0) {
    const SPHERE_MAX_RADIUS = 135;
    const rawNodes = GENERATED_GRAPH.nodes as unknown as DictionaryNode[];
    const nodes = rawNodes.map((node) => {
      let [x, y, z] = node.layout || [0, 0, 0];
      const dist = Math.hypot(x, y, z);
      if (dist > SPHERE_MAX_RADIUS) {
        const factor = SPHERE_MAX_RADIUS / dist;
        x *= factor;
        y *= factor;
        z *= factor;
      }
      return {
        ...node,
        layout: [x, y, z] as [number, number, number],
      };
    });

    const rawSections = GENERATED_GRAPH.sections as unknown as DictionarySection[];
    const sections = rawSections.map((s) => ({
      ...s,
      slugs: s.slugs ? [...s.slugs] : [],
    }));

    // Ensure all nodes belong to their respective section slugs
    for (const node of nodes) {
      const sec = sections[node.section % sections.length];
      if (sec && !sec.slugs.includes(node.slug)) {
        sec.slugs.push(node.slug);
      }
    }

    const edges = GENERATED_GRAPH.edges as unknown as DictionaryEdge[];
    return { nodes, edges, sections };
  }

  const SPHERE_MAX_RADIUS = 135;

  const nodes = DICTIONARY_NODES.map((node) => {
    let [x, y, z] = node.layout;
    const dist = Math.hypot(x, y, z);
    if (dist > SPHERE_MAX_RADIUS) {
      const factor = SPHERE_MAX_RADIUS / dist;
      x *= factor;
      y *= factor;
      z *= factor;
    }
    return {
      ...node,
      layout: [x, y, z] as [number, number, number],
    };
  });

  const sections = DICTIONARY_SECTIONS.map((s) => ({
    ...s,
    slugs: [] as string[],
  }));

  for (const node of nodes) {
    const sec = sections[node.section % sections.length];
    if (sec) sec.slugs.push(node.slug);
  }

  const edges = buildDictionaryEdges(nodes);
  return { nodes, edges, sections };
}
