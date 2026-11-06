import { Suspense } from 'react';
import { connection } from 'next/server';
import { getCheckInEvent } from '@/actions/events';
import { CheckInExperience } from '@/components/check-in/CheckInExperience';
import {
  CheckInLoadingState,
  CheckInUnavailableState,
} from '@/components/check-in/CheckInShared';
import { getCheckInRequirements } from '@/lib/check-in/solution';

type AttendeeCheckInPageProps = {
  params: Promise<{ eventId: string }>;
};

export default function AttendeeCheckInPage(props: AttendeeCheckInPageProps) {
  return (
    <Suspense fallback={<CheckInLoadingState message="Đang tải thông tin phiên điểm danh..." />}>
      <AttendeeCheckInContent {...props} />
    </Suspense>
  );
}

async function AttendeeCheckInContent({ params }: AttendeeCheckInPageProps) {
  await connection();
  const { eventId } = await params;
  const event = await getCheckInEvent(eventId);

  if (!event) return <CheckInUnavailableState />;
  if (event.status === 'closed') return <CheckInUnavailableState closed />;

  return (
    <CheckInExperience
      event={event}
      requirements={getCheckInRequirements(event)}
    />
  );
}
