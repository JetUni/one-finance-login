export interface Pockets {
  /**
   * @format "pocket.uuid"
   */
  pocket_id: string;
  type: 'Spending' | 'Saving' | 'Autosave';
  name: string;
  account_number: string;
  routing_number: string;
  balance: number;
  available_balance: number;
  context_user_relation: 'OWNER';
  members: {
    user_id: string;
    relation: 'OWNER';
    preferred_name: string;
    first_name: string;
    last_name: string;
  }[];
  auto_save_enabled?: boolean;
  is_default: boolean;
  /**
   * @format date
   */
  creation_date: string;
  status: 'ACTIVE';
  interest_rate?: number;
  /**
   * @format float
   */
  monthly_interest_rate?: number;
  interest_balance_cap: number;
  /**
   * @format float
   */
  accrued_interest?: number;
  card_auto_save_enabled?: boolean;
  goal_amount?: number;
  /**
   * @format "goal.uuid"
   */
  goal_id?: string;
  /**
   * @format date
   */
  goal_created_on?: string;
  goal_status?: 'STARTED';
}

export interface Transactions {
  trn_id: string;
  pocket_id: string;
  pocket_name: string;
  pocket_type: string;
  balance: number;
  amount: number;
  comment: string;
  sequence_number: number;
  entry_name: string;
  ccy_code: string;
  /**
   * @format date
   */
  date: string;
  /**
   * @description true for
   */
  is_debit: boolean;
  category: 'Transfer';
  description: string;
  user_created_pocket: boolean;
  type: 'PostedTransaction';
  is_disputed: boolean;
  is_recurring: boolean;
  client_display: {
    title: string;
    description: string;
  };
}

export interface TransactionsResponse {
  next?: string;
  type: 'NEXT';
  transactions: Transactions[];
}
