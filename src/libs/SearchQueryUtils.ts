import cloneDeep from 'lodash/cloneDeep';
import type {OnyxCollection} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import type {LocaleContextProps} from '@components/LocaleContextProvider';
import type {
    ASTNode,
    QueryFilter,
    QueryFilters,
    SearchDateFilterKeys,
    SearchDatePreset,
    SearchFilterKey,
    SearchQueryJSON,
    SearchQueryString,
    SearchStatus,
    UserFriendlyKey,
} from '@components/Search/types';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import type {OnyxCollectionKey, OnyxCollectionValuesMapping} from '@src/ONYXKEYS';
import ONYXKEYS from '@src/ONYXKEYS';
import SCREENS from '@src/SCREENS';
import type {SearchAdvancedFiltersForm} from '@src/types/form';
import FILTER_KEYS, {ALLOWED_TYPE_FILTERS, DATE_FILTER_KEYS} from '@src/types/form/SearchAdvancedFiltersForm';
import type {SearchAdvancedFiltersKey} from '@src/types/form/SearchAdvancedFiltersForm';
import type * as OnyxTypes from '@src/types/onyx';
import type {SearchDataTypes} from '@src/types/onyx/SearchResults';
import {getCardFeedsForDisplay} from './CardFeedUtils';
import {getCardDescription} from './CardUtils';
import {convertToBackendAmount, convertToFrontendAmountAsInteger} from './CurrencyUtils';
import Log from './Log';
import {validateAmount} from './MoneyRequestUtils';
import navigationRef from './Navigation/navigationRef';
import type {SearchFullscreenNavigatorParamList} from './Navigation/types';
import {getPersonalDetailByEmail} from './PersonalDetailsUtils';
import {getCleanedTagName, getTagNamesFromTagsLists} from './PolicyUtils';
import {getReportName} from './ReportUtils';
import {parse as parseSearchQuery} from './SearchParser/searchParser';
import {hashText} from './UserUtils';
import {isValidDate} from './ValidationUtils';

type FilterKeys = keyof typeof CONST.SEARCH.SYNTAX_FILTER_KEYS;

type TodoSearchType = typeof CONST.SEARCH.SEARCH_KEYS.SUBMIT | typeof CONST.SEARCH.SEARCH_KEYS.APPROVE | typeof CONST.SEARCH.SEARCH_KEYS.PAY | typeof CONST.SEARCH.SEARCH_KEYS.EXPORT;

// This map contains chars that match each operator
const operatorToCharMap = {
    [CONST.SEARCH.SYNTAX_OPERATORS.EQUAL_TO]: ':' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.LOWER_THAN]: '<' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.LOWER_THAN_OR_EQUAL_TO]: '<=' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.GREATER_THAN]: '>' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.GREATER_THAN_OR_EQUAL_TO]: '>=' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.NOT_EQUAL_TO]: '!=' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.AND]: ',' as const,
    [CONST.SEARCH.SYNTAX_OPERATORS.OR]: ' ' as const,
};

/**
 * A mapping object that maps filter names from the internal codebase format to user-friendly names.
 */
const UserFriendlyKeyMap: Record<SearchFilterKey | typeof CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_BY | typeof CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_ORDER, UserFriendlyKey> = {
    type: 'type',
    status: 'status',
    sortBy: 'sort-by',
    sortOrder: 'sort-order',
    policyID: 'workspace',
    date: 'date',
    amount: 'amount',
    expenseType: 'expense-type',
    currency: 'currency',
    merchant: 'merchant',
    description: 'description',
    from: 'from',
    to: 'to',
    payer: 'payer',
    exporter: 'exporter',
    category: 'category',
    tag: 'tag',
    taxRate: 'tax-rate',
    cardID: 'card',
    feed: 'feed',
    // cspell:disable-next-line
    reportID: 'reportid',
    keyword: 'keyword',
    in: 'in',
    submitted: 'submitted',
    approved: 'approved',
    paid: 'paid',
    exported: 'exported',
    posted: 'posted',
    groupBy: 'group-by',
    title: 'title',
    assignee: 'assignee',
    billable: 'billable',
    reimbursable: 'reimbursable',
    action: 'action',
};
/**
 * @private
 * Returns string value wrapped in quotes "", if the value contains space or &nbsp; (no-breaking space).
 */
function sanitizeSearchValue(str: string) {
    if (str.includes(' ') || str.includes(`\xA0`)) {
        return `"${str}"`;
    }
    return str;
}

/**
 * @private
 * Returns date filter value for QueryString.
 */
function buildDateFilterQuery(filterValues: Partial<SearchAdvancedFiltersForm>, filterKey: SearchDateFilterKeys) {
    const dateOn = filterValues[`${filterKey}${CONST.SEARCH.DATE_MODIFIERS.ON}`];
    const dateAfter = filterValues[`${filterKey}${CONST.SEARCH.DATE_MODIFIERS.AFTER}`];
    const dateBefore = filterValues[`${filterKey}${CONST.SEARCH.DATE_MODIFIERS.BEFORE}`];

    const dateFilters = [];

    if (dateOn) {
        dateFilters.push(`${filterKey}:${dateOn}`);
    }
    if (dateAfter) {
        dateFilters.push(`${filterKey}>${dateAfter}`);
    }
    if (dateBefore) {
        dateFilters.push(`${filterKey}<${dateBefore}`);
    }

    return dateFilters.join(' ');
}

/**
 * @private
 * Returns amount filter value for QueryString.
 */
function buildAmountFilterQuery(filterValues: Partial<SearchAdvancedFiltersForm>) {
    const lessThan = filterValues[FILTER_KEYS.LESS_THAN];
    const greaterThan = filterValues[FILTER_KEYS.GREATER_THAN];

    let amountFilter = '';
    if (greaterThan) {
        amountFilter += `${CONST.SEARCH.SYNTAX_FILTER_KEYS.AMOUNT}>${greaterThan}`;
    }
    if (lessThan && greaterThan) {
        amountFilter += ' ';
    }
    if (lessThan) {
        amountFilter += `${CONST.SEARCH.SYNTAX_FILTER_KEYS.AMOUNT}<${lessThan}`;
    }

    return amountFilter;
}

/**
 * @private
 * Returns string of correctly formatted filter values from QueryFilters object.
 */
function buildFilterValuesString(filterName: string, queryFilters: QueryFilter[]) {
    const delimiter = filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.KEYWORD ? ' ' : ',';
    let filterValueString = '';
    queryFilters.forEach((queryFilter, index) => {
        // If the previous queryFilter has the same operator (this rule applies only to eq and neq operators) then append the current value
        if (
            index !== 0 &&
            ((queryFilter.operator === 'eq' && queryFilters?.at(index - 1)?.operator === 'eq') || (queryFilter.operator === 'neq' && queryFilters.at(index - 1)?.operator === 'neq'))
        ) {
            filterValueString += `${delimiter}${sanitizeSearchValue(queryFilter.value.toString())}`;
        } else if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.KEYWORD) {
            filterValueString += `${delimiter}${sanitizeSearchValue(queryFilter.value.toString())}`;
        } else {
            filterValueString += ` ${filterName}${operatorToCharMap[queryFilter.operator]}${sanitizeSearchValue(queryFilter.value.toString())}`;
        }
    });

    return filterValueString;
}

/**
 * @private
 * Traverses the AST and returns filters as a QueryFilters object.
 */
function getFilters(queryJSON: SearchQueryJSON) {
    const filters = [] as QueryFilters;
    const filterKeys = Object.values(CONST.SEARCH.SYNTAX_FILTER_KEYS);

    function traverse(node: ASTNode) {
        if (!node.operator) {
            return;
        }

        if (typeof node.left === 'object' && node.left) {
            traverse(node.left);
        }

        if (typeof node.right === 'object' && node.right && !Array.isArray(node.right)) {
            traverse(node.right);
        }

        const nodeKey = node.left as ValueOf<typeof CONST.SEARCH.SYNTAX_FILTER_KEYS>;
        if (!filterKeys.includes(nodeKey)) {
            return;
        }

        const filterArray = [];
        if (!Array.isArray(node.right)) {
            filterArray.push({
                operator: node.operator,
                value: node.right as string | number,
            });
        } else {
            node.right.forEach((element) => {
                filterArray.push({
                    operator: node.operator,
                    value: element,
                });
            });
        }
        filters.push({key: nodeKey, filters: filterArray});
    }

    if (queryJSON.filters) {
        traverse(queryJSON.filters);
    }

    return filters;
}

/**
 * @private
 * Returns an updated filter value for some query filters.
 * - for `AMOUNT` it formats value to "backend" amount
 * - for personal filters it tries to substitute any user emails with accountIDs
 */
function getUpdatedFilterValue(filterName: ValueOf<typeof CONST.SEARCH.SYNTAX_FILTER_KEYS>, filterValue: string | string[]) {
    if (
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.FROM ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.TO ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.PAYER ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.EXPORTER
    ) {
        if (typeof filterValue === 'string') {
            return getPersonalDetailByEmail(filterValue)?.accountID.toString() ?? filterValue;
        }

        return filterValue.map((email) => getPersonalDetailByEmail(email)?.accountID.toString() ?? email);
    }

    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.AMOUNT) {
        if (typeof filterValue === 'string') {
            const backendAmount = convertToBackendAmount(Number(filterValue));
            return Number.isNaN(backendAmount) ? filterValue : backendAmount.toString();
        }
        return filterValue.map((amount) => {
            const backendAmount = convertToBackendAmount(Number(amount));
            return Number.isNaN(backendAmount) ? amount : backendAmount.toString();
        });
    }

    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.REPORT_ID) {
        const cleanReportIDs = (value: string) =>
            value
                .split(',')
                .map((id) => id.trim())
                .filter((id) => id.length > 0)
                .join(',');

        if (typeof filterValue === 'string') {
            return cleanReportIDs(filterValue);
        }
        return filterValue.map(cleanReportIDs);
    }

    return filterValue;
}

/**
 * @private
 * This is a custom collator only for getQueryHashes function.
 * The reason for this is that the computation of hashes should not depend on the locale.
 * This is used to ensure that hashes stay consistent.
 */
const customCollator = new Intl.Collator('en', {usage: 'sort', sensitivity: 'variant', numeric: true, caseFirst: 'upper'});

/**
 * @private
 * Computes and returns a numerical hash for a given queryJSON.
 * Sorts the query keys and values to ensure that hashes stay consistent.
 */
function getQueryHashes(query: SearchQueryJSON): {primaryHash: number; recentSearchHash: number} {
    let orderedQuery = '';
    orderedQuery += `${CONST.SEARCH.SYNTAX_ROOT_KEYS.TYPE}:${query.type}`;
    orderedQuery += ` ${CONST.SEARCH.SYNTAX_ROOT_KEYS.STATUS}:${Array.isArray(query.status) ? query.status.join(',') : query.status}`;
    orderedQuery += ` ${CONST.SEARCH.SYNTAX_ROOT_KEYS.GROUP_BY}:${query.groupBy}`;

    query.flatFilters
        .map((filter) => {
            const filters = cloneDeep(filter.filters);
            filters.sort((a, b) => customCollator.compare(a.value.toString(), b.value.toString()));
            return buildFilterValuesString(filter.key, filters);
        })
        .sort()
        .forEach((filterString) => (orderedQuery += ` ${filterString}`));

    const recentSearchHash = hashText(orderedQuery, 2 ** 32);

    orderedQuery += ` ${CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_BY}:${query.sortBy}`;
    orderedQuery += ` ${CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_ORDER}:${query.sortOrder}`;
    if (query.policyID) {
        orderedQuery += ` ${CONST.SEARCH.SYNTAX_FILTER_KEYS.POLICY_ID}:${Array.isArray(query.policyID) ? query.policyID.join(',') : query.policyID} `;
    }
    const primaryHash = hashText(orderedQuery, 2 ** 32);

    return {primaryHash, recentSearchHash};
}

/**
 * Returns whether a given string is a date preset (e.g. Last month)
 */
function isSearchDatePreset(date: string | undefined): date is SearchDatePreset {
    return Object.values(CONST.SEARCH.DATE_PRESETS).some((datePreset) => datePreset === date);
}

/**
 * Returns whether a given search filter is supported in a given search data type
 */
function isFilterSupported(filter: SearchAdvancedFiltersKey, type: SearchDataTypes) {
    return ALLOWED_TYPE_FILTERS[type].some((supportedFilter) => supportedFilter === filter);
}

/**
 * Parses a given search query string into a structured `SearchQueryJSON` format.
 * This format of query is most commonly shared between components and also sent to backend to retrieve search results.
 *
 * In a way this is the reverse of buildSearchQueryString()
 */
function buildSearchQueryJSON(query: SearchQueryString) {
    try {
        const result = parseSearchQuery(query) as SearchQueryJSON;
        const flatFilters = getFilters(result);

        // Add the full input and hash to the results
        result.inputQuery = query;
        result.flatFilters = flatFilters;
        const {primaryHash, recentSearchHash} = getQueryHashes(result);
        result.hash = primaryHash;
        result.recentSearchHash = recentSearchHash;

        if (result.policyID && typeof result.policyID === 'string') {
            // Ensure policyID is always an array for consistency
            result.policyID = [result.policyID];
        }

        return result;
    } catch (e) {
        console.error(`Error when parsing SearchQuery: "${query}"`, e);
    }
}

/**
 * Formats a given `SearchQueryJSON` object into the string version of query.
 * This format of query is the most basic string format and is used as the query param `q` in search URLs.
 *
 * In a way this is the reverse of buildSearchQueryJSON()
 */
function buildSearchQueryString(queryJSON?: SearchQueryJSON) {
    const queryParts: string[] = [];
    const defaultQueryJSON = buildSearchQueryJSON('');

    for (const [, key] of Object.entries(CONST.SEARCH.SYNTAX_ROOT_KEYS)) {
        const existingFieldValue = queryJSON?.[key];
        const queryFieldValue = existingFieldValue ?? defaultQueryJSON?.[key];

        if (queryFieldValue) {
            if (Array.isArray(queryFieldValue)) {
                queryParts.push(`${key}:${queryFieldValue.join(',')}`);
            } else {
                queryParts.push(`${key}:${queryFieldValue}`);
            }
        }
    }

    if (queryJSON?.policyID) {
        queryParts.push(`${CONST.SEARCH.SYNTAX_FILTER_KEYS.POLICY_ID}:${Array.isArray(queryJSON.policyID) ? queryJSON.policyID.join(',') : queryJSON.policyID}`);
    }

    if (!queryJSON) {
        return queryParts.join(' ');
    }

    const filters = queryJSON.flatFilters;

    for (const filter of filters) {
        const filterValueString = buildFilterValuesString(filter.key, filter.filters);
        queryParts.push(filterValueString.trim());
    }

    return queryParts.join(' ');
}

/**
 * Formats a given object with search filter values into the string version of the query.
 * Main usage is to consume data format that comes from AdvancedFilters Onyx Form Data, and generate query string.
 *
 * Reverse operation of buildFilterFormValuesFromQuery()
 */
function buildQueryStringFromFilterFormValues(filterValues: Partial<SearchAdvancedFiltersForm>) {
    const supportedFilterValues = {...filterValues};

    // When switching types/setting the type, ensure we aren't polluting our query with filters that are
    // only available for the previous type. Remove all filters that are not allowed for the new type
    const providedFilterKeys = Object.keys(supportedFilterValues) as SearchAdvancedFiltersKey[];
    providedFilterKeys.forEach((filter) => {
        if (isFilterSupported(filter, supportedFilterValues.type ?? CONST.SEARCH.DATA_TYPES.EXPENSE)) {
            return;
        }

        supportedFilterValues[filter] = undefined;
    });

    // We separate type and status filters from other filters to maintain hashes consistency for saved searches
    const {type, status, groupBy, ...otherFilters} = supportedFilterValues;
    const filtersString: string[] = [];

    filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_BY}:${CONST.SEARCH.TABLE_COLUMNS.DATE}`);
    filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_ORDER}:${CONST.SEARCH.SORT_ORDER.DESC}`);

    if (type) {
        const sanitizedType = sanitizeSearchValue(type);
        filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.TYPE}:${sanitizedType}`);
    }

    if (groupBy) {
        const sanitizedGroupBy = sanitizeSearchValue(groupBy);
        filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.GROUP_BY}:${sanitizedGroupBy}`);
    }

    if (status && typeof status === 'string') {
        const sanitizedStatus = sanitizeSearchValue(status);
        filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.STATUS}:${sanitizedStatus}`);
    }

    if (status && Array.isArray(status)) {
        const filterValueArray = [...new Set<string>(status)];
        filtersString.push(`${CONST.SEARCH.SYNTAX_ROOT_KEYS.STATUS}:${filterValueArray.map(sanitizeSearchValue).join(',')}`);
    }

    const mappedFilters = Object.entries(otherFilters)
        .map(([filterKey, filterValue]) => {
            if (
                (filterKey === FILTER_KEYS.MERCHANT ||
                    filterKey === FILTER_KEYS.DESCRIPTION ||
                    filterKey === FILTER_KEYS.REIMBURSABLE ||
                    filterKey === FILTER_KEYS.BILLABLE ||
                    filterKey === FILTER_KEYS.TITLE ||
                    filterKey === FILTER_KEYS.PAYER ||
                    filterKey === FILTER_KEYS.ACTION) &&
                filterValue
            ) {
                const keyInCorrectForm = (Object.keys(CONST.SEARCH.SYNTAX_FILTER_KEYS) as FilterKeys[]).find((key) => CONST.SEARCH.SYNTAX_FILTER_KEYS[key] === filterKey);
                if (keyInCorrectForm) {
                    return `${CONST.SEARCH.SYNTAX_FILTER_KEYS[keyInCorrectForm]}:${sanitizeSearchValue(filterValue as string)}`;
                }
            }
            if (filterKey === FILTER_KEYS.REPORT_ID && filterValue) {
                const reportIDs = (filterValue as string)
                    .split(',')
                    .map((id) => id.trim())
                    .filter((id) => id.length > 0);

                const keyInCorrectForm = (Object.keys(CONST.SEARCH.SYNTAX_FILTER_KEYS) as FilterKeys[]).find((key) => CONST.SEARCH.SYNTAX_FILTER_KEYS[key] === filterKey);
                if (keyInCorrectForm && reportIDs.length > 0) {
                    return `${CONST.SEARCH.SYNTAX_FILTER_KEYS[keyInCorrectForm]}:${reportIDs.join(',')}`;
                }
            }

            if (filterKey === FILTER_KEYS.KEYWORD && filterValue) {
                const value = (filterValue as string).split(' ').map(sanitizeSearchValue).join(' ');
                return `${value}`;
            }

            if (
                (filterKey === FILTER_KEYS.CATEGORY ||
                    filterKey === FILTER_KEYS.CARD_ID ||
                    filterKey === FILTER_KEYS.TAX_RATE ||
                    filterKey === FILTER_KEYS.EXPENSE_TYPE ||
                    filterKey === FILTER_KEYS.TAG ||
                    filterKey === FILTER_KEYS.CURRENCY ||
                    filterKey === FILTER_KEYS.FROM ||
                    filterKey === FILTER_KEYS.TO ||
                    filterKey === FILTER_KEYS.FEED ||
                    filterKey === FILTER_KEYS.IN ||
                    filterKey === FILTER_KEYS.ASSIGNEE ||
                    filterKey === FILTER_KEYS.POLICY_ID ||
                    filterKey === FILTER_KEYS.EXPORTER) &&
                Array.isArray(filterValue) &&
                filterValue.length > 0
            ) {
                const filterValueArray = [...new Set<string>(filterValue)];
                const keyInCorrectForm = (Object.keys(CONST.SEARCH.SYNTAX_FILTER_KEYS) as FilterKeys[]).find((key) => CONST.SEARCH.SYNTAX_FILTER_KEYS[key] === filterKey);

                if (keyInCorrectForm) {
                    return `${CONST.SEARCH.SYNTAX_FILTER_KEYS[keyInCorrectForm]}:${filterValueArray.map(sanitizeSearchValue).join(',')}`;
                }
            }

            return undefined;
        })
        .filter((filter): filter is string => !!filter);

    filtersString.push(...mappedFilters);

    DATE_FILTER_KEYS.forEach((dateKey) => {
        const dateFilter = buildDateFilterQuery(filterValues, dateKey);
        filtersString.push(dateFilter);
    });

    const amountFilter = buildAmountFilterQuery(filterValues);
    filtersString.push(amountFilter);

    return filtersString.filter(Boolean).join(' ').trim();
}

function getAllPolicyValues<T extends OnyxCollectionKey>(
    policyID: string[] | undefined,
    key: T,
    policyData: OnyxCollection<OnyxCollectionValuesMapping[T]>,
): Array<OnyxCollectionValuesMapping[T]> {
    if (!policyData || !policyID) {
        return [];
    }

    return policyID.map((id) => policyData?.[`${key}${id}`]).filter((data) => !!data) as Array<OnyxCollectionValuesMapping[T]>;
}

/**
 * Generates object with search filter values, in a format that can be consumed by SearchAdvancedFiltersForm.
 * Main usage of this is to generate the initial values for AdvancedFilters from existing query.
 *
 * Reverse operation of buildQueryStringFromFilterFormValues()
 */
function buildFilterFormValuesFromQuery(
    queryJSON: SearchQueryJSON,
    policyCategories: OnyxCollection<OnyxTypes.PolicyCategories>,
    policyTags: OnyxCollection<OnyxTypes.PolicyTagLists>,
    currencyList: OnyxTypes.CurrencyList,
    personalDetails: OnyxTypes.PersonalDetailsList | undefined,
    cardList: OnyxTypes.CardList,
    reports: OnyxCollection<OnyxTypes.Report>,
    taxRates: Record<string, string[]>,
) {
    const filters = queryJSON.flatFilters;
    const filtersForm = {} as Partial<SearchAdvancedFiltersForm>;
    const policyID = queryJSON.policyID;

    for (const queryFilter of filters) {
        const filterKey = queryFilter.key;
        const filterList = queryFilter.filters;
        const filterValues = filterList.map((item) => item.value.toString());
        if (
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.REPORT_ID ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.MERCHANT ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.DESCRIPTION ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.TITLE ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.ACTION
        ) {
            filtersForm[filterKey] = filterValues.at(0);
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.EXPENSE_TYPE) {
            const validExpenseTypes = new Set(Object.values(CONST.SEARCH.TRANSACTION_TYPE));
            filtersForm[filterKey] = filterValues.filter((expenseType) => validExpenseTypes.has(expenseType as ValueOf<typeof CONST.SEARCH.TRANSACTION_TYPE>));
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.CARD_ID) {
            filtersForm[filterKey] = filterValues.filter((card) => cardList[card]);
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.FEED) {
            filtersForm[filterKey] = filterValues.filter((feed) => feed);
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.TAX_RATE) {
            const allTaxRates = new Set(Object.values(taxRates).flat());
            filtersForm[filterKey] = filterValues.filter((tax) => allTaxRates.has(tax));
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.IN) {
            filtersForm[filterKey] = filterValues.filter((id) => reports?.[`${ONYXKEYS.COLLECTION.REPORT}${id}`]?.reportID);
        }
        if (
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.FROM ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.TO ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.ASSIGNEE ||
            filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.EXPORTER
        ) {
            filtersForm[filterKey] = filterValues.filter((id) => personalDetails && personalDetails[id]);
        }

        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.PAYER) {
            filtersForm[filterKey] = filterValues.find((id) => personalDetails && personalDetails[id]);
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.CURRENCY) {
            const validCurrency = new Set(Object.keys(currencyList));
            filtersForm[filterKey] = filterValues.filter((currency) => validCurrency.has(currency));
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.TAG) {
            const tags = policyID
                ? getAllPolicyValues(policyID, ONYXKEYS.COLLECTION.POLICY_TAGS, policyTags)
                      .map((tagList) => getTagNamesFromTagsLists(tagList ?? {}))
                      .flat()
                : Object.values(policyTags ?? {})
                      .filter((item) => !!item)
                      .map((tagList) => getTagNamesFromTagsLists(tagList ?? {}))
                      .flat();
            const uniqueTags = new Set(tags);
            uniqueTags.add(CONST.SEARCH.TAG_EMPTY_VALUE);
            filtersForm[filterKey] = filterValues.filter((name) => uniqueTags.has(name));
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.CATEGORY) {
            const categories = policyID
                ? getAllPolicyValues(policyID, ONYXKEYS.COLLECTION.POLICY_CATEGORIES, policyCategories)
                      .map((item) => Object.values(item ?? {}).map((category) => category.name))
                      .flat()
                : Object.values(policyCategories ?? {})
                      .map((item) => Object.values(item ?? {}).map((category) => category.name))
                      .flat();
            const uniqueCategories = new Set(categories);
            const emptyCategories = CONST.SEARCH.CATEGORY_EMPTY_VALUE.split(',');
            const hasEmptyCategoriesInFilter = emptyCategories.every((category) => filterValues.includes(category));
            // We split CATEGORY_EMPTY_VALUE into individual values to detect both are present in filterValues.
            // If empty categories are found, append the CATEGORY_EMPTY_VALUE to filtersForm.
            filtersForm[filterKey] = filterValues.filter((name) => uniqueCategories.has(name)).concat(hasEmptyCategoriesInFilter ? [CONST.SEARCH.CATEGORY_EMPTY_VALUE] : []);
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.KEYWORD) {
            filtersForm[filterKey] = filterValues
                ?.map((filter) => {
                    if (filter.includes(' ')) {
                        return `"${filter}"`;
                    }
                    return filter;
                })
                .join(' ');
        }
        if (DATE_FILTER_KEYS.includes(filterKey as SearchDateFilterKeys)) {
            const beforeKey = `${filterKey}${CONST.SEARCH.DATE_MODIFIERS.BEFORE}` as `${SearchDateFilterKeys}${typeof CONST.SEARCH.DATE_MODIFIERS.BEFORE}`;
            const afterKey = `${filterKey}${CONST.SEARCH.DATE_MODIFIERS.AFTER}` as `${SearchDateFilterKeys}${typeof CONST.SEARCH.DATE_MODIFIERS.AFTER}`;
            const onKey = `${filterKey}${CONST.SEARCH.DATE_MODIFIERS.ON}` as `${SearchDateFilterKeys}${typeof CONST.SEARCH.DATE_MODIFIERS.ON}`;

            const beforeFilter = filterList.find((filter) => filter.operator === 'lt' && isValidDate(filter.value.toString()));
            const afterFilter = filterList.find((filter) => filter.operator === 'gt' && isValidDate(filter.value.toString()));
            // The `On` filter could be either a date or a date preset (e.g. Last month)
            const onFilter = filterList.find((filter) => filter.operator === 'eq' && (isValidDate(filter.value.toString()) || isSearchDatePreset(filter.value.toString())));

            filtersForm[beforeKey] = beforeFilter?.value.toString() ?? filtersForm[beforeKey];
            filtersForm[afterKey] = afterFilter?.value.toString() ?? filtersForm[afterKey];
            filtersForm[onKey] = onFilter?.value.toString() ?? filtersForm[onKey];
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.AMOUNT) {
            // backend amount is an integer and is 2 digits longer than frontend amount
            filtersForm[FILTER_KEYS.LESS_THAN] =
                filterList.find((filter) => filter.operator === 'lt' && validateAmount(filter.value.toString(), 0, CONST.IOU.AMOUNT_MAX_LENGTH + 2))?.value.toString() ??
                filtersForm[FILTER_KEYS.LESS_THAN];
            filtersForm[FILTER_KEYS.GREATER_THAN] =
                filterList.find((filter) => filter.operator === 'gt' && validateAmount(filter.value.toString(), 0, CONST.IOU.AMOUNT_MAX_LENGTH + 2))?.value.toString() ??
                filtersForm[FILTER_KEYS.GREATER_THAN];
        }
        if (filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.BILLABLE || filterKey === CONST.SEARCH.SYNTAX_FILTER_KEYS.REIMBURSABLE) {
            const validBooleanTypes = Object.values(CONST.SEARCH.BOOLEAN);
            filtersForm[filterKey] = validBooleanTypes.find((value) => filterValues.at(0) === value);
        }
    }

    const [typeKey, typeValue] = Object.entries(CONST.SEARCH.DATA_TYPES).find(([, value]) => value === queryJSON.type) ?? [];
    filtersForm[FILTER_KEYS.TYPE] = typeValue ? queryJSON.type : CONST.SEARCH.DATA_TYPES.EXPENSE;

    if (typeKey) {
        if (Array.isArray(queryJSON.status)) {
            const validStatuses = queryJSON.status.filter((status) => Object.values(CONST.SEARCH.STATUS[typeKey as keyof typeof CONST.SEARCH.DATA_TYPES]).includes(status));

            if (validStatuses.length) {
                filtersForm[FILTER_KEYS.STATUS] = queryJSON.status.join(',');
            } else {
                filtersForm[FILTER_KEYS.STATUS] = CONST.SEARCH.STATUS.EXPENSE.ALL;
            }
        } else {
            filtersForm[FILTER_KEYS.STATUS] = queryJSON.status;
        }
    }

    if (queryJSON.policyID) {
        filtersForm[FILTER_KEYS.POLICY_ID] = queryJSON.policyID;
    }

    if (queryJSON.groupBy) {
        filtersForm[FILTER_KEYS.GROUP_BY] = queryJSON.groupBy;
    }

    return filtersForm;
}

/**
 * Returns the human-readable "pretty" string for a specified filter value.
 */
function getFilterDisplayValue(
    filterName: string,
    filterValue: string,
    personalDetails: OnyxTypes.PersonalDetailsList | undefined,
    reports: OnyxCollection<OnyxTypes.Report>,
    cardList: OnyxTypes.CardList,
    cardFeeds: OnyxCollection<OnyxTypes.CardFeeds>,
    policies: OnyxCollection<OnyxTypes.Policy>,
) {
    if (
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.FROM ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.TO ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.ASSIGNEE ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.PAYER ||
        filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.EXPORTER
    ) {
        // login can be an empty string
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return personalDetails?.[filterValue]?.displayName || filterValue;
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.CARD_ID) {
        const cardID = parseInt(filterValue, 10);
        if (Number.isNaN(cardID)) {
            return filterValue;
        }
        return getCardDescription(cardID, cardList) || filterValue;
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.IN) {
        return getReportName(reports?.[`${ONYXKEYS.COLLECTION.REPORT}${filterValue}`]) || filterValue;
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.AMOUNT) {
        const frontendAmount = convertToFrontendAmountAsInteger(Number(filterValue));
        return Number.isNaN(frontendAmount) ? filterValue : frontendAmount.toString();
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.TAG) {
        return getCleanedTagName(filterValue);
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.FEED) {
        const cardFeedsForDisplay = getCardFeedsForDisplay(cardFeeds, cardList);
        return cardFeedsForDisplay[filterValue]?.name ?? filterValue;
    }
    if (filterName === CONST.SEARCH.SYNTAX_FILTER_KEYS.POLICY_ID) {
        return policies?.[`${ONYXKEYS.COLLECTION.POLICY}${filterValue}`]?.name ?? filterValue;
    }
    return filterValue;
}

/**
 * Formats a given `SearchQueryJSON` object into the human-readable string version of query.
 * This format of query is the one which we want to display to users.
 * We try to replace every numeric id value with a display version of this value,
 * So: user IDs get turned into emails, report ids into report names etc.
 */
function buildUserReadableQueryString(
    queryJSON: SearchQueryJSON,
    PersonalDetails: OnyxTypes.PersonalDetailsList | undefined,
    reports: OnyxCollection<OnyxTypes.Report>,
    taxRates: Record<string, string[]>,
    cardList: OnyxTypes.CardList,
    cardFeeds: OnyxCollection<OnyxTypes.CardFeeds>,
    policies: OnyxCollection<OnyxTypes.Policy>,
) {
    const {type, status, groupBy, policyID} = queryJSON;
    const filters = queryJSON.flatFilters;

    let title = status ? `type:${type} status:${Array.isArray(status) ? status.join(',') : status}` : `type:${type}`;

    if (groupBy) {
        title += ` group-by:${groupBy}`;
    }

    if (policyID && policyID.length > 0) {
        title += ` workspace:${policyID.map((id) => sanitizeSearchValue(policies?.[`${ONYXKEYS.COLLECTION.POLICY}${id}`]?.name ?? id)).join(',')}`;
    }

    for (const filterObject of filters) {
        const key = filterObject.key;
        const queryFilter = filterObject.filters;

        let displayQueryFilters: QueryFilter[] = [];
        if (key === CONST.SEARCH.SYNTAX_FILTER_KEYS.TAX_RATE) {
            const taxRateIDs = queryFilter.map((filter) => filter.value.toString());
            const taxRateNames = taxRateIDs
                .map((id) => {
                    const taxRate = Object.entries(taxRates)
                        .filter(([, IDs]) => IDs.includes(id))
                        .map(([name]) => name);
                    return taxRate.length > 0 ? taxRate : id;
                })
                .flat();

            const uniqueTaxRateNames = [...new Set(taxRateNames)];

            displayQueryFilters = uniqueTaxRateNames.map((taxRate) => ({
                operator: queryFilter.at(0)?.operator ?? CONST.SEARCH.SYNTAX_OPERATORS.AND,
                value: taxRate,
            }));
        } else if (key === CONST.SEARCH.SYNTAX_FILTER_KEYS.FEED) {
            displayQueryFilters = queryFilter.reduce((acc, filter) => {
                const feedKey = filter.value.toString();
                const cardFeedsForDisplay = getCardFeedsForDisplay(cardFeeds, cardList);
                const plaidFeedName = feedKey?.split(CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID)?.at(1);
                const regularBank = feedKey?.split('_')?.at(1) ?? CONST.DEFAULT_NUMBER_ID;
                const idPrefix = feedKey?.split('_')?.at(0) ?? CONST.DEFAULT_NUMBER_ID;
                const plaidValue = cardFeedsForDisplay[`${idPrefix}_${CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID}${plaidFeedName}` as OnyxTypes.CompanyCardFeed]?.name;
                if (plaidFeedName) {
                    if (plaidValue) {
                        acc.push({operator: filter.operator, value: plaidValue});
                    }
                    return acc;
                }
                const value = cardFeedsForDisplay[`${idPrefix}_${regularBank}` as OnyxTypes.CompanyCardFeed]?.name ?? feedKey;
                acc.push({operator: filter.operator, value});

                return acc;
            }, [] as QueryFilter[]);
        } else if (key === CONST.SEARCH.SYNTAX_FILTER_KEYS.CARD_ID) {
            displayQueryFilters = queryFilter.reduce((acc, filter) => {
                const cardValue = filter.value.toString();
                const cardID = parseInt(cardValue, 10);

                if (cardList?.[cardID]) {
                    if (Number.isNaN(cardID)) {
                        acc.push({operator: filter.operator, value: cardID});
                    } else {
                        acc.push({operator: filter.operator, value: getCardDescription(cardID, cardList) || cardID});
                    }
                }
                return acc;
            }, [] as QueryFilter[]);
        } else {
            displayQueryFilters = queryFilter.map((filter) => ({
                operator: filter.operator,
                value: getFilterDisplayValue(key, filter.value.toString(), PersonalDetails, reports, cardList, cardFeeds, policies),
            }));
        }
        title += buildFilterValuesString(getUserFriendlyKey(key), displayQueryFilters);
    }

    return title;
}

/**
 * Returns properly built QueryString for a canned query, with the optional policyID.
 */
function buildCannedSearchQuery({
    type = CONST.SEARCH.DATA_TYPES.EXPENSE,
    status,
    policyID,
    cardID,
    groupBy,
}: {
    type?: SearchDataTypes;
    status?: SearchStatus;
    policyID?: string;
    cardID?: string;
    groupBy?: string;
} = {}): SearchQueryString {
    let queryString = status ? `type:${type} status:${Array.isArray(status) ? status.join(',') : status}` : `type:${type}`;

    if (groupBy) {
        queryString += ` group-by:${groupBy}`;
    }

    if (policyID) {
        queryString += ` policyID:${policyID}`;
    }

    if (cardID) {
        queryString += ` expense-type:card card:${cardID}`;
    }

    // Parse the query to fill all default query fields with values
    const normalizedQueryJSON = buildSearchQueryJSON(queryString);
    return buildSearchQueryString(normalizedQueryJSON);
}

/**
 * Returns whether a given search query is a Canned query.
 *
 * Canned queries are simple predefined queries, that are defined only using type and status and no additional filters.
 * In addition, they can contain an optional policyID.
 * For example: "type:trip" is a canned query.
 */
function isCannedSearchQuery(queryJSON: SearchQueryJSON) {
    return !queryJSON.filters && !queryJSON.policyID;
}

function isDefaultExpensesQuery(queryJSON: SearchQueryJSON) {
    return queryJSON.type === CONST.SEARCH.DATA_TYPES.EXPENSE && !queryJSON.status && !queryJSON.filters && !queryJSON.groupBy && !queryJSON.policyID;
}

/**
 * Always show `No category` and `No tag` as the first option
 */
const sortOptionsWithEmptyValue = (a: string, b: string, localeCompare: LocaleContextProps['localeCompare']) => {
    if (a === CONST.SEARCH.CATEGORY_EMPTY_VALUE || a === CONST.SEARCH.TAG_EMPTY_VALUE) {
        return -1;
    }
    if (b === CONST.SEARCH.CATEGORY_EMPTY_VALUE || b === CONST.SEARCH.TAG_EMPTY_VALUE) {
        return 1;
    }
    return localeCompare(a, b);
};

/**
 *  Given a search query, this function will standardize the query by replacing display values with their corresponding IDs.
 */
function traverseAndUpdatedQuery(queryJSON: SearchQueryJSON, computeNodeValue: (left: ValueOf<typeof CONST.SEARCH.SYNTAX_FILTER_KEYS>, right: string | string[]) => string | string[]) {
    const standardQuery = cloneDeep(queryJSON);
    const filters = standardQuery.filters;
    const traverse = (node: ASTNode) => {
        if (!node.operator) {
            return;
        }
        if (typeof node.left === 'object') {
            traverse(node.left);
        }
        if (typeof node.right === 'object' && !Array.isArray(node.right)) {
            traverse(node.right);
        }

        if (typeof node.left !== 'object' && (Array.isArray(node.right) || typeof node.right === 'string')) {
            // eslint-disable-next-line no-param-reassign
            node.right = computeNodeValue(node.left, node.right);
        }
    };

    if (filters) {
        traverse(filters);
    }

    standardQuery.flatFilters = getFilters(standardQuery);
    return standardQuery;
}

/**
 * Returns new string query, after parsing it and traversing to update some filter values.
 * If there are any personal emails, it will try to substitute them with accountIDs
 */
function getQueryWithUpdatedValues(query: string) {
    const queryJSON = buildSearchQueryJSON(query);

    if (!queryJSON) {
        Log.alert(`${CONST.ERROR.ENSURE_BUG_BOT} user query failed to parse`, {}, false);
        return;
    }

    const standardizedQuery = traverseAndUpdatedQuery(queryJSON, getUpdatedFilterValue);
    return buildSearchQueryString(standardizedQuery);
}

function getCurrentSearchQueryJSON() {
    const rootState = navigationRef.getRootState();
    const lastPolicyRoute = rootState?.routes?.findLast((route) => route.name === NAVIGATORS.REPORTS_SPLIT_NAVIGATOR || route.name === NAVIGATORS.SEARCH_FULLSCREEN_NAVIGATOR);

    if (!lastPolicyRoute) {
        return;
    }

    const lastSearchRoute = lastPolicyRoute.state?.routes.findLast((route) => route.name === SCREENS.SEARCH.ROOT);
    if (!lastSearchRoute || !lastSearchRoute.params) {
        return;
    }

    const {q: searchParams} = lastSearchRoute.params as SearchFullscreenNavigatorParamList[typeof SCREENS.SEARCH.ROOT];
    const queryJSON = buildSearchQueryJSON(searchParams);
    if (!queryJSON) {
        return;
    }

    return queryJSON;
}

function getTodoSearchQuery(action: TodoSearchType, userAccountID: number | undefined) {
    switch (action) {
        case CONST.SEARCH.SEARCH_KEYS.SUBMIT:
            return buildQueryStringFromFilterFormValues({
                type: CONST.SEARCH.DATA_TYPES.EXPENSE,
                groupBy: CONST.SEARCH.GROUP_BY.REPORTS,
                status: CONST.SEARCH.STATUS.EXPENSE.DRAFTS,
                from: [`${userAccountID}`],
            });
        case CONST.SEARCH.SEARCH_KEYS.APPROVE:
            return buildQueryStringFromFilterFormValues({
                type: CONST.SEARCH.DATA_TYPES.EXPENSE,
                groupBy: CONST.SEARCH.GROUP_BY.REPORTS,
                action: CONST.SEARCH.ACTION_FILTERS.APPROVE,
                to: [`${userAccountID}`],
            });
        case CONST.SEARCH.SEARCH_KEYS.PAY:
            return buildQueryStringFromFilterFormValues({
                type: CONST.SEARCH.DATA_TYPES.EXPENSE,
                groupBy: CONST.SEARCH.GROUP_BY.REPORTS,
                action: CONST.SEARCH.ACTION_FILTERS.PAY,
                reimbursable: CONST.SEARCH.BOOLEAN.YES,
                payer: userAccountID?.toString(),
            });
        case CONST.SEARCH.SEARCH_KEYS.EXPORT:
            return buildQueryStringFromFilterFormValues({
                groupBy: CONST.SEARCH.GROUP_BY.REPORTS,
                action: CONST.SEARCH.ACTION_FILTERS.EXPORT,
                exporter: [`${userAccountID}`],
                exportedOn: CONST.SEARCH.DATE_PRESETS.NEVER,
            });

        default:
            return '';
    }
}

/**
 * Extracts the query text without the filter parts.
 * This is used to determine if a user's core search terms have changed,
 * ignoring any filter modifications.
 *
 * @param searchQuery - The complete search query string
 * @returns The query without filters (core search terms only)
 */
function getQueryWithoutFilters(searchQuery: string) {
    const queryJSON = buildSearchQueryJSON(searchQuery);
    if (!queryJSON) {
        return '';
    }

    const keywordFilter = queryJSON.flatFilters.find((filter) => filter.key === 'keyword');

    return keywordFilter?.filters.map((filter) => filter.value).join(' ') ?? '';
}

/**
 * Converts a filter key from old naming (camelCase) to user friendly naming (kebab-case).
 *
 * There are two types of keys used in the context of Search.
 * The `camelCase` naming (ex: `sortBy`, `taxRate`) is more friendly to developers, but not nice to show to people. This was the default key naming in the past.
 * The "user friendly" naming (ex: `sort-by`, `tax-rate`) was introduced at a later point, to offer better experience for the users.
 * Currently search parsers support both versions as an input, but output the `camelCase` form. Whenever we display some query to the user however, we always do it in the newer pretty format.
 *
 * @example
 * getUserFriendlyKey("taxRate") // returns "tax-rate"
 */
function getUserFriendlyKey(keyName: SearchFilterKey | typeof CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_BY | typeof CONST.SEARCH.SYNTAX_ROOT_KEYS.SORT_ORDER): UserFriendlyKey {
    return UserFriendlyKeyMap[keyName];
}

function shouldHighlight(referenceText: string, searchText: string) {
    if (!referenceText || !searchText) {
        return false;
    }

    const escapedText = searchText
        .toLowerCase()
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|\\s)${escapedText}(?=\\s|$)`, 'i');

    return pattern.test(referenceText.toLowerCase());
}

export {
    isSearchDatePreset,
    isFilterSupported,
    buildSearchQueryJSON,
    buildSearchQueryString,
    buildUserReadableQueryString,
    getFilterDisplayValue,
    buildQueryStringFromFilterFormValues,
    buildFilterFormValuesFromQuery,
    buildCannedSearchQuery,
    isCannedSearchQuery,
    sanitizeSearchValue,
    getQueryWithUpdatedValues,
    getCurrentSearchQueryJSON,
    getQueryWithoutFilters,
    getUserFriendlyKey,
    isDefaultExpensesQuery,
    sortOptionsWithEmptyValue,
    shouldHighlight,
    getAllPolicyValues,
    getTodoSearchQuery,
};
