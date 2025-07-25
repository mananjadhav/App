import {useIsFocused} from '@react-navigation/native';
import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import type {ForwardedRef} from 'react';
import {View} from 'react-native';
import Button from '@components/Button';
import SafariFormWrapper from '@components/Form/SafariFormWrapper';
import FormHelpMessage from '@components/FormHelpMessage';
import type {MagicCodeInputHandle} from '@components/MagicCodeInput';
import MagicCodeInput from '@components/MagicCodeInput';
import PressableWithFeedback from '@components/Pressable/PressableWithFeedback';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import type {WithToggleVisibilityViewProps} from '@components/withToggleVisibilityView';
import withToggleVisibilityView from '@components/withToggleVisibilityView';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useOnyx from '@hooks/useOnyx';
import usePrevious from '@hooks/usePrevious';
import useStyleUtils from '@hooks/useStyleUtils';
import useThemeStyles from '@hooks/useThemeStyles';
import AccountUtils from '@libs/AccountUtils';
import canFocusInputOnScreenFocus from '@libs/canFocusInputOnScreenFocus';
import {getLatestErrorMessage} from '@libs/ErrorUtils';
import {isValidRecoveryCode, isValidTwoFactorCode, isValidValidateCode} from '@libs/ValidationUtils';
import ChangeExpensifyLoginLink from '@pages/signin/ChangeExpensifyLoginLink';
import Terms from '@pages/signin/Terms';
import {clearAccountMessages, clearSignInData as sessionActionsClearSignInData, signIn, signInWithValidateCode} from '@userActions/Session';
import {resendValidateCode as userActionsResendValidateCode} from '@userActions/User';
import CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import ONYXKEYS from '@src/ONYXKEYS';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import type ValidateCodeFormProps from './types';

type BaseValidateCodeFormProps = WithToggleVisibilityViewProps &
    ValidateCodeFormProps & {
        /** Specifies autocomplete hints for the system, so it can provide autofill */
        autoComplete: 'sms-otp' | 'one-time-code';
    };

type BaseValidateCodeFormRef = {
    clearSignInData: () => void;
};

type ValidateCodeFormVariant = 'validateCode' | 'twoFactorAuthCode' | 'recoveryCode';

type FormError = Partial<Record<ValidateCodeFormVariant, TranslationPaths>>;

function BaseValidateCodeForm({autoComplete, isUsingRecoveryCode, setIsUsingRecoveryCode, isVisible}: BaseValidateCodeFormProps, forwardedRef: ForwardedRef<BaseValidateCodeFormRef>) {
    const [account] = useOnyx(ONYXKEYS.ACCOUNT, {canBeMissing: true});
    const [credentials] = useOnyx(ONYXKEYS.CREDENTIALS, {canBeMissing: true});
    const [session] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: false});
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const {translate} = useLocalize();
    const isFocused = useIsFocused();
    const {isOffline} = useNetwork();
    const [formError, setFormError] = useState<FormError>({});
    const [validateCode, setValidateCode] = useState(credentials?.validateCode ?? '');
    const [twoFactorAuthCode, setTwoFactorAuthCode] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(CONST.REQUEST_CODE_DELAY as number);
    const [recoveryCode, setRecoveryCode] = useState('');
    const [needToClearError, setNeedToClearError] = useState<boolean>(!!account?.errors);

    const prevRequiresTwoFactorAuth = usePrevious(account?.requiresTwoFactorAuth);
    const prevValidateCode = usePrevious(credentials?.validateCode);

    const inputValidateCodeRef = useRef<MagicCodeInputHandle | undefined>(undefined);
    const input2FARef = useRef<MagicCodeInputHandle | undefined>(undefined);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const hasError = !!account && !isEmptyObject(account?.errors) && !needToClearError;
    const isLoadingResendValidationForm = account?.loadingForm === CONST.FORMS.RESEND_VALIDATE_CODE_FORM;
    const shouldDisableResendValidateCode = isOffline ?? account?.isLoading;
    const isValidateCodeFormSubmitting = AccountUtils.isValidateCodeFormSubmitting(account);

    useEffect(() => {
        if (!(inputValidateCodeRef.current && hasError && (session?.autoAuthState === CONST.AUTO_AUTH_STATE.FAILED || account?.isLoading))) {
            return;
        }
        inputValidateCodeRef.current.blur();
    }, [account?.isLoading, session?.autoAuthState, hasError]);

    useEffect(() => {
        if (!inputValidateCodeRef.current || !canFocusInputOnScreenFocus() || !isVisible || !isFocused) {
            return;
        }
        setTimeRemaining(CONST.REQUEST_CODE_DELAY);
        inputValidateCodeRef.current.focus();
    }, [isVisible, isFocused]);

    useEffect(() => {
        if (!!prevValidateCode || !credentials?.validateCode) {
            return;
        }
        setValidateCode(credentials.validateCode);
    }, [credentials?.validateCode, prevValidateCode]);

    useEffect(() => {
        if (!input2FARef.current || !!prevRequiresTwoFactorAuth || !account?.requiresTwoFactorAuth) {
            return;
        }
        input2FARef.current.focus();
    }, [account?.requiresTwoFactorAuth, prevRequiresTwoFactorAuth]);

    useEffect(() => {
        if (!inputValidateCodeRef.current || validateCode.length > 0) {
            return;
        }
        inputValidateCodeRef.current.clear();
    }, [validateCode]);

    useEffect(() => {
        if (!input2FARef.current || twoFactorAuthCode.length > 0) {
            return;
        }
        input2FARef.current.clear();
    }, [twoFactorAuthCode]);

    useEffect(() => {
        if (timeRemaining > 0) {
            timerRef.current = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
        }
        return () => {
            clearTimeout(timerRef.current);
        };
    }, [timeRemaining]);

    /**
     * Handle text input and clear formError upon text change
     */
    const onTextInput = (text: string, key: ValidateCodeFormVariant) => {
        if (key === 'validateCode') {
            setValidateCode(text);
        }
        if (key === 'twoFactorAuthCode') {
            setTwoFactorAuthCode(text);
        }
        if (key === 'recoveryCode') {
            setRecoveryCode(text.trim());
        }

        setFormError((prevError) => ({...prevError, [key]: undefined}));

        if (account?.errors) {
            clearAccountMessages();
        }
    };

    /**
     * Trigger the reset validate code flow and ensure the 2FA input field is reset to avoid it being permanently hidden
     */
    const resendValidateCode = () => {
        userActionsResendValidateCode(credentials?.login ?? '');
        inputValidateCodeRef.current?.clear();
        // Give feedback to the user to let them know the email was sent so that they don't spam the button.
        setTimeRemaining(CONST.REQUEST_CODE_DELAY);
    };

    /**
     * Clear local sign in states
     */
    const clearLocalSignInData = useCallback(() => {
        setTwoFactorAuthCode('');
        setFormError({});
        setValidateCode('');
        setIsUsingRecoveryCode(false);
        setRecoveryCode('');
    }, [setIsUsingRecoveryCode]);

    /**
     * Clears local and Onyx sign in states
     */
    const clearSignInData = useCallback(() => {
        clearLocalSignInData();
        sessionActionsClearSignInData();
    }, [clearLocalSignInData]);

    useImperativeHandle(forwardedRef, () => ({
        clearSignInData,
    }));

    useEffect(() => {
        if (!needToClearError) {
            return;
        }

        if (account?.errors) {
            clearAccountMessages();
            return;
        }
        setNeedToClearError(false);
    }, [account?.errors, needToClearError]);

    /**
     * Switches between 2fa and recovery code, clears inputs and errors
     */
    const switchBetween2faAndRecoveryCode = () => {
        setIsUsingRecoveryCode(!isUsingRecoveryCode);

        setRecoveryCode('');
        setTwoFactorAuthCode('');

        setFormError((prevError) => ({...prevError, recoveryCode: undefined, twoFactorAuthCode: undefined}));

        if (account?.errors) {
            clearAccountMessages();
        }
    };

    useEffect(() => {
        if (!isLoadingResendValidationForm) {
            return;
        }
        clearLocalSignInData();
        // `clearLocalSignInData` is not required as a dependency, and adding it
        // over complicates things requiring clearLocalSignInData function to use useCallback
        // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    }, [isLoadingResendValidationForm]);

    useEffect(() => {
        if (!hasError) {
            return;
        }

        setFormError({});
    }, [hasError]);

    /**
     * Check that all the form fields are valid, then trigger the submit callback
     */
    const validateAndSubmitForm = useCallback(() => {
        if (account?.isLoading) {
            return;
        }
        if (account?.errors) {
            clearAccountMessages();
        }
        const requiresTwoFactorAuth = account?.requiresTwoFactorAuth;
        if (requiresTwoFactorAuth) {
            if (input2FARef.current) {
                input2FARef.current.blur();
            }
            /**
             * User could be using either recovery code or 2fa code
             */
            if (!isUsingRecoveryCode) {
                if (!twoFactorAuthCode.trim()) {
                    setFormError({twoFactorAuthCode: 'validateCodeForm.error.pleaseFillTwoFactorAuth'});
                    return;
                }
                if (!isValidTwoFactorCode(twoFactorAuthCode)) {
                    setFormError({twoFactorAuthCode: 'passwordForm.error.incorrect2fa'});
                    return;
                }
            } else {
                if (!recoveryCode.trim()) {
                    setFormError({recoveryCode: 'recoveryCodeForm.error.pleaseFillRecoveryCode'});
                    return;
                }
                if (!isValidRecoveryCode(recoveryCode)) {
                    setFormError({recoveryCode: 'recoveryCodeForm.error.incorrectRecoveryCode'});
                    return;
                }
            }
        } else {
            if (inputValidateCodeRef.current) {
                inputValidateCodeRef.current.blur();
            }
            if (!validateCode.trim()) {
                setFormError({validateCode: 'validateCodeForm.error.pleaseFillMagicCode'});
                return;
            }
            if (!isValidValidateCode(validateCode)) {
                setFormError({validateCode: 'validateCodeForm.error.incorrectMagicCode'});
                return;
            }
        }
        setFormError({});

        const recoveryCodeOr2faCode = isUsingRecoveryCode ? recoveryCode : twoFactorAuthCode;

        const accountID = credentials?.accountID;
        if (accountID) {
            signInWithValidateCode(accountID, validateCode, recoveryCodeOr2faCode);
        } else {
            signIn(validateCode, recoveryCodeOr2faCode);
        }
    }, [account?.isLoading, account?.errors, account?.requiresTwoFactorAuth, isUsingRecoveryCode, recoveryCode, twoFactorAuthCode, credentials?.accountID, validateCode]);

    return (
        <SafariFormWrapper>
            {/* At this point, show 2FA only after the user has submitted a magic code and account requires 2FA */}
            {account?.requiresTwoFactorAuth && !!credentials?.validateCode ? (
                <View style={[styles.mv3]}>
                    {isUsingRecoveryCode ? (
                        <TextInput
                            accessibilityLabel={translate('recoveryCodeForm.recoveryCode')}
                            value={recoveryCode}
                            onChangeText={(text) => onTextInput(text, 'recoveryCode')}
                            maxLength={CONST.FORM_CHARACTER_LIMIT}
                            label={translate('recoveryCodeForm.recoveryCode')}
                            errorText={formError?.recoveryCode ? translate(formError?.recoveryCode) : ''}
                            hasError={hasError}
                            onSubmitEditing={validateAndSubmitForm}
                            autoFocus
                        />
                    ) : (
                        <MagicCodeInput
                            autoComplete={autoComplete}
                            ref={(magicCodeInput) => {
                                if (!magicCodeInput) {
                                    return;
                                }
                                input2FARef.current = magicCodeInput;
                            }}
                            name="twoFactorAuthCode"
                            value={twoFactorAuthCode}
                            onChangeText={(text) => onTextInput(text, 'twoFactorAuthCode')}
                            onFulfill={validateAndSubmitForm}
                            maxLength={CONST.TFA_CODE_LENGTH}
                            errorText={formError?.twoFactorAuthCode ? translate(formError?.twoFactorAuthCode) : ''}
                            hasError={hasError}
                            autoFocus
                            key="twoFactorAuthCode"
                        />
                    )}
                    {hasError && <FormHelpMessage message={getLatestErrorMessage(account)} />}
                    <PressableWithFeedback
                        key={isUsingRecoveryCode.toString()}
                        style={[styles.mt2]}
                        onPress={switchBetween2faAndRecoveryCode}
                        hoverDimmingValue={1}
                        disabled={isValidateCodeFormSubmitting}
                        role={CONST.ROLE.BUTTON}
                        accessibilityLabel={isUsingRecoveryCode ? translate('recoveryCodeForm.use2fa') : translate('recoveryCodeForm.useRecoveryCode')}
                    >
                        <Text style={[styles.link]}>{isUsingRecoveryCode ? translate('recoveryCodeForm.use2fa') : translate('recoveryCodeForm.useRecoveryCode')}</Text>
                    </PressableWithFeedback>
                </View>
            ) : (
                <View style={[styles.mv3]}>
                    <MagicCodeInput
                        autoComplete={autoComplete}
                        ref={(magicCodeInput) => {
                            if (!magicCodeInput) {
                                return;
                            }
                            inputValidateCodeRef.current = magicCodeInput;
                        }}
                        name="validateCode"
                        value={validateCode}
                        onChangeText={(text) => onTextInput(text, 'validateCode')}
                        onFulfill={validateAndSubmitForm}
                        errorText={formError?.validateCode ? translate(formError?.validateCode) : ''}
                        hasError={hasError}
                        autoFocus
                        key="validateCode"
                        testID="validateCode"
                    />
                    {hasError && <FormHelpMessage message={getLatestErrorMessage(account)} />}
                    <View style={[styles.alignItemsStart]}>
                        {timeRemaining > 0 && !isOffline ? (
                            <Text style={[styles.mt2]}>
                                {translate('validateCodeForm.requestNewCode')}
                                <Text style={[styles.textBlue]}>00:{String(timeRemaining).padStart(2, '0')}</Text>
                            </Text>
                        ) : (
                            <PressableWithFeedback
                                style={[styles.mt2]}
                                onPress={resendValidateCode}
                                disabled={shouldDisableResendValidateCode}
                                hoverDimmingValue={1}
                                pressDimmingValue={0.2}
                                role={CONST.ROLE.BUTTON}
                                accessibilityLabel={translate('validateCodeForm.magicCodeNotReceived')}
                            >
                                <Text style={[StyleUtils.getDisabledLinkStyles(shouldDisableResendValidateCode)]}>
                                    {hasError ? translate('validateCodeForm.requestNewCodeAfterErrorOccurred') : translate('validateCodeForm.magicCodeNotReceived')}
                                </Text>
                            </PressableWithFeedback>
                        )}
                    </View>
                </View>
            )}
            <View>
                <Button
                    isDisabled={isOffline}
                    success
                    large
                    style={[styles.mv3]}
                    text={translate('common.signIn')}
                    isLoading={isValidateCodeFormSubmitting}
                    onPress={validateAndSubmitForm}
                />
                <ChangeExpensifyLoginLink onPress={clearSignInData} />
            </View>
            <View style={[styles.mt5, styles.signInPageWelcomeTextContainer]}>
                <Terms />
            </View>
        </SafariFormWrapper>
    );
}

BaseValidateCodeForm.displayName = 'BaseValidateCodeForm';

export default withToggleVisibilityView(forwardRef(BaseValidateCodeForm));

export type {BaseValidateCodeFormRef};
