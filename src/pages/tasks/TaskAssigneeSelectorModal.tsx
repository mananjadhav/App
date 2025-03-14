/* eslint-disable es/no-optional-chaining */
import {useRoute} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {InteractionManager, View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import {useBetas, useSession} from '@components/OnyxProvider';
import {useOptionsList} from '@components/OptionListContextProvider';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import type {ListItem} from '@components/SelectionList/types';
import UserListItem from '@components/SelectionList/UserListItem';
import withCurrentUserPersonalDetails from '@components/withCurrentUserPersonalDetails';
import withNavigationTransitionEnd from '@components/withNavigationTransitionEnd';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ReportActions from '@libs/actions/Report';
import {READ_COMMANDS} from '@libs/API/types';
import HttpUtils from '@libs/HttpUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackRouteProp} from '@libs/Navigation/PlatformStackNavigation/types';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import * as ReportUtils from '@libs/ReportUtils';
import type {TaskDetailsNavigatorParamList} from '@navigation/types';
import * as TaskActions from '@userActions/Task';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {Report} from '@src/types/onyx';

function useOptions() {
    const betas = useBetas();
    const [isLoading, setIsLoading] = useState(true);
    const [searchValue, debouncedSearchValue, setSearchValue] = useDebouncedState('');
    const {options: optionsList, areOptionsInitialized} = useOptionsList();

    const defaultOptions = useMemo(() => {
        const {recentReports, personalDetails, userToInvite, currentUserOption} = OptionsListUtils.getValidOptions(
            {
                reports: optionsList.reports,
                personalDetails: optionsList.personalDetails,
            },
            {
                betas,
                excludeLogins: CONST.EXPENSIFY_EMAILS_OBJECT,
            },
        );

        const headerMessage = OptionsListUtils.getHeaderMessage((recentReports?.length || 0) + (personalDetails?.length || 0) !== 0 || !!currentUserOption, !!userToInvite, '');

        if (isLoading) {
            // eslint-disable-next-line react-compiler/react-compiler
            setIsLoading(false);
        }

        return {
            userToInvite,
            recentReports,
            personalDetails,
            currentUserOption,
            headerMessage,
        };
    }, [optionsList.reports, optionsList.personalDetails, betas, isLoading]);

    const options = useMemo(() => {
        const filteredOptions = OptionsListUtils.filterAndOrderOptions(defaultOptions, debouncedSearchValue.trim(), {
            excludeLogins: CONST.EXPENSIFY_EMAILS_OBJECT,
            maxRecentReportsToShow: CONST.IOU.MAX_RECENT_REPORTS_TO_SHOW,
        });
        const headerMessage = OptionsListUtils.getHeaderMessage(
            (filteredOptions.recentReports?.length || 0) + (filteredOptions.personalDetails?.length || 0) !== 0 || !!filteredOptions.currentUserOption,
            !!filteredOptions.userToInvite,
            debouncedSearchValue,
        );

        return {
            ...filteredOptions,
            headerMessage,
        };
    }, [debouncedSearchValue, defaultOptions]);

    return {...options, searchValue, debouncedSearchValue, setSearchValue, areOptionsInitialized};
}

function TaskAssigneeSelectorModal() {
    const styles = useThemeStyles();
    const route = useRoute<PlatformStackRouteProp<TaskDetailsNavigatorParamList, typeof SCREENS.TASK.ASSIGNEE>>();
    const {translate} = useLocalize();
    const session = useSession();
    const backTo = route.params?.backTo;
    const [reports] = useOnyx(ONYXKEYS.COLLECTION.REPORT);
    const [task] = useOnyx(ONYXKEYS.TASK);
    const [isSearchingForReports] = useOnyx(ONYXKEYS.IS_SEARCHING_FOR_REPORTS, {initWithStoredValues: false});
    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const {userToInvite, recentReports, personalDetails, currentUserOption, searchValue, debouncedSearchValue, setSearchValue, headerMessage, areOptionsInitialized} = useOptions();

    const report: OnyxEntry<Report> = useMemo(() => {
        if (!route.params?.reportID) {
            return;
        }
        const reportOnyx = reports?.[`${ONYXKEYS.COLLECTION.REPORT}${route.params?.reportID}`];
        if (reportOnyx && !ReportUtils.isTaskReport(reportOnyx)) {
            Navigation.isNavigationReady().then(() => {
                Navigation.dismissModal(reportOnyx.reportID);
            });
        }
        return reports?.[`${ONYXKEYS.COLLECTION.REPORT}${route.params?.reportID}`];
    }, [reports, route]);

    const sections = useMemo(() => {
        const sectionsList = [];

        if (currentUserOption) {
            sectionsList.push({
                title: translate('newTaskPage.assignMe'),
                data: [currentUserOption],
                shouldShow: true,
            });
        }

        sectionsList.push({
            title: translate('common.recents'),
            data: recentReports,
            shouldShow: recentReports?.length > 0,
        });

        sectionsList.push({
            title: translate('common.contacts'),
            data: personalDetails,
            shouldShow: personalDetails?.length > 0,
        });

        if (userToInvite) {
            sectionsList.push({
                title: '',
                data: [userToInvite],
                shouldShow: true,
            });
        }

        return sectionsList.map((section) => ({
            ...section,
            data: section.data.map((option) => ({
                ...option,
                text: option.text ?? '',
                alternateText: option.alternateText ?? undefined,
                keyForList: option.keyForList ?? '',
                isDisabled: option.isDisabled ?? undefined,
                login: option.login ?? undefined,
                shouldShowSubscript: option.shouldShowSubscript ?? undefined,
            })),
        }));
    }, [currentUserOption, personalDetails, recentReports, translate, userToInvite]);

    const selectReport = useCallback(
        (option: ListItem) => {
            HttpUtils.cancelPendingRequests(READ_COMMANDS.SEARCH_FOR_REPORTS);
            if (!option) {
                return;
            }

            // Check to see if we're editing a task and if so, update the assignee
            if (report) {
                if (option.accountID !== report.managerID) {
                    const assigneeChatReport = TaskActions.setAssigneeValue(
                        option?.login ?? '',
                        option?.accountID ?? -1,
                        report.reportID,
                        undefined, // passing null as report because for editing task the report will be task details report page not the actual report where task was created
                        OptionsListUtils.isCurrentUser({...option, accountID: option?.accountID ?? -1, login: option?.login ?? ''}),
                    );
                    // Pass through the selected assignee
                    TaskActions.editTaskAssignee(report, session?.accountID ?? -1, option?.login ?? '', option?.accountID, assigneeChatReport);
                }
                InteractionManager.runAfterInteractions(() => {
                    Navigation.dismissModal(report.reportID);
                });
                // If there's no report, we're creating a new task
            } else if (option.accountID) {
                TaskActions.setAssigneeValue(
                    option?.login ?? '',
                    option.accountID ?? -1,
                    task?.shareDestination ?? '',
                    undefined, // passing null as report is null in this condition
                    OptionsListUtils.isCurrentUser({...option, accountID: option?.accountID ?? -1, login: option?.login ?? undefined}),
                );
                InteractionManager.runAfterInteractions(() => {
                    Navigation.goBack(ROUTES.NEW_TASK.getRoute(backTo));
                });
            }
        },
        [session?.accountID, task?.shareDestination, report, backTo],
    );

    const handleBackButtonPress = useCallback(() => Navigation.goBack(!route.params?.reportID ? ROUTES.NEW_TASK.getRoute(backTo) : backTo), [route.params, backTo]);

    const isOpen = ReportUtils.isOpenTaskReport(report);
    const canModifyTask = TaskActions.canModifyTask(report, currentUserPersonalDetails.accountID);
    const isTaskNonEditable = ReportUtils.isTaskReport(report) && (!canModifyTask || !isOpen);

    useEffect(() => {
        ReportActions.searchInServer(debouncedSearchValue);
    }, [debouncedSearchValue]);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            testID={TaskAssigneeSelectorModal.displayName}
        >
            <FullPageNotFoundView shouldShow={isTaskNonEditable}>
                <HeaderWithBackButton
                    title={translate('task.assignee')}
                    onBackButtonPress={handleBackButtonPress}
                />
                <View style={[styles.flex1, styles.w100, styles.pRelative]}>
                    <SelectionList
                        sections={areOptionsInitialized ? sections : []}
                        ListItem={UserListItem}
                        onSelectRow={selectReport}
                        shouldSingleExecuteRowSelect
                        onChangeText={setSearchValue}
                        textInputValue={searchValue}
                        headerMessage={headerMessage}
                        textInputLabel={translate('selectionList.nameEmailOrPhoneNumber')}
                        showLoadingPlaceholder={!areOptionsInitialized}
                        isLoadingNewOptions={!!isSearchingForReports}
                    />
                </View>
            </FullPageNotFoundView>
        </ScreenWrapper>
    );
}

TaskAssigneeSelectorModal.displayName = 'TaskAssigneeSelectorModal';

export default withNavigationTransitionEnd(withCurrentUserPersonalDetails(TaskAssigneeSelectorModal));
