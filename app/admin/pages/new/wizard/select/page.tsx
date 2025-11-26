import SelectVariationClient from "./SelectVariationClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Variation - Admin",
  description: "Choose your AI-generated About page style",
};

export default function SelectVariationPage() {
  return <SelectVariationClient />;
}
