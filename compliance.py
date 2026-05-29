#!/usr/bin/env python3
"""
Everflow Acquisitions — CAN-SPAM Compliance Helper
==================================================
Makes compliance STRUCTURAL instead of a memo. Used at the OUTREACH/SEND stage
and wired back to the sourcing agent's suppression list.

This is not legal advice. CAN-SPAM (15 U.S.C. 7701 et seq.) is an opt-OUT regime:
cold commercial email to U.S. business owners is LEGAL without prior consent, IF
every message satisfies the FTC's requirements. B2B is NOT exempt.

The seven requirements, and how this module covers them:
  1. No false/misleading headers      -> your sending setup (real From/Reply-To/domain).
  2. No deceptive subject lines        -> enforced in the Outreach Agent's voice rules.
  3. Identify as a solicitation        -> implicit; the email plainly proposes a conversation.
  4. Valid physical postal address     -> compliant_footer() appends it.
  5. Clear opt-out mechanism           -> compliant_footer() adds a one-line reply opt-out.
  6. Honor opt-outs within 10 biz days -> detect_optout() + suppress() do it immediately.
  7. Monitor anyone sending for you     -> if Shifa or a VA sends, they use THIS footer; you
                                           stay liable either way, so make it the only template.

Also note (out of scope here, but real): emailing Canada (CASL) or the EU/UK
(GDPR/PECR) requires CONSENT, not opt-out. Keep this pipeline U.S.-only or branch.
"""

import os
import re
import datetime as dt

SUPPRESSION_FILE = "suppression.txt"

# Fill these in once. The address must be a real, valid postal address you control
# (HQ, registered agent, or a USPS/UPS mailbox — a PO box is acceptable to the FTC).
SENDER = {
    "name": "Jake Ontiveros",
    "company": "Everflow Acquisitions",
    "postal_address": "123 Main St, Suite 200, Tulsa, OK 74103",   # <-- replace
    "reply_to": "jake@everflow-acq.com",                            # <-- replace
}

# Replies that count as an opt-out. Kept broad on purpose — when unsure, suppress.
_OPTOUT_PATTERNS = [
    r"\bunsubscribe\b", r"\bremove me\b", r"\btake me off\b", r"\bstop\b",
    r"\bno thanks?\b", r"\bnot interested\b", r"\bpass\b", r"\bdo not (contact|email)\b",
    r"\bopt[\s-]?out\b", r"\bleave me alone\b",
]


def compliant_footer(sender: dict = SENDER) -> str:
    """
    Plain-text signature block. Reads like an operator signing off, not a marketing
    footer — but carries the postal address (req. 4) and a reply-based opt-out (req. 5).
    """
    return (
        f"\n\n{sender['name']}\n"
        f"{sender['company']}\n"
        f"{sender['postal_address']}\n\n"
        f"Not the right time? Reply \"pass\" and I won't reach out again."
    )


def wrap_email(body: str, sender: dict = SENDER) -> str:
    """Append the compliant footer unless the address is already present (idempotent)."""
    if sender["postal_address"] in body:
        return body
    return body.rstrip() + compliant_footer(sender)


def detect_optout(reply_text: str) -> bool:
    """True if an inbound reply signals the recipient wants out."""
    t = (reply_text or "").lower()
    return any(re.search(p, t) for p in _OPTOUT_PATTERNS)


def suppress(identifier: str, reason: str = "opt-out", path: str = SUPPRESSION_FILE) -> None:
    """
    Add an email or domain to the do-not-contact list IMMEDIATELY (well inside the
    FTC's 10-business-day window). The sourcing agent reads this same file, so a
    suppressed owner never re-enters the pipeline on a later run.
    """
    identifier = identifier.strip().lower()
    existing = _load(path)
    if identifier in existing:
        return
    stamp = dt.date.today().isoformat()
    with open(path, "a") as f:
        f.write(f"{identifier}    # {reason} {stamp}\n")


def _load(path: str) -> set[str]:
    if not os.path.exists(path):
        return set()
    out = set()
    with open(path) as f:
        for line in f:
            tok = line.split("#", 1)[0].strip().lower()
            if tok:
                out.add(tok)
    return out


def process_reply(reply_text: str, from_identifier: str) -> str:
    """
    Drop this into your inbox automation. If the reply is an opt-out, suppress and
    confirm. Returns a short status string for logging.
    """
    if detect_optout(reply_text):
        suppress(from_identifier, reason="reply opt-out")
        return f"SUPPRESSED {from_identifier} (opt-out honored)"
    return f"OK {from_identifier} (no opt-out detected — route to Shifa)"


if __name__ == "__main__":
    # Tiny self-demo
    demo_body = (
        "Hi Marcus — 22 years running a HIPAA-focused MSP in Tulsa is a long time "
        "to carry the whole thing yourself.\n\n"
        "I'm an operator, not a broker. Open to a 20-minute conversation about what "
        "the next chapter could look like? Totally fine if not."
    )
    print("=== COMPLIANT EMAIL ===")
    print(wrap_email(demo_body))
    print("\n=== REPLY HANDLING ===")
    for r, who in [("No thanks, not interested.", "owner@acme-msp.com"),
                   ("Sure, how's Thursday?", "owner@beta-it.com")]:
        print(process_reply(r, who))
