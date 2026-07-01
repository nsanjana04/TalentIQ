import { AppError } from "@/lib/errors/app-error";
import { resolveZohoConfigFromEnv } from "@/lib/integrations/zoho/config";
import { getZohoAccessToken } from "@/lib/integrations/zoho/token";
import type { ZohoPeopleEmployee } from "@/types/zoho-people";

const PAGE_SIZE = 200;

type ZohoRecord = Record<string, unknown>;

type ZohoGetRecordsResponse = {
  response?: {
    status?: number;
    message?: string;
    result?: ZohoRecord[];
  };
};

function pickString(record: ZohoRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseEmployeeRecord(record: ZohoRecord, index: number): ZohoPeopleEmployee | null {
  const email = pickString(record, [
    "Email address",
    "EmailID",
    "Employee Email",
    "EMPLOYEEMAILALIAS",
    "Email",
    "email",
    "employeemail",
  ]);

  if (!email) return null;

  const firstName =
    pickString(record, ["First Name", "FirstName", "first_name", "firstname"]) ?? "";
  const lastName =
    pickString(record, ["Last Name", "Last Name ", "LastName", "last_name", "lastname"]) ?? "";

  const fullName = pickString(record, ["Employee Name", "EmployeeName", "employeename"]);
  let resolvedFirst = firstName;
  let resolvedLast = lastName;
  if (!resolvedFirst && !resolvedLast && fullName) {
    const parts = fullName.split(/\s+/);
    resolvedFirst = parts[0] ?? "";
    resolvedLast = parts.slice(1).join(" ");
  }

  const status = pickString(record, [
    "Employee Status",
    "Employeestatus",
    "Status",
    "employeestatus",
  ]);

  if (status && !/active/i.test(status)) {
    return null;
  }

  return {
    zohoRecordId:
      pickString(record, ["RecordId", "recordId", "Zoho_ID"]) ?? `zoho-${index}`,
    employeeId: pickString(record, ["Employee ID", "EmployeeID", "employeeid"]),
    email: email.toLowerCase(),
    firstName: resolvedFirst,
    lastName: resolvedLast,
    department: pickString(record, ["Department", "Department Name", "department"]),
    designation: pickString(record, ["Designation", "Job Title", "designation"]),
    team: pickString(record, ["Team", "Team Name", "team"]),
    status,
  };
}

async function fetchEmployeePage(sIndex: number): Promise<ZohoRecord[]> {
  const config = resolveZohoConfigFromEnv();
  if (!config) {
    throw new AppError("BAD_REQUEST", "Zoho People is not configured");
  }

  const accessToken = await getZohoAccessToken(config);
  const url = new URL(`${config.peopleApiUrl}/people/api/forms/employee/getRecords`);
  url.searchParams.set("sIndex", String(sIndex));
  url.searchParams.set("limit", String(PAGE_SIZE));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    cache: "no-store",
  });

  const data = (await response.json()) as ZohoGetRecordsResponse;

  if (!response.ok) {
    throw new AppError(
      "BAD_REQUEST",
      data.response?.message ?? `Zoho People API error (${response.status})`
    );
  }

  if (data.response?.status !== 0) {
    throw new AppError(
      "BAD_REQUEST",
      data.response?.message ?? "Zoho People returned an unexpected response"
    );
  }

  return data.response.result ?? [];
}

export async function fetchAllZohoEmployees(): Promise<ZohoPeopleEmployee[]> {
  const employees: ZohoPeopleEmployee[] = [];
  let sIndex = 1;

  for (let page = 0; page < 50; page++) {
    const records = await fetchEmployeePage(sIndex);
    if (!records.length) break;

    records.forEach((record, index) => {
      const parsed = parseEmployeeRecord(record, sIndex + index);
      if (parsed) employees.push(parsed);
    });

    if (records.length < PAGE_SIZE) break;
    sIndex += PAGE_SIZE;
  }

  return employees;
}
