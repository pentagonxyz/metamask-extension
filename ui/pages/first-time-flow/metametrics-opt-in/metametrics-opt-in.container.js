import { connect } from 'react-redux';
import {
  createNewVaultAndGetSeedPhrase,
  setCompletedOnboarding,
  setParticipateInMetaMetrics,
} from '../../../store/actions';
import MetaMetricsOptIn from './metametrics-opt-in.component';

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  import: 'Selected Import Wallet',
};

const mapStateToProps = (state) => {
  const { firstTimeFlowType, participateInMetaMetrics } = state.metamask;

  return {
    firstTimeSelectionMetaMetricsName:
      firstTimeFlowTypeNameMap[firstTimeFlowType],
    participateInMetaMetrics,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createNewVaultAndGetSeedPhrase: (val) =>
      dispatch(createNewVaultAndGetSeedPhrase(val)),
    setCompletedOnboarding: (val) => dispatch(setCompletedOnboarding(val)),
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn);
