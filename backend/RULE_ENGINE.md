# KelayakanKu Rule Engine

KelayakanKu uses a deterministic rule engine for eligibility matching. Gemini is not used for scoring, ranking, exclusion, or eligibility decisions. Gemini may only explain a rule-engine result after the backend has already returned a recommendation.

The public API response has only two categories:

- `recommended`
- `needMoreInfo`

Policies that clearly fail hard rules are excluded internally and are not shown to users. There is no public `lessLikely` category.

## User Fields Considered

The backend normalizes the frontend form into a canonical household profile and uses these fields where relevant:

- citizenship
- age group and estimated age
- state
- household situation
- dependents
- work situation
- household income range and normalized income value
- income stability
- EPF/KWSP or SOCSO/PERKESO contribution status
- support needs
- special household situations
- optional extra context

Older frontend aliases are also supported, such as `age`, `ageGroup`, `incomeRange`, `householdIncomeRange`, `employmentStatus`, `workSituation`, `epfSocsoStatus`, `supportNeed`, `supportNeeds`, `numberOfDependents`, `dependents`, `extraInfo`, and `extraContext`.

## Income Normalization

The income dropdown maps to deterministic values:

| Form value | Normalized value |
| --- | ---: |
| `no_income` | `0` |
| `below_1000` | `999` |
| `1000_1999` | `1999` |
| `2000_2999` | `2999` |
| `3000_4999` | `4999` |
| `exactly_5000` | `5000` |
| `5001_7999` | `7999` |
| `8000_above` | `8000` |
| `unstable_unknown` | `null` |
| `prefer_not_say` | `null` |

`null` means income cannot be confirmed. It does not pass income rules, does not receive income points, and caps income-capped policies below the Recommended threshold. `no_income` is intentionally `0`.

## Hard Rules

Hard rules run before public classification. A policy is excluded when the user clearly fails:

- citizenship requirement
- strict household income cap
- strict monthly income cap
- age minimum or maximum
- state-specific restriction
- explicit required special condition, such as disability, student status, senior status, single-parent status, or caregiver status
- required contribution status, when the policy explicitly requires EPF/KWSP or SOCSO/PERKESO and the user clearly does not match

If a required field is unknown, the policy is not hard-disqualified. Instead, the result becomes `Need More Info` and the score is capped at 74.

## Scoring Table

Scores are normalized to 100 based on applicable rule weights.

| Rule | Weight |
| --- | ---: |
| Citizenship | 10 |
| Income | 25 |
| Age group | 10 |
| State | 8 |
| Household situation | 8 |
| Dependents | 7 |
| Work situation | 8 |
| Income stability | 6 |
| Contribution status | 6 |
| Support needs | 8 |
| Special situations | 8 |
| Optional extra context | 4 |

Missing policy fields are treated as unknown or not applicable. They do not award full points. Critical missing user fields, such as unknown income for an income-capped policy, cap the result below Recommended.

## Support Needs Mapping

User support needs are normalized and matched against policy categories, policy support needs, and policy text:

- `cash_aid`: Cash Aid, Living Cost Aid, Welfare Aid
- `food_aid`: Food Aid, essential goods, SARA, MyKasih
- `education_aid`: Education Aid, Student Aid, Scholarship, BKOKU
- `healthcare_aid`: Healthcare Aid, Medical Aid, Caregiver Aid, OKU support
- `housing_aid`: Housing Aid, Rent Aid, Home Repair Aid
- `employment_support`: Employment Aid, PERKESO, upskilling, jobseeker aid
- `childcare_support`: Child Aid, Family Aid, Bantuan Kanak-Kanak
- `senior_support`: Senior Aid, Warga Emas
- `disability_support`: OKU Aid, Disability Aid, BKOKU

If support needs are unknown, the engine does not over-penalize, but it adds a `Need More Info` reason where useful.

## Special Situations Mapping

Special household situations can strengthen relevant matches but cannot override hard rules:

- `oku_or_disability`: disability, OKU, BKOKU, healthcare/education support
- `student`: student, education, BKOKU
- `single_parent`: family, child, cash aid
- `senior_citizen`: senior, Warga Emas
- `caregiver`: caregiver, healthcare aid
- `chronic_illness`: medical or chronic-care support
- `no_fixed_income`: welfare, cash, food aid
- `recently_lost_job`: employment, welfare, cash aid
- `many_dependents`: family, child, cash aid
- `no_payslip`: gig, self-employed, welfare-friendly programmes
- `no_bank_account`: may become a next-step or verification concern

## Classification

- Hard-disqualified: excluded internally
- Critical missing information: `Need More Info`, score capped at 74
- Score `>= 75`: `Recommended`
- Score `45 - 74`: `Need More Info`
- Score `< 45`: excluded internally

## Explainability Output

Every returned recommendation includes:

- `eligibilityScore`
- `status`
- `matchReasons`
- `missingInfo`
- `needsMoreInfoReasons`
- `disqualificationReasons`
- `ruleBreakdown`
- `profileFactors`
- `requiredDocuments`
- `nextSteps`
- `officialUrl`
- `sourceUrl`

Each `ruleBreakdown` item includes:

- `rule`
- `label`
- `userValue`
- `policyRule`
- `result`: `matched`, `failed`, `missing`, `unknown`, `partial`, or `not_applicable`
- `scoreAwarded`
- `maxScore`
- `message`
- `impact`

Legacy fields `points`, `matched`, and `reason` are also included for frontend compatibility.

The rule breakdown always includes these user input areas so the frontend and Gemini explanation can see how the full three-step form affected each programme:

- citizenship
- income
- ageGroup
- state
- householdSituation
- dependents
- workSituation
- incomeStability
- contributionStatus
- supportNeeds
- specialSituations
- extraContext

`profileFactors` mirrors the same rule keys in a compact object:

```json
{
  "income": {
    "userValue": "RM4999",
    "policyRule": "Maximum household income RM5000",
    "result": "matched",
    "impact": "Strengthened the match"
  }
}
```

This makes the recommendation output easier to explain without letting Gemini decide eligibility. Gemini receives the complete user profile, `matchReasons`, `needsMoreInfoReasons`, `ruleBreakdown`, and `profileFactors` only after deterministic matching is complete.

## Known Limitations

- The MVP uses local JSON policies, so matching quality depends on how complete each policy record is.
- Some official schemes depend on JKM assessment, STR approval, eKasih, or agency case review that the form does not collect.
- Optional extra context uses deterministic keyword matching only. It is intentionally a light signal and cannot create a 100% match by itself.
- The rule engine provides guidance only. It does not approve, reject, or submit applications.
