import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanPhoneNumber,
  generateWhatsAppLink,
  formatFeeReminderMessage,
  formatAbsenceNotice,
  formatExamScoreNotice,
} from './communicationService';
import type { Announcement, AnnouncementAudience, AnnouncementPriority } from './types';

test('cleanPhoneNumber handles various phone number formats correctly', () => {
  // Standard 10 digit Indian number
  assert.equal(cleanPhoneNumber('9876543210'), '919876543210');
  // Formatted with spaces and dashes
  assert.equal(cleanPhoneNumber('98765-43210'), '919876543210');
  assert.equal(cleanPhoneNumber('+91 98765 43210'), '919876543210');
  assert.equal(cleanPhoneNumber('(91) 98765-43210'), '919876543210');
  // Already prefixed with country code (12 digits)
  assert.equal(cleanPhoneNumber('919876543210'), '919876543210');
});

test('generateWhatsAppLink produces valid wa.me URI with URL encoded message', () => {
  const link = generateWhatsAppLink('9876543210', 'Hello from Pradeep Classes! Test 123');
  assert.equal(
    link,
    'https://wa.me/919876543210?text=Hello%20from%20Pradeep%20Classes!%20Test%20123'
  );
});

test('formatFeeReminderMessage constructs accurate template with balance and UPI', () => {
  const msg = formatFeeReminderMessage('Rohan Sharma', 15000, 'Pradeep Classes', 'pradeep@upi');
  assert.match(msg, /Rohan Sharma/);
  assert.match(msg, /15,000/);
  assert.match(msg, /pradeep@upi/);
  assert.match(msg, /Pradeep Classes/);
});

test('formatAbsenceNotice constructs polite guardian absence alert', () => {
  const msg = formatAbsenceNotice('Anjali Gupta', '2026-11-20', 'Batch XII-Science', 'Pradeep Classes');
  assert.match(msg, /Anjali Gupta/);
  assert.match(msg, /Batch XII-Science/);
  assert.match(msg, /ABSENT/);
  assert.match(msg, /2026-11-20/);
});

test('formatExamScoreNotice calculates percentage and includes letter grade', () => {
  const msg = formatExamScoreNotice('Sumit Verma', 'Unit Test 1 - Physics', 88, 100, 'A', 'Pradeep Classes');
  assert.match(msg, /Sumit Verma/);
  assert.match(msg, /Unit Test 1 - Physics/);
  assert.match(msg, /88 \/ 100/);
  assert.match(msg, /88%/);
  assert.match(msg, /Performance Grade: \*A\*/);
});

test('Announcement types enforce valid priority and audience models', () => {
  const audiences: AnnouncementAudience[] = ['all', 'staff', 'students', 'batch'];
  const priorities: AnnouncementPriority[] = ['normal', 'important', 'urgent'];

  assert.equal(audiences.length, 4);
  assert.equal(priorities.length, 3);

  const announcement: Announcement = {
    id: 'ann_123',
    instituteId: 'inst_pradeep',
    title: 'Winter Vacation Schedule',
    content: 'Classes will remain suspended from Dec 25 to Jan 1.',
    targetAudience: 'all',
    priority: 'important',
    publishedBy: 'Director Desk',
  };

  assert.equal(announcement.targetAudience, 'all');
  assert.equal(announcement.priority, 'important');
});
