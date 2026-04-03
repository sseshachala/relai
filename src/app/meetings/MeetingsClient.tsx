'use client'
import { CalendarEvent, ThreadSnapshot } from '@/types'

export default function MeetingsClient({ events }: { events: CalendarEvent[] }) {
  if (!events.length) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
        <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="15" rx="3" stroke="#8a8680" strokeWidth="1.3" fill="none"/><path d="M6 1v4M14 1v4M2 8h16" stroke="#8a8680" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
          No meetings in the next 48 hours, or your calendar hasn't synced yet. Run a Gmail sync to connect your calendar.
        </p>
      </div>
    )
  }

  const now   = new Date()
  const today = now.toDateString()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {events.map(event => {
        const start     = new Date(event.start_time)
        const end       = new Date(event.end_time)
        const isToday   = start.toDateString() === today
        const isPast    = end < now
        const snapshots = (event.linked_snapshots ?? []) as ThreadSnapshot[]

        const timeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        const dateStr = isToday ? 'Today' : start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const duration = Math.round((end.getTime() - start.getTime()) / 60000)

        return (
          <div key={event.id} style={{
            background: 'var(--surface)',
            border: `1px solid ${isPast ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: 12, padding: '18px 20px',
            opacity: isPast ? 0.6 : 1,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{dateStr}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>{timeStr}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>{duration}min</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  {event.title || '(No title)'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(event.attendee_emails ?? []).map((email: string) => (
                    <span key={email} style={{
                      fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px',
                      borderRadius: 20, background: 'var(--bg2)', color: 'var(--muted)',
                    }}>{email}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Linked threads */}
            {snapshots.length > 0 ? (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Related email context ({snapshots.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {snapshots.map((snap, i) => (
                    <div key={snap.id} style={{
                      padding: '10px 12px', background: 'var(--bg)',
                      borderRadius: i === 0 ? '8px 8px 0 0' : i === snapshots.length - 1 ? '0 0 8px 8px' : '0',
                      border: '1px solid var(--border)',
                      borderTop: i > 0 ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {snap.subject || '(no subject)'}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                          {snap.date_from ? new Date(snap.date_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                        {snap.preview_text && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                            {snap.preview_text.slice(0, 100)}…
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
                No related email threads found for these attendees.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
