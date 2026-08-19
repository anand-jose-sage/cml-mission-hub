"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildTheme } from "@/lib/theme";
import { TopHeader } from "@/components/home/top-header";
import { HeroEvent } from "@/components/home/hero-event";
import { WeekCalendar } from "@/components/home/week-calendar";
import { TodayMission } from "@/components/home/today-mission";
import { SectionHead } from "@/components/shared/section-head";
import { HomeNotices } from "@/components/home/home-notices";
import { HomeActivities } from "@/components/home/home-activities";
import { BottomNav } from "@/components/home/bottom-nav";
import { Blobs } from "@/components/home/blobs";
import { OtherScreen } from "@/components/home/other-screen";
import { AboutScreen } from "@/components/home/about-screen";
import { NoticeBoard } from "@/components/notices/notice-board";
import { MediaCenter } from "@/components/media/media-center";
import { ActivitiesScreen } from "@/components/activities/activities-screen";
import { FeastPortalCard } from "@/components/feast/feast-portal-card";
import { QuickAccess } from "@/components/home/quick-access";
import { FeastModule } from "@/components/feast/feast-module";
import { LentPortalCard } from "@/components/lent/lent-portal-card";
import { useTutorialPrelude } from "@/app/(tutorial)/help/tutorials/registration/_hooks/use-tutorial-prelude";
import { useMyRegistrationsTutorial } from "@/app/(tutorial)/help/tutorials/my-registrations/_hooks/use-my-registrations-tutorial";
import { useEditRegistrationTutorial } from "@/app/(tutorial)/help/tutorials/edit-registration/_hooks/use-edit-registration-tutorial";
import { useDeleteRegistrationTutorial } from "@/app/(tutorial)/help/tutorials/delete-registration/_hooks/use-delete-registration-tutorial";

export default function HomePage() {
  const router = useRouter();
  const theme = useMemo(() => buildTheme("aurora-glass", "dusk", 28), []);
  const [tab, setTab] = useState("home");
  const [sel, setSel] = useState<number | null>(null); // null = all week
  const [noticeDetailOpen, setNoticeDetailOpen] = useState(false);
  const [inFeastInternal, setInFeastInternal] = useState(false);
  const tutorial = useTutorialPrelude();
  const myRegTutorial = useMyRegistrationsTutorial();
  const editRegTutorial = useEditRegistrationTutorial();
  const deleteRegTutorial = useDeleteRegistrationTutorial();
  const activeTutorial = tutorial.active ? tutorial
    : myRegTutorial.active ? myRegTutorial
    : editRegTutorial.active ? editRegTutorial
    : deleteRegTutorial.active ? deleteRegTutorial
    : null;
  const onTutorialAction: ((action: string) => void) | undefined =
    activeTutorial && "onTutorialAction" in activeTutorial
      ? (activeTutorial as { onTutorialAction: (action: string) => void }).onTutorialAction
      : undefined;
  const inFeast = activeTutorial ? activeTutorial.inFeast : inFeastInternal;
  const setInFeast = (v: boolean) => {
    if (!activeTutorial) {
      setInFeastInternal(v);
    }
  };
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [tab]);

  const handleNoticeDetail = useCallback((open: boolean) => {
    setNoticeDetailOpen(open);
  }, []);

  // Compute 8-day range: this Sunday → next Sunday
  const weekDates = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Find this Sunday (start of week)
    const dayOfWeek = today.getDay(); // 0=Sun
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    // 7 days: this Sunday through Saturday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, []);

  if (inFeast) {
    return (
      <div className="relative h-dvh w-full overflow-hidden max-w-md mx-auto" style={{ background: theme.pageBg }}>
        <FeastModule
          onExit={() => setInFeast(false)}
          parentTheme={theme}
          tutorialStep={activeTutorial?.feastStep ?? undefined}
          tutorialDetails={activeTutorial?.feastDetails ?? undefined}
          onTutorialAction={onTutorialAction}
        />
      </div>
    );
  }

  return (
    <div
      className="relative h-dvh w-full overflow-hidden max-w-md mx-auto"
      style={{ background: theme.pageBg }}
    >
      <Blobs mode={theme.blobs} />

      {/* Notices tab — absolute-positioned layer, z-bumped when detail is open */}
      {tab === "notices" && (
        <div
          className="absolute inset-0"
          style={{ zIndex: noticeDetailOpen ? 60 : 1 }}
        >
          <NoticeBoard theme={theme} onDetailChange={handleNoticeDetail} />
        </div>
      )}

      {/* Media tab — absolute-positioned layer */}
      {tab === "media" && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <MediaCenter theme={theme} />
        </div>
      )}

      {/* Activities tab — absolute-positioned layer */}
      {tab === "activities" && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <ActivitiesScreen theme={theme} />
        </div>
      )}

      {/* About tab — absolute-positioned layer */}
      {tab === "about" && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <AboutScreen theme={theme} />
        </div>
      )}

      {tab !== "notices" && tab !== "media" && tab !== "activities" && tab !== "about" && (
        <main
          ref={scrollRef}
          className="relative h-full overflow-y-auto overflow-x-hidden pt-3 pb-28 scrollbar-hide"
        >
          {tab === "home" ? (
            <>
              <TopHeader theme={theme} />
              <HeroEvent theme={theme} />

              <FeastPortalCard onEnter={() => setInFeast(true)} />
              <LentPortalCard onEnter={() => router.push("/lent")} />

              {/* Quick access — soft 3D shortcuts */}
              <QuickAccess
                onFeast={() => setInFeast(true)}
                onNotices={() => setTab("notices")}
                onMedia={() => setTab("media")}
                onEvents={() => setTab("activities")}
              />

              {/* Today's Mission timeline */}
              <SectionHead title="Today's Mission" action="More" onAction={() => setTab("media")} />
              <TodayMission theme={theme} onNoticeClick={() => setTab("notices")} />

              {/* Notices section */}
              <HomeNotices theme={theme} onViewAll={() => setTab("notices")} />

              {/* Week slider + Activities */}
              <div className="mt-5 mb-2 px-5">
                <h3
                  className="font-[family-name:var(--font-poppins)] font-semibold text-[17px] tracking-tight m-0 mb-3"
                  style={{ color: "#1E1B4B" }}
                >
                  This Week
                </h3>
              </div>
              <WeekCalendar theme={theme} sel={sel} setSel={setSel} dates={weekDates} />
              <HomeActivities
                theme={theme}
                dates={weekDates}
                sel={sel}
                onViewAll={() => setTab("activities")}
              />
            </>
          ) : (
            <OtherScreen tab={tab} theme={theme} />
          )}
        </main>
      )}

      <BottomNav active={tab} setActive={setTab} theme={theme} />
    </div>
  );
}
