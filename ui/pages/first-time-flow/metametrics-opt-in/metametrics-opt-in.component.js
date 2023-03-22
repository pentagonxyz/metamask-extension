import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { INITIALIZE_UNLOCK_ROUTE } from '../../../helpers/constants/routes';

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    history: PropTypes.object,
    setParticipateInMetaMetrics: PropTypes.func,
    participateInMetaMetrics: PropTypes.bool,
    createNewVaultAndGetSeedPhrase: PropTypes.func,
    setCompletedOnboarding: PropTypes.func,
  };

  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { trackEvent, t } = this.context;
    const {
      history,
      setParticipateInMetaMetrics,
      participateInMetaMetrics,
      createNewVaultAndGetSeedPhrase,
      setCompletedOnboarding,
    } = this.props;

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <MetaFoxLogo />
          <div className="metametrics-opt-in__body-graphic">
            <img src="images/metrics-chart.svg" alt="" />
          </div>
          <div className="metametrics-opt-in__title">
            {t('metametricsHelpImproveMetaMask')}
          </div>
          <div className="metametrics-opt-in__body">
            <div className="metametrics-opt-in__description">
              {t('metametricsOptInDescription')}
            </div>
          </div>
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={async () => {
                await setParticipateInMetaMetrics(false);
                await createNewVaultAndGetSeedPhrase();
                await setCompletedOnboarding();
                history.push(INITIALIZE_UNLOCK_ROUTE);
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={async () => {
                await setParticipateInMetaMetrics(true);
                try {
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === false
                  ) {
                    await trackEvent(
                      {
                        category: EVENT.CATEGORIES.ONBOARDING,
                        event: EVENT_NAMES.METRICS_OPT_IN,
                        properties: {
                          action: 'Metrics Option',
                          legacy_event: true,
                        },
                      },
                      {
                        isOptIn: true,
                        flushImmediately: true,
                      },
                    );
                  }
                } finally {
                  await createNewVaultAndGetSeedPhrase();
                  await setCompletedOnboarding();
                  history.push(INITIALIZE_UNLOCK_ROUTE);
                }
              }}
              submitText={t('affirmAgree')}
              disabled={false}
            />
          </div>
        </div>
      </div>
    );
  }
}
