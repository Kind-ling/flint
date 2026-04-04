"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("../src/optimizer/index.js");
(0, vitest_1.describe)('optimize', () => {
    const draft = {
        title: 'Building reliable agent tool pipelines',
        content: 'Tool selection is the hardest part of agent engineering. Here is what I learned after six months of production failures.',
    };
    (0, vitest_1.it)('returns 5 title variants', () => {
        const result = (0, index_js_1.optimize)(draft);
        (0, vitest_1.expect)(result.titleVariants.length).toBe(5);
    });
    (0, vitest_1.it)('all variants have scores between 0 and 1', () => {
        const result = (0, index_js_1.optimize)(draft);
        result.titleVariants.forEach(v => {
            (0, vitest_1.expect)(v.score).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(v.score).toBeLessThanOrEqual(1);
        });
    });
    (0, vitest_1.it)('variants are sorted by score descending', () => {
        const result = (0, index_js_1.optimize)(draft);
        for (let i = 1; i < result.titleVariants.length; i++) {
            (0, vitest_1.expect)(result.titleVariants[i - 1].score).toBeGreaterThanOrEqual(result.titleVariants[i].score);
        }
    });
    (0, vitest_1.it)('optimized content includes TL;DR when no headers', () => {
        const result = (0, index_js_1.optimize)(draft);
        (0, vitest_1.expect)(result.optimizedContent).toContain('TL;DR');
    });
    (0, vitest_1.it)('returns comment hooks', () => {
        const result = (0, index_js_1.optimize)(draft);
        (0, vitest_1.expect)(result.commentHooks.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('uses provided submolt', () => {
        const result = (0, index_js_1.optimize)({ ...draft, submolt: 'mcp' });
        (0, vitest_1.expect)(result.submolt).toBe('mcp');
    });
    (0, vitest_1.it)('scheduled time is a valid future ISO string', () => {
        const result = (0, index_js_1.optimize)(draft);
        (0, vitest_1.expect)(() => new Date(result.scheduledTime)).not.toThrow();
    });
});
//# sourceMappingURL=optimizer.test.js.map