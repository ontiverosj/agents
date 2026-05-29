#!/usr/bin/env python3
"""
Everflow Acquisitions — Lead Sourcing Agent
============================================
Front of the pipeline. Casts a firmographic net via Apollo, hands candidates to
Clay for deep enrichment, applies the Buy Box v2.0 disqualifiers + succession
scoring, and emits ranked JSON for the Qualification Agent.

HONEST ARCHITECTURE NOTE
------------------------
The Buy Box is more precise than any data source can filter at query time.
Apollo can filter firmographics it actually has: industry keywords, employee
count, country, and (unreliably, for sub-$3M private firms) revenue + founded
year. It does NOT have: owner age, owner tenure, recurring-revenue %, or any
succession signal. Those are DERIVED downstream from Clay/LinkedIn enrichment
and human review. So this agent does three honest things:

  1. Apollo  -> coarse net on the filters Apollo reliably supports.
  2. Python  -> enforce every Buy Box rule it CAN evaluate from returned data;
                mark everything else "unknown -> needs_enrichment". Never fabricate.
  3. Clay    -> push survivors to a Clay table (webhook) for owner/age/tenure/
                recurring-revenue enrichment, which feeds the Qualification Agent.

Run:
    export APOLLO_API_KEY="..."
    export CLAY_WEBHOOK_URL="..."          # optional; omit to skip enrichment push
    python lead_sourcing_agent.py --track track1 --industry "Managed IT Services (MSP)" --limit 50

Requires: pip install requests
"""

import os
import sys
import json
import time
import argparse
import datetime as dt
from typing import Any

import requests

APOLLO_BASE = "https://api.apollo.io/api/v1"
CURRENT_YEAR = dt.date.today().year

# ─────────────────────────────────────────────────────────────────────────────
# BUY BOX v2.0  (source of truth — keep in sync with the spec doc)
# ─────────────────────────────────────────────────────────────────────────────
BUY_BOX = {
    "version": "2.1",
    "universal": {
        "revenue_min": 500_000, "revenue_max": 3_000_000,
        "founded_after_exclude": 2010,       # founded AFTER this year => exclude
        "owner_age_min": 50, "owner_tenure_min": 15,
        "employees_min": 3, "employees_max": 30,
    },
    "track1": {
        "Managed IT Services (MSP)": {
            "keywords": ["managed IT services", "MSP", "managed service provider", "IT support services"],
            "employee_ranges": ["5,10", "11,20", "21,50"],
        },
        "Bookkeeping Outsourcing": {
            "keywords": ["bookkeeping services", "outsourced accounting", "client accounting services", "monthly bookkeeping"],
            "employee_ranges": ["3,10", "11,20", "21,25"],
        },
        "Specialized Marketing Agency": {
            "keywords": ["SEO agency", "local SEO", "Google Ads agency", "email marketing agency", "Klaviyo partner", "PPC agency"],
            "employee_ranges": ["3,10", "11,25"],
        },
        "Outsourced CFO": {
            "keywords": ["fractional CFO", "outsourced CFO services", "virtual CFO", "CFO consulting"],
            "employee_ranges": ["2,10", "11,15"],
        },
        "Cybersecurity Audit/Compliance": {
            "keywords": ["SOC 2 auditor", "compliance audit firm", "cybersecurity assessment", "PCI assessor", "HITRUST assessor", "penetration testing"],
            "employee_ranges": ["5,10", "11,30"],
        },
        # Owner-run colocation / managed-hosting shops with a succession angle.
        # Thesis bonus: operators still running aging on-prem hardware that can be
        # migrated to software/cloud in days (see legacy_hardware_modernizable).
        "Data Centers / Colocation": {
            "keywords": ["colocation", "colo", "data center", "managed hosting", "private cloud",
                         "dedicated servers", "on-premise hosting", "server hosting", "legacy infrastructure"],
            "employee_ranges": ["3,10", "11,20", "21,30"],
        },
    },
    "track2": {
        "HVAC": {"keywords": ["HVAC", "heating cooling", "heating and air", "air conditioning service"], "employee_ranges": ["8,20", "21,30"]},
        "Plumbing": {"keywords": ["plumbing services", "plumber", "plumbing contractor", "residential plumbing", "commercial plumbing"], "employee_ranges": ["8,20", "21,30"]},
        "Pest Control": {"keywords": ["pest control", "exterminator", "termite control", "pest management"], "employee_ranges": ["5,10", "11,25"]},
        "Commercial Cleaning": {"keywords": ["commercial cleaning", "janitorial services", "facility cleaning", "office cleaning"], "employee_ranges": ["10,20", "21,50"]},
    },
}

# Exclusion keywords applied to Apollo results (PE / roll-up / already-listed signals)
EXCLUDE_KEYWORDS = [
    "private equity", "portfolio company", "platform company", "roll-up", "rollup",
    "bizbuysell", "empire flippers", "for sale", "acquired by",
]


# ─────────────────────────────────────────────────────────────────────────────
# SCORING ENGINE  (ported 1:1 from the Deal Desk artifact so both surfaces agree)
# Succession signals are mostly UNKNOWN at sourcing time -> the agent computes a
# PARTIAL score and lists what must be enriched before the Qualification Agent runs.
# ─────────────────────────────────────────────────────────────────────────────
SIGNALS = {
    "strong":   (3,  ["owner_60_plus", "tenure_25_plus", "no_family_leadership",
                      "retirement_posts", "reduced_posting_12mo", "recent_mgmt_hire"]),
    "moderate": (2,  ["owner_55_60", "tenure_20_25", "no_geo_expansion_5yr",
                      "no_active_hiring", "legacy_headline", "solo_owner_no_partner",
                      # value-creation upside, esp. for Data Centers / Colocation:
                      # aging on-prem hardware that can be modernized to software/cloud fast.
                      "legacy_hardware_modernizable"]),
    "weak":     (1,  ["owner_50_55", "tenure_15_20", "limited_social_presence",
                      "family_owned_desc", "tertiary_market"]),
    "negative": (-2, ["active_hiring_spree", "pe_style_hires", "recent_rebrand",
                      "owner_under_50", "tenure_under_15", "recently_raised_capital"]),
}
DQ_SIGNALS = ["listed_on_broker", "pe_acquisition_press", "owner_moved_to_advisor",
              "active_litigation", "industry_declining"]


def score_succession(known_signals: dict[str, bool]) -> tuple[int, list[dict], list[str]]:
    """Sum only the signals we actually KNOW. Return (raw, hits, unknown_keys)."""
    raw, hits, unknown = 0, [], []
    for _grp, (pts, keys) in SIGNALS.items():
        for k in keys:
            if k not in known_signals:
                unknown.append(k)
            elif known_signals[k]:
                raw += pts
                hits.append({"signal": k, "pts": pts})
    return raw, hits, unknown


def raw_to_priority(raw: int) -> int:
    bands = [(12, 10), (10, 9), (8, 8), (6, 7), (4, 6), (2, 5), (0, 4)]
    for threshold, pr in bands:
        if raw >= threshold:
            return pr
    return max(1, 4 + (raw // 2))


def evaluate(prospect: dict, track: str) -> dict:
    """Apply every Buy Box rule we can given available data. Defer the rest."""
    u = BUY_BOX["universal"]
    fails: list[str] = []
    unknown_dq: list[str] = []

    rev = prospect.get("estimated_revenue")
    founded = prospect.get("founded_year")
    emp = prospect.get("employees")

    # Hard disqualifiers we can evaluate now
    if rev is not None:
        if rev < u["revenue_min"] or rev > u["revenue_max"]:
            fails.append(f"Revenue ${rev:,} outside $500K-$3M")
    else:
        unknown_dq.append("revenue (Apollo sparse for sub-$3M private firms)")

    if founded is not None:
        if founded > u["founded_after_exclude"]:
            fails.append(f"Founded {founded} (after 2010)")
    else:
        unknown_dq.append("founded_year")

    if emp is not None and not (u["employees_min"] <= emp <= u["employees_max"]):
        fails.append(f"{emp} employees outside 3-30")

    if not prospect.get("in_united_states", True):
        fails.append("Located outside the United States")

    # Keyword-based exclusion (PE / listed-for-sale signals in Apollo blob)
    blob = " ".join(str(v) for v in prospect.get("_raw_keywords", [])).lower()
    for kw in EXCLUDE_KEYWORDS:
        if kw in blob:
            fails.append(f"Exclusion keyword matched: '{kw}'")
            break

    # Succession signals — almost all UNKNOWN until Clay/LinkedIn enrichment
    known = prospect.get("known_succession_signals", {})
    raw, hits, unknown = score_succession(known)
    priority = 0 if fails else raw_to_priority(raw)

    # Track-2 remote-manageable cap (cannot verify at sourcing -> always cap until enriched)
    track2_unverified = (track == "track2")
    if track2_unverified and priority > 4:
        priority = 4

    if fails:
        verdict, action = "disqualify", "Disqualify — do not enrich"
    elif unknown or unknown_dq:
        verdict, action = "enrich", "Needs enrichment before qualification"
    elif priority >= 7:
        verdict, action = "proceed", "Proceed to Qualification Agent"
    else:
        verdict, action = "hold", "Hold / deprioritize"

    return {
        "verdict": verdict,
        "recommended_next_step": action,
        "partial_priority": priority,
        "partial_raw_signal": raw,
        "signals_confirmed": hits,
        "signals_needing_enrichment": unknown,
        "disqualifiers_failed": fails,
        "criteria_unknown_at_source": unknown_dq,
        "track2_remote_manageable_status": "UNVERIFIED — capped at 4" if track2_unverified else "n/a",
    }


# ─────────────────────────────────────────────────────────────────────────────
# APOLLO
# ─────────────────────────────────────────────────────────────────────────────
def apollo_headers(key: str) -> dict:
    return {"Content-Type": "application/json", "Cache-Control": "no-cache", "X-Api-Key": key}


def apollo_org_search(key: str, keywords: list[str], emp_ranges: list[str], page: int = 1, per_page: int = 25) -> dict:
    """
    Organization search. NOTE: Apollo changes field names periodically — verify
    against current docs (https://docs.apollo.io). Anything Apollo can't filter
    server-side is enforced afterward in evaluate().
    """
    payload = {
        "q_organization_keyword_tags": keywords,
        "organization_num_employees_ranges": emp_ranges,
        "organization_locations": ["United States"],
        "page": page,
        "per_page": per_page,
    }
    r = requests.post(f"{APOLLO_BASE}/mixed_companies/search",
                      headers=apollo_headers(key), json=payload, timeout=40)
    r.raise_for_status()
    return r.json()


def apollo_find_owner(key: str, org_id: str) -> dict | None:
    """Find an owner/founder/CEO contact for the org. Returns None if not found."""
    payload = {
        "organization_ids": [org_id],
        "person_titles": ["owner", "founder", "president", "ceo", "managing partner"],
        "page": 1, "per_page": 5,
    }
    try:
        r = requests.post(f"{APOLLO_BASE}/mixed_people/search",
                          headers=apollo_headers(key), json=payload, timeout=40)
        r.raise_for_status()
        people = r.json().get("people", [])
        return people[0] if people else None
    except requests.RequestException:
        return None


def normalize_org(org: dict, owner: dict | None) -> dict:
    """Map Apollo's response onto Buy Box fields. Missing data stays None — never guessed."""
    return {
        "company": org.get("name"),
        "domain": org.get("primary_domain") or org.get("website_url"),
        "location": ", ".join(filter(None, [org.get("city"), org.get("state")])) or org.get("country"),
        "in_united_states": (org.get("country") or "").lower() in ("", "united states", "usa", "us"),
        "employees": org.get("estimated_num_employees"),
        "founded_year": org.get("founded_year"),
        "estimated_revenue": org.get("annual_revenue"),        # frequently None for small firms
        "industry": org.get("industry"),
        "owner_name": owner.get("name") if owner else None,
        "owner_title": owner.get("title") if owner else None,
        "owner_linkedin": owner.get("linkedin_url") if owner else None,
        "known_succession_signals": {},                        # filled by Clay downstream
        "_raw_keywords": (org.get("keywords") or []) + [org.get("short_description") or ""],
        "_apollo_org_id": org.get("id"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLAY (deep enrichment via webhook table — how Clay actually ingests rows)
# ─────────────────────────────────────────────────────────────────────────────
def push_to_clay(prospects: list[dict], webhook_url: str) -> int:
    """
    POST survivors into a Clay table source. In Clay you build the enrichment
    columns (find owner, estimate age from grad year, tenure from job history,
    recurring-revenue signals, BizBuySell check, etc.) which then populate
    known_succession_signals for the Qualification Agent. Returns count pushed.
    """
    sent = 0
    for p in prospects:
        row = {k: v for k, v in p.items() if not k.startswith("_")}
        try:
            resp = requests.post(webhook_url, json=row, timeout=20)
            if resp.ok:
                sent += 1
            time.sleep(0.25)  # be gentle on the webhook
        except requests.RequestException:
            pass
    return sent


# ─────────────────────────────────────────────────────────────────────────────
# COMPLIANCE — do-not-contact suppression at the SOURCING stage
# Opted-out owners must never re-enter the pipeline (CAN-SPAM 10-business-day rule
# is about send-time, but suppressing at source is the structural safeguard).
# ─────────────────────────────────────────────────────────────────────────────
def load_suppression(path: str = "suppression.txt") -> set[str]:
    if not os.path.exists(path):
        return set()
    with open(path) as f:
        return {line.strip().lower() for line in f if line.strip() and not line.startswith("#")}


def is_suppressed(prospect: dict, suppressed: set[str]) -> bool:
    domain = (prospect.get("domain") or "").lower()
    return any(domain.endswith(s) or s in domain for s in suppressed) if domain else False


# ─────────────────────────────────────────────────────────────────────────────
# ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────
def run(track: str, industry: str, limit: int) -> dict:
    key = os.environ.get("APOLLO_API_KEY")
    if not key:
        sys.exit("ERROR: set APOLLO_API_KEY in your environment.")

    cfg = BUY_BOX[track].get(industry)
    if not cfg:
        sys.exit(f"ERROR: '{industry}' not found in {track}. Options: {list(BUY_BOX[track])}")

    suppressed = load_suppression()
    results, page, per_page = [], 1, 25

    print(f"[sourcing] {industry} ({track}) — target {limit} prospects ...", file=sys.stderr)
    while len(results) < limit:
        data = apollo_org_search(key, cfg["keywords"], cfg["employee_ranges"], page, per_page)
        orgs = data.get("organizations") or data.get("accounts") or []
        if not orgs:
            break
        for org in orgs:
            owner = apollo_find_owner(key, org.get("id")) if org.get("id") else None
            prospect = normalize_org(org, owner)
            if is_suppressed(prospect, suppressed):
                continue
            prospect["evaluation"] = evaluate(prospect, track)
            prospect["track"] = track
            results.append(prospect)
            if len(results) >= limit:
                break
        page += 1
        if page > 20:
            break
        time.sleep(0.4)

    # Rank: proceed > enrich > hold > disqualify, then by partial priority
    order = {"proceed": 0, "enrich": 1, "hold": 2, "disqualify": 3}
    results.sort(key=lambda p: (order[p["evaluation"]["verdict"]], -p["evaluation"]["partial_priority"]))

    enrich_queue = [p for p in results if p["evaluation"]["verdict"] in ("proceed", "enrich")]
    clay_url = os.environ.get("CLAY_WEBHOOK_URL")
    pushed = push_to_clay(enrich_queue, clay_url) if clay_url else 0

    return {
        "run_meta": {
            "generated": dt.datetime.now().isoformat(timespec="seconds"),
            "buy_box_version": BUY_BOX["version"],
            "track": track, "industry": industry,
            "returned": len(results),
            "to_enrich": len(enrich_queue),
            "pushed_to_clay": pushed,
            "suppressed_skipped": True if suppressed else False,
            "data_honesty": "Revenue/owner-age/tenure/recurring%/succession signals are NOT "
                            "filtered at Apollo. Survivors are scored on confirmed signals only "
                            "and routed to Clay; unknowns are listed per prospect. No data fabricated.",
        },
        "prospects": results,
    }


def main():
    ap = argparse.ArgumentParser(description="Everflow Lead Sourcing Agent")
    ap.add_argument("--track", choices=["track1", "track2"], default="track1")
    ap.add_argument("--industry", required=True, help='e.g. "Managed IT Services (MSP)"')
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--out", default="prospects.json")
    args = ap.parse_args()

    output = run(args.track, args.industry, args.limit)
    with open(args.out, "w") as f:
        json.dump(output, f, indent=2)

    m = output["run_meta"]
    print(f"[done] {m['returned']} prospects -> {args.out} | {m['to_enrich']} queued for "
          f"enrichment | {m['pushed_to_clay']} pushed to Clay", file=sys.stderr)


if __name__ == "__main__":
    main()
