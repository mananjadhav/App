import {ExpensiMark} from 'expensify-common';
import React from 'react';
import {View} from 'react-native';
import InputWrapper from '@components/Form/InputWrapper';
import RenderHTML from '@components/RenderHTML';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import CONST from '@src/CONST';
import INPUT_IDS from '@src/types/form/NetSuiteCustomFieldForm';

const parser = new ExpensiMark();

function TransactionFieldIDStep() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const fieldLabel = translate(`workspace.netsuite.import.importCustomFields.customLists.fields.transactionFieldID`);

    return (
        <View style={styles.ph5}>
            <Text style={[styles.mb3, styles.textHeadlineLineHeightXXL]}>{translate(`workspace.netsuite.import.importCustomFields.customLists.addForm.transactionFieldIDTitle`)}</Text>
            <InputWrapper
                InputComponent={TextInput}
                inputID={INPUT_IDS.TRANSACTION_FIELD_ID}
                label={fieldLabel}
                aria-label={fieldLabel}
                role={CONST.ROLE.PRESENTATION}
                spellCheck={false}
                shouldSaveDraft
            />
            <View style={[styles.flex1, styles.mv3, styles.renderHTML, styles.textDecorationSkipInkNone]}>
                <RenderHTML html={`<comment>${parser.replace(translate(`workspace.netsuite.import.importCustomFields.customLists.addForm.transactionFieldIDFooter`))}</comment>`} />
            </View>
        </View>
    );
}

TransactionFieldIDStep.displayName = 'TransactionFieldIDStep';
export default TransactionFieldIDStep;