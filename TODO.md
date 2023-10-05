# jscwlib

- fix quadratic complexity

# Copy Trainer

- show characters as they are played
- translate explanation text
- give 1 “free miss” every 20 correctly copied character
- make script loading async
- reinforcement
    - nice ding when copying X characters in a row without any error
    - have the user type the correct key after a mistake
- current session might not be saved in history, but stats are still counted
- style
    - '+ X points' pop-up messages
    - buttons to close modal windows
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
- adapt speed automatically (target e.g. 5 % error rate)
- add alphabet progressively (learner)
- copy N at a time (“N blind”):
    - block input
    - play N characters
    - unblock input
    - user types N characters
    - check
- variance in speed
- simulate QRN, QRM

# Keying Trainer

- https://fr.aliexpress.com/item/1005005606806315.html
- https://morsecode.me/#/help/about
- https://vail.woozle.org/
- https://hamradio.solutions/vband/

# Tutorial

- stop your brain from trying to predict the next characters
- starting a session should never risk diminishing a metric
- prolonging a session by not making a mistake should never diminish a metric
