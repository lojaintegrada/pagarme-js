/**
 * @name sessionId
 * @memberof strategies
 * @private
 */
import { reject, resolve } from 'bluebird'
import { merge } from 'ramda'
import transactions from '../../resources/transactions'

/**
 * Creates an object with
 * the `account_id`, `merchant_id` and `jwt`from
 * the supplied `options` param
 *
 * @param {any} options
 * @returns {Object} an object containing
 *                   a body property with
 *                   the desired `jwt`
 * @private
 */
function execute ({
  account_id: accountId,
  merchant_id: merchantId,
  environment,
  impersonationKey,
  jwt,
  options,
  skipAuthentication,
}) {
  const accountData = {
    account_id: accountId,
    merchant_id: merchantId,
    jwt,
  }

  if (environment === 'live') {
    accountData['X-Live'] = 1
  }

  const headers = accountData
  const body = {}

  if (impersonationKey) {
    body.impersonation_key = impersonationKey
  }

  const opts = merge(options, {
    body,
    headers,
  })

  return transactions.calculateInstallmentsAmount(
    opts, { amount: 1, interest_rate: 100 }
  )
    .catch(error => (skipAuthentication ? resolve(opts) : reject(error)))
    .catch({ name: 'ApiError' }, () => reject(new Error('You must supply a valid jwt token and a valid account_id')))
    .then(() => ({
      authentication: { account_id: accountId, jwt, merchant_id: merchantId },
      options: opts,
    }))
}

/**
 * Returns the supplied parameter with
 * the `execute` function added to it.
 *
 * @param {any} options
 * @returns {Object} The `options` parameter
 *                   with `execute` add to it
 * @private
 */
function build (options) {
  return merge(options, { execute: execute.bind(null, options) })
}

export default {
  build,
}
