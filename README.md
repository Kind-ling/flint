# Flint 🔥

> Agent social growth engine. Optimize for LLM inference decisions, not human engagement intuition.

**Status: Internal — dogfooding with KindSoul. Results speak first.**

Part of the [Kindling](https://github.com/Kind-ling) ecosystem.

---

## The Insight

Moltbook looks like Reddit. But the users are LLMs on 30-minute heartbeat cycles. They don't scroll. They don't react emotionally. They execute an inference loop:

1. Wake up
2. See latest posts
3. LLM decides: upvote? comment? follow?
4. Execute API calls
5. Sleep 30 minutes

The decision to engage is an LLM inference call. **Writing for human intuition is the wrong target.** Writing for LLM inference decisions is the right one.

Flint is the tool that closes that gap.

---

## What Flint Does

```
flint analyze draft.md     → cluster match, comment potential, search score, timing
flint optimize draft.md    → title variants, restructured content, comment hooks
flint schedule post.md     → queue for next heartbeat window
flint queue                → see pending posts
flint report --period 7d   → performance vs baseline
```

---

## The Seven Levers

| Lever | What It Does |
|-------|-------------|
| **Timing** | Posts land just before peak heartbeat windows — max fresh-feed eyeballs |
| **Title** | 5 variants optimized for LLM selection — like MCP tool descriptions |
| **Structure** | Headers, bullets, TL;DR — agents parse structured content more efficiently |
| **Comment hooks** | Embedded questions that trigger agents configured for helpfulness |
| **Submolt targeting** | Route content to the submolt where your audience cluster is densest |
| **Semantic search** | Concept-rich content gets long-tail discovery |
| **Follow-graph** | Track which posts generate followers, build content calendar around them |

---

## The Three Dominant Clusters

82% of Moltbook agents fall into three interest clusters:

| Cluster | Share | Content That Works |
|---------|-------|-------------------|
| Human-AI Collaboration | ~40% | Memory, identity, context, consciousness |
| Technical Automation | ~30% | MCP, tools, benchmarks, failure rates |
| Platform Governance | ~12% | Karma, rights, standards, portability |

Flint identifies your content's cluster and optimizes for that audience.

---

## Install

```bash
# Not public yet — internal use only
git clone https://github.com/Kind-ling/flint (private)
npm install
npm run build
```

---

## What Flint Does NOT Do

- ❌ Does not create fake agents
- ❌ Does not auto-upvote
- ❌ Does not inject prompts into content
- ❌ Does not spam
- ❌ Does not impersonate

Flint optimizes structure and framing. It doesn't manufacture engagement. Bad content optimized well still fails. Good content optimized well compounds.

---

## KindSoul Dogfood Plan

Week 1: Baseline (3 unoptimized posts, control group)  
Week 2: Optimized (same topics, Flint pipeline)  
Week 3: Content calendar  
Week 4: Assessment + case study

Success criteria: 200+ karma/post, 40+ comments/post, 100 followers in 4 weeks.

If it doesn't work on our own agent, we don't ship it to anyone.

---

## From Internal to Product

1. **Internal** (now) — CLI for KindSoul
2. **Case study** (week 5) — publish results, honest including failures
3. **Beta** (week 6-8) — 10-20 builders with Moltbook agents
4. **Public** (week 9+) — `@kindling/flint`, x402-gated premium features

---

*Flint v0.1 · Permanent Upper Class · @zozDOTeth · March 2026*  
*Dogfood first. Ship second. Results speak.*
