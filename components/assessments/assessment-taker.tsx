"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useAssessmentMutations } from "@/hooks/use-assessments";
import type { AttemptQuestion, AttemptResult, AttemptSession } from "@/types/assessments";
import { AssessmentGradingInfo } from "@/components/assessments/assessment-grading-info";
import {
  getQuestionEvaluationLabel,
  type ExamKind,
} from "@/lib/assessments/exam-grading-policy";
import { formatAttemptScoreSummary } from "@/lib/assessments/attempt-scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function questionTierLabel(question: string): string | null {
  const match = question.match(/^\[(Basic|Intermediate|Advanced|Expert)\]/i);
  return match ? match[1]! : null;
}

function questionTypeLabel(type: AttemptQuestion["type"]) {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "Multiple choice";
    case "TRUE_FALSE":
      return "True / False";
    case "CODE":
      return "Coding";
    case "SHORT_ANSWER":
      return "Short answer";
    case "ESSAY":
      return "Essay";
    default:
      return String(type).replace(/_/g, " ");
  }
}

function QuestionInput({
  question,
  answer,
  onChange,
}: {
  question: AttemptQuestion;
  answer: string;
  onChange: (value: string) => void;
}) {
  if (question.type === "MULTIPLE_CHOICE" && question.options) {
    return (
      <div className="mt-4 space-y-2">
        {question.options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
              answer === opt
                ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
                : "border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
            )}
          >
            <input
              type="radio"
              name={question.id}
              checked={answer === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4 accent-[#2563EB]"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "TRUE_FALSE") {
    return (
      <div className="mt-4 flex gap-3">
        {["True", "False"].map((opt) => (
          <Button
            key={opt}
            size="lg"
            variant={answer === opt ? "default" : "outline"}
            className="min-w-[100px]"
            onClick={() => onChange(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>
    );
  }

  if (question.type === "CODE") {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-[#334155] bg-[#0F172A]">
        <div className="border-b border-[#334155] px-3 py-1.5 text-xs text-[#94A3B8]">
          Code editor
        </div>
        <textarea
          className="min-h-[220px] w-full resize-y bg-[#0F172A] p-4 font-mono text-sm leading-relaxed text-[#E2E8F0] outline-none"
          rows={12}
          value={answer || question.codeTemplate || ""}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="// Write your solution here"
        />
      </div>
    );
  }

  return (
    <textarea
      className="mt-4 w-full rounded-lg border bg-background p-4 text-sm"
      rows={question.type === "ESSAY" ? 6 : 3}
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer…"
    />
  );
}

export function AssessmentTaker({
  session,
  onClose,
  onComplete,
  layout,
}: {
  session: AttemptSession;
  onClose: () => void;
  onComplete: (result: AttemptResult) => void;
  layout?: "scroll" | "paged";
}) {
  const mutations = useAssessmentMutations();
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers);
  const [remaining, setRemaining] = useState(session.remainingSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const examKind: ExamKind = session.questions.length >= 20 ? "final" : "module";
  const usePagedLayout = layout ?? (session.questions.length >= 10 ? "paged" : "scroll");

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const result = await mutations.submitAttempt.mutateAsync({
        attemptId: session.id,
        answers,
      });
      onComplete(result);
    } finally {
      setSubmitting(false);
    }
  }, [answers, mutations.submitAttempt, onComplete, session.id]);

  useEffect(() => {
    if (!remaining || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r === null || r <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmit, remaining]);

  useEffect(() => {
    const saveTimer = setInterval(() => {
      mutations.saveAnswers.mutate({ attemptId: session.id, answers });
    }, 15000);
    return () => clearInterval(saveTimer);
  }, [answers, mutations.saveAnswers, session.id]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k]?.trim()).length,
    [answers]
  );

  const progress = session.questions.length
    ? Math.round((answeredCount / session.questions.length) * 100)
    : 0;

  const currentQuestion = session.questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === session.questions.length - 1;

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  if (usePagedLayout === "scroll") {
    return (
      <ScrollAssessmentTaker
        session={session}
        answers={answers}
        setAnswers={setAnswers}
        remaining={remaining}
        submitting={submitting}
        answered={answeredCount}
        progress={progress}
        examKind={examKind}
        onClose={onClose}
        onSubmit={handleSubmit}
      />
    );
  }

  if (!currentQuestion) return null;

  const tier = questionTierLabel(currentQuestion.question);
  const displayQuestion = currentQuestion.question.replace(/^\[[^\]]+\]\s*/, "");

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="shrink-0 border-b bg-[#F8FAFC] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#111827]">{session.assessmentTitle}</h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              Attempt {session.attemptNumber} · {session.questions.length} questions · Pass{" "}
              {session.passingScore}%
            </p>
          </div>
          {remaining !== null && (
            <Badge
              className={cn(
                "gap-1 font-mono text-sm",
                remaining < 120 && "bg-red-100 text-red-700"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(remaining)}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
          <span>
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <span>
            {answeredCount} of {session.questions.length} answered
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {showIntro && currentIndex === 0 && (
          <div className="mb-4">
            <AssessmentGradingInfo kind={examKind} compact />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 text-[#2563EB]"
              onClick={() => setShowIntro(false)}
            >
              Got it — start assessment
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px]">
              {questionTypeLabel(currentQuestion.type)}
            </Badge>
            {tier && (
              <Badge className="bg-[#EFF6FF] text-[11px] text-[#2563EB]">{tier}</Badge>
            )}
            {answers[currentQuestion.id]?.trim() && (
              <Badge className="bg-emerald-100 text-[11px] text-emerald-700">Answered</Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-[#6B7280]">
            {getQuestionEvaluationLabel(currentQuestion.type)}
          </p>
          <p className="mt-3 text-base font-medium leading-relaxed text-[#111827]">
            {displayQuestion}
          </p>

          <QuestionInput
            question={currentQuestion}
            answer={answers[currentQuestion.id] ?? ""}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-[#6B7280]">Jump to question</p>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {session.questions.map((q, index) => {
              const isAnswered = Boolean(answers[q.id]?.trim());
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={cn(
                    "flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors",
                    isCurrent && "border-[#2563EB] bg-[#2563EB] text-white",
                    !isCurrent && isAnswered && "border-emerald-300 bg-emerald-50 text-emerald-700",
                    !isCurrent && !isAnswered && "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F8FAFC]"
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-[#F8FAFC] px-5 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Exit
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirst}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          {!isLast ? (
            <Button type="button" onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit assessment"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollAssessmentTaker({
  session,
  answers,
  setAnswers,
  remaining,
  submitting,
  answered,
  progress,
  examKind,
  onClose,
  onSubmit,
}: {
  session: AttemptSession;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  remaining: number | null;
  submitting: boolean;
  answered: number;
  progress: number;
  examKind: ExamKind;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{session.assessmentTitle}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Attempt {session.attemptNumber} · {session.questions.length} questions · Pass{" "}
              {session.passingScore}%
            </p>
          </div>
          {remaining !== null && (
            <Badge
              className={cn(
                "gap-1 font-mono text-sm",
                remaining < 120 && "bg-destructive/15 text-destructive"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(remaining)}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="mt-3 h-1.5" />
        <p className="text-xs text-muted-foreground">
          {answered} of {session.questions.length} answered
        </p>
        <AssessmentGradingInfo kind={examKind} className="mt-3" compact />
      </CardHeader>
      <CardContent className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
        {session.questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Question {i + 1} · {questionTypeLabel(q.type)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {getQuestionEvaluationLabel(q.type)}
            </p>
            <p className="mt-2 font-medium">{q.question}</p>
            <QuestionInput
              question={q}
              answer={answers[q.id] ?? ""}
              onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
            />
          </div>
        ))}
      </CardContent>
      <div className="flex justify-end gap-2 border-t p-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Assessment"
          )}
        </Button>
      </div>
    </Card>
  );
}

export function AttemptResultView({
  result,
  onRetake,
  onClose,
}: {
  result: AttemptResult;
  onRetake?: () => void;
  onClose: () => void;
}) {
  const passed = result.passed === true;
  const failed = result.passed === false;
  const pending = result.passed === null;
  const correctCount =
    result.correctCount ??
    result.questionResults.filter((q) => q.isCorrect === true).length;
  const totalQuestions =
    result.totalQuestions ??
    result.questionResults.filter((q) => q.type !== "ESSAY").length;
  const scoreLabel =
    result.percentage !== null
      ? formatAttemptScoreSummary(correctCount, totalQuestions, result.percentage)
      : null;

  const isLongResult = result.questionResults.length > 10;

  return (
    <Card
      className={cn(
        "border-2",
        passed && "border-emerald-400/50",
        failed && "border-destructive/40",
        pending && "border-amber-400/40"
      )}
    >
      <CardHeader className="text-center">
        {passed && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />}
        {failed && <XCircle className="mx-auto h-12 w-12 text-destructive" />}
        {pending && <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />}
        <CardTitle className="mt-3">
          {passed ? "Passed!" : failed ? "Not Passed" : "Submitted for Review"}
        </CardTitle>
        <p className="text-muted-foreground">{result.assessmentTitle}</p>
        {scoreLabel && (
          <>
            <p className="mt-2 text-3xl font-bold text-primary">{result.percentage}%</p>
            <p className="mt-1 text-sm text-muted-foreground">{scoreLabel}</p>
          </>
        )}
        {failed && result.passingScore != null && (
          <p className="mt-2 text-sm font-medium text-destructive">
            Minimum {result.passingScore}% required to pass. Retake the assessment to continue.
          </p>
        )}
        {result.feedback && (
          <p className="mt-2 text-sm text-muted-foreground">{result.feedback}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLongResult &&
          result.questionResults.map((q) => (
            <div
              key={q.questionId}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                q.isCorrect === true && "border-emerald-400/30 bg-emerald-500/5",
                q.isCorrect === false && "border-destructive/30 bg-destructive/5",
                q.isCorrect === null && "border-amber-400/30 bg-amber-500/5"
              )}
            >
              <p className="font-medium">{q.question}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getQuestionEvaluationLabel(q.type)}
              </p>
              <p className="mt-1 text-muted-foreground">Your answer: {q.userAnswer || "—"}</p>
              {q.isCorrect === false && q.correctAnswer && (
                <p className="mt-1 text-muted-foreground">Correct answer: {q.correctAnswer}</p>
              )}
              {q.isCorrect === null && (
                <p className="mt-1 text-xs text-amber-700">
                  Pending review — score may change after manual grading.
                </p>
              )}
              <p className="mt-1 text-xs font-medium">
                {q.isCorrect === true && "Correct"}
                {q.isCorrect === false && "Incorrect"}
                {q.isCorrect === null && "Pending review"}
              </p>
            </div>
          ))}
        {isLongResult && (
          <p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {correctCount} of {totalQuestions} auto-graded questions correct. Detailed breakdown is
            available from the Assessments screen.
          </p>
        )}
        <div className="flex justify-center gap-2 pt-4">
          {failed && result.canRetake && onRetake && (
            <Button onClick={onRetake}>Retake assessment ({result.attemptsRemaining} left)</Button>
          )}
          {passed && (
            <Button variant="outline" onClick={onClose}>
              Continue
            </Button>
          )}
          {failed && !result.canRetake && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          {failed && result.canRetake && (
            <Button variant="outline" onClick={onClose}>
              Back to course
            </Button>
          )}
          {pending && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
