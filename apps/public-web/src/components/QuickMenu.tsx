import { Dialog } from "./Dialog";

export interface QuickMenuSection {
  id: string;
  label: string;
}

export function sectionAnchorId(sectionId: string) {
  return `invitation-section-${sectionId}`;
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 7h14M5 12h10M5 17h7" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="m19.3 18.3 1.7 1.7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  );
}

export function QuickMenu({
  open,
  sections,
  rsvpEnabled,
  guestUploadsEnabled,
  guestUploadsAvailable,
  onOpen,
  onClose,
  onRsvp,
  onGuestUpload,
  onCalendar,
  onCopyLink,
  onShare,
}: {
  open: boolean;
  sections: QuickMenuSection[];
  rsvpEnabled: boolean;
  guestUploadsEnabled: boolean;
  guestUploadsAvailable: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRsvp: () => void;
  onGuestUpload: () => void;
  onCalendar: () => void;
  onCopyLink: () => void;
  onShare: () => void;
}) {
  const moveToSection = (sectionId: string) => {
    onClose();
    window.requestAnimationFrame(() => {
      const target = document.getElementById(sectionAnchorId(sectionId));
      if (!target) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <>
      <button
        className="floating-menu-button"
        type="button"
        aria-label="빠른 메뉴 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onOpen}
      >
        <MenuIcon />
      </button>

      <Dialog open={open} title="빠른 메뉴" onClose={onClose}>
        <div className="quick-menu">
          <div className="quick-menu__actions">
            {rsvpEnabled ? (
              <button className="primary-button" type="button" onClick={onRsvp}>
                참석 의사 전달하기
              </button>
            ) : null}
            {guestUploadsEnabled ? (
              <button
                className="secondary-button"
                type="button"
                disabled={!guestUploadsAvailable}
                onClick={onGuestUpload}
              >
                축하 사진 공유하기
              </button>
            ) : null}
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                onClose();
                onCalendar();
              }}
            >
              일정 저장하기
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                onClose();
                onCopyLink();
              }}
            >
              링크 복사하기
            </button>
            <button
              className="quick-menu__share secondary-button"
              type="button"
              onClick={() => {
                onClose();
                onShare();
              }}
            >
              초대장 공유하기
            </button>
          </div>

          <nav className="quick-menu__nav" aria-label="초대장 섹션 바로가기">
            <ul>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <button type="button" onClick={() => moveToSection(section.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{section.label}</strong>
                    <ArrowIcon />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Dialog>
    </>
  );
}
