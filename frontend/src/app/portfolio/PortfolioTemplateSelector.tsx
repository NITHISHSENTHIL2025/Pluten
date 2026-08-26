"use client";

import {
  Check,
  CircleDot,
  LayoutTemplate,
  Orbit,
} from "lucide-react";

import styles from "./PortfolioTemplateSelector.module.css";

export type PortfolioTemplateId =
  | "premium-editorial"
  | "orbit";

type PortfolioTemplateSelectorProps = {
  selected: PortfolioTemplateId;
  portfolio?: unknown;
  onChange: (
    template: PortfolioTemplateId,
  ) => void;
};

type TemplateOption = {
  id: PortfolioTemplateId;
  name: string;
  description: string;
  meta: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "premium-editorial",
    name: "Editorial",
    description:
      "Refined, minimal and typography-led.",
    meta: "01 / EDITORIAL",
  },
  {
    id: "orbit",
    name: "Orbit",
    description:
      "Immersive portfolio navigation with a spatial card system.",
    meta: "02 / ORBIT",
  },
];

export default function PortfolioTemplateSelector({
  selected,
  onChange,
}: TemplateProps) {
  return (
    <section
      className={
        styles.selector
      }
      aria-labelledby="portfolio-template-title"
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            PRESENTATION
          </span>

          <h2
            id="portfolio-template-title"
            className={
              styles.title
            }
          >
            Choose your
            <br />
            presentation.
          </h2>

          <p
            className={
              styles.description
            }
          >
            Your portfolio content stays
            the same. Only the visual
            presentation changes.
          </p>
        </div>

        <span
          className={
            styles.count
          }
        >
          {String(
            TEMPLATE_OPTIONS.length,
          ).padStart(2, "0")}{" "}
          TEMPLATES
        </span>
      </div>

      <div
        className={
          styles.options
        }
      >
        {TEMPLATE_OPTIONS.map(
          (template) => {
            const isSelected =
              selected ===
              template.id;

            return (
              <button
                key={
                  template.id
                }
                type="button"
                className={[
                  styles.option,
                  isSelected
                    ? styles.optionSelected
                    : "",
                ].join(" ")}
                aria-pressed={
                  isSelected
                }
                onClick={() =>
                  onChange(
                    template.id,
                  )
                }
              >
                <div
                  className={
                    styles.optionTop
                  }
                >
                  <span
                    className={
                      styles.optionMeta
                    }
                  >
                    {
                      template.meta
                    }
                  </span>

                  {isSelected && (
                    <span
                      className={
                        styles.selectedPill
                      }
                    >
                      <Check
                        size={12}
                        strokeWidth={
                          2.4
                        }
                      />
                      Selected
                    </span>
                  )}
                </div>

                <div
                  className={
                    styles.visual
                  }
                >
                  {template.id ===
                  "orbit" ? (
                    <div
                      className={
                        styles.orbitVisual
                      }
                    >
                      <span
                        className={
                          styles.orbitRing
                        }
                      />

                      <span
                        className={
                          styles.orbitRingSmall
                        }
                      />

                      <span
                        className={
                          styles.orbitCore
                        }
                      >
                        <Orbit
                          size={22}
                          strokeWidth={
                            1.5
                          }
                        />
                      </span>

                      <span
                        className={
                          styles.orbitCardLeft
                        }
                      />

                      <span
                        className={
                          styles.orbitCardRight
                        }
                      />
                    </div>
                  ) : (
                    <div
                      className={
                        styles.editorialVisual
                      }
                    >
                      <div
                        className={
                          styles.editorialLines
                        }
                      >
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>

                      <div
                        className={
                          styles.editorialMark
                        }
                      >
                        <LayoutTemplate
                          size={20}
                          strokeWidth={
                            1.5
                          }
                        />
                      </div>

                      <div
                        className={
                          styles.editorialText
                        }
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={
                    styles.optionBottom
                  }
                >
                  <div>
                    <h3>
                      {
                        template.name
                      }
                    </h3>

                    <p>
                      {
                        template.description
                      }
                    </p>
                  </div>

                  <span
                    className={
                      styles.optionIcon
                    }
                  >
                    {template.id ===
                    "orbit" ? (
                      <CircleDot
                        size={18}
                        strokeWidth={
                          1.6
                        }
                      />
                    ) : (
                      <LayoutTemplate
                        size={18}
                        strokeWidth={
                          1.6
                        }
                      />
                    )}
                  </span>
                </div>
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}

type TemplateProps =
  PortfolioTemplateSelectorProps;