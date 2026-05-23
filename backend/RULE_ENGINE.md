# KelayakanKu Rule Engine

The public eligibility response has only two user-facing categories:

- `recommended`
- `needMoreInfo`

The backend can still detect policies that are clearly unsuitable, but those policies are excluded from the public response. The frontend does not show a low-match or less-likely section.

## Hard Exclusion Rules

A policy is excluded from the public result when the profile clearly fails a strict rule:

- citizenship does not match
- household income is above a stated household income cap
- monthly income is above a stated monthly income cap
- state is outside a specific state restriction
- age is outside a stated age range
- required special condition is not met, such as student status, children, disability status, dependents, or housing status

## Scoring

Visible policies are scored using deterministic rules:

- citizenship match: `+15`
- household income within stated cap: `+30`
- monthly income within stated cap: `+15`
- state coverage match: `+10`
- age range match: `+10`
- work, student, or support-need category match: `+10`
- special household condition match, or no special condition required: `+10`

## Public Classification

- hard disqualification: excluded
- score `>= 75`: `Recommended`
- score `45 - 74`: `Need More Info`
- score `< 45`: excluded

When a policy looks partly relevant but has category uncertainty, the score is capped below the recommended threshold so it appears as `Need More Info`. Missing policy details are included in `needsMoreInfoReasons` for transparency without letting the system claim certainty.

Gemini is not used for scoring or eligibility decisions. Gemini may only explain a returned rule-engine result in simpler language.
