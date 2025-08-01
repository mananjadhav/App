import type {WorkspaceSplitNavigatorParamList} from '@libs/Navigation/types';
import SCREENS from '@src/SCREENS';

// This file is used to define relation between workspace split navigator's central screens and RHP screens.
const WORKSPACE_TO_RHP: Partial<Record<keyof WorkspaceSplitNavigatorParamList, string[]>> = {
    [SCREENS.WORKSPACE.INITIAL]: [],
    [SCREENS.WORKSPACE.PROFILE]: [
        SCREENS.WORKSPACE.NAME,
        SCREENS.WORKSPACE.ADDRESS,
        SCREENS.WORKSPACE.PLAN,
        SCREENS.WORKSPACE.CURRENCY,
        SCREENS.WORKSPACE.DESCRIPTION,
        SCREENS.WORKSPACE.SHARE,
    ],
    [SCREENS.WORKSPACE.MEMBERS]: [
        SCREENS.WORKSPACE.MEMBER_DETAILS,
        SCREENS.WORKSPACE.MEMBER_CUSTOM_FIELD,
        SCREENS.WORKSPACE.MEMBER_NEW_CARD,
        SCREENS.WORKSPACE.OWNER_CHANGE_CHECK,
        SCREENS.WORKSPACE.OWNER_CHANGE_SUCCESS,
        SCREENS.WORKSPACE.OWNER_CHANGE_ERROR,
        SCREENS.WORKSPACE.OWNER_CHANGE_ERROR,
        SCREENS.WORKSPACE.MEMBERS_IMPORT,
        SCREENS.WORKSPACE.MEMBERS_IMPORTED,
    ],
    [SCREENS.WORKSPACE.WORKFLOWS]: [
        SCREENS.WORKSPACE.WORKFLOWS_APPROVALS_NEW,
        SCREENS.WORKSPACE.WORKFLOWS_APPROVALS_EDIT,
        SCREENS.WORKSPACE.WORKFLOWS_APPROVALS_EXPENSES_FROM,
        SCREENS.WORKSPACE.WORKFLOWS_APPROVALS_APPROVER,
        SCREENS.WORKSPACE.WORKFLOWS_AUTO_REPORTING_FREQUENCY,
        SCREENS.WORKSPACE.WORKFLOWS_AUTO_REPORTING_MONTHLY_OFFSET,
        SCREENS.WORKSPACE.WORKFLOWS_PAYER,
    ],
    [SCREENS.WORKSPACE.ACCOUNTING.ROOT]: [
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_IMPORT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_CHART_OF_ACCOUNTS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_CLASSES,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_TAXES,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_LOCATIONS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_CUSTOMERS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_DATE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_INVOICE_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_OUT_OF_POCKET_EXPENSES_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_COMPANY_CARD_EXPENSE_ACCOUNT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_COMPANY_CARD_EXPENSE_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_COMPANY_CARD_EXPENSE_ACCOUNT_COMPANY_CARD_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_PREFERRED_EXPORTER,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_OUT_OF_POCKET_EXPENSES,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_EXPORT_OUT_OF_POCKET_EXPENSES_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_NON_REIMBURSABLE_DEFAULT_VENDOR_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_ADVANCED,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_ACCOUNT_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_INVOICE_ACCOUNT_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_CLASSES_DISPLAYED_AS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_CUSTOMERS_DISPLAYED_AS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_LOCATIONS_DISPLAYED_AS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_AUTO_SYNC,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_ONLINE_ACCOUNTING_METHOD,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_COMPANY_CARD_EXPENSE_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_COMPANY_CARD_EXPENSE_ACCOUNT_COMPANY_CARD_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_COMPANY_CARD_EXPENSE_ACCOUNT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_NON_REIMBURSABLE_DEFAULT_VENDOR_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_ADVANCED,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT_DATE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT_PREFERRED_EXPORTER,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT_OUT_OF_POCKET_EXPENSES,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT_OUT_OF_POCKET_EXPENSES_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT_OUT_OF_POCKET_EXPENSES_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_EXPORT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_SETUP_MODAL,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_SETUP_REQUIRED_DEVICE_MODAL,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_TRIGGER_FIRST_SYNC,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_IMPORT,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_CHART_OF_ACCOUNTS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_CLASSES,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_CLASSES_DISPLAYED_AS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_CUSTOMERS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_CUSTOMERS_DISPLAYED_AS,
        SCREENS.WORKSPACE.ACCOUNTING.QUICKBOOKS_DESKTOP_ITEMS,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_IMPORT,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_CHART_OF_ACCOUNTS,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_ORGANIZATION,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_CUSTOMER,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_TAXES,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_TRACKING_CATEGORIES,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_MAP_TRACKING_CATEGORY,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_EXPORT,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_EXPORT_PURCHASE_BILL_DATE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_ADVANCED,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_AUTO_SYNC,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_ACCOUNTING_METHOD,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_BILL_STATUS_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_INVOICE_ACCOUNT_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_EXPORT_PREFERRED_EXPORTER_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_BILL_PAYMENT_ACCOUNT_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.XERO_EXPORT_BANK_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_SUBSIDIARY_SELECTOR,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_REUSE_EXISTING_CONNECTIONS,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_TOKEN_INPUT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_MAPPING,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOM_FIELD,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOM_FIELD_VIEW,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOM_FIELD_EDIT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOM_LIST_ADD,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOM_SEGMENT_ADD,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOMERS_OR_PROJECTS,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_IMPORT_CUSTOMERS_OR_PROJECTS_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_PREFERRED_EXPORTER_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_DATE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT_EXPENSES,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT_EXPENSES_DESTINATION_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT_EXPENSES_VENDOR_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT_EXPENSES_PAYABLE_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPORT_EXPENSES_JOURNAL_POSTING_PREFERENCE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_RECEIVABLE_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_INVOICE_ITEM_PREFERENCE_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_INVOICE_ITEM_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_TAX_POSTING_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_PROVINCIAL_TAX_POSTING_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_ADVANCED,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_REIMBURSEMENT_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_COLLECTION_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_EXPENSE_REPORT_APPROVAL_LEVEL_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_VENDOR_BILL_APPROVAL_LEVEL_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_JOURNAL_ENTRY_APPROVAL_LEVEL_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_APPROVAL_ACCOUNT_SELECT,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_CUSTOM_FORM_ID,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_AUTO_SYNC,
        SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_ACCOUNTING_METHOD,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_PREREQUISITES,
        SCREENS.WORKSPACE.ACCOUNTING.ENTER_SAGE_INTACCT_CREDENTIALS,
        SCREENS.WORKSPACE.ACCOUNTING.EXISTING_SAGE_INTACCT_CONNECTIONS,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_ENTITY,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_IMPORT,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_MAPPING_TYPE,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_IMPORT_TAX,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_IMPORT_TAX_MAPPING,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_TOGGLE_MAPPING,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_USER_DIMENSIONS,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_ADD_USER_DIMENSION,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_EDIT_USER_DIMENSION,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_EXPORT,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_PREFERRED_EXPORTER,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_EXPORT_DATE,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_REIMBURSABLE_EXPENSES,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_NON_REIMBURSABLE_EXPENSES,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_REIMBURSABLE_DESTINATION,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_NON_REIMBURSABLE_DESTINATION,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_DEFAULT_VENDOR,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_NON_REIMBURSABLE_CREDIT_CARD_ACCOUNT,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_ADVANCED,
        SCREENS.WORKSPACE.ACCOUNTING.SAGE_INTACCT_PAYMENT_ACCOUNT,
        SCREENS.WORKSPACE.ACCOUNTING.CARD_RECONCILIATION,
        SCREENS.WORKSPACE.ACCOUNTING.RECONCILIATION_ACCOUNT_SETTINGS,
    ],
    [SCREENS.WORKSPACE.TAXES]: [
        SCREENS.WORKSPACE.TAXES_SETTINGS,
        SCREENS.WORKSPACE.TAX_CREATE,
        SCREENS.WORKSPACE.TAXES_SETTINGS_CUSTOM_TAX_NAME,
        SCREENS.WORKSPACE.TAXES_SETTINGS_FOREIGN_CURRENCY_DEFAULT,
        SCREENS.WORKSPACE.TAXES_SETTINGS_WORKSPACE_CURRENCY_DEFAULT,
        SCREENS.WORKSPACE.TAX_CREATE,
        SCREENS.WORKSPACE.TAX_EDIT,
        SCREENS.WORKSPACE.TAX_NAME,
        SCREENS.WORKSPACE.TAX_VALUE,
        SCREENS.WORKSPACE.TAX_CODE,
    ],
    [SCREENS.WORKSPACE.TAGS]: [
        SCREENS.WORKSPACE.TAGS_SETTINGS,
        SCREENS.WORKSPACE.TAGS_EDIT,
        SCREENS.WORKSPACE.TAG_CREATE,
        SCREENS.WORKSPACE.TAG_SETTINGS,
        SCREENS.WORKSPACE.TAG_EDIT,
        SCREENS.WORKSPACE.TAG_LIST_VIEW,
        SCREENS.WORKSPACE.TAG_GL_CODE,
        SCREENS.WORKSPACE.TAG_APPROVER,
        SCREENS.WORKSPACE.TAGS_IMPORT,
        SCREENS.WORKSPACE.TAGS_IMPORT_OPTIONS,
        SCREENS.WORKSPACE.TAGS_IMPORTED,
        SCREENS.WORKSPACE.TAGS_IMPORTED_MULTI_LEVEL,
        SCREENS.WORKSPACE.TAGS_IMPORT_MULTI_LEVEL_SETTINGS,
    ],
    [SCREENS.WORKSPACE.CATEGORIES]: [
        SCREENS.WORKSPACE.CATEGORY_CREATE,
        SCREENS.WORKSPACE.CATEGORY_SETTINGS,
        SCREENS.WORKSPACE.CATEGORIES_IMPORT,
        SCREENS.WORKSPACE.CATEGORIES_IMPORTED,
        SCREENS.WORKSPACE.CATEGORIES_SETTINGS,
        SCREENS.WORKSPACE.CATEGORY_EDIT,
        SCREENS.WORKSPACE.CATEGORY_GL_CODE,
        SCREENS.WORKSPACE.CATEGORY_PAYROLL_CODE,
        SCREENS.WORKSPACE.CATEGORY_DEFAULT_TAX_RATE,
        SCREENS.WORKSPACE.CATEGORY_FLAG_AMOUNTS_OVER,
        SCREENS.WORKSPACE.CATEGORY_DESCRIPTION_HINT,
        SCREENS.WORKSPACE.CATEGORY_APPROVER,
        SCREENS.WORKSPACE.CATEGORY_REQUIRE_RECEIPTS_OVER,
    ],
    [SCREENS.WORKSPACE.DISTANCE_RATES]: [
        SCREENS.WORKSPACE.CREATE_DISTANCE_RATE,
        SCREENS.WORKSPACE.DISTANCE_RATES_SETTINGS,
        SCREENS.WORKSPACE.DISTANCE_RATE_EDIT,
        SCREENS.WORKSPACE.DISTANCE_RATE_NAME_EDIT,
        SCREENS.WORKSPACE.DISTANCE_RATE_TAX_RECLAIMABLE_ON_EDIT,
        SCREENS.WORKSPACE.DISTANCE_RATE_TAX_RATE_EDIT,
        SCREENS.WORKSPACE.DISTANCE_RATE_DETAILS,
    ],
    [SCREENS.WORKSPACE.REPORT_FIELDS]: [
        SCREENS.WORKSPACE.RULES_CUSTOM_NAME,
        SCREENS.WORKSPACE.REPORT_FIELDS_CREATE,
        SCREENS.WORKSPACE.REPORT_FIELDS_SETTINGS,
        SCREENS.WORKSPACE.REPORT_FIELDS_LIST_VALUES,
        SCREENS.WORKSPACE.REPORT_FIELDS_ADD_VALUE,
        SCREENS.WORKSPACE.REPORT_FIELDS_VALUE_SETTINGS,
        SCREENS.WORKSPACE.REPORT_FIELDS_EDIT_VALUE,
        SCREENS.WORKSPACE.REPORT_FIELDS_EDIT_INITIAL_VALUE,
    ],
    [SCREENS.WORKSPACE.INVOICES]: [SCREENS.WORKSPACE.INVOICES_COMPANY_NAME, SCREENS.WORKSPACE.INVOICES_COMPANY_WEBSITE],
    [SCREENS.WORKSPACE.COMPANY_CARDS]: [
        SCREENS.WORKSPACE.COMPANY_CARDS_ADD_NEW,
        SCREENS.WORKSPACE.COMPANY_CARDS_TYPE,
        SCREENS.WORKSPACE.COMPANY_CARDS_INSTRUCTIONS,
        SCREENS.WORKSPACE.COMPANY_CARDS_NAME,
        SCREENS.WORKSPACE.COMPANY_CARDS_DETAILS,
        SCREENS.WORKSPACE.COMPANY_CARDS_SELECT_FEED,
        SCREENS.WORKSPACE.COMPANY_CARDS_BANK_CONNECTION,
        SCREENS.WORKSPACE.COMPANY_CARDS_SETTINGS,
        SCREENS.WORKSPACE.COMPANY_CARDS_SETTINGS_FEED_NAME,
        SCREENS.WORKSPACE.COMPANY_CARDS_SETTINGS_STATEMENT_CLOSE_DATE,
        SCREENS.WORKSPACE.COMPANY_CARDS_ASSIGN_CARD,
        SCREENS.WORKSPACE.COMPANY_CARD_DETAILS,
        SCREENS.WORKSPACE.COMPANY_CARD_NAME,
        SCREENS.WORKSPACE.COMPANY_CARD_EXPORT,
        SCREENS.WORKSPACE.COMPANY_CARDS_TRANSACTION_START_DATE,
    ],
    [SCREENS.WORKSPACE.EXPENSIFY_CARD]: [
        SCREENS.WORKSPACE.EXPENSIFY_CARD_ISSUE_NEW,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_BANK_ACCOUNT,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_SETTINGS,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_SETTINGS_ACCOUNT,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_SETTINGS_FREQUENCY,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_DETAILS,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_NAME,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_LIMIT,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_LIMIT_TYPE,
        SCREENS.WORKSPACE.EXPENSIFY_CARD_SELECT_FEED,
    ],
    [SCREENS.WORKSPACE.RULES]: [
        SCREENS.WORKSPACE.RULES_AUTO_APPROVE_REPORTS_UNDER,
        SCREENS.WORKSPACE.RULES_RANDOM_REPORT_AUDIT,
        SCREENS.WORKSPACE.RULES_AUTO_PAY_REPORTS_UNDER,
        SCREENS.WORKSPACE.RULES_RECEIPT_REQUIRED_AMOUNT,
        SCREENS.WORKSPACE.RULES_MAX_EXPENSE_AMOUNT,
        SCREENS.WORKSPACE.RULES_MAX_EXPENSE_AGE,
        SCREENS.WORKSPACE.RULES_BILLABLE_DEFAULT,
        SCREENS.WORKSPACE.RULES_CUSTOM,
        SCREENS.WORKSPACE.RULES_PROHIBITED_DEFAULT,
    ],
    [SCREENS.WORKSPACE.PER_DIEM]: [
        SCREENS.WORKSPACE.PER_DIEM_IMPORT,
        SCREENS.WORKSPACE.PER_DIEM_IMPORTED,
        SCREENS.WORKSPACE.PER_DIEM_SETTINGS,
        SCREENS.WORKSPACE.PER_DIEM_DETAILS,
        SCREENS.WORKSPACE.PER_DIEM_EDIT_DESTINATION,
        SCREENS.WORKSPACE.PER_DIEM_EDIT_SUBRATE,
        SCREENS.WORKSPACE.PER_DIEM_EDIT_AMOUNT,
        SCREENS.WORKSPACE.PER_DIEM_EDIT_CURRENCY,
    ],
    [SCREENS.WORKSPACE.MORE_FEATURES]: [],
};

export default WORKSPACE_TO_RHP;
