import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export interface PublicGrade {
  id: string;
  level: number;
  slug: string;
  nameVi: string;
  stage: "primary" | "lower_secondary" | "upper_secondary";
}

export interface PublicSubject {
  id: string;
  slug: string;
  nameVi: string;
  description: string | null;
}

export type HomepageSection =
  | {
      key: string;
      type: "hero";
      titleVi: string;
      config: {
        slides: { title: string; subtitle?: string; ctaLabel?: string; ctaHref?: string }[];
      };
    }
  | {
      key: string;
      type: "announcement";
      titleVi: string;
      config: { message: string; tone: "info" | "success" | "warning"; enabled: boolean };
    }
  | { key: string; type: "grades"; titleVi: string; config: { groups: PublicGrade["stage"][] } }
  | {
      key: string;
      type: "featured_courses";
      titleVi: string;
      config: { limit: number; note?: string };
    }
  | { key: string; type: "subjects"; titleVi: string; config: { limit: number } }
  | {
      key: string;
      type: "features";
      titleVi: string;
      config: { items: { title: string; description: string }[] };
    }
  | { key: string; type: "cta"; titleVi: string; config: { ctaLabel: string; ctaHref: string } };

export const catalogKeys = {
  grades: ["public", "grades"] as const,
  subjects: ["public", "subjects"] as const,
  homepage: ["public", "homepage"] as const,
};

export function usePublicGrades() {
  return useQuery({
    queryKey: catalogKeys.grades,
    queryFn: async () => (await api.get<PublicGrade[]>("/public/grades", { auth: false })).data,
  });
}

export function usePublicSubjects() {
  return useQuery({
    queryKey: catalogKeys.subjects,
    queryFn: async () => (await api.get<PublicSubject[]>("/public/subjects", { auth: false })).data,
  });
}

export function usePublicHomepage() {
  return useQuery({
    queryKey: catalogKeys.homepage,
    queryFn: async () =>
      (await api.get<HomepageSection[]>("/public/homepage", { auth: false })).data,
  });
}
