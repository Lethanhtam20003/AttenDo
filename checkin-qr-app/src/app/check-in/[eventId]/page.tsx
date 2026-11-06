import { Suspense } from 'react';
import { CheckInExperience } from '@/components/check-in/CheckInExperience';
import {
  CheckInLoadingState,
  CheckInUnavailableState,
} from '@/components/check-in/CheckInShared';
import { parseCheckInEventConfig } from '@/lib/check-in/event-config';
import { getCheckInRequirements } from '@/lib/check-in/solution';

type AttendeeCheckInPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ config?: string | string[] }>;
};

export default function AttendeeCheckInPage(props: AttendeeCheckInPageProps) {
  return (
    <Suspense fallback={<CheckInLoadingState message="Đang tải thông tin phiên điểm danh..." />}>
      <AttendeeCheckInContent {...props} />
    </Suspense>
  );
}

async function AttendeeCheckInContent({ params, searchParams }: AttendeeCheckInPageProps) {
  const [{ eventId }, { config }] = await Promise.all([params, searchParams]);
  const event = parseCheckInEventConfig(
    typeof config === 'string' ? config : undefined,
    eventId
  );

  if (!event) return <CheckInUnavailableState invalidLink />;
  if (event.status === 'closed') return <CheckInUnavailableState closed />;

  return (
    <CheckInExperience
      event={event}
      requirements={getCheckInRequirements(event)}
    />
  );
}
