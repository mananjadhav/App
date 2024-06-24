import ConnectionLayout from '@components/ConnectionLayout';
import withPolicyConnections from '@pages/workspace/withPolicyConnections';
import type {WithPolicyConnectionsProps} from '@pages/workspace/withPolicyConnections';
import type { StackScreenProps } from '@react-navigation/stack';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import CONST from '@src/CONST';
import type SCREENS from '@src/SCREENS';
import React from 'react';


type NetSuiteTokenInputPageProps = WithPolicyConnectionsProps & StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.ACCOUNTING.NETSUITE_TOKEN_INPUT>;

function NetSuiteTokenInputPage({policy}: NetSuiteTokenInputPageProps) {

    const policyID = policy?.id ?? '';

    return <ConnectionLayout
    displayName={NetSuiteTokenInputPage.displayName}
    headerTitle="workspace.netsuite.subsidiary"
    accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
    policyID={policyID}
    featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
    shouldIncludeSafeAreaPaddingBottom
>
    Txt Onpt
</ConnectionLayout>;
}

NetSuiteTokenInputPage.displayName = 'NetSuiteTokenInputPage';

export default withPolicyConnections(NetSuiteTokenInputPage);
