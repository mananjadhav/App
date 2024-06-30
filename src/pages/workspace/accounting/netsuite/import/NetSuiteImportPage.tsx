import React from 'react';
import {View} from 'react-native';
import ConnectionLayout from '@components/ConnectionLayout';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ErrorUtils from '@libs/ErrorUtils';
import withPolicyConnections from '@pages/workspace/withPolicyConnections';
import type {WithPolicyConnectionsProps} from '@pages/workspace/withPolicyConnections';
import ToggleSettingOptionRow from '@pages/workspace/workflows/ToggleSettingsOptionRow';
import * as Policy from '@userActions/Policy/Policy';
import CONST from '@src/CONST';

function NetSuiteImportPage({policy}: WithPolicyConnectionsProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const policyID = policy?.id ?? '-1';
    const config = policy?.connections?.netsuite?.options.config;
    const importFields = CONST.NETSUITE_CONFIG.IMPORT_FIELDS;
    const importCustomFields = CONST.NETSUITE_CONFIG.IMPORT_CUSTOM_FIELDS;

    return (
        <ConnectionLayout
            displayName={NetSuiteImportPage.displayName}
            headerTitle="workspace.accounting.import"
            headerSubtitle={config?.subsidiary ?? ''}
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            contentContainerStyle={[styles.pb2]}
            titleStyle={styles.ph5}
            connectionName={CONST.POLICY.CONNECTIONS.NAME.NETSUITE}
        >
            <View style={[styles.flex1, styles.ph5, styles.mb4]}>
                <ToggleSettingOptionRow
                    title={translate('workspace.netsuite.import.expenseCategories')}
                    subtitle={translate('workspace.netsuite.import.expenseCategoriesDescription')}
                    shouldPlaceSubtitleBelowSwitch
                    isActive
                    disabled
                    switchAccessibilityLabel={translate('workspace.netsuite.import.expenseCategories')}
                    onToggle={() => {}}
                />
            </View>

            <View style={styles.mb4}>
                {importFields.map((importField) => (
                    <OfflineWithFeedback
                        key={importField}
                        errors={ErrorUtils.getLatestErrorField(config ?? {}, importField)}
                        errorRowStyles={[styles.ph5, styles.mt2, styles.mb4]}
                        onClose={() => Policy.clearNetSuiteErrorField(policyID, importField)}
                    >
                        <MenuItemWithTopDescription
                            description={translate(`workspace.netsuite.import.importFields.${importField}`)}
                            title={translate(`workspace.accounting.importTypes.${config?.syncOptions?.mapping?.[importField] ?? CONST.INTEGRATION_ENTITY_MAP_TYPES.NETSUITE_DEFAULT}`)}
                            shouldShowRightIcon
                            onPress={() => {
                                // TODO: Navigation will be handled in future PRs
                            }}
                            brickRoadIndicator={config?.errorFields?.[importField] ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined}
                        />
                    </OfflineWithFeedback>
                ))}
            </View>

            <View style={[styles.flex1, styles.ph5, styles.mb4]}>
                <ToggleSettingOptionRow
                    title={translate('common.tax')}
                    subtitle={translate('workspace.netsuite.import.importTaxDescription')}
                    shouldPlaceSubtitleBelowSwitch
                    isActive={config?.syncOptions?.syncTax ?? false}
                    disabled
                    switchAccessibilityLabel={translate('common.tax')}
                    onToggle={() => {}}
                />
            </View>

            <View style={styles.mb4}>
                {importCustomFields.map((importField) => (
                    <OfflineWithFeedback
                        key={importField}
                        errors={ErrorUtils.getLatestErrorField(config ?? {}, importField)}
                        errorRowStyles={[styles.ph5, styles.mt2, styles.mb4]}
                        onClose={() => Policy.clearNetSuiteErrorField(policyID, importField)}
                    >
                        <MenuItemWithTopDescription
                            description={translate(`workspace.netsuite.import.importCustomFields.${importField}`)}
                            shouldShowRightIcon
                            onPress={() => {
                                // TODO: Navigation will be handled in future PRs
                            }}
                            brickRoadIndicator={config?.errorFields?.[importField] ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined}
                        />
                    </OfflineWithFeedback>
                ))}
            </View>
        </ConnectionLayout>
    );
}

NetSuiteImportPage.displayName = 'NetSuiteImportPage';
export default withPolicyConnections(NetSuiteImportPage);
