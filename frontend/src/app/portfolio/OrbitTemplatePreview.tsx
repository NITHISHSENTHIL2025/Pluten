"use client";

import type { Portfolio } from "@/lib/portfolioApi";

import OrbitPortfolio from "./OrbitPortfolio";
import styles from "./OrbitTemplatePreview.module.css";

export type OrbitPreviewPortfolio = {
  fullName: string;
  professionalTitle: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  website: string;

  projects: Portfolio["projects"];
  experiences: Portfolio["experiences"];
  education: Portfolio["education"];
  skills: Portfolio["skills"];

  certifications?: Portfolio["certifications"];
  achievements?: Portfolio["achievements"];

  socialLinks: Portfolio["socialLinks"];
};

type OrbitTemplatePreviewProps = {
  portfolio: OrbitPreviewPortfolio;
};

export default function OrbitTemplatePreview({
  portfolio,
}: OrbitTemplatePreviewProps) {
  return (
    <div className={styles.preview}>
      <div className={styles.previewFrame}>
        <div className={styles.previewViewport}>
          <OrbitPortfolio
            portfolio={portfolio}
            preview
          />
        </div>
      </div>
    </div>
  );
}