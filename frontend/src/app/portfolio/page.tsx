"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import PlutenNav from "@/components/PlutenNav";
import {
  getPortfolios,
  type Portfolio,
} from "@/lib/portfolioApi";

import styles from "./portfolio.module.css";

export default function PortfolioDashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");

  async function loadPortfolios(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setUnauthorized(false);

      const result = await getPortfolios();

      setPortfolios(
        Array.isArray(result.portfolios)
          ? result.portfolios
          : [],
      );
    } catch (err: unknown) {
      const errorObject = err as {
        response?: {
          status?: number;
          data?: {
            error?: string;
            message?: string;
          };
        };
      };

      if (errorObject.response?.status === 401) {
        setUnauthorized(true);
        setPortfolios([]);
      } else {
        setError(
          errorObject.response?.data?.error ||
            errorObject.response?.data?.message ||
            "We couldn't load your portfolios right now.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPortfolios();
  }, []);

  return (
    <main className={styles.page}>
      <PlutenNav />

      <section className={styles.dashboard}>
        <div className={styles.shell}>
          <header className={styles.topbar}>
            <div>
              <div className={styles.eyebrow}>
                PLUTEN / PORTFOLIO
              </div>

              <h1>Your portfolios.</h1>

              <p>
                Build, manage and publish your professional
                presence from one place.
              </p>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={() => void loadPortfolios(true)}
                disabled={loading || refreshing}
              >
                {refreshing ? (
                  <Loader2
                    size={16}
                    className={styles.spin}
                  />
                ) : (
                  <RefreshCw
                    size={16}
                    strokeWidth={1.7}
                  />
                )}

                Refresh
              </button>

              <Link
                href="/portfolio/new"
                className={styles.createButton}
              >
                <Plus
                  size={18}
                  strokeWidth={1.8}
                />

                New portfolio

                <ArrowRight
                  size={16}
                  strokeWidth={1.8}
                />
              </Link>
            </div>
          </header>

          {loading && (
            <section className={styles.loadingCard}>
              <div className={styles.loadingIcon}>
                <Loader2
                  size={22}
                  className={styles.spin}
                />
              </div>

              <div>
                <strong>
                  Loading your portfolios
                </strong>

                <span>
                  Checking your Pluten account…
                </span>
              </div>
            </section>
          )}

          {!loading && unauthorized && (
            <section className={styles.authCard}>
              <div className={styles.authIcon}>
                <Sparkles
                  size={22}
                  strokeWidth={1.7}
                />
              </div>

              <div className={styles.authCopy}>
                <span className={styles.cardKicker}>
                  ACCOUNT REQUIRED
                </span>

                <h2>
                  Sign in to start building.
                </h2>

                <p>
                  Your portfolio belongs to your Pluten account
                  so you can come back, edit it and publish updates
                  later.
                </p>

                <Link
                  href="/login?redirect=/portfolio"
                  className={styles.primaryAction}
                >
                  Sign in to Pluten

                  <ArrowRight
                    size={17}
                    strokeWidth={1.8}
                  />
                </Link>
              </div>
            </section>
          )}

          {!loading && !unauthorized && error && (
            <section className={styles.errorCard}>
              <div>
                <span className={styles.cardKicker}>
                  SOMETHING WENT WRONG
                </span>

                <h2>
                  We couldn't load your portfolios.
                </h2>

                <p>{error}</p>
              </div>

              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => void loadPortfolios(true)}
              >
                Try again

                <RefreshCw
                  size={16}
                  strokeWidth={1.8}
                />
              </button>
            </section>
          )}

          {!loading &&
            !unauthorized &&
            !error &&
            portfolios.length === 0 && (
              <section className={styles.emptyState}>
                <div className={styles.emptyVisual}>
                  <div className={styles.emptyVisualInner}>
                    <span>01</span>

                    <BriefcaseBusiness
                      size={36}
                      strokeWidth={1.3}
                    />

                    <small>
                      YOUR WORK
                    </small>
                  </div>
                </div>

                <div className={styles.emptyContent}>
                  <span className={styles.cardKicker}>
                    YOUR FIRST PORTFOLIO
                  </span>

                  <h2>
                    Nothing here yet.
                    <br />
                    Let's change that.
                  </h2>

                  <p>
                    Create your first portfolio and turn your
                    experience, projects and skills into a
                    professional website you can actually share.
                  </p>

                  <Link
                    href="/portfolio/new"
                    className={styles.primaryAction}
                  >
                    Create my portfolio

                    <ArrowRight
                      size={17}
                      strokeWidth={1.8}
                    />
                  </Link>
                </div>
              </section>
            )}

          {!loading &&
            !unauthorized &&
            !error &&
            portfolios.length > 0 && (
              <>
                <div className={styles.summaryRow}>
                  <div>
                    <span>PORTFOLIOS</span>

                    <strong>
                      {portfolios.length}
                    </strong>
                  </div>

                  <div>
                    <span>PUBLISHED</span>

                    <strong>
                      {
                        portfolios.filter(
                          (portfolio) =>
                            portfolio.status ===
                            "PUBLISHED",
                        ).length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>DRAFTS</span>

                    <strong>
                      {
                        portfolios.filter(
                          (portfolio) =>
                            portfolio.status ===
                              "DRAFT" ||
                            portfolio.status ===
                              "UNPUBLISHED",
                        ).length
                      }
                    </strong>
                  </div>
                </div>

                <div className={styles.portfolioGrid}>
                  {portfolios.map((portfolio) => (
                    <PortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                    />
                  ))}

                  <Link
                    href="/portfolio/new"
                    className={styles.addCard}
                  >
                    <div className={styles.addIcon}>
                      <Plus
                        size={24}
                        strokeWidth={1.6}
                      />
                    </div>

                    <div>
                      <strong>
                        Create another portfolio
                      </strong>

                      <span>
                        Start with a fresh professional profile.
                      </span>
                    </div>

                    <ArrowRight
                      size={18}
                      strokeWidth={1.7}
                    />
                  </Link>
                </div>
              </>
            )}
        </div>
      </section>
    </main>
  );
}

function PortfolioCard({
  portfolio,
}: {
  portfolio: Portfolio;
}) {
  const isPublished =
    portfolio.status === "PUBLISHED";

  const publicUrl = isPublished
    ? `/p/${encodeURIComponent(portfolio.username)}`
    : null;

  return (
    <article className={styles.portfolioCard}>
      <div className={styles.portfolioCardTop}>
        <div className={styles.cardIdentity}>
          <div className={styles.avatar}>
            {portfolio.fullName
              .trim()
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <div className={styles.cardNameRow}>
              <h2>
                {portfolio.fullName}
              </h2>

              <span
                className={
                  isPublished
                    ? styles.publishedBadge
                    : styles.draftBadge
                }
              >
                {isPublished ? (
                  <>
                    <CheckCircle2
                      size={12}
                      strokeWidth={2}
                    />
                    LIVE
                  </>
                ) : (
                  portfolio.status
                )}
              </span>
            </div>

            <p>
              {portfolio.professionalTitle ||
                "Professional portfolio"}
            </p>
          </div>
        </div>

        <div className={styles.cardNumber}>
          {portfolio.username}
        </div>
      </div>

      <div className={styles.portfolioCardBody}>
        <div className={styles.previewMock}>
          <div className={styles.previewTop}>
            <span>PLUTEN</span>

            <span>
              {portfolio.username}
            </span>
          </div>

          <div className={styles.previewHero}>
            <span>
              {portfolio.fullName}
            </span>

            <strong>
              {portfolio.professionalTitle ||
                "Developer"}
            </strong>

            <small>
              {portfolio.tagline ||
                "A professional portfolio built with Pluten."}
            </small>
          </div>

          <div className={styles.previewStats}>
            <span>
              <strong>
                {portfolio.projects.length}
              </strong>

              <small>
                PROJECTS
              </small>
            </span>

            <span>
              <strong>
                {portfolio.skills.length}
              </strong>

              <small>
                SKILLS
              </small>
            </span>

            <span>
              <strong>
                {portfolio.experiences.length}
              </strong>

              <small>
                ROLES
              </small>
            </span>
          </div>
        </div>

        <div className={styles.portfolioCardMeta}>
          <div>
            <span>UPDATED</span>

            <strong>
              {new Date(
                portfolio.updatedAt,
              ).toLocaleDateString(
                undefined,
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}
            </strong>
          </div>

          <div>
            <span>CONTENT</span>

            <strong>
              {portfolio.projects.length +
                portfolio.experiences.length +
                portfolio.skills.length}{" "}
              items
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.portfolioCardFooter}>
        <Link
          href={`/portfolio/edit/${encodeURIComponent(
            portfolio.id,
          )}`}
          className={styles.editAction}
        >
          Edit portfolio

          <ArrowRight
            size={16}
            strokeWidth={1.7}
          />
        </Link>

        {publicUrl ? (
          <Link
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.viewAction}
          >
            Open portfolio

            <ExternalLink
              size={15}
              strokeWidth={1.7}
            />
          </Link>
        ) : (
          <span className={styles.privateLabel}>
            Not published
          </span>
        )}
      </div>
    </article>
  );
}