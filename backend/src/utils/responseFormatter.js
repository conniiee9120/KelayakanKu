export function formatEligibilityResponse(scoredPolicies) {
  const publicPolicies = scoredPolicies.filter((item) => item.status === "Recommended" || item.status === "Need More Info");

  return {
    recommended: publicPolicies
      .filter((item) => item.status === "Recommended")
      .sort((a, b) => b.eligibilityScore - a.eligibilityScore),
    needMoreInfo: publicPolicies
      .filter((item) => item.status === "Need More Info")
      .sort((a, b) => b.eligibilityScore - a.eligibilityScore)
  };
}
