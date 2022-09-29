import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/button';
// import { SUPPORT_LINK } from '../../helpers/constants/common';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  EVENT,
  EVENT_NAMES,
  // CONTEXT_PROPS,
} from '../../../shared/constants/metametrics';

export default class UnlockPage extends Component {
  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  static propTypes = {
    /**
     * History router for redirect after action
     */
    history: PropTypes.object.isRequired,
    /**
     * If isUnlocked is true will redirect to most recent route in history
     */
    isUnlocked: PropTypes.bool,
    /**
     * onClick handler for "Forgot password?" link
     */
    // onRestore: PropTypes.func,
    /**
     * onSumbit handler when form is submitted
     */
    onSubmit: PropTypes.func,
    /**
     * Force update metamask data state
     */
    forceUpdateMetamaskState: PropTypes.func,
    /**
     * Event handler to show metametrics modal
     */
    // showOptInModal: PropTypes.func,
  };

  state = {
    error: null,
  };

  submitting = false;

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  UNSAFE_componentWillMount() {
    const { isUnlocked, history } = this.props;

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
    }
  }

  handleLogin = async (session_access_token) => {
    const { onSubmit, forceUpdateMetamaskState /* , showOptInModal */ } =
      this.props;

    if (this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      await onSubmit(session_access_token);
      /* const newState = */ await forceUpdateMetamaskState();
      this.context.trackEvent(
        {
          category: EVENT.CATEGORIES.NAVIGATION,
          event: EVENT_NAMES.APP_UNLOCKED,
          properties: {
            failed_attempts: this.failed_attempts,
          },
        },
        {
          isNewVisit: true,
        },
      );

      // TODO: Re-enable analytics
      /* if (
        newState.participateInMetaMetrics === null ||
        newState.participateInMetaMetrics === undefined
      ) {
        showOptInModal();
      } */
    } catch ({ message }) {
      this.failed_attempts += 1;
      this.setState({ error: message });
      this.submitting = false;
    }
  };

  handleSubmit = async () => {
    if (this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      chrome.windows.create({
        url: 'http://localhost:3000/login/?login_source=extension',
        focused: true,
        type: 'popup',
        width: 400,
        height: 700,
      });
    } catch (error) {
      this.setState({ error: error.error_description || error.message });
    } finally {
      this.submitting = false;
    }
  };

  renderSubmitButton() {
    const style = {
      backgroundColor: 'var(--color-primary-default)',
      color: 'var(--color-primary-inverse)',
      marginTop: '20px',
      height: '60px',
      fontWeight: '400',
      boxShadow: 'none',
      borderRadius: '100px',
    };

    return (
      <Button
        type="submit"
        style={style}
        variant="contained"
        size="large"
        onClick={() => this.handleSubmit()}
      >
        {this.context.t('signInWithKevlar')}
      </Button>
    );
  }

  render() {
    const { error } = this.state;
    const { t } = this.context;

    // TODO: Add a "forgot password" button for key recovery
    // const { onRestore } = this.props;

    return (
      <div className="unlock-page__container">
        <div className="unlock-page" data-testid="unlock-page">
          <div className="unlock-page__mascot-container">
            <img
              src="./images/logo/metamask-fox.svg"
              alt=""
              style={{ width: '120px', height: '120px' }}
            />
          </div>
          <h1 className="unlock-page__title">{t('welcomeBack')}</h1>
          <div style={{ marginBottom: '10px' }}>{t('unlockMessage')}</div>
          {error ? (
            <div
              style={{
                background: '#ff8080',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
                padding: '5px 10px',
                marginTop: '20px',
              }}
            >
              {error}
            </div>
          ) : null}
          {this.renderSubmitButton()}
          {/* <div className="unlock-page__links">
            <Button
              type="link"
              key="import-account"
              className="unlock-page__link"
              onClick={() => onRestore()}
            >
              {t('forgotPassword')}
            </Button>
          </div>
          <div className="unlock-page__support">
            {t('needHelp', [
              <a
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                key="need-help-link"
                onClick={() => {
                  this.context.trackEvent(
                    {
                      category: EVENT.CATEGORIES.NAVIGATION,
                      event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
                      properties: {
                        url: SUPPORT_LINK,
                      },
                    },
                    {
                      contextPropsIntoEventProperties: [
                        CONTEXT_PROPS.PAGE_TITLE,
                      ],
                    },
                  );
                }}
              >
                {t('needHelpLinkText')}
              </a>,
            ])}
          </div> */}
        </div>
      </div>
    );
  }
}
