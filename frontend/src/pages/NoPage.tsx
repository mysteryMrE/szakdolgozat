import type { ReactNode } from "react";
import SmallScreen from "./SmallScreen";

/**
 * Component shown for non-existent pages, prompting users to return to an existing page.
 * @returns The rendered component.
 */
const NoPage = (): ReactNode => {
  return <SmallScreen bg={false} text={"Ez az oldal nem létezik!"} />;
};

export default NoPage;
