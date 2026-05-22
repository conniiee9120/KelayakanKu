export function formatEligibilityResponse(scoredPolicies) {
  return {
    recommended: scoredPolicies.filter((item) => item.status === "Recommended"),
    needMoreInfo: scoredPolicies.filter((item) => item.status === "Need More Info"),
    lessLikely: scoredPolicies.filter((item) => item.status === "Less Likely")
  };
}
