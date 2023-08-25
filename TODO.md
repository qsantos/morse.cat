# jscwlib

- fix quadratic complexity

# Copy Trainer

- enable keyboard navigation
- have both correct and wrong sound be played by sound API to avoid delays in loading files
- make script loading async
- reinforcement
    - nice ding when copying X characters in a row without any error
    - the buzzer sound is negative reinforcement; this causes the brain to become risk averse; so, it opts for strategies that are perceived as less risky; this means that the brain will favor typing “less risky” keys over “more correct” keys, resulting in more mistakes
    - have the user type the correct key
- current session might not be saved in history, but stats are still counted
- style
    - '+ X points' pop-up messages
    - buttons to close modal windows
    - favicon
- cache busting
- take WPM into account in score

- most frequent mistakes
- smartphone friendly keyboard
- text sources:
    - random
    - dictionary
    - corpus
    - option to disable diacritics
- account
    - persist settings
    - persist history

## Adaptative Training

- focus on hard characters
- adapt speed automatically
- add alphabet progressively (learner)
- copy N at a time (“N blind”):
    - block input
    - play N characters
    - unblock input
    - user types N characters
    - check
- variance in speed
- simulate QRN, QRM

## Explanatory text

- no point in bike-shedding about the exact practise method, or what character to learn, just practise
- https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=learning+morse+code&btnG=
- feedback
    - correct copy
    - mistake
    - what the right character was
    - encourage more practise
    - conscious and unconscious
- tribute to jscwlib & LCWO
- credits
    - barbell icon https://www.svgrepo.com/vectors/barbell/
    - stats icon https://www.svgrepo.com/vectors/stats/
    - settings icon https://www.svgrepo.com/vectors/settings/
- too much advice is given based on observed results
    - e.g. you should focus
    - e.g. you should not count the dits and dahs
    - the purpose of training *is* to get to a level that (probably) exhibit this
    - but it is not useful to try and force oneself to focus on it
- the goal is to type a character while listening to the next one
- the goal is to not consciously count the dits and dahs, but it's fine to get started
- deliberate practise
    - the following is only part of the story
    - just going through the motions is not enough
    - you need to pay attention to what you are doing
    - your conscious mind evaluate the results of your actions
    - this feedbacks sips into the unconscious to guide the improvement of automatic actions
- the challenge is in keeping focused on the task at hand
    - thinking about the mistake we just did loses focus
    - thinking about the character we should be typing right now (when we hesitate) loses focus, we should just skip the character
    - thinking about what we should do once the section has ended loses focus
    - trying to remember a previous mistake to fix it later loses focus
    - trying to remember a previous mistake to understand it later loses focus
    - thinking about focus loses focus
    - thinking about the task at hand loses focus
    - focusing itself only keep focus
    - losing focus is not a binary thing but a spectrum
    - when losing focus, the unconscious mind and automatic actions take over
- Jeremiah Denton https://www.youtube.com/watch?v=rufnWLVQcKg
- Better Days https://soundcloud.com/michael-zelenko/better-days-by-natalia-gutierrez-y-angelo
- our perception lags slightly, so our reflexes can be influenced by something that we perceived as having happened right after we acted
    - for instance, at sufficient speed, the character we hear right after a mistake might actually be the cause of the mistake
- the ding is useful to reinforce that we did type a character, that we did type the correct character, and that we would be getting immediate feedback of mistakes (not in LCWO)
- during unfocused practice, the error rate is similar to that during focused practice
    - however, feedback requires focused practice
- when increasing wpm, the error rates does not shoot up immediately
    - in the first few sessions, it feels like the brain is more alert to compensate for the increased difficulty
    - afterwards, the brain considers that a new normal
    - the increase in error rate might correspond to the switch to “learning mode” from “survival mode”

# Keying Trainer

- TODO

# Tutorial

- stop your brain from trying to predict the next characters
- starting a session should never risk diminishing a metric
- prolonging a session by not making a mistake should never diminish a metric
