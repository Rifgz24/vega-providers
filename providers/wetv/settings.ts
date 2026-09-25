import { ProviderContext, SettingsField } from "../types";

export const getSettingsSchema = async function ({
  providerContext,
}: {
  providerContext: ProviderContext;
}): Promise<SettingsField[]> {
  return [
    {
      key: "preferredQuality",
      type: "select",
      label: "Preferred Quality",
      description: "Default streaming resolution",
      options: [
        { label: "Auto", value: "auto" },
        { label: "1080p", value: "1080" },
        { label: "720p", value: "720" },
        { label: "480p", value: "480" },
      ],
      defaultValue: "auto",
    },
    {
      key: "useChinaDomain",
      type: "toggle",
      label: "Use Chinese Domain (v.qq.com)",
      description: "Switch to v.qq.com for better content coverage (requires Chinese IP)",
      defaultValue: false,
    },
  ];
};
