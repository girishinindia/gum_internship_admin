export interface Envelope<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: { pagination?: { page: number; limit: number; total: number; totalPages: number }; [k: string]: unknown };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export interface SessionUser {
  id: number;
  fullName: string;
  email: string | null;
  roles: string[];
  avatarUrl: string | null;
}

export interface InternshipSummary {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  category: { name: string; slug: string };
  pricingType: 'free' | 'paid' | 'stipend';
  price: number;
  deliveryMode: string;
  level: string | null;
  durationWeeks: number | null;
  languages: string[];
  thumbnailUrl: string | null;
  enrollmentCount: number;
  instructorName: string;
  instructorProfileId: number;
}
