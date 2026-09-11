import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicPortfolio, type Portfolio } from "@/lib/portfolioApi";
import OrbitPortfolio from "@/app/portfolio/OrbitPortfolio";
import PortfolioExperience from "./PortfolioExperience";

interface PageProps { params: Promise<{ username: string }> }
type PublicResponse = { success:boolean; portfolio?:Portfolio; redirectTo?:string };

async function loadPortfolio(username:string):Promise<PublicResponse>{
  try{return await getPublicPortfolio(username) as unknown as PublicResponse}catch{return {success:false}}
}

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
  const {username}=await params; const clean=decodeURIComponent(username).trim().toLowerCase();
  if(!clean) return {title:"Portfolio unavailable",robots:{index:false,follow:false}};
  const response=await loadPortfolio(clean); const portfolio=response.portfolio;
  if(!portfolio) return {title:"Portfolio unavailable",robots:{index:false,follow:false}};
  const seo=portfolio.seo || {};
  const canonical=seo.canonicalUrl?.trim() || `https://pluten.site/p/${encodeURIComponent(portfolio.username)}`;
  const title=seo.title?.trim() || `${portfolio.fullName} — ${portfolio.professionalTitle || "Portfolio"}`;
  const description=seo.description?.trim() || portfolio.tagline?.trim() || portfolio.bio?.trim() || `${portfolio.fullName}'s professional portfolio.`;
  const ogTitle=seo.ogTitle?.trim() || title; const ogDescription=seo.ogDescription?.trim() || description;
  return {
    title, description, keywords:seo.keywords || undefined,
    alternates:{canonical},
    robots:{index:!seo.noIndex,follow:!seo.noIndex},
    openGraph:{title:ogTitle,description:ogDescription,url:canonical,type:"profile",images:seo.ogImage?[{url:seo.ogImage,alt:portfolio.fullName}]:undefined},
    twitter:{card:seo.twitterCard === "summary" ? "summary" : "summary_large_image",title:ogTitle,description:ogDescription,images:seo.ogImage?[seo.ogImage]:undefined},
  };
}

export default async function PublicPortfolioPage({params}:PageProps){
  const {username}=await params; const cleanUsername=decodeURIComponent(username).trim().toLowerCase();
  if(!cleanUsername) notFound();
  const response=await loadPortfolio(cleanUsername);
  if(response.redirectTo) redirect(`/p/${encodeURIComponent(response.redirectTo)}`);
  const portfolio=response.portfolio;
  if(!response.success || !portfolio || portfolio.status!=="PUBLISHED" || portfolio.visibility!=="PUBLIC") notFound();
  if(portfolio.template==="orbit") return <OrbitPortfolio portfolio={portfolio}/>;
  return <PortfolioExperience portfolio={portfolio}/>;
}
