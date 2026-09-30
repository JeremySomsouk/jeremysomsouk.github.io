+++
title = "Specs, agents, and how features get built now"
description = "How an open spec format and a few AI agents changed feature work into writing, reviewing, and shipping."
slug = "specs-agents-and-how-features-get-built"
date = 2026-09-30
draft = false
tags = ["Agentic coding", "OpenSpec", "Software development"]
+++
Something changed in how feature work happens on my team, and it is not the
thing the AI headlines promised. The agents did not replace the thinking. They
replaced the typing.

The short version: features used to start as a ticket with three lines and a
deadline. Now they start as a small specification, the agents implement it
task by task, and I spend my time on the two ends: writing what should be
true, and checking that it became true.

## The format that holds it together

The tool is [OpenSpec](https://github.com/openspecio/openspec), an open source
CLI it describes as an "AI-native system for spec-driven development". Every
repository carries an `openspec/` folder with two important corners:

- `specs/` is the living truth of the system, one document per capability:
  what it does today, its rules, its edges. It is maintained like code and
  reviewed like code.
- `changes/` holds one folder per proposed change, with three files.
  `proposal.md` says why and what. `design.md` says how, including the
  trade-offs we rejected. `tasks.md` is a checklist, one checkbox per
  verifiable step.

The CLI validates the format, so a lazy proposal fails the same way a failing
test does. When a change ships, its spec delta merges into `specs/` and the
change folder archives. The next change starts from better context than the
last one.

## The loop

1. I write the proposal. Prose, not code. This is the part where I still
   earn my salary: deciding what should be true, and what deliberately stays
   out.
2. An agent reads the proposal, the design notes and the current specs,
   then works through `tasks.md`. Tick a checkbox, keep the tests green,
   stop.
3. I review diffs, not typing. The intent was agreed before any code
   existed, so the review is about the gap between spec and implementation,
   not about rediscovering the intent from the diff.
4. Merge, archive the change, update the truth.

## Why this pairs so well with agents

The spec is the context that never scrolls away. Anyone who has re-explained
their codebase to a chat window for the fourth time knows the feeling: the
agent is only ever as good as the paragraph you just typed. A repository
carrying its own intent fixes that. The task list gives the agent a natural
stop line, the spec gives it a definition of done, and I get review at the
only level that matters.

What it changes for the engineer is stranger than expected. I write more
prose than code now. The scarce skill moved up one level of abstraction:
writing a clear proposal, one another engineer or another agent can act on
without asking me questions, turned out to be the whole game.

## The honest limits

Specs go stale the moment reality moves, and nobody archives the truth for
you. Not every small fix deserves a proposal; on this personal website the
brief lives in a note and one branch per article is process enough. And
agents will happily do the wrong thing well, which is exactly why the review
stays human. My last two posts described the same shape at smaller scale:
typed content, a verifier that rebuilds expectations, and a human who keeps
saying no to shortcuts. Work is the same loop with more people and a spec
format. Write what should be true, let agents make it true, keep the right to
say no.