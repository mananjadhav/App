import React, {useCallback, useMemo, useRef} from 'react';
import {View} from 'react-native';
import * as Expensicons from '@components/Icon/Expensicons';
import ThreeDotsMenu from '@components/ThreeDotsMenu';
import type ThreeDotsMenuProps from '@components/ThreeDotsMenu/types';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import Navigation from '@navigation/Navigation';
import type {AnchorPosition} from '@styles/index';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

const anchorAlignment = {
    horizontal: CONST.MODAL.ANCHOR_ORIGIN_HORIZONTAL.RIGHT,
    vertical: CONST.MODAL.ANCHOR_ORIGIN_VERTICAL.TOP,
};

function CardSectionActions() {
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {translate} = useLocalize();
    const threeDotsMenuContainerRef = useRef<View>(null);

    const overflowMenu: ThreeDotsMenuProps['menuItems'] = useMemo(
        () => [
            {
                icon: Expensicons.CreditCard,
                text: translate('subscription.cardSection.changeCard'),
                onSelected: () => Navigation.navigate(ROUTES.SETTINGS_SUBSCRIPTION_ADD_PAYMENT_CARD),
            },
            {
                icon: Expensicons.MoneyCircle,
                text: translate('subscription.cardSection.changeCurrency'),
                onSelected: () => Navigation.navigate(ROUTES.SETTINGS_SUBSCRIPTION_CHANGE_BILLING_CURRENCY),
            },
        ],
        [translate],
    );

    const calculateAndSetThreeDotsMenuPosition = useCallback(() => {
        if (shouldUseNarrowLayout) {
            return Promise.resolve({horizontal: 0, vertical: 0});
        }
        return new Promise<AnchorPosition>((resolve) => {
            threeDotsMenuContainerRef.current?.measureInWindow((x, y, width, height) => {
                resolve({
                    horizontal: x + width,
                    vertical: y + height,
                });
            });
        });
    }, [shouldUseNarrowLayout]);

    return (
        <View ref={threeDotsMenuContainerRef}>
            <ThreeDotsMenu
                getAnchorPosition={calculateAndSetThreeDotsMenuPosition}
                menuItems={overflowMenu}
                anchorAlignment={anchorAlignment}
                shouldOverlay
            />
        </View>
    );
}

CardSectionActions.displayName = 'CardSectionActions';

export default CardSectionActions;
