import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MetaFoxLogo from '../../../ui/metafox-logo';
import PageContainerFooter from '../../../ui/page-container/page-container-footer';
import {
  EVENT,
  EVENT_NAMES,
} from '../../../../../shared/constants/metametrics';

export default class MetaMetricsOptInModal extends Component {
  static propTypes = {
    setParticipateInMetaMetrics: PropTypes.func,
    hideModal: PropTypes.func,
  };

  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { trackEvent, t } = this.context;
    const { setParticipateInMetaMetrics, hideModal } = this.props;

    return (
      <div className="metametrics-opt-in metametrics-opt-in-modal">
        <div className="metametrics-opt-in__main">
          <div className="metametrics-opt-in__content">
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
          </div>
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={() => {
                setParticipateInMetaMetrics(false).then(() => {
                  trackEvent(
                    {
                      category: EVENT.CATEGORIES.ONBOARDING,
                      event: EVENT_NAMES.METRICS_OPT_OUT,
                      properties: {
                        action: 'Metrics Option',
                        legacy_event: true,
                      },
                    },
                    {
                      isOptIn: true,
                      excludeMetaMetricsId: true,
                    },
                  );
                  hideModal();
                });
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={() => {
                setParticipateInMetaMetrics(true).then(() => {
                  trackEvent(
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
                    },
                  );
                  hideModal();
                });
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
