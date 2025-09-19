export const genericExamples = [
	'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.',
	`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
	'人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。'
];

export const openaiExamples = [
	"Hello! I'm ChatGPT, an AI language model created by OpenAI. I can help you with questions, creative writing, analysis, and problem-solving.",
	...genericExamples
];

export const anthropicExamples = [
	"Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help with analysis, writing, math, coding, and many other tasks.",
	...genericExamples
];

export const geminiExamples = [
	"Hello! I'm Gemini, an AI model created by Google. I can help with complex reasoning, coding, creative tasks, and multimodal understanding.",
	...genericExamples
];
