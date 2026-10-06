import { colorSchemes } from "../colors";

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3)
    throw new Error(`Invalid color: ${hex}`);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground: string, background: string): number {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe.each(["light", "dark"] as const)("%s color scheme", (scheme) => {
  const colors = colorSchemes[scheme];

  it("keeps body text contrast at or above WCAG AA", () => {
    expect(
      contrastRatio(colors.text, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(colors.textSecondary, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary button contrast at or above WCAG AA", () => {
    expect(
      contrastRatio(colors.onPrimary, colors.primary),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
