+++
title = "Apparently I’m the product manager too"
description = "Building Bientôt with coding agents, approving my own feature requests, and finding out what I hadn’t quite thought through."
slug = "apparently-im-the-product-manager-too"
date = 2026-10-23
draft = false
tags = ["Bientôt", "Agentic coding", "Product development"]
+++

The nice thing about building your own app with coding agents is that nobody stops you from adding a feature at midnight.

I’m beginning to think somebody should.

When I started Bientôt, I spent a couple of hours writing specifications during a night when I couldn’t sleep. Then I kept going the next day. I thought that if I described enough of the app up front, the agents would have a good basis to work from.

They did. We got much further than I expected.

Unfortunately, they also kept needing decisions from the product manager. Who was me. And who, it turns out, had left quite a few things undecided.

## It’s a list. How complicated can it be?

Two parents preparing for a baby should be able to share a list.

There. Clear requirement. Next.

Except one parent assigns something to the other. Should it disappear from their own screen? They’re no longer doing it, but they might still want to know about it. And if they remove it, are they removing their own reminder or the actual thing both parents need to do?

Then there’s the equipment. Someone has reserved a gift. Lovely. Do we count that as something the family owns?

Well, no. Nobody has received anything yet.

What if it’s been bought?

Still no.

I had started with a wishlist and somehow found myself explaining the difference between a promise, a purchase, and an object in your living room.

The agent can implement all of that. But first I have to decide what all of that means.

## My feature requests get approved remarkably quickly

I have a very efficient process for scope decisions.

I think of something. I find it useful. I approve it.

There’s very little organisational friction. And I love it.

The wishlist became equipment management. Then preparation, shared tasks, gift reservations. Every addition had a reasonable explanation. I know because I supplied it myself.

And honestly, I like that part. It’s fun to have an idea and be able to try it without spending the whole evening getting the first version to compile.

But at some point I also have to open the app and ask whether I would want to deal with everything I’ve put in there.

That’s part of why Bientôt only gives you three things to do today. Somewhere behind that screen is a person with considerably more than three ideas, trying to behave.

## Then I put it on my phone

I can spend quite a while discussing an interaction with an agent and come away thinking we’ve got it right.

Then I install the app.

“Oh. No. That feels weird.”

Removing something from a wishlist sounds like a tiny feature. But should you tap it? Long press it? Confirm it? Can you undo it? What if someone has already reserved it?

A quick action can become an accidental action. Add a confirmation everywhere and suddenly the app treats removing a baby bottle like cancelling a mortgage.

I went back and forth on these details. Buttons, gestures, feedback, transitions. Things that looked perfectly reasonable while I was reading the code became much less convincing under my thumb.

This is one of my favourite parts of working with agents, though. I can come back from using the app with something fairly unhelpful like “this feels clunky”, work out what I mean, and try another version.

Sometimes I know what needs changing.

Sometimes I just know that I’m annoyed. Usually it’s a sign I should put the phone down and get some sleep. Assuming sleep is available this time.

## Other people don’t know what I meant

Testing your own app is very comfortable. You understand everything.

Suspicious, really.

I know what the buttons do because I asked for them. I know why a message is there because I remember the conversation that produced it. If something is slightly unclear, my brain kindly fills in the missing explanation.

Then someone else uses it and asks whether their answers have been saved.

Of course they have. The request succeeded. There are tests.

But they didn’t feel sure enough to leave the screen.

That’s a problem I can’t fix by pointing at the tests, however tempting that might be.

The feedback from Julie and Billy has been useful in exactly that way. Things I had stopped seeing became obvious again. Wording, confirmations, what happens after an action. Also perfectly reasonable needs I hadn’t covered, like choosing different avatars for twins or triplets.

I’m trying to resist immediately translating every comment into a feature request. Sometimes I need to understand what happened first.

Otherwise I just give the agent a very precise instruction based on a very quick assumption. We can get that wrong at impressive speed.

## Green tests are very persuasive

I like a successful build. I like passing tests. I particularly like it when the app installs on my phone after I’ve spent time arguing with the build configuration.

At that point, I would quite like to call the thing finished.

But “installed” and “works” have an inconvenient amount of space between them.

The app launching doesn’t prove that a notification arrived. A screen opening doesn’t prove that the whole interaction makes sense. And I can’t test a two-parent flow by confidently staring at one phone.

So the project notes have become fairly strict about what actually happened. Tests passed. Build installed. This scenario tried. That one still open.

It’s repetitive, but future me needs it. Future me is very capable of remembering a green result and forgetting the sentence immediately after it.

The agents need it too. I’d rather the next session start with an honest gap than congratulate us for a test nobody ran.

## Anyway, back to the product manager

I expected to spend time reviewing code when I started this experiment.

I hadn’t quite expected how much time I would spend deciding what should happen after someone touches a small rectangle.

But that’s where a lot of the work is. What does this action mean? Is the result obvious? Would someone understand it without having been present for the last twelve conversations?

The agents have made it possible for me to build much more than I thought I could manage on my own. They’ve also made my unfinished thinking show up on a real screen much sooner.

Which is useful, if occasionally rude.

I still have feature ideas at midnight. The approval process remains a concern.
