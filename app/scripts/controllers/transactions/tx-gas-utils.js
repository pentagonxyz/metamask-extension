import EthQuery from 'ethjs-query';
import log from 'loglevel';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import abi from 'ethereumjs-abi';
import { cloneDeep } from 'lodash';
import { hexToBn, BnMultiplyByFraction, bnToHex } from '../../lib/util';

/**
 * Result of gas analysis, including either a gas estimate for a successful analysis, or
 * debug information for a failed analysis.
 *
 * @typedef {object} GasAnalysisResult
 * @property {string} blockGasLimit - The gas limit of the block used for the analysis
 * @property {string} estimatedGasHex - The estimated gas, in hexadecimal
 * @property {object} simulationFails - Debug information about why an analysis failed
 */

/**
 * tx-gas-utils are gas utility methods for Transaction manager
 * its passed ethquery
 * and used to do things like calculate gas of a tx.
 *
 * @param {object} provider - A network provider.
 */

export default class TxGasUtil {
  constructor(provider) {
    this.query = new EthQuery(provider);
  }

  /**
   * @param {object} txMeta - the txMeta object
   * @returns {GasAnalysisResult} The result of the gas analysis
   */
  async analyzeGasUsage(txMeta) {
    const block = await this.query.getBlockByNumber('latest', false);

    // fallback to block gasLimit
    const blockGasLimitBN = hexToBn(typeof block.gasLimit !== 'string' ? block.gasLimit.toString() : block.gasLimit);
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20);
    let estimatedGasHex = bnToHex(saferGasLimitBN);
    let simulationFails;
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta);
    } catch (error) {
      log.warn(error);
      simulationFails = {
        reason: error.message,
        errorKey: error.errorKey,
        debug: { blockNumber: block.number, blockGasLimit: block.gasLimit },
      };
    }

    return { blockGasLimit: block.gasLimit, estimatedGasHex, simulationFails };
  }

  /**
   * Estimates the tx's gas usage
   *
   * @param {object} txMeta - the txMeta object
   * @returns {string} the estimated gas limit as a hex string
   */
  async estimateTxGas(txMeta) {
    const txParams = cloneDeep(txMeta.txParams);

    // `eth_estimateGas` can fail if the user has insufficient balance for the
    // value being sent, or for the gas cost. We don't want to check their
    // balance here, we just want the gas estimate. The gas price is removed
    // to skip those balance checks. We check balance elsewhere. We also delete
    // maxFeePerGas and maxPriorityFeePerGas to support EIP-1559 txs.
    delete txParams.gasPrice;
    delete txParams.maxFeePerGas;
    delete txParams.maxPriorityFeePerGas;

    // estimate tx gas requirements
    try {
      let result = await this.query.call({
        from: "0x0000000000000000000000000000000000000000",
        to: txParams.from,
        data: this.generateSimulateFunctionCallData({ toAddress: txParams.to, data: txParams.data, amount: txParams.value })
      });
    } catch (err) {
      if (err) {
        console.log("SIMULATEFUNCTIONCALL ERROR:", err);

        if (err.message.indexOf("WALLET_SIMULATE_FUNCTION_CALL_GAS_USAGE=") >= 0) {
          let walletSimulateFunctionCallGasUsage = parseInt(/WALLET_SIMULATE_FUNCTION_CALL_GAS_USAGE=(\d+)/g.exec(err.message)[1]);

          let functionCallDataLength = txParams.data.length === 0 ? 0 : Math.ceil((txParams.data.length >= 2 && txParams.data.substring(0, 2) === "0x" ? txParams.data.substring(2) : txParams.data).length / 2);
          
          const A = 18600; // Base gas
          const E_TIMES_1000 = 194; // Gas per byte of calldata (multipled by 1000)
          let feeData0 = hexToBn(A.toString(16)).add(hexToBn(E_TIMES_1000.toString(16)).muln(functionCallDataLength).divn(1000)).addn(walletSimulateFunctionCallGasUsage);

          const X = 38300; // Base gas
          const W_TIMES_10 = 166; // Gas per byte of calldata (multipled by 10)
          let feeData3 = hexToBn(X.toString(16)).add(hexToBn(W_TIMES_10.toString(16)).muln(functionCallDataLength).divn(10));

          console.log("WALLET_SIMULATE_FUNCTION_CALL_GAS_USAGE, functionCallDataLength, feeData[0], feeData[3]:", walletSimulateFunctionCallGasUsage, functionCallDataLength, feeData0, feeData3)
          return bnToHex(feeData0.add(feeData3));
        }

        throw err;
      }
    }

    throw "Failed to simulate function call on smart contract wallet for gas estimation";
  }

  generateSimulateFunctionCallData({
    toAddress = '0x0',
    data = '0x',
    amount = '0x0',
  }) {
    return (
      "0x37f9b120" +
      Array.prototype.map
        .call(
          abi.rawEncode(
            ['address', 'bytes', 'uint256'],
            [addHexPrefix(toAddress), Buffer.from(stripHexPrefix(data), 'hex'), addHexPrefix(amount)],
          ),
          (x) => `00${x.toString(16)}`.slice(-2),
        )
        .join('')
    );
  }

  /**
   * Adds a gas buffer with out exceeding the block gas limit
   *
   * @param {string} initialGasLimitHex - the initial gas limit to add the buffer too
   * @param {string} blockGasLimitHex - the block gas limit
   * @param multiplier
   * @returns {string} the buffered gas limit as a hex string
   */
  addGasBuffer(initialGasLimitHex, blockGasLimitHex, multiplier = 1.5) {
    const initialGasLimitBn = hexToBn(typeof initialGasLimitHex !== 'string' ? initialGasLimitHex.toString() : initialGasLimitHex);
    const blockGasLimitBn = hexToBn(typeof blockGasLimitHex !== 'string' ? blockGasLimitHex.toString() : blockGasLimitHex);
    const upperGasLimitBn = blockGasLimitBn.muln(0.9);
    const bufferedGasLimitBn = initialGasLimitBn.muln(multiplier);

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) {
      return bnToHex(initialGasLimitBn);
    }
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) {
      return bnToHex(bufferedGasLimitBn);
    }
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn);
  }

  async getBufferedGasLimit(txMeta, multiplier) {
    const { blockGasLimit, estimatedGasHex, simulationFails } =
      await this.analyzeGasUsage(txMeta);

    // add additional gas buffer to our estimation for safety
    const gasLimit = this.addGasBuffer(
      addHexPrefix(estimatedGasHex),
      blockGasLimit,
      multiplier,
    );
    return { gasLimit, simulationFails };
  }
}
