import EventEmitter from 'events';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
} from '../../../helpers/constants/routes';
import { isBeta } from '../../../helpers/utils/build-types';
import WelcomeFooter from './welcome-footer.component';
import BetaWelcomeFooter from './beta-welcome-footer.component';
import { INITIALIZE_UNLOCK_ROUTE } from '../../../helpers/constants/routes';

export default class Welcome extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    participateInMetaMetrics: PropTypes.bool,
    welcomeScreenSeen: PropTypes.bool,
    isInitialized: PropTypes.bool,
    setParticipateInMetaMetrics: PropTypes.func,
    createNewVaultAndGetSeedPhrase: PropTypes.func,
    setCompletedOnboarding: PropTypes.func
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.animationEventEmitter = new EventEmitter();
  }

  componentDidMount() {
    const {
      history,
      participateInMetaMetrics,
      welcomeScreenSeen,
      isInitialized,
    } = this.props;

    if (
      welcomeScreenSeen &&
      isInitialized &&
      participateInMetaMetrics !== null
    ) {
      history.push(INITIALIZE_CREATE_PASSWORD_ROUTE);
    } else if (welcomeScreenSeen && participateInMetaMetrics !== null) {
      history.push(INITIALIZE_SELECT_ACTION_ROUTE);
    } else if (welcomeScreenSeen) {
      history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
    }
  }

  handleContinue = async () => {
    const {
      history,
      setParticipateInMetaMetrics,
      createNewVaultAndGetSeedPhrase,
      setCompletedOnboarding
    } = this.props;

    await setParticipateInMetaMetrics(true);
    await createNewVaultAndGetSeedPhrase();
    await setCompletedOnboarding();
    history.push(INITIALIZE_UNLOCK_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="welcome-page__wrapper">
        <div className="welcome-page">
          <img
            src="./images/logo/metamask-fox.svg"
            alt=""
            style={{width: '125px', height: '125px'}}
          />
          {isBeta() ? <BetaWelcomeFooter /> : <WelcomeFooter />}
          <Button
            type="primary"
            className="first-time-flow__button"
            onClick={this.handleContinue}
            data-testid="first-time-flow__button"
          >
            {t('getStarted')}
          </Button>
        </div>
      </div>
    );
  }
}
