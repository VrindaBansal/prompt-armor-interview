'use server';

// Server-action CONTRACT stubs (execution-plan.md §4.2). Signatures are frozen;
// Agent B wires UI against these now. Agent A fills in the bodies in A2.
import type {
  Comment,
  Decision,
  NewSubmission,
  Submission,
  SubmissionDetail,
  SubmissionWithFlags,
} from '@/lib/types';

class NotImplemented extends Error {
  constructor(name: string) {
    super(`${name} not implemented yet (A2)`);
    this.name = 'NotImplemented';
  }
}

export async function createSubmission(
  _input: NewSubmission,
): Promise<Submission> {
  throw new NotImplemented('createSubmission');
}

// draft/changes_requested → pending_ai, then triggers the AI compliance check.
export async function submitForReview(_submissionId: string): Promise<void> {
  throw new NotImplemented('submitForReview');
}

export async function decideReview(
  _submissionId: string,
  _decision: Decision,
  _notes?: string,
): Promise<void> {
  throw new NotImplemented('decideReview');
}

export async function setFlagAgreement(
  _aiCheckId: string,
  _agreed: boolean,
): Promise<void> {
  throw new NotImplemented('setFlagAgreement');
}

export async function addComment(
  _submissionId: string,
  _body: string,
): Promise<Comment> {
  throw new NotImplemented('addComment');
}

// Reviewer queue, RLS-scoped, sorted by severity + age (implemented in A3).
export async function listQueue(): Promise<SubmissionWithFlags[]> {
  throw new NotImplemented('listQueue');
}

export async function getSubmissionDetail(
  _id: string,
): Promise<SubmissionDetail> {
  throw new NotImplemented('getSubmissionDetail');
}
