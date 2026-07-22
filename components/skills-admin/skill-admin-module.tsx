"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Brain,
  ClipboardCheck,
  Layers,
  Link2,
  Scale,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  useAssessmentMappings,
  useCertificateMappings,
  useCourseMappings,
  useRoleMappings,
  useSkillAdminMutations,
  useSkillCategories,
  useSkillLibrary,
  useSkillLevels,
  useSkillMeta,
  useSkillOverview,
  useSkillRelations,
  useValidityRules,
  useWeightageRules,
} from "@/hooks/use-skill-admin";
import { AdminPanel, DeleteButton, FormRow, StatPill } from "./admin-ui";
import { AdminTable } from "./admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUrlTab } from "@/hooks/use-url-tab";

type TabId =
  | "library"
  | "categories"
  | "levels"
  | "relations"
  | "roles"
  | "courses"
  | "assessments"
  | "certificates"
  | "validity"
  | "weightage";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "library", label: "Skill Library", icon: Brain },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "levels", label: "Skill Levels", icon: Sparkles },
  { id: "relations", label: "Skill Mapping", icon: Link2 },
  { id: "roles", label: "Role Mapping", icon: Shield },
  { id: "courses", label: "Course Mapping", icon: BookOpen },
  { id: "assessments", label: "Assessment Mapping", icon: ClipboardCheck },
  { id: "certificates", label: "Certificate Mapping", icon: Award },
  { id: "validity", label: "Validity Rules", icon: Timer },
  { id: "weightage", label: "Weightage Rules", icon: Scale },
];

const VALID_TABS = new Set<TabId>(TABS.map((t) => t.id));

export function SkillAdminModule() {
  const [tab, setTab] = useUrlTab(VALID_TABS, "library");
  const [search, setSearch] = useState("");
  const { data: overview } = useSkillOverview();

  return (
    <div className="space-y-6">
      {overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatPill label="Skills" value={overview.totalSkills} />
          <StatPill label="Categories" value={overview.totalCategories} />
          <StatPill label="Levels" value={overview.totalLevels} />
          <StatPill label="Role Mappings" value={overview.totalRoleMappings} />
          <StatPill label="Course Mappings" value={overview.totalCourseMappings} />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1 lg:w-56 lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full",
                  tab === t.id
                    ? "bg-card font-medium shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:bg-card/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "library" && <LibraryTab search={search} onSearch={setSearch} />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "levels" && <LevelsTab />}
          {tab === "relations" && <RelationsTab />}
          {tab === "roles" && <RoleMappingsTab />}
          {tab === "courses" && <CourseMappingsTab />}
          {tab === "assessments" && <AssessmentMappingsTab />}
          {tab === "certificates" && <CertificateMappingsTab />}
          {tab === "validity" && <ValidityTab />}
          {tab === "weightage" && <WeightageTab />}
        </div>
      </div>
    </div>
  );
}

function LibraryTab({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  const { data, isLoading } = useSkillLibrary(search);
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const items = (data as { id: string; name: string; categoryName: string; employeeCount: number; mappingCount: number }[]) ?? [];

  return (
    <>
      <AdminPanel
        title="Skill Library"
        description="Central repository of organizational skills and competencies"
        onAdd={() => setOpen(true)}
        addLabel="Add Skill"
        isLoading={isLoading}
      >
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="mb-4 max-w-sm"
        />
        <AdminTable
          headers={["Skill", "Category", "Employees", "Mappings", ""]}
          rows={items.map((s) => [
            <span key="n" className="font-medium">{s.name}</span>,
            s.categoryName,
            s.employeeCount,
            s.mappingCount,
            <DeleteButton key="d" onClick={() => { if (confirm("Delete this skill?")) m.deleteSkill.mutate(s.id); }} loading={m.deleteSkill.isPending} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>Create a new skill in the library.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createSkill.mutate({ name, description, categoryId }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></FormRow>
            <FormRow label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></FormRow>
            <FormRow label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Select category</option>
                {meta?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormRow>
            <Button type="submit" disabled={m.createSkill.isPending}>Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useSkillCategories();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const items = (data as { id: string; name: string; slug: string; skillCount: number; parentName: string | null }[]) ?? [];

  return (
    <>
      <AdminPanel title="Skill Categories" description="Organize skills into hierarchical categories" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Name", "Slug", "Parent", "Skills", ""]}
          rows={items.map((c) => [
            c.name, c.slug, c.parentName ?? "—", c.skillCount,
            <DeleteButton key="d" onClick={() => m.deleteCategory.mutate(c.id)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createCategory.mutate({ name, description }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></FormRow>
            <FormRow label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LevelsTab() {
  const { data, isLoading } = useSkillLevels();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rank, setRank] = useState(1);
  const items = (data as { id: string; name: string; code: string; rank: number; usageCount: number }[]) ?? [];

  return (
    <>
      <AdminPanel title="Skill Levels" description="Proficiency tiers from beginner to expert" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Level", "Code", "Rank", "In Use", ""]}
          rows={items.map((l) => [
            l.name, l.code, l.rank, l.usageCount,
            <DeleteButton key="d" onClick={() => m.deleteLevel.mutate(l.id)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Add Level</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createLevel.mutate({ name, code, rank }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></FormRow>
            <FormRow label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} required /></FormRow>
            <FormRow label="Rank"><Input type="number" value={rank} onChange={(e) => setRank(Number(e.target.value))} min={1} max={10} /></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RelationsTab() {
  const { data, isLoading } = useSkillRelations();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  const [relatedSkillId, setRelatedSkillId] = useState("");
  const [relationType, setRelationType] = useState("RELATED");
  const items = (data as { id: string; skillName: string; relatedSkillName: string; relationType: string }[]) ?? [];

  return (
    <>
      <AdminPanel title="Skill Mapping" description="Define prerequisites and related skill relationships" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Skill", "Related To", "Type", ""]}
          rows={items.map((r) => [
            r.skillName, r.relatedSkillName,
            <Badge key="t" variant="outline">{r.relationType}</Badge>,
            <DeleteButton key="d" onClick={() => m.deleteRelation.mutate(r.id)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Add Skill Relation</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createRelation.mutate({ skillId, relatedSkillId, relationType }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill">
              <Select value={skillId} onChange={(e) => setSkillId(e.target.value)} required>
                <option value="">Select</option>
                {meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Related Skill">
              <Select value={relatedSkillId} onChange={(e) => setRelatedSkillId(e.target.value)} required>
                <option value="">Select</option>
                {meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Type">
              <Select value={relationType} onChange={(e) => setRelationType(e.target.value)}>
                <option value="PREREQUISITE">Prerequisite</option>
                <option value="RELATED">Related</option>
                <option value="COMPLEMENTARY">Complementary</option>
              </Select>
            </FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleMappingsTab() {
  const { data, isLoading } = useRoleMappings();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jobRoleId: "", experienceLevelId: "", skillId: "", requiredSkillLevelId: "", isMandatory: true });
  const items = (data as { id: string; jobRoleTitle: string; experienceLevelName: string; skillName: string; requiredLevelName: string; isMandatory: boolean }[]) ?? [];

  return (
    <>
      <AdminPanel title="Role Mapping" description="Required skills per job role and experience level" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Role", "Experience", "Skill", "Required Level", "Mandatory", ""]}
          rows={items.map((r) => [
            r.jobRoleTitle, r.experienceLevelName, r.skillName, r.requiredLevelName,
            r.isMandatory ? "Yes" : "No",
            <DeleteButton key="d" onClick={() => m.deleteRoleMapping.mutate(r.id)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Add Role Mapping</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createRoleMapping.mutate(form, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Job Role"><Select value={form.jobRoleId} onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })} required><option value="">Select</option>{meta?.jobRoles.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</Select></FormRow>
            <FormRow label="Experience"><Select value={form.experienceLevelId} onChange={(e) => setForm({ ...form, experienceLevelId: e.target.value })} required><option value="">Select</option>{meta?.experienceLevels.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormRow>
            <FormRow label="Skill"><Select value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Required Level"><Select value={form.requiredSkillLevelId} onChange={(e) => setForm({ ...form, requiredSkillLevelId: e.target.value })} required><option value="">Select</option>{meta?.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CourseMappingsTab() {
  const { data, isLoading } = useCourseMappings();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [coveragePercent, setCoveragePercent] = useState(100);
  const items = (data as { id: string; skillName: string; courseTitle: string; coveragePercent: number }[]) ?? [];

  return (
    <>
      <AdminPanel title="Course Mapping" description="Link skills to learning courses" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable headers={["Skill", "Course", "Coverage", ""]} rows={items.map((r) => [r.skillName, r.courseTitle, `${r.coveragePercent}%`, <DeleteButton key="d" onClick={() => m.deleteCourseMapping.mutate(r.id)} />])} />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Map Course to Skill</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createCourseMapping.mutate({ skillId, courseId, coveragePercent }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill"><Select value={skillId} onChange={(e) => setSkillId(e.target.value)} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Course"><Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required><option value="">Select</option>{meta?.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></FormRow>
            <FormRow label="Coverage %"><Input type="number" value={coveragePercent} onChange={(e) => setCoveragePercent(Number(e.target.value))} min={1} max={100} /></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssessmentMappingsTab() {
  const { data, isLoading } = useAssessmentMappings();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const items = (data as { id: string; skillName: string; assessmentTitle: string }[]) ?? [];

  return (
    <>
      <AdminPanel title="Assessment Mapping" description="Assessments that validate skill proficiency" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable headers={["Skill", "Assessment", ""]} rows={items.map((r) => [r.skillName, r.assessmentTitle, <DeleteButton key="d" onClick={() => m.deleteAssessmentMapping.mutate(r.id)} />])} />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Map Assessment</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createAssessmentMapping.mutate({ skillId, assessmentId }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill"><Select value={skillId} onChange={(e) => setSkillId(e.target.value)} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Assessment"><Select value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} required><option value="">Select</option>{meta?.assessments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CertificateMappingsTab() {
  const { data, isLoading } = useCertificateMappings();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  const [certificateTemplateId, setCertificateTemplateId] = useState("");
  const items = (data as { id: string; skillName: string; templateName: string }[]) ?? [];

  return (
    <>
      <AdminPanel title="Certificate Mapping" description="Certificates that attest skill mastery" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable headers={["Skill", "Template", ""]} rows={items.map((r) => [r.skillName, r.templateName, <DeleteButton key="d" onClick={() => m.deleteCertificateMapping.mutate(r.id)} />])} />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Map Certificate</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createCertificateMapping.mutate({ skillId, certificateTemplateId }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill"><Select value={skillId} onChange={(e) => setSkillId(e.target.value)} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Template"><Select value={certificateTemplateId} onChange={(e) => setCertificateTemplateId(e.target.value)} required><option value="">Select</option>{meta?.certificateTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ValidityTab() {
  const { data, isLoading } = useValidityRules();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ skillId: "", validityDays: 365, gracePeriodDays: 30, requiresRecertification: true, reassessmentDaysBeforeExpiry: 60 });
  const items = (data as { skillId: string; skillName: string; validityDays: number; gracePeriodDays: number; requiresRecertification: boolean; reassessmentDaysBeforeExpiry: number }[]) ?? [];

  return (
    <>
      <AdminPanel title="Validity Rules" description="Certification expiry and recertification policies" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Skill", "Validity", "Grace", "Recert", "Reassess Before", ""]}
          rows={items.map((r) => [
            r.skillName, `${r.validityDays}d`, `${r.gracePeriodDays}d`,
            r.requiresRecertification ? "Yes" : "No", `${r.reassessmentDaysBeforeExpiry}d`,
            <DeleteButton key="d" onClick={() => m.deleteValidity.mutate(r.skillId)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Validity Rule</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.upsertValidity.mutate(form, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill"><Select value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Validity (days)"><Input type="number" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })} /></FormRow>
            <FormRow label="Grace period (days)"><Input type="number" value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: Number(e.target.value) })} /></FormRow>
            <FormRow label="Reassess before expiry (days)"><Input type="number" value={form.reassessmentDaysBeforeExpiry} onChange={(e) => setForm({ ...form, reassessmentDaysBeforeExpiry: Number(e.target.value) })} /></FormRow>
            <Button type="submit">Save Rule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WeightageTab() {
  const { data, isLoading } = useWeightageRules();
  const { data: meta } = useSkillMeta();
  const m = useSkillAdminMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ skillId: "", jobRoleId: "", experienceLevelId: "", weight: 10, isMandatory: false });
  const items = (data as { id: string; skillName: string; jobRoleTitle: string | null; experienceLevelName: string | null; weight: number; isMandatory: boolean }[]) ?? [];

  return (
    <>
      <AdminPanel title="Weightage Rules" description="Skill importance weighting for readiness scoring" onAdd={() => setOpen(true)} isLoading={isLoading}>
        <AdminTable
          headers={["Skill", "Role", "Experience", "Weight", "Mandatory", ""]}
          rows={items.map((r) => [
            r.skillName, r.jobRoleTitle ?? "All", r.experienceLevelName ?? "All",
            <Badge key="w" variant="secondary">{r.weight}%</Badge>,
            r.isMandatory ? "Yes" : "No",
            <DeleteButton key="d" onClick={() => m.deleteWeightage.mutate(r.id)} />,
          ])}
        />
      </AdminPanel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader><DialogTitle>Weightage Rule</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.createWeightage.mutate({ ...form, jobRoleId: form.jobRoleId || null, experienceLevelId: form.experienceLevelId || null }, { onSuccess: () => setOpen(false) }); }}>
            <FormRow label="Skill"><Select value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })} required><option value="">Select</option>{meta?.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <FormRow label="Job Role (optional)"><Select value={form.jobRoleId} onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })}><option value="">All roles</option>{meta?.jobRoles.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</Select></FormRow>
            <FormRow label="Experience (optional)"><Select value={form.experienceLevelId} onChange={(e) => setForm({ ...form, experienceLevelId: e.target.value })}><option value="">All levels</option>{meta?.experienceLevels.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormRow>
            <FormRow label="Weight (1-100)"><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} min={1} max={100} /></FormRow>
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
