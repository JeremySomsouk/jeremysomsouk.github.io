+++
title = "Specs, agents, and how features get built now"
description = "How an open spec format, a custom schema and a few AI agents changed feature work into writing, reviewing, and shipping."
slug = "specs-agents-and-how-features-get-built"
date = 2026-10-01
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
repository carries an `openspec/` folder. `specs/` is the living truth of the
system, one document per capability. `changes/` holds one folder per proposed
change. The CLI validates the format, so a lazy proposal fails the same way a
failing test does. When a change ships, its spec delta merges into the truth
and the change folder archives.

## Following the book was too narrow

Honest confession: by the book, OpenSpec was a poor fit for us at first. The
default flow assumed a shape of feature work we do not have, and it had too
many steps for the size of our average change. We nearly dropped it. Two
adaptations saved it.

The first is a small prompt schema I feed the whole process with, called
QRSPI. It is nothing exotic: context, goal, initial hypothesis, open
questions. But writing those four blocks is where the actual scoping happens,
the hallway conversations and the half-formed ideas, compressed into one
artifact an agent can start from. A week of discussions becomes a page
somebody can challenge.

The second is that OpenSpec turns out to be a format, not a law. We wrote our
own schema on top of it, with a strict ownership rule per artifact: the
proposal owns the WHY, a product specification owns the WHAT as user stories,
service-level specs own the behavior as scenarios, design owns the HOW, and
tasks plus the ticket breakdown are generated from those. What survived is
not the book's process. It is ours, expressed in their format.

## The sync problem

Then reality arrived. A change this size does not run in a straight line:
there are amendments, scope corrections, discoveries halfway through, and
specs that quietly go stale while the code moves. The first months needed a
lot of manual syncing and re-reading, which is exactly the kind of work
agents are good at and humans are bad at.

So the maintenance became skills. One syncs the shared schema and spec
references across repositories, so the rules live in one place and every
repo gets the same truth. One challenges what has been done: read the
implementation, scrap what the specs do not justify, question the rest. And
one evaluates the final output against the current state of the specs before
merge, a cold audit that scores what was built against what was agreed. The
drift did not disappear, but chasing it stopped being my evenings.

## The social contract

None of it works without the boring part: all of it lives in a single
repository the whole team shares. Spec changes are committed and pushed to
main directly, and everyone on the team is expected to do it. No
specification hidden in a chat thread, no truth living in slides. The truth
has one address, it is versioned like code, and touching it is part of
shipping.

## Why this pairs so well with agents

The spec is the context that never scrolls away. The task list gives the
agent a natural stop line, the schema gives it a definition of done, and I
get review at the only level that matters: the gap between what was agreed
and what was built. My job moved up one level of abstraction. I write more
prose than code now, and the scarce skill is writing a proposal another
engineer, or another agent, can act on without asking me questions.

## The honest limits

Not every small fix deserves a proposal; on this personal website the brief
lives in a note and one branch per article is process enough. Custom schemas
need maintenance too, and a schema that fits is worth more than a schema
that is standard. And agents will happily do the wrong thing well, which is
exactly why the challenging and the audit stay in the loop, and why the
final no stays human. Write what should be true, let agents make it true,
keep the right to say no.