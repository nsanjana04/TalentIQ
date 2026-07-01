"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AssessmentDetail,
  AssessmentListItem,
  AssessmentOverview,
  AttemptRecord,
  AttemptResult,
  AttemptSession,
  AvailableAssessment,
  QuestionBankItem,
} from "@/types/assessments";
import type {
  CreateAssessmentInput,
  CreateAssessmentQuestionInput,
  CreateBankQuestionInput,
} from "@/lib/validations/assessments";

export const ASSESSMENTS_KEY = ["assessments"] as const;

export function useAssessmentOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "overview"],
    queryFn: () => apiClient.get<AssessmentOverview>("/api/assessments/overview"),
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  });
}

export function useAssessmentList(
  search?: string,
  published?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "list", search, published],
    queryFn: () =>
      apiClient.get<AssessmentListItem[]>("/api/assessments", {
        params: {
          ...(search && { search }),
          ...(published && { published }),
        },
      }),
    staleTime: 30_000,
    enabled: options?.enabled !== false,
  });
}

export function useAssessmentDetail(id: string | null) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "detail", id],
    queryFn: () => apiClient.get<AssessmentDetail>(`/api/assessments/${id}`),
    enabled: !!id,
  });
}

export function useQuestionBank(search?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "bank", search],
    queryFn: () =>
      apiClient.get<QuestionBankItem[]>("/api/assessments/question-bank", {
        params: search ? { search } : undefined,
      }),
    staleTime: 30_000,
    enabled: options?.enabled !== false,
  });
}

export function useAttemptRecords(assessmentId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "attempts", assessmentId ?? "all"],
    queryFn: () =>
      apiClient.get<AttemptRecord[]>("/api/assessments/attempts", {
        params: assessmentId ? { assessmentId } : undefined,
      }),
    staleTime: 30_000,
    enabled: options?.enabled !== false,
  });
}

export function useAvailableAssessments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "available"],
    queryFn: () => apiClient.get<AvailableAssessment[]>("/api/assessments/available"),
    staleTime: 30_000,
    enabled: options?.enabled !== false,
  });
}

export function useAttemptSession(attemptId: string | null) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "session", attemptId],
    queryFn: () => apiClient.get<AttemptSession>(`/api/assessments/attempts/${attemptId}`),
    enabled: !!attemptId,
    refetchInterval: 30_000,
  });
}

export function useAttemptResult(attemptId: string | null) {
  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, "result", attemptId],
    queryFn: () =>
      apiClient.get<AttemptResult>(`/api/assessments/attempts/${attemptId}/result`),
    enabled: !!attemptId,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
}

export function useAssessmentMutations() {
  const invalidate = useInvalidate();

  const createAssessment = useMutation({
    mutationFn: (data: Partial<CreateAssessmentInput> & { title: string }) =>
      apiClient.post("/api/assessments", data),
    onSuccess: invalidate,
  });

  const updateAssessment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssessmentInput> }) =>
      apiClient.patch(`/api/assessments/${id}`, data),
    onSuccess: invalidate,
  });

  const deleteAssessment = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/assessments/${id}`),
    onSuccess: invalidate,
  });

  const createBankItem = useMutation({
    mutationFn: (data: CreateBankQuestionInput) =>
      apiClient.post("/api/assessments/question-bank", data),
    onSuccess: invalidate,
  });

  const deleteBankItem = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/assessments/question-bank/${id}`),
    onSuccess: invalidate,
  });

  const addQuestion = useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: CreateAssessmentQuestionInput;
    }) => apiClient.post(`/api/assessments/${assessmentId}/questions`, data),
    onSuccess: invalidate,
  });

  const importBank = useMutation({
    mutationFn: ({
      assessmentId,
      bankItemIds,
    }: {
      assessmentId: string;
      bankItemIds: string[];
    }) =>
      apiClient.post(`/api/assessments/${assessmentId}/import-bank`, { bankItemIds }),
    onSuccess: invalidate,
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) =>
      apiClient.delete(`/api/assessments/questions/${questionId}`),
    onSuccess: invalidate,
  });

  const startAttempt = useMutation({
    mutationFn: (assessmentId: string) =>
      apiClient.post<AttemptSession>(`/api/assessments/${assessmentId}/start`, {}),
    onSuccess: invalidate,
  });

  const saveAnswers = useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: string;
      answers: Record<string, string>;
    }) => apiClient.patch(`/api/assessments/attempts/${attemptId}`, { answers }),
  });

  const submitAttempt = useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: string;
      answers: Record<string, string>;
    }) =>
      apiClient.post<AttemptResult>(`/api/assessments/attempts/${attemptId}/submit`, {
        answers,
      }),
    onSuccess: invalidate,
  });

  return {
    createAssessment,
    updateAssessment,
    deleteAssessment,
    createBankItem,
    deleteBankItem,
    addQuestion,
    importBank,
    deleteQuestion,
    startAttempt,
    saveAnswers,
    submitAttempt,
  };
}
