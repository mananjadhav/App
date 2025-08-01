import {useNavigationState} from '@react-navigation/native';
import debounce from 'lodash/debounce';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import type {SectionListData} from 'react-native';
import BlockingView from '@components/BlockingViews/BlockingView';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import FormAlertWithSubmitButton from '@components/FormAlertWithSubmitButton';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import {FallbackAvatar} from '@components/Icon/Expensicons';
import * as Illustrations from '@components/Icon/Illustrations';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import InviteMemberListItem from '@components/SelectionList/InviteMemberListItem';
import type {Section} from '@components/SelectionList/types';
import Text from '@components/Text';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {clearApprovalWorkflowApprover, clearApprovalWorkflowApprovers, setApprovalWorkflowApprover} from '@libs/actions/Workflow';
import {canUseTouchScreen} from '@libs/DeviceCapabilities';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {WorkspaceSplitNavigatorParamList} from '@libs/Navigation/types';
import {getSearchValueForPhoneOrEmail, sortAlphabetically} from '@libs/OptionsListUtils';
import {getMemberAccountIDsForWorkspace, goBackFromInvalidPolicy, isPendingDeletePolicy, isPolicyAdmin} from '@libs/PolicyUtils';
import tokenizedSearch from '@libs/tokenizedSearch';
import AccessOrNotFoundWrapper from '@pages/workspace/AccessOrNotFoundWrapper';
import MemberRightIcon from '@pages/workspace/MemberRightIcon';
import withPolicyAndFullscreenLoading from '@pages/workspace/withPolicyAndFullscreenLoading';
import type {WithPolicyAndFullscreenLoadingProps} from '@pages/workspace/withPolicyAndFullscreenLoading';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {Icon} from '@src/types/onyx/OnyxCommon';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';

type WorkspaceWorkflowsApprovalsApproverPageProps = WithPolicyAndFullscreenLoadingProps &
    PlatformStackScreenProps<WorkspaceSplitNavigatorParamList, typeof SCREENS.WORKSPACE.WORKFLOWS_APPROVALS_APPROVER>;

type SelectionListApprover = {
    text: string;
    alternateText: string;
    keyForList: string;
    isSelected: boolean;
    login: string;
    rightElement?: React.ReactNode;
    icons: Icon[];
};
type ApproverSection = SectionListData<SelectionListApprover, Section<SelectionListApprover>>;

function WorkspaceWorkflowsApprovalsApproverPage({policy, personalDetails, isLoadingReportData = true, route}: WorkspaceWorkflowsApprovalsApproverPageProps) {
    const styles = useThemeStyles();
    const {translate, localeCompare} = useLocalize();
    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('');
    const [approvalWorkflow, approvalWorkflowMetadata] = useOnyx(ONYXKEYS.APPROVAL_WORKFLOW, {canBeMissing: true});
    const isApprovalWorkflowLoading = isLoadingOnyxValue(approvalWorkflowMetadata);
    const [selectedApproverEmail, setSelectedApproverEmail] = useState<string | undefined>(undefined);
    const [allApprovers, setAllApprovers] = useState<SelectionListApprover[]>([]);
    const shouldShowTextInput = allApprovers?.length >= CONST.STANDARD_LIST_ITEM_LIMIT;

    // eslint-disable-next-line rulesdir/no-negated-variables
    const shouldShowNotFoundView = (isEmptyObject(policy) && !isLoadingReportData) || !isPolicyAdmin(policy) || isPendingDeletePolicy(policy);
    const approverIndex = Number(route.params.approverIndex) ?? 0;
    const isInitialCreationFlow = approvalWorkflow?.action === CONST.APPROVAL_WORKFLOW.ACTION.CREATE && !route.params.backTo;
    const defaultApprover = policy?.approver ?? policy?.owner;
    const firstApprover = approvalWorkflow?.approvers?.[0]?.email ?? '';
    const rhpRoutes = useNavigationState((state) => state.routes);

    useEffect(() => {
        const currentApprover = approvalWorkflow?.approvers[approverIndex];
        if (!currentApprover) {
            return;
        }

        setSelectedApproverEmail(currentApprover.email);
    }, [approvalWorkflow?.approvers, approverIndex]);

    const employeeList = policy?.employeeList;
    const approversFromWorkflow = approvalWorkflow?.approvers;
    const isDefault = approvalWorkflow?.isDefault;
    const membersEmail = useMemo(() => approvalWorkflow?.members.map((member) => member.email), [approvalWorkflow?.members]);
    const sections: ApproverSection[] = useMemo(() => {
        const approvers: SelectionListApprover[] = [];

        if (isApprovalWorkflowLoading) {
            return [];
        }

        if (employeeList) {
            const availableApprovers = Object.values(employeeList)
                .map((employee): SelectionListApprover | null => {
                    const email = employee.email;

                    if (!email) {
                        return null;
                    }

                    if (policy?.preventSelfApproval && membersEmail?.includes(email)) {
                        return null;
                    }

                    // Do not allow the same email to be added twice
                    const isEmailAlreadyInApprovers = approversFromWorkflow?.some((approver, index) => approver?.email === email && index !== approverIndex);
                    if (isEmailAlreadyInApprovers && selectedApproverEmail !== email) {
                        return null;
                    }

                    // Do not allow the default approver to be added as the first approver
                    if (!isDefault && approverIndex === 0 && defaultApprover === email) {
                        return null;
                    }

                    const policyMemberEmailsToAccountIDs = getMemberAccountIDsForWorkspace(employeeList);
                    const accountID = Number(policyMemberEmailsToAccountIDs[email] ?? '');
                    const {avatar, displayName = email, login} = personalDetails?.[accountID] ?? {};

                    return {
                        text: displayName,
                        alternateText: email,
                        keyForList: email,
                        isSelected: selectedApproverEmail === email,
                        login: email,
                        icons: [{source: avatar ?? FallbackAvatar, type: CONST.ICON_TYPE_AVATAR, name: displayName, id: accountID}],
                        rightElement: (
                            <MemberRightIcon
                                role={employee.role}
                                owner={policy?.owner}
                                login={login}
                            />
                        ),
                    };
                })
                .filter((approver): approver is SelectionListApprover => !!approver);

            approvers.push(...availableApprovers);
            // eslint-disable-next-line react-compiler/react-compiler
            setAllApprovers(approvers);
        }

        const filteredApprovers =
            debouncedSearchTerm !== '' ? tokenizedSearch(approvers, getSearchValueForPhoneOrEmail(debouncedSearchTerm), (option) => [option.text ?? '', option.login ?? '']) : approvers;

        const data = sortAlphabetically(filteredApprovers, 'text', localeCompare);
        return [
            {
                title: undefined,
                data,
                shouldShow: true,
            },
        ];
    }, [
        isApprovalWorkflowLoading,
        approversFromWorkflow,
        isDefault,
        approverIndex,
        debouncedSearchTerm,
        defaultApprover,
        personalDetails,
        employeeList,
        selectedApproverEmail,
        membersEmail,
        policy?.preventSelfApproval,
        policy?.owner,
        localeCompare,
    ]);

    const shouldShowListEmptyContent = !debouncedSearchTerm && !!approvalWorkflow && !sections.at(0)?.data.length && !isApprovalWorkflowLoading;

    const goBack = useCallback(() => {
        let backTo;
        if (isInitialCreationFlow) {
            backTo = ROUTES.WORKSPACE_WORKFLOWS_APPROVALS_EXPENSES_FROM.getRoute(route.params.policyID);
            clearApprovalWorkflowApprovers();
        } else if (approvalWorkflow?.action === CONST.APPROVAL_WORKFLOW.ACTION.EDIT) {
            backTo = rhpRoutes.length > 1 ? undefined : ROUTES.WORKSPACE_WORKFLOWS_APPROVALS_EDIT.getRoute(route.params.policyID, firstApprover);
        } else {
            backTo = ROUTES.WORKSPACE_WORKFLOWS_APPROVALS_NEW.getRoute(route.params.policyID);
        }
        Navigation.goBack(backTo);
    }, [isInitialCreationFlow, approvalWorkflow?.action, route.params.policyID, rhpRoutes.length, firstApprover]);

    const nextStep = useCallback(() => {
        if (selectedApproverEmail) {
            const policyMemberEmailsToAccountIDs = getMemberAccountIDsForWorkspace(employeeList);
            const accountID = Number(policyMemberEmailsToAccountIDs[selectedApproverEmail] ?? '');
            const {avatar, displayName = selectedApproverEmail} = personalDetails?.[accountID] ?? {};
            setApprovalWorkflowApprover(
                {
                    email: selectedApproverEmail,
                    avatar,
                    displayName,
                },
                approverIndex,
                route.params.policyID,
            );
        } else {
            clearApprovalWorkflowApprover(approverIndex);
        }

        if (isInitialCreationFlow) {
            Navigation.navigate(ROUTES.WORKSPACE_WORKFLOWS_APPROVALS_NEW.getRoute(route.params.policyID));
        } else {
            goBack();
        }
    }, [selectedApproverEmail, employeeList, personalDetails, approverIndex, route.params.policyID, isInitialCreationFlow, goBack]);

    const button = useMemo(() => {
        let buttonText = isInitialCreationFlow ? translate('common.next') : translate('common.save');

        if (shouldShowListEmptyContent) {
            buttonText = translate('common.buttonConfirm');
        }

        return (
            <FormAlertWithSubmitButton
                isDisabled={!shouldShowListEmptyContent && !selectedApproverEmail && isInitialCreationFlow}
                buttonText={buttonText}
                onSubmit={nextStep}
                containerStyles={[styles.flexReset, styles.flexGrow0, styles.flexShrink0, styles.flexBasisAuto]}
                enabledWhenOffline
                shouldBlendOpacity
            />
        );
    }, [isInitialCreationFlow, nextStep, selectedApproverEmail, shouldShowListEmptyContent, styles.flexBasisAuto, styles.flexGrow0, styles.flexReset, styles.flexShrink0, translate]);

    const toggleApprover = useCallback(
        (approver: SelectionListApprover) =>
            debounce(() => {
                if (selectedApproverEmail === approver.login) {
                    setSelectedApproverEmail(undefined);
                    return;
                }
                setSelectedApproverEmail(approver.login);
            }, 200)(),
        [selectedApproverEmail],
    );

    const headerMessage = useMemo(() => (searchTerm && !sections.at(0)?.data?.length ? translate('common.noResultsFound') : ''), [searchTerm, sections, translate]);

    const listEmptyContent = useMemo(
        () => (
            <BlockingView
                icon={Illustrations.TurtleInShell}
                iconWidth={variables.emptyListIconWidth}
                iconHeight={variables.emptyListIconHeight}
                title={translate('workflowsPage.emptyContent.title')}
                subtitle={translate('workflowsPage.emptyContent.approverSubtitle')}
                subtitleStyle={styles.textSupporting}
                containerStyle={styles.pb10}
                contentFitImage="contain"
            />
        ),
        [translate, styles.textSupporting, styles.pb10],
    );

    return (
        <AccessOrNotFoundWrapper
            policyID={route.params.policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_WORKFLOWS_ENABLED}
        >
            <ScreenWrapper
                testID={WorkspaceWorkflowsApprovalsApproverPage.displayName}
                enableEdgeToEdgeBottomSafeAreaPadding
            >
                <FullPageNotFoundView
                    shouldShow={shouldShowNotFoundView}
                    subtitleKey={isEmptyObject(policy) ? undefined : 'workspace.common.notAuthorized'}
                    onBackButtonPress={goBackFromInvalidPolicy}
                    onLinkPress={goBackFromInvalidPolicy}
                    addBottomSafeAreaPadding
                >
                    <HeaderWithBackButton
                        title={translate('workflowsPage.approver')}
                        onBackButtonPress={goBack}
                    />
                    {approvalWorkflow?.action === CONST.APPROVAL_WORKFLOW.ACTION.CREATE && !shouldShowListEmptyContent && (
                        <Text style={[styles.textHeadlineH1, styles.mh5, styles.mv3]}>{translate('workflowsApproverPage.header')}</Text>
                    )}
                    <SelectionList
                        sections={sections}
                        ListItem={InviteMemberListItem}
                        textInputLabel={shouldShowListEmptyContent ? undefined : translate('selectionList.findMember')}
                        textInputValue={searchTerm}
                        onChangeText={setSearchTerm}
                        headerMessage={headerMessage}
                        onSelectRow={toggleApprover}
                        showScrollIndicator
                        shouldPreventDefaultFocusOnSelectRow={!canUseTouchScreen()}
                        footerContent={button}
                        listEmptyContent={listEmptyContent}
                        shouldShowListEmptyContent={shouldShowListEmptyContent}
                        initiallyFocusedOptionKey={selectedApproverEmail}
                        shouldUpdateFocusedIndex
                        shouldShowTextInput={shouldShowTextInput}
                        addBottomSafeAreaPadding
                    />
                </FullPageNotFoundView>
            </ScreenWrapper>
        </AccessOrNotFoundWrapper>
    );
}

WorkspaceWorkflowsApprovalsApproverPage.displayName = 'WorkspaceWorkflowsApprovalsApproverPage';

export default withPolicyAndFullscreenLoading(WorkspaceWorkflowsApprovalsApproverPage);
