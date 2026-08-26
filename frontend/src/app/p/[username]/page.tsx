import { notFound } from "next/navigation";

import {
  getPublicPortfolio,
  type Portfolio,
} from "@/lib/portfolioApi";

import OrbitPortfolio from "@/app/portfolio/OrbitPortfolio";
import PortfolioExperience from "./PortfolioExperience";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicPortfolioPage({
  params,
}: PageProps) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).trim();

  if (!cleanUsername) {
    notFound();
  }

  try {
    const response = await getPublicPortfolio(cleanUsername);
    const portfolio = response?.portfolio as Portfolio | undefined;

    if (!response?.success || !portfolio) {
      notFound();
    }

    if (
      portfolio.status !== "PUBLISHED" ||
      portfolio.visibility !== "PUBLIC"
    ) {
      notFound();
    }

    if (portfolio.template === "orbit") {
      return <OrbitPortfolio portfolio={portfolio} />;
    }

    return <PortfolioExperience portfolio={portfolio} />;
  } catch {
    notFound();
  }
}
