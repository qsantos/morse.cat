- normalized adjusted score (take into account lucky vs unlucky draws)
- per-letter success rate
- stats about how much copy ahead
- morse machine-like, but play ahead to keep closer to real speed
- practice several time on the same text
- types of errors:
    - recognition
    - mapping to character
    - mapping to keyboard
    - hitting key
- do not stop nor notify on error, just make the character more frequent
- when mistake, start next session with correct character of mistake

# Copy Trainer

- modes: displayed/interaction/feedback
    - immediate feedback        → points     / keys              / last character and sound when mistake
    - reverse (detect mistakes) → characters / return            / last character and sound?
    - head-copy                 → nothing    / text field+return / sent text
    - spot the word             → nothing    / return            / last X+Y characters
    - delayed feedback          → nothing    / text field+return / diff
        - detect whether correcting oneself during the session causes one to make more mistakes
- translate explanation text
- make script loading async
- reinforcement
    - nice ding when copying X characters in a row without any error
    - have the user type the correct key after a mistake
- current session might not be saved in history, but stats are still counted
- buttons to close modal windows
- cache busting
- take WPM into account in points
- more useful stats
    - most frequent mistakes
    - progress
- text sources:
    - random
    - dictionary
    - corpus
    - option to disable diacritics
- account
    - persist settings
    - persist history
- adaptative training
    - focus on hard characters
    - adapt speed automatically (target e.g. 5 % error rate)
    - add alphabet progressively (learner)
    - variance in speed
    - simulate QRN, QRM

# Keying Trainer

- https://fr.aliexpress.com/item/1005005606806315.html
- https://morsecode.me/#/help/about
- https://vail.woozle.org/
- https://hamradio.solutions/vband/
