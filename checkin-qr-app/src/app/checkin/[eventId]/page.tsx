import { Suspense } from 'react';
import { connection } from 'next/server';
import { getCheckinEvent } from '@/actions/events';
import { CheckinExperience } from '@/components/checkin/CheckinExperience';
import {
  CheckinLoadingState,
  CheckinUnavailableState,
} from '@/components/checkin/CheckinShared';
import { getCheckinRequirements } from '@/lib/checkin/solution';

type AttendeeCheckinPageProps = {
  params: Promise<{ eventId: string }>;
};

export default function AttendeeCheckinPage(props: AttendeeCheckinPageProps) {
  return (
    <Suspense fallback={<CheckinLoadingState message="Đang tải thông tin phiên điểm danh..." />}>
      <AttendeeCheckinContent {...props} />
    </Suspense>
  );
}

async function AttendeeCheckinContent({ params }: AttendeeCheckinPageProps) {
  await connection();
  const { eventId } = await params;
  const event = await getCheckinEvent(eventId);

  if (!event) return <CheckinUnavailableState />;
  if (event.status === 'closed') return <CheckinUnavailableState closed />;

  return (
    <CheckinExperience
      event={event}
      requirements={getCheckinRequirements(event)}
    />
  );
}
