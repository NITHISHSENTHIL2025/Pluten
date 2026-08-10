"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  Crown,
  Library,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import apiClient from "@/lib/apiClient";

import styles from "./profile.module.css";


/* =========================================================
   USER PROFILE
   ========================================================= */

interface UserProfile {
  firstName: string | null;

  lastName: string | null;

  email: string;

  role: string;

  isPremium: boolean;

  createdAt: string;
}


/* =========================================================
   PROFILE PAGE
   ========================================================= */

export default function ProfilePage() {
  const router = useRouter();


  /* =======================================================
     STATE
     ======================================================= */

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);


  /* =======================================================
     FETCH SECURE PROFILE
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const response =
          await apiClient.get(
            "/user/profile"
          );

        if (!mounted) {
          return;
        }

        setProfile(response.data);

      } catch (error) {
        console.error(
          "Failed to load secure profile:",
          error
        );


        /* ===============================================
           CLEAR INVALID CLIENT SESSION
        =============================================== */

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "role"
        );


        document.cookie =
          "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        document.cookie =
          "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";


        router.push("/login");

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };


    fetchProfile();


    return () => {
      mounted = false;
    };

  }, [router]);


  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await apiClient.post(
        "/auth/logout"
      );

    } catch (error) {
      console.error(
        "Secure logout network fault:",
        error
      );

    } finally {

      /* ===============================================
         CLEAR LOCAL AUTH STATE
      =============================================== */

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "role"
      );


      /* ===============================================
         CLEAR MIDDLEWARE COOKIES
      =============================================== */

      document.cookie =
        "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      document.cookie =
        "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";


      /* ===============================================
         RETURN TO STOREFRONT
      =============================================== */

      window.location.href = "/";
    }
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <main
        className={styles.loader}
      >
        <Loader2
          size={24}
          className="animate-spin"
        />
      </main>
    );
  }


  /* =======================================================
     NO PROFILE
     ======================================================= */

  if (!profile) {
    return null;
  }


  /* =======================================================
     DISPLAY NAME
     ======================================================= */

  const displayName =
    profile.firstName
      ? `${profile.firstName} ${
          profile.lastName || ""
        }`.trim()
      : "User";


  /* =======================================================
     ACCOUNT STATUS
     ======================================================= */

  const isSuperAdmin =
    profile.role ===
    "SUPER_ADMIN";


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className={
        styles.pageContainer
      }
    >

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        className={
          styles.backgroundGrid
        }
        aria-hidden="true"
      />

      <div
        className={
          styles.backgroundGlow
        }
        aria-hidden="true"
      />


      {/* ===================================================
          HEADER
      =================================================== */}

      <header
        className={styles.header}
      >

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className={
            styles.backBtn
          }
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.8}
          />

          <span>
            Back to store
          </span>
        </button>


        <span
          className={
            styles.headerLabel
          }
        >
          PLUTEN / ACCOUNT
        </span>

      </header>


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <section
        className={
          styles.contentWrapper
        }
      >

        {/* =================================================
            PAGE INTRO
        ================================================= */}

        <div
          className={
            styles.pageIntro
          }
        >

          <span
            className={
              styles.eyebrow
            }
          >
            YOUR ACCOUNT
          </span>


          <h1
            className={
              styles.pageTitle
            }
          >
            Profile.
          </h1>


          <p
            className={
              styles.pageDescription
            }
          >
            Manage your Pluten account
            and access everything you've
            purchased.
          </p>

        </div>


        {/* =================================================
            IDENTITY CARD
        ================================================= */}

        <section
          className={
            styles.identityCard
          }
        >

          {/* ===============================================
              AVATAR
          =============================================== */}

          <div
            className={
              styles.avatar
            }
          >
            <User
              size={32}
              strokeWidth={1.5}
            />
          </div>


          {/* ===============================================
              USER INFORMATION
          =============================================== */}

          <div
            className={
              styles.userInfo
            }
          >

            <h2>
              {displayName}
            </h2>


            <div
              className={
                styles.userEmail
              }
            >
              <Mail
                size={15}
                strokeWidth={1.7}
              />

              <span>
                {profile.email}
              </span>
            </div>


            {/* =============================================
                ACCOUNT STATUS
            ============================================= */}

            <div
              className={
                styles.accountBadge
              }
            >

              {isSuperAdmin ? (
                <>
                  <ShieldCheck
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Super Admin
                  </span>
                </>
              ) : profile.isPremium ? (
                <>
                  <Crown
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Premium Member
                  </span>
                </>
              ) : (
                <>
                  <User
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Standard Account
                  </span>
                </>
              )}

            </div>

          </div>

        </section>


        {/* =================================================
            ACCOUNT ACTIONS
        ================================================= */}

        <section
          className={
            styles.actionsSection
          }
        >

          <span
            className={
              styles.sectionLabel
            }
          >
            ACCOUNT
          </span>


          {/* ===============================================
              DIGITAL LIBRARY
          =============================================== */}

          <button
            type="button"
            className={
              styles.actionCard
            }
            onClick={() =>
              router.push("/library")
            }
          >

            <div
              className={
                styles.actionIcon
              }
            >
              <Library
                size={20}
                strokeWidth={1.7}
              />
            </div>


            <div
              className={
                styles.actionText
              }
            >

              <strong>
                Digital Library
              </strong>

              <span>
                Access your purchased
                digital products.
              </span>

            </div>


            <span
              className={
                styles.actionArrow
              }
            >
              ↗
            </span>

          </button>


          {/* ===============================================
              PURCHASED PRODUCTS
          =============================================== */}

          <button
            type="button"
            className={
              styles.actionCard
            }
            onClick={() =>
              router.push("/library")
            }
          >

            <div
              className={
                styles.actionIcon
              }
            >
              <BookOpen
                size={20}
                strokeWidth={1.7}
              />
            </div>


            <div
              className={
                styles.actionText
              }
            >

              <strong>
                Your Products
              </strong>

              <span>
                View the digital products
                you've acquired.
              </span>

            </div>


            <span
              className={
                styles.actionArrow
              }
            >
              ↗
            </span>

          </button>

        </section>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          onClick={
            handleLogout
          }
          disabled={
            loggingOut
          }
          className={
            styles.logoutBtn
          }
        >

          {loggingOut ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              <span>
                Signing out...
              </span>
            </>
          ) : (
            <>
              <LogOut
                size={17}
                strokeWidth={1.8}
              />

              <span>
                Sign out
              </span>
            </>
          )}

        </button>

      </section>


      {/* ===================================================
          FOOTER LABEL
      =================================================== */}

      <div
        className={
          styles.bottomLabel
        }
      >
        PLUTEN — BEYOND ORDINARY.
      </div>

    </main>
  );
}