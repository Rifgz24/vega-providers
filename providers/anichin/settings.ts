import { ProviderContext, SettingsField } from "../types";

export const getSettingsSchema = async function ({}: {
  providerContext: ProviderContext;
}): Promise<SettingsField[]> {
  return [
    {
      key: "preferredQuality",
      type: "select",
      label: "Preferred Quality",
      options: [
        { label: "Auto", value: "auto" },
        { label: "1080p", value: "1080" },
        { label: "720p", value: "720" },
      ],
      defaultValue: "auto",
    },
  ];
};
