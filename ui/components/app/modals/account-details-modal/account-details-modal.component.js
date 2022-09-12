import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
// import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import {
  EVENT,
  EVENT_NAMES,
} from '../../../../../shared/constants/metametrics';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    chainId: PropTypes.string,
    setAccountLabel: PropTypes.func,
    rpcPrefs: PropTypes.object,
    accounts: PropTypes.array,
    history: PropTypes.object,
    hideModal: PropTypes.func,
    blockExplorerLinkText: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const {
      selectedIdentity,
      chainId,
      setAccountLabel,
      rpcPrefs,
      accounts,
      history,
      hideModal,
      blockExplorerLinkText,
    } = this.props;
    const { name, address } = selectedIdentity;

    const getAccountsNames = (allAccounts, currentName) => {
      return Object.values(allAccounts)
        .map((item) => item.name)
        .filter((itemName) => itemName !== currentName);
    };

    const routeToAddBlockExplorerUrl = () => {
      hideModal();
      history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    };

    const openBlockExplorer = () => {
      const accountLink = getAccountLink(address, chainId, rpcPrefs);
      this.context.trackEvent({
        category: EVENT.CATEGORIES.NAVIGATION,
        event: EVENT_NAMES.EXTERNAL_LINK_CLICKED,
        properties: {
          link_type: EVENT.EXTERNAL_LINK_TYPES.ACCOUNT_TRACKER,
          location: 'Account Details Modal',
          url_domain: getURLHostName(accountLink),
        },
      });
      global.platform.openTab({
        url: accountLink,
      });
    };

    return (
      <AccountModalContainer className="account-details-modal">
        <EditableLabel
          className="account-details-modal__name"
          defaultValue={name}
          onSubmit={(label) => setAccountLabel(address, label)}
          accountsNames={getAccountsNames(accounts, name)}
        />

        <QrView
          Qr={{
            data: address,
          }}
        />

        <div className="account-details-modal__divider" />

        <Button
          type="secondary"
          className="account-details-modal__button"
          onClick={
            blockExplorerLinkText.firstPart === 'addBlockExplorer'
              ? routeToAddBlockExplorerUrl
              : openBlockExplorer
          }
        >
          {this.context.t(
            blockExplorerLinkText.firstPart,
            blockExplorerLinkText.secondPart === ''
              ? null
              : [blockExplorerLinkText.secondPart],
          )}
        </Button>
      </AccountModalContainer>
    );
  }
}
