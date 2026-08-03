'use client';

import { Caveat } from 'next/font/google';

const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'] });

export default function StickyNote({
  heading = 'To the woman who\'s been meaning to start,',
  paragraphs = [],
  signature = 'Love from Idah x',
}) {
  return (
    <div className="note-wrap">
      {/* Washi tape */}
      <div className="tape" aria-hidden="true" />

      {/* Paper note */}
      <div className={`note ${caveat.className}`}>
        {heading && <h2 className="note-heading">{heading}</h2>}

        {paragraphs.map((p, i) => (
          <p key={i} className="note-body">{p}</p>
        ))}

        {signature && <p className="note-sig">{signature}</p>}
      </div>

      <style jsx>{`
        .note-wrap {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 24px 72px;
          /* slight counter-rotation on the wrap so the note sits naturally */
        }

        /* ── Washi / masking tape ── */
        .tape {
          position: absolute;
          top: 46px;
          left: 50%;
          transform: translateX(-50%) rotate(-4deg);
          width: 220px;
          height: 42px;
          /* Jagged torn edges via clip-path */
          clip-path: polygon(
            0% 20%, 3% 0%, 6% 15%, 9% 2%, 12% 18%,
            15% 4%, 18% 20%, 21% 6%, 24% 22%, 27% 5%,
            30% 18%, 33% 3%, 36% 20%, 39% 5%, 42% 18%,
            45% 3%, 48% 20%, 51% 4%, 54% 19%, 57% 6%,
            60% 22%, 63% 5%, 66% 19%, 69% 4%, 72% 20%,
            75% 6%, 78% 22%, 81% 5%, 84% 18%, 87% 3%,
            90% 20%, 93% 5%, 96% 18%, 100% 8%,
            100% 80%, 97% 100%, 94% 82%, 91% 98%, 88% 80%,
            85% 96%, 82% 78%, 79% 96%, 76% 80%, 73% 95%,
            70% 78%, 67% 94%, 64% 78%, 61% 96%, 58% 80%,
            55% 94%, 52% 78%, 49% 96%, 46% 80%, 43% 94%,
            40% 80%, 37% 96%, 34% 80%, 31% 94%, 28% 78%,
            25% 95%, 22% 80%, 19% 96%, 16% 78%, 13% 95%,
            10% 78%, 7% 94%, 4% 80%, 0% 90%
          );
          background: linear-gradient(
            180deg,
            rgba(220, 214, 198, 0.70) 0%,
            rgba(235, 230, 218, 0.55) 50%,
            rgba(210, 204, 190, 0.68) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        /* ── Paper note ── */
        .note {
          position: relative;
          background: #f3efe4;
          border-radius: 3px;
          padding: 52px 44px 44px;
          max-width: 600px;
          width: 100%;
          transform: rotate(-1.5deg);
          box-shadow:
            0 2px 4px rgba(0,0,0,0.12),
            0 6px 16px rgba(0,0,0,0.16),
            0 18px 40px rgba(0,0,0,0.18),
            4px 4px 0 rgba(0,0,0,0.04) inset;
          z-index: 1;
          /* faint ruled-line texture */
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 31px,
            rgba(180,160,120,0.13) 31px,
            rgba(180,160,120,0.13) 32px
          );
        }

        .note-heading {
          font-size: clamp(1.35rem, 3vw, 1.7rem);
          font-weight: 700;
          color: #2a2a28;
          line-height: 1.3;
          margin-bottom: 24px;
          text-transform: none;
        }

        .note-body {
          font-size: clamp(1.1rem, 2.5vw, 1.3rem);
          font-weight: 500;
          color: #2a2a28;
          line-height: 1.9;
          margin-bottom: 18px;
        }

        .note-body:last-of-type {
          margin-bottom: 32px;
        }

        .note-sig {
          font-size: clamp(1.25rem, 3vw, 1.6rem);
          font-weight: 700;
          color: #2a2a28;
          text-align: right;
          margin-top: 12px;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .note {
            padding: 48px 28px 36px;
            transform: rotate(-1deg);
          }
          .tape {
            width: 160px;
            height: 36px;
            top: 40px;
          }
        }
      `}</style>
    </div>
  );
}
