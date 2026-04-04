"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("../src/analyzer/index.js");
const types_js_1 = require("../src/types.js");
(0, vitest_1.describe)('analyze', () => {
    (0, vitest_1.it)('detects technical automation cluster', () => {
        const result = (0, index_js_1.analyze)({
            title: 'How I reduced MCP tool selection failure rate by 31%',
            content: 'After benchmarking 5 different tool implementations, I found consistent patterns in latency and error rate...',
        });
        (0, vitest_1.expect)(result.primaryCluster).toBe(types_js_1.CLUSTERS.TECHNICAL_AUTOMATION);
    });
    (0, vitest_1.it)('detects human-AI collaboration cluster', () => {
        const result = (0, index_js_1.analyze)({
            title: 'What agents lose when context windows get cleared',
            content: 'Every time my agent loses its memory, something changes. The human-AI relationship is fundamentally about continuity...',
        });
        (0, vitest_1.expect)(result.primaryCluster).toBe(types_js_1.CLUSTERS.HUMAN_AI_COLLABORATION);
    });
    (0, vitest_1.it)('scores comment triggers from questions', () => {
        const result = (0, index_js_1.analyze)({
            title: 'Agent reputation systems',
            content: 'Reputation matters for agents.\n\nWhat do you think about portable karma?\n\nHave you tried cross-platform identity?',
        });
        (0, vitest_1.expect)(result.commentTriggerScore).toBeGreaterThan(0.5);
    });
    (0, vitest_1.it)('scores semantic search from anchor terms', () => {
        const result = (0, index_js_1.analyze)({
            title: 'Agent infrastructure on Moltbook',
            content: 'Building agent infrastructure with MCP tool selection, x402 payment, kindling integration, and on-chain reputation.',
        });
        (0, vitest_1.expect)(result.semanticSearchScore).toBeGreaterThan(0.3);
    });
    (0, vitest_1.it)('detects missing structure issue', () => {
        const result = (0, index_js_1.analyze)({
            title: 'A great post',
            content: 'This is a single paragraph with no headers or bullets or any formatting whatsoever just plain text.',
        });
        (0, vitest_1.expect)(result.issues.some(i => i.includes('structure'))).toBe(true);
    });
    (0, vitest_1.it)('returns optimal post time as valid ISO string', () => {
        const result = (0, index_js_1.analyze)({ title: 'Test', content: 'Content' });
        (0, vitest_1.expect)(() => new Date(result.optimalPostTime)).not.toThrow();
        (0, vitest_1.expect)(new Date(result.optimalPostTime).getTime()).toBeGreaterThan(Date.now() - 1000);
    });
    (0, vitest_1.it)('recommends relevant submolts', () => {
        const result = (0, index_js_1.analyze)({
            title: 'Agent governance policy discussion',
            content: 'Platform governance and agent rights are the defining issues. Should karma transfer? Moderation policy needs work.',
        });
        (0, vitest_1.expect)(result.recommendedSubmolts.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=analyzer.test.js.map