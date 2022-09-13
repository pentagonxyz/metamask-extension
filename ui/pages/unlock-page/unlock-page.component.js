import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createClient } from '@supabase/supabase-js';
import Button from '../../components/ui/button';
import TextField from '../../components/ui/text-field';
// import { SUPPORT_LINK } from '../../helpers/constants/common';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  EVENT,
  EVENT_NAMES,
  // CONTEXT_PROPS,
} from '../../../shared/constants/metametrics';
import {
  REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY,
} from '../../../shared/constants/supabase';

const supabaseClient = createClient(
  REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY,
);

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
    email: '',
    error: null,
  };

  submitting = false;

  failed_attempts = 0;

  animationEventEmitter = new EventEmitter();

  UNSAFE_componentWillMount() {
    const { isUnlocked, history } = this.props;

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE);
    } else {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this.handleLogin(session);
        }
      });
    }
  }

  handleLogin = async (session) => {
    const { onSubmit, forceUpdateMetamaskState /* , showOptInModal */ } =
      this.props;

    if (this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      await onSubmit(session.access_token);
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

  handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { email } = this.state;

    if (email === '' || this.submitting) {
      return;
    }

    this.setState({ error: null });
    this.submitting = true;

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({ email });
      if (error) this.setState({ error: error.error_description || error.message });
      else this.setState({ error: 'Check your email for the login link!' });
    } catch (error) {
      this.setState({ error: error.error_description || error.message });
    } finally {
      this.submitting = false;
    }
  };

  handleInputChange({ target }) {
    this.setState({ email: target.value, error: null });
  }

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
        disabled={!this.state.email}
        variant="contained"
        size="large"
        onClick={this.handleSubmit}
      >
        {this.context.t('sendMagicLink')}
      </Button>
    );
  }

  render() {
    const { email, error } = this.state;
    const { t } = this.context;

    // TODO: Add a "forgot password" button for key recovery
    // const { onRestore } = this.props;

    return (
      <div className="unlock-page__container">
        <div className="unlock-page" data-testid="unlock-page">
          <div className="unlock-page__mascot-container">
            <img src="./images/logo/metamask-fox.svg" alt="" style="width: 120px; height: 120px;" />
          </div>
          <h1 className="unlock-page__title">{t('welcomeBack')}</h1>
          <div>{t('unlockMessage')}</div>
          <form className="unlock-page__form" onSubmit={this.handleSubmit}>
            <TextField
              id="email"
              label={t('email')}
              type="email"
              value={email}
              onChange={(event) => this.handleInputChange(event)}
              error={error}
              autoFocus
              autoComplete="current-email"
              theme="material"
              fullWidth
            />
          </form>
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
          </div> */ }
        </div>
      </div>
    );
  }
}
