"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  createPortfolio,
  type CreatePortfolioPayload,
} from "@/lib/portfolioApi";

export default function NewPortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function create() {
      const payload: CreatePortfolioPayload = {
        username: `portfolio-${Date.now()}`,
        fullName: "Your Name",
        professionalTitle: "",
        tagline: "",
        bio: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        availability: "",
        yearsOfExperience: null,

        template: "premium-editorial",
        templateVersion: 1,

        projects: [],
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        achievements: [],
        socialLinks: [],

        seo: {
          keywords: [],
          noIndex: true,
        },

        settings: {
          showEmail: true,
          showPhone: false,
          showLocation: true,
          showProjects: true,
          showExperience: true,
          showEducation: true,
          showSkills: true,
          showCertifications: true,
          showAchievements: true,
          showSocialLinks: true,
          showBranding: true,
          contactEnabled: true,
        },
      };

      try {
        const result = await createPortfolio(
          payload,
        );

        if (!cancelled) {
          router.replace(
            `/portfolio/edit/${result.portfolio.id}`,
          );
        }
      } catch (error) {
        console.error(
          "Unable to create portfolio:",
          error,
        );

        if (!cancelled) {
          router.replace(
            "/portfolio",
          );
        }
      }
    }

    create();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f7f7f3",
        color: "#111",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "#777",
          fontSize: 14,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: "2px solid #111",
            borderTopColor:
              "transparent",
            borderRadius: "50%",
            animation:
              "pluten-spin .8s linear infinite",
          }}
        />

        Preparing your portfolio…
      </div>

      <style jsx>{`
        @keyframes pluten-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}