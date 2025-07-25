import React, {useCallback} from 'react';
import {View} from 'react-native';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import InteractiveStepSubHeader from '@components/InteractiveStepSubHeader';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useSubStep from '@hooks/useSubStep';
import type {SubStepProps} from '@hooks/useSubStep/types';
import useThemeStyles from '@hooks/useThemeStyles';
import {addPersonalBankAccount, clearPersonalBankAccount} from '@libs/actions/BankAccounts';
import {continueSetup} from '@libs/actions/PaymentMethods';
import {updateCurrentStep} from '@libs/actions/Wallet';
import Navigation from '@navigation/Navigation';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SetupMethod from './SetupMethod';
import Confirmation from './substeps/ConfirmationStep';
import Plaid from './substeps/PlaidStep';

const plaidSubsteps: Array<React.ComponentType<SubStepProps>> = [Plaid, Confirmation];
function AddBankAccount() {
    const [plaidData] = useOnyx(ONYXKEYS.PLAID_DATA);
    const [personalBankAccount] = useOnyx(ONYXKEYS.PERSONAL_BANK_ACCOUNT);
    const [personalBankAccountDraft] = useOnyx(ONYXKEYS.FORMS.PERSONAL_BANK_ACCOUNT_FORM_DRAFT);
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const submit = useCallback(() => {
        const bankAccounts = plaidData?.bankAccounts ?? [];
        const selectedPlaidBankAccount = bankAccounts.find((bankAccount) => bankAccount.plaidAccountID === personalBankAccountDraft?.plaidAccountID);

        if (selectedPlaidBankAccount) {
            addPersonalBankAccount(selectedPlaidBankAccount);
        }
    }, [personalBankAccountDraft?.plaidAccountID, plaidData?.bankAccounts]);

    const isSetupTypeChosen = personalBankAccountDraft?.setupType === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID;

    const {componentToRender: SubStep, isEditing, screenIndex, nextScreen, prevScreen, moveTo} = useSubStep({bodyContent: plaidSubsteps, startFrom: 0, onFinished: submit});

    const exitFlow = (shouldContinue = false) => {
        const exitReportID = personalBankAccount?.exitReportID;
        const onSuccessFallbackRoute = personalBankAccount?.onSuccessFallbackRoute ?? '';

        if (exitReportID) {
            Navigation.dismissModalWithReport({reportID: exitReportID});
            return;
        }
        if (shouldContinue && onSuccessFallbackRoute) {
            continueSetup(onSuccessFallbackRoute);
            return;
        }
        Navigation.goBack(ROUTES.SETTINGS_WALLET);
    };

    const handleBackButtonPress = () => {
        if (!isSetupTypeChosen) {
            exitFlow();
            return;
        }
        if (screenIndex === 0) {
            clearPersonalBankAccount();
            updateCurrentStep(null);
            Navigation.goBack(ROUTES.SETTINGS_WALLET);
            return;
        }
        prevScreen();
    };

    return (
        <ScreenWrapper
            testID={AddBankAccount.displayName}
            includeSafeAreaPaddingBottom={false}
            shouldEnablePickerAvoiding={false}
            shouldShowOfflineIndicator
        >
            <HeaderWithBackButton
                shouldShowBackButton
                onBackButtonPress={handleBackButtonPress}
                title={translate('bankAccount.addBankAccount')}
            />
            <View style={styles.flex1}>
                {isSetupTypeChosen ? (
                    <>
                        <View style={[styles.ph5, styles.mb5, styles.mt3, {height: CONST.BANK_ACCOUNT.STEPS_HEADER_HEIGHT}]}>
                            <InteractiveStepSubHeader
                                startStepIndex={0}
                                stepNames={CONST.WALLET.STEP_NAMES}
                            />
                        </View>
                        <SubStep
                            isEditing={isEditing}
                            onNext={nextScreen}
                            onMove={moveTo}
                        />
                    </>
                ) : (
                    <SetupMethod />
                )}
            </View>
        </ScreenWrapper>
    );
}

AddBankAccount.displayName = 'AddBankAccountPage';

export default AddBankAccount;
