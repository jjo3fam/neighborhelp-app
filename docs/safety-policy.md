# Safety-first exact location policy

NeighborHelp stores approximate location data in public task listings. Exact location is never shown until a task has a valid accepted match.

Rules:
- public listings show approximate location only
- exact address is hidden during browsing
- exact location is revealed only after a task offer is accepted
- exact location is only visible to the accepted parties
- tasks can be reported if the location or behavior is unsafe
- match acceptance is tracked in a dedicated Match record

This policy is enforced in the backend and by the mobile flow.
