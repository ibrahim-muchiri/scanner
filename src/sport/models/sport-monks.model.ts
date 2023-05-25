interface SubscriptionTime {
  date: string;
  timezone_type: number;
  timezone: string;
}

interface Plan {
  // The name of the plan
  name: string;
  // The price per month
  price_monthly: number;
  // The price per year
  price_yearly: number;
  // The number of API calls per hour before it is rate limited (Code 429)
  request_limit: string;
}

interface SportProduct {
  id: number;
  name: string;
  current: boolean;
}

interface SportMonksResponseMeta {
  /** Time specifications for the subscription */
  subscription: {
    started_at: SubscriptionTime;
    ends_at: SubscriptionTime;
    trial_ends_at: SubscriptionTime;
  };
  /** The list of subscribed plans. */
  plan: Plan[];
  /** Sports that are currently included in the plan. */
  sports: SportProduct[];
  /** Information about pagination / paging (payload is possibly divided into discrete pages) */
  pagination?: {
    // number of all entries available
    total: number;
    // number of entries of current page
    count: number;
    // results per page
    per_page: number;
    // current page (parameter "page" of request)
    current_page: number;
    // number of total pages regarding current page size
    total_pages: number;
    // link to previous and next page
    links: {
      previous?: string;
      next?: string;
    };
  };
}

export interface SportMonksResponse<T = any, S extends SportMonksResponseMeta = SportMonksResponseMeta> {
  data: T;
  meta: S;
}
