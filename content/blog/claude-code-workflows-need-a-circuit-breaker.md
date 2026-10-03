+++
title = "Claude Code workflows need a circuit breaker"
description = "What Claude Code buys, what its loops cost, and why a useful workflow needs stopping rules and the right model for each task."
slug = "claude-code-workflows-need-a-circuit-breaker"
date = 2026-10-02
draft = false
tags = ["Claude Code", "Agentic coding", "Software development"]
+++
In [the previous article](/blog/specs-agents-and-how-features-get-built/), I
wrote about agents taking over the typing while humans keep the judgment.
With Claude Code, that delegation goes further than asking one agent to
implement a feature. My workflow also creates review workers specialized in
security, code correctness, and architecture. They discuss their findings
with each other, and the workflow implements the fixes.

That is where the benefits get interesting. It is also where the loop can
become expensive: one reviewer asks for a change, another challenges that
change, a worker fixes it, and the reviewers start again. The workflow needs
a way to distinguish useful disagreement from a cycle that no longer moves
the feature forward.

## The workflow I actually run

The initial implementation goes to Opus 5.5. At that stage, the job still
contains decisions: how the pieces fit together, which existing patterns to
follow, and how to turn the specification into working code.

Then the review workers take over, also on Opus, with different questions.
The security worker looks for vulnerabilities and unsafe assumptions. The
correctness worker looks for behavior that is wrong, including edge cases.
The architecture worker looks at boundaries, dependencies, and whether the
change fits the system it is entering.

They discuss each other's findings. That matters because a fix can satisfy
one concern and create another. A security check can change behavior. A
correctness fix can put responsibility in the wrong layer. Three isolated
reports would leave all that reconciliation to me; the discussion is part
of the work I am delegating.

Once the finding and the intended correction are clear, implementing the
fix goes to Sonnet. Checking the result goes back to Opus. Checking against
the specs goes to Sonnet, and writing and publishing the result in the pull
request goes to Haiku.

That is the model split in my workflow:

| Work | Model |
| --- | --- |
| Initial implementation | Opus 5.5 |
| Security, correctness, and architecture review | Opus 5.5 |
| Implementing agreed fixes | Sonnet |
| Checking and reviewing the fixes | Opus 5.5 |
| Checking against the specs | Sonnet |
| Writing and publishing the result in the PR | Haiku |

Claude Code supports selecting models for subagents; its
[model configuration docs](https://code.claude.com/docs/en/model-config)
describe the available choices. The table is my allocation of those models
to jobs, not a claim that every project should use the same split.

## Why the split helps

Opus 5.5 has shown a strong price-to-performance ratio in my workflow. That
is why I use it for initial implementation as well as review. The cost that
matters to me is getting a correct, reviewed change through the whole cycle,
including retries and corrections.

Anthropic's [Opus 5.5 release](https://www.anthropic.com/claude-opus-5-5)
reports lower per-token prices and fewer tokens per task than Opus 5, with
40% lower costs on its typical workloads at default settings. That is
Anthropic's reported comparison, not a measured saving for my workflow,
but it helps explain why using Opus at these stages can make economic sense.

Initial implementation and implementing a review fix are different jobs.
The first has to establish an approach. The second should have a finding,
a reason, and a bounded correction already attached to it. Sonnet does not
need to reopen the entire design to apply an agreed fix.

Review is where I want to spend on Opus. The difficult part is often seeing
what the implementation missed, or deciding whether a proposed correction
actually resolves the concern. The workers' specializations give that
reasoning a focus.

The spec check has another purpose: did we build what was asked for? Code
can pass a security review and still miss a user story. Architecture can be
clean while the behavior contradicts the specification. Keeping that check
explicit stops "the reviewers liked it" from becoming the definition of done.

By the time Haiku writes the PR result, the decisions should already be
made. It is reporting the change, the checks, and the remaining findings.
It should not have to invent a technical verdict to write a convincing
summary.

## The cost lives in the review rounds

A subscription can make cost feel fixed, but every extra round still uses
allowance. On API billing, the same work appears directly in the bill.
Anthropic's [cost guide](https://code.claude.com/docs/en/costs) explains the
billing differences, context costs, and the extra consumption that comes
with multiple agents.

In this workflow, making the fix cheaper only solves part of the problem.
The Opus workers still have to review it and discuss it. If the cycle keeps
reopening the same finding, the expensive reasoning repeats even when the
actual code edit is small.

The benefit I want is a better change with less manual coordination. The
cost I need to watch is how many review rounds it takes to get there,
alongside model usage and my own review time. A busy discussion is not
evidence that the change is getting better.

## A circuit breaker for the discussion

This is the breaker I want to put around that cycle. It needs to live in
the orchestration, outside the reviewers' willingness to keep going.
"Keep reviewing until everybody agrees" has no useful limit when the
workers can keep producing new objections.

First, findings need stable identities. Each one should carry the affected
behavior or code, the evidence, the proposed correction, and its status.
If a reviewer reopens a resolved finding, it should explain what new evidence
makes the resolution insufficient. Rephrasing an old objection should not
reset the counter.

Second, a fix needs a clear question for the next review: did this change
resolve this finding without introducing a regression? Otherwise a bounded
correction becomes another invitation to redesign the feature.

Third, repeated reversals need to stop the run. If architecture asks for a
change and correctness asks to undo it, the next step should resolve the
tradeoff against the specs. Applying both recommendations in alternating
rounds is a cycle, not a resolution.

My starting rule would be to stop after two review-and-fix rounds on the
same finding without new evidence or a measurable improvement. I would
also put a limit on total rounds, elapsed time, and spend, because a workflow
can drift forever by opening a different finding each time. Those thresholds
need tuning; the requirement is that the workers cannot reset them by
renaming the problem or spawning another worker.

At the limit, preserve the current diff and return the unresolved findings,
the competing recommendations, the fixes already attempted, and the decision
needed from me. Haiku can publish that state in the PR too. An honest report
of a blocked decision is useful output.

The breaker must not turn an unresolved security issue into approval just
because the budget ran out. It stops autonomous work and hands the decision
back. There is a difference between ending a run and accepting a change.

Claude Code gives me a way to delegate implementation, specialized review,
fixes, and reporting. Making that useful means choosing a model for each of
those jobs, and giving the whole cycle an end. The agents can discuss the
tradeoffs. I still own the decision when the discussion stops making progress.
