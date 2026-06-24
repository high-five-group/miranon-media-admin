export interface RegistrationFilters {
  eventId?: string;
  status?: string;
  flagga?: string;
}

export interface PersonFilters {
  search?: string;
  limit?: number;
}

/** Scenario 3: Eventdag — filtrera deltaganden */
export interface AttendanceFilters {
  eventId?: string;
  session?: string;
  status?: string;
}

/** Scenario 8: Väntelista */
export interface WaitlistFilters {
  event?: string;
}

/** Scenario 7: Mailutskick — filtrera utskickslogg */
export interface MailLogFilters {
  status?: string;
  efter?: string;
}
