import { EventEmitter } from 'events';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Auth } from '@supabase/ui';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
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
    // password: '',
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
          this.handleSubmit(session);
        }
      });
    }
  }

  handleSubmit = async (session) => {
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

  render() {
    const { error } = this.state;

    // TODO: Add a "forgot password" button for key recovery
    // const { onRestore } = this.props;

    return (
      <div>
        {error ? (
          <div style="background: #ff8080; color: white; font-size: 14px; text-align: center; padding: 5px 10px;">
            {error}
          </div>
        ) : null}
        <Auth
          supabaseClient={supabaseClient}
          providers={['google', 'apple']}
          socialLayout="horizontal"
          redirectTo="/vaults"
          socialButtonSize="xlarge"
        />
      </div>
    );
  }
}
