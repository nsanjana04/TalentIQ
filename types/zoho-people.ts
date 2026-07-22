export interface ZohoPeopleEmployee {
  zohoRecordId: string;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  department: string | null;
  designation: string | null;
  team: string | null;
  status: string | null;
}

export interface ZohoPeopleConfigStatus {
  enabled: boolean;
  configured: boolean;
  accountsUrl: string;
  peopleApiUrl: string;
}

export interface ZohoPeopleFetchResult {
  employees: ZohoPeopleEmployee[];
  total: number;
  source: "zoho";
}

export interface ZohoMatchedEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teamName: string | null;
  departmentName: string | null;
  zohoEmployeeId: string | null;
}
