import styles from "./PlutenSkeleton.module.css";

type SkeletonProps = {
  variant?: "product" | "library" | "profile" | "table" | "text";
};

export default function PlutenSkeleton({
  variant = "product",
}: SkeletonProps) {
  if (variant === "library") {
    return (
      <div className={styles.libraryCard} aria-hidden="true">
        <div className={styles.libraryImage}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.libraryContent}>
          <div className={styles.lineSmall}>
            <div className={styles.shimmer} />
          </div>

          <div className={styles.lineTitle}>
            <div className={styles.shimmer} />
          </div>

          <div className={styles.lineMedium}>
            <div className={styles.shimmer} />
          </div>

          <div className={styles.libraryFooter}>
            <div className={styles.lineTiny}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.buttonSkeleton}>
              <div className={styles.shimmer} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className={styles.profileCard} aria-hidden="true">
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <div className={styles.shimmer} />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.lineTitle}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.lineMedium}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.badgeSkeleton}>
              <div className={styles.shimmer} />
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <div className={styles.actionSkeleton}>
            <div className={styles.actionIcon}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.actionText}>
              <div className={styles.lineMedium}>
                <div className={styles.shimmer} />
              </div>

              <div className={styles.lineSmall}>
                <div className={styles.shimmer} />
              </div>
            </div>
          </div>

          <div className={styles.actionSkeleton}>
            <div className={styles.actionIcon}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.actionText}>
              <div className={styles.lineMedium}>
                <div className={styles.shimmer} />
              </div>

              <div className={styles.lineSmall}>
                <div className={styles.shimmer} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={styles.tableSkeleton} aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className={styles.tableRow} key={index}>
            <div className={styles.tableCell}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.tableCellWide}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.tableCell}>
              <div className={styles.shimmer} />
            </div>

            <div className={styles.tableCellAction}>
              <div className={styles.shimmer} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={styles.textSkeleton} aria-hidden="true">
        <div className={styles.lineTitle}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.lineMedium}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.lineMedium}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.lineSmall}>
          <div className={styles.shimmer} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productCard} aria-hidden="true">
      <div className={styles.productImage}>
        <div className={styles.shimmer} />
      </div>

      <div className={styles.productContent}>
        <div className={styles.lineSmall}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.lineTitle}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.lineMedium}>
          <div className={styles.shimmer} />
        </div>

        <div className={styles.productBottom}>
          <div className={styles.priceSkeleton}>
            <div className={styles.shimmer} />
          </div>

          <div className={styles.buttonSkeleton}>
            <div className={styles.shimmer} />
          </div>
        </div>
      </div>
    </div>
  );
}