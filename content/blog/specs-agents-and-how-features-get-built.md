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
replaced the typing. Features used to start as a ticket with three lines and
a deadline. Now they start as a specification, and my day is spent on the two
ends: writing what should be true, and checking that it became true.

## The format

The tool is [OpenSpec](https://github.com/Fission-AI/openspec), an open source
CLI it describes as an "AI-native system for spec-driven development". Each
repository carries an `openspec/` folder. `specs/` is the living truth, one
document per capability. `changes/` holds one folder per proposed change. The
CLI validates the format, so a lazy proposal fails the same way a failing
test does. When a change ships, its delta merges into the truth and the folder
archives. None of that is exotic. The interesting part is everything we had
to change to actually use it.

## The book did not fit

We tried OpenSpec by the book first, and honestly it nearly died there. The
default flow assumed a shape of feature work we do not have, with more steps
than our changes deserved. Two things saved it.

The first was QRSPI, a small prompt schema I now feed everything through:
context, goal, initial hypothesis, open questions. Nothing clever, but those
four blocks are where the actual scoping happens. The hallway conversations,
the half-formed ideas, the question you are embarrassed to ask, all land in
one page an agent can start from and a peer can attack.

The second was realizing OpenSpec is a format, not a law. We wrote our own
schema on top of it with a strict ownership rule per artifact: the proposal
owns the WHY, a product specification owns the WHAT as user stories,
service-level specs own the behavior as scenarios, design owns the HOW, and
the tasks and tickets generate from all of that. What we run today is not the
book's process. It is ours, in their format.

## What a feature looks like now

The last feature I scoped went like this. I wrote the QRSPI page, it became a
proposal after some arguing, I validated the tech scoping with the team, and
then the agents worked the task list from there. Then
the amendments arrived, because they always do: scope corrections, things we
learned halfway through. That used to mean evenings of manual syncing and
re-reading. Now the maintenance is skills: one keeps the shared schema and
spec references in sync across repositories, one challenges what has been
done and scraps whatever the current specs no longer justify, and one audits
the final output against the specs before merge and scores the gap. The
challenger deleted a chunk of work mid-flight this time. Annoying, and
correct.

By the end I had typed the prompt, some review comments, and the merge
button. That is the whole feature, from my side of the keyboard.

## One repository

The boring part holds it all together: everything lives in a single repository
the team shares. The lead owns the specs, writes the updates, and pushes them
straight to main. The rest of us challenge, and we are expected to, but we do
it by opening PRs the lead orchestrates, not by editing around each other. No
specification stranded in a chat thread, no truth living in slides. When a
spec is wrong it gets fixed on main, and the next person starts from something
real. My personal website runs the same shape in miniature, with me as the
lead of a team of one: ideas in a vault, one branch per article, a verifier
that rebuilds expectations from scratch, and me saying no to shortcuts.

## The catch

Not everything deserves a proposal. A small fix gets a small PR, and the
schema itself needs maintenance, which is a real cost: a schema that fits is
worth more than a schema that is standard, but somebody has to keep it
fitting. And agents will happily do the wrong thing well, which is why the
challenger and the audit exist, and why the final no stays with a human. The
agents took the typing. The judgment is still the job.