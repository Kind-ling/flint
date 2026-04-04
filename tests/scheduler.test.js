"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("../src/scheduler/index.js");
(0, vitest_1.describe)('alignToHeartbeat', () => {
    (0, vitest_1.it)('aligns to :27 when minutes < 27', () => {
        const d = new Date('2026-03-24T10:10:00Z');
        const aligned = (0, index_js_1.alignToHeartbeat)(d);
        (0, vitest_1.expect)(aligned.getMinutes()).toBe(27);
    });
    (0, vitest_1.it)('aligns to :57 when minutes between 27-57', () => {
        const d = new Date('2026-03-24T10:30:00Z');
        const aligned = (0, index_js_1.alignToHeartbeat)(d);
        (0, vitest_1.expect)(aligned.getMinutes()).toBe(57);
    });
    (0, vitest_1.it)('returns a time after input', () => {
        const now = new Date();
        const aligned = (0, index_js_1.alignToHeartbeat)(now);
        (0, vitest_1.expect)(aligned.getTime()).toBeGreaterThan(now.getTime());
    });
});
(0, vitest_1.describe)('getNextAvailableSlot', () => {
    (0, vitest_1.it)('returns a date', () => {
        const slot = (0, index_js_1.getNextAvailableSlot)();
        (0, vitest_1.expect)(slot).toBeInstanceOf(Date);
    });
    (0, vitest_1.it)('returns a future or present time', () => {
        const slot = (0, index_js_1.getNextAvailableSlot)();
        (0, vitest_1.expect)(slot.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
    });
});
//# sourceMappingURL=scheduler.test.js.map