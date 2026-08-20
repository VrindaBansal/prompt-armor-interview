// Rule selection: given a submission's channel + product type, return the
// subset of rules that apply. An empty scope array on a rule means "applies to
// all" (wildcard), matching the seed migration's convention.
import type { Channel, ProductType, Rule } from '@/lib/types';

export function selectApplicableRules(
  rules: Rule[],
  channel: Channel,
  productType: ProductType,
): Rule[] {
  return rules.filter((rule) => {
    const channelOk =
      rule.applies_to_channels.length === 0 ||
      rule.applies_to_channels.includes(channel);
    const productOk =
      rule.applies_to_product_types.length === 0 ||
      rule.applies_to_product_types.includes(productType);
    return channelOk && productOk;
  });
}
